package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public GeminiService(
        @Value("${gemini.api.key:}") String apiKey,
        @Value("${gemini.api.model:gemini-1.5-flash}") String model,
        @Value("${gemini.api.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
        this.objectMapper = new ObjectMapper();
    }

    public enum IntentAction {
        CREATE_TASK,
        UPDATE_STATUS,
        LOG_HOURS,
        DELETE_TASK,
        STATUS_SUMMARY,
        HELP,
        UNKNOWN
    }

    public record ParsedIntent(
        IntentAction action,
        String title,
        String priority,
      String status,
      String statusQuery,
        Double hours,
        double confidence,
        String clarificationQuestion
    ) {}

    public String generateText(String prompt) throws Exception {
        String body = buildTextRequestBody(prompt);
        JsonNode root = callGemini(body);
        return extractText(root);
    }

    public ParsedIntent parseIntent(String userText) throws Exception {
        String parserPrompt = """
            You are an intent parser for a Telegram project-management bot.
            Return ONLY JSON with this exact schema:
            {
              \"action\": \"CREATE_TASK|UPDATE_STATUS|LOG_HOURS|DELETE_TASK|STATUS_SUMMARY|HELP|UNKNOWN\",
              \"title\": string|null,
              \"priority\": \"LOW|MEDIUM|HIGH\"|null,
              \"status\": \"TODO|IN_PROGRESS|BLOCKED|DONE\"|null,
              \"statusQuery\": string|null,
              \"hours\": number|null,
              \"confidence\": number,
              \"clarificationQuestion\": string|null
            }
            Rules:
            - Keep confidence between 0 and 1.
            - Use UNKNOWN if not clear.
            - For CREATE_TASK, use title and optional priority.
            - For STATUS_SUMMARY, if user asks about a specific sprint or task, put it in statusQuery.
            - Do not include markdown or code fences.
            User text: %s
            """.formatted(userText.replace("\"", "\\\""));

        String body = buildJsonResponseRequestBody(parserPrompt);
        JsonNode root = callGemini(body);
        String text = extractText(root);
        String normalized = stripCodeFences(text).trim();

        JsonNode intentNode = objectMapper.readTree(normalized);
        String actionRaw = intentNode.path("action").asText("UNKNOWN").toUpperCase(Locale.ROOT);
        IntentAction action;
        try {
            action = IntentAction.valueOf(actionRaw);
        } catch (IllegalArgumentException ex) {
            action = IntentAction.UNKNOWN;
        }

        String title = intentNode.path("title").isNull() ? null : intentNode.path("title").asText(null);
        String priority = intentNode.path("priority").isNull() ? null : intentNode.path("priority").asText(null);
        String status = intentNode.path("status").isNull() ? null : intentNode.path("status").asText(null);
        String statusQuery = intentNode.path("statusQuery").isNull() ? null : intentNode.path("statusQuery").asText(null);
        Double hours = intentNode.path("hours").isNumber() ? intentNode.path("hours").asDouble() : null;
        double confidence = intentNode.path("confidence").isNumber() ? intentNode.path("confidence").asDouble() : 0.0;
        String clarification = intentNode.path("clarificationQuestion").isNull() ? null : intentNode.path("clarificationQuestion").asText(null);

        return new ParsedIntent(action, title, priority, status, statusQuery, hours, confidence, clarification);
    }

    private JsonNode callGemini(String body) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured.");
        }

        String endpoint = "%s/models/%s:generateContent?key=%s".formatted(baseUrl, model, apiKey);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .timeout(Duration.ofSeconds(25))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            logger.error("Gemini API call failed with status {} and body {}", response.statusCode(), response.body());
            throw new IllegalStateException("Gemini API call failed: " + response.statusCode());
        }

        return objectMapper.readTree(response.body());
    }

    private String extractText(JsonNode root) {
        JsonNode textNode = root.path("candidates")
            .path(0)
            .path("content")
            .path("parts")
            .path(0)
            .path("text");
        return textNode.isMissingNode() ? "" : textNode.asText("");
    }

    private String buildTextRequestBody(String prompt) {
        return """
            {
              "contents": [
                {
                  "role": "user",
                  "parts": [
                    {"text": "%s"}
                  ]
                }
              ],
              "generationConfig": {
                "temperature": 0.2
              }
            }
            """.formatted(prompt.replace("\"", "\\\"").replace("\n", "\\n"));
    }

    private String buildJsonResponseRequestBody(String prompt) {
        return """
            {
              "contents": [
                {
                  "role": "user",
                  "parts": [
                    {"text": "%s"}
                  ]
                }
              ],
              "generationConfig": {
                "temperature": 0.0,
                "responseMimeType": "application/json"
              }
            }
            """.formatted(prompt.replace("\"", "\\\"").replace("\n", "\\n"));
    }

    private String stripCodeFences(String raw) {
        if (raw == null) return "";
        String text = raw.trim();
        if (text.startsWith("```") && text.endsWith("```")) {
            int firstNewline = text.indexOf('\n');
            if (firstNewline > -1) {
                text = text.substring(firstNewline + 1, text.length() - 3).trim();
            }
        }
        return text;
    }
}
