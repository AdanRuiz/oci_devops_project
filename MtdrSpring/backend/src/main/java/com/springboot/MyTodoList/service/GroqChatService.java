package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.springboot.MyTodoList.config.AiProps;
import com.springboot.MyTodoList.controller.dto.GenAiChatMessage;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GroqChatService {

    private static final Logger logger = LoggerFactory.getLogger(GroqChatService.class);

    private static final String LUMI_SYSTEM_PROMPT = """
        You are Lumi, a friendly project assistant in the Lumen app.
        Reply in the same language the user uses (English or Spanish). Be warm and concise.

        Important:
        - Talk like a human colleague, not a command manual.
        - Never tell the user to type slash commands (/addtask, /register, etc.).
        - If they want something created, ask naturally for missing details (names, dates, people).
        - Do not claim you already created teams, projects, or sprints unless the user message says it was done.
        - The app does not require login; created items appear in Dashboard → Team / Projects.
        """;

    private final AiProps aiProps;
    private final ObjectMapper objectMapper;

    public GroqChatService(AiProps aiProps, ObjectMapper objectMapper) {
        this.aiProps = aiProps;
        this.objectMapper = objectMapper;
    }

    public boolean isAvailable() {
        return aiProps.isEnabled()
            && aiProps.getApiKey() != null
            && !aiProps.getApiKey().isBlank();
    }

    public String chat(String message, List<GenAiChatMessage> history) {
        if (!isAvailable()) {
            return null;
        }

        try {
            RestClient client = RestClient.builder()
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + aiProps.getApiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

            String endpoint = aiProps.getBaseUrl().replaceAll("/$", "") + "/chat/completions";
            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(messageOf("system", LUMI_SYSTEM_PROMPT));

            if (history != null) {
                for (GenAiChatMessage item : history) {
                    if (item == null || item.getContent() == null || item.getContent().isBlank()) {
                        continue;
                    }
                    String role = normalizeRole(item.getRole());
                    messages.add(messageOf(role, item.getContent()));
                }
            }

            messages.add(messageOf("user", message == null ? "" : message));

            Map<String, Object> payload = new HashMap<>();
            payload.put("model", aiProps.getModel());
            payload.put("messages", messages);
            payload.put("temperature", 0.3);

            String responseBody = client.post()
                .uri(endpoint)
                .body(payload)
                .retrieve()
                .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (content.isMissingNode() || content.asText().isBlank()) {
                return null;
            }
            return content.asText().trim();
        } catch (Exception ex) {
            logger.warn("Groq chat request failed", ex);
            return null;
        }
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "user";
        }
        String normalized = role.trim().toLowerCase();
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
}
