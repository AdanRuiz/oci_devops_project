package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.springboot.MyTodoList.config.AiProps;
import com.springboot.MyTodoList.controller.dto.GenAiChatMessage;
import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.LumiActionPlan.Action;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class LumiIntentService {

    private static final Logger logger = LoggerFactory.getLogger(LumiIntentService.class);

    private static final String PLANNER_PROMPT = """
        You are Lumi's action planner for a project management app.
        Read the user message (and short history) and decide if they want you to DO something in the database.

        Respond with JSON only (no markdown). Schema:
        {
          "action": "NONE|CHAT|CREATE_TEAM|CREATE_PROJECT|CREATE_SPRINT|WORKLOAD|TASK_QUERY",
          "teamName": "",
          "memberNames": [],
          "managerName": "",
          "projectName": "",
          "sourceTeamName": "",
          "sprintName": "",
          "startDate": "YYYY-MM-DD or YYYY-MM-DD HH:MM",
          "endDate": "YYYY-MM-DD or YYYY-MM-DD HH:MM",
          "needsClarification": false,
          "clarificationQuestion": ""
        }

        Rules:
        - Natural language is fine ("Can you set up a team called X with Y and Z?").
        - Map intent to CREATE_* when the user wants something created, even without the words "create" or "crear".
        - Use WORKLOAD for questions about remaining work, capacity, or hours this week.
        - Use TASK_QUERY for listing tasks, sprint status, assignee workload (not WORKLOAD).
        - Use CHAT for general questions with no workspace change.
        - Use NONE only if truly unrelated.
        - Match memberNames/managerName to people from the workspace context when possible.
        - If required fields are missing, set needsClarification=true and ask ONE short friendly question in clarificationQuestion.
          Never mention slash commands, /addtask, or BotFather-style syntax.
        - Dates: infer from phrases like "next two weeks", "May 20 to June 3 2026" when possible.
        """;

    private final AiProps aiProps;
    private final ObjectMapper objectMapper;
    private final UserService userService;
    private final TeamService teamService;

    public LumiIntentService(AiProps aiProps,
                             ObjectMapper objectMapper,
                             UserService userService,
                             TeamService teamService) {
        this.aiProps = aiProps;
        this.objectMapper = objectMapper;
        this.userService = userService;
        this.teamService = teamService;
    }

    public boolean isAvailable() {
        return aiProps.isEnabled()
            && aiProps.getApiKey() != null
            && !aiProps.getApiKey().isBlank();
    }

    public Optional<LumiActionPlan> extractPlan(String message, List<GenAiChatMessage> history) {
        if (!isAvailable() || message == null || message.isBlank()) {
            return Optional.empty();
        }

        try {
            RestClient client = RestClient.builder()
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + aiProps.getApiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

            String endpoint = aiProps.getBaseUrl().replaceAll("/$", "") + "/chat/completions";
            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(messageOf("system", PLANNER_PROMPT + "\n\n" + workspaceContext()));

            if (history != null) {
                int start = Math.max(0, history.size() - 6);
                for (int i = start; i < history.size(); i++) {
                    GenAiChatMessage item = history.get(i);
                    if (item == null || item.getContent() == null || item.getContent().isBlank()) {
                        continue;
                    }
                    messages.add(messageOf(normalizeRole(item.getRole()), item.getContent()));
                }
            }

            messages.add(messageOf("user", message));

            Map<String, Object> payload = new HashMap<>();
            payload.put("model", aiProps.getModel());
            payload.put("messages", messages);
            payload.put("temperature", 0);
            payload.put("response_format", Map.of("type", "json_object"));

            String responseBody = client.post()
                .uri(endpoint)
                .body(payload)
                .retrieve()
                .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (content.isMissingNode() || content.asText().isBlank()) {
                return Optional.empty();
            }

            return Optional.of(parsePlan(content.asText()));
        } catch (Exception ex) {
            logger.warn("Lumi intent extraction failed", ex);
            return Optional.empty();
        }
    }

    private LumiActionPlan parsePlan(String json) throws Exception {
        String payload = extractJsonPayload(json);
        JsonNode node = objectMapper.readTree(payload);
        LumiActionPlan plan = new LumiActionPlan();

        String actionRaw = node.path("action").asText("NONE");
        try {
            plan.setAction(Action.valueOf(actionRaw.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            plan.setAction(Action.NONE);
        }

        plan.setTeamName(textOrNull(node, "teamName"));
        plan.setManagerName(textOrNull(node, "managerName"));
        plan.setProjectName(textOrNull(node, "projectName"));
        plan.setSourceTeamName(textOrNull(node, "sourceTeamName"));
        plan.setSprintName(textOrNull(node, "sprintName"));
        plan.setStartDate(textOrNull(node, "startDate"));
        plan.setEndDate(textOrNull(node, "endDate"));
        plan.setNeedsClarification(node.path("needsClarification").asBoolean(false));
        plan.setClarificationQuestion(textOrNull(node, "clarificationQuestion"));

        JsonNode members = node.path("memberNames");
        if (members.isArray()) {
            List<String> names = new ArrayList<>();
            members.forEach(item -> {
                if (item.isTextual() && !item.asText().isBlank()) {
                    names.add(item.asText().trim());
                }
            });
            plan.setMemberNames(names);
        }

        return plan;
    }

    private String workspaceContext() {
        List<User> users = userService.findAll();
        List<Team> teams = teamService.findAll();

        String people = users.isEmpty()
            ? "(no developers in database yet)"
            : users.stream()
                .map(u -> "- " + (u.getName() != null ? u.getName() : "user " + u.getId())
                    + (u.getRole() != null ? " [" + u.getRole() + "]" : ""))
                .collect(Collectors.joining("\n"));

        String teamLines = teams.isEmpty()
            ? "(no teams yet)"
            : teams.stream()
                .map(t -> "- " + t.getName())
                .collect(Collectors.joining("\n"));

        return "Workspace context:\nDevelopers:\n" + people + "\nTeams/projects:\n" + teamLines;
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText().trim();
        return text.isEmpty() ? null : text;
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "user";
        }
        String normalized = role.trim().toLowerCase(Locale.ROOT);
        if ("assistant".equals(normalized) || "system".equals(normalized) || "user".equals(normalized)) {
            return normalized;
        }
        return "user";
    }

    private Map<String, Object> messageOf(String role, String content) {
        Map<String, Object> message = new HashMap<>();
        message.put("role", role);
        message.put("content", content);
        return message;
    }

    private String extractJsonPayload(String content) {
        String trimmed = content == null ? "" : content.trim();
        if (trimmed.startsWith("```")) {
            int firstNewLine = trimmed.indexOf('\n');
            if (firstNewLine >= 0) {
                trimmed = trimmed.substring(firstNewLine + 1).trim();
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3).trim();
            }
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }
}
