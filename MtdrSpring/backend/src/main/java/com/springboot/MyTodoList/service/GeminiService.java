package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
    private final boolean allowHeuristicFallback;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private record GeminiApiResponse(JsonNode root, String rawBody) {}

    public GeminiService(
        @Value("${gemini.api.key:}") String apiKey,
        @Value("${gemini.api.model:gemini-1.5-flash}") String model,
      @Value("${gemini.api.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
      @Value("${bot.parser.allow-heuristic-fallback:false}") boolean allowHeuristicFallback
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
      this.allowHeuristicFallback = allowHeuristicFallback;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
        this.objectMapper = new ObjectMapper();
    }

    public enum ParseStage {
      SUCCESS,
      API_CONFIGURATION,
      API_REQUEST_FAILED,
      MODEL_EMPTY_RESPONSE,
      MODEL_NON_JSON_RESPONSE,
      PARSER_EXCEPTION
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

    public record IntentDiagnostics(
      ParseStage stage,
      ParsedIntent intent,
      String modelTextPreview,
      String errorDetail
    ) {}

    public String generateText(String prompt) throws Exception {
        String body = buildTextRequestBody(prompt);
      GeminiApiResponse response = callGemini(body);
      return extractText(response.root());
    }

    public ParsedIntent parseIntent(String userText) throws Exception {
        IntentDiagnostics diagnostics = parseIntentWithDiagnostics(userText);
        if (diagnostics.intent() == null) {
            throw new IllegalStateException("Intent parsing failed at stage " + diagnostics.stage() + ": " + diagnostics.errorDetail());
        }
        return diagnostics.intent();
    }

    public IntentDiagnostics parseIntentWithDiagnostics(String userText) {
      try {
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
          - Output must be valid minified JSON (single JSON object), without markdown or extra prose.
          - Do not include markdown or code fences.
          User text: %s
          """.formatted(userText.replace("\"", "\\\""));

        String body = buildJsonResponseRequestBody(parserPrompt);
        GeminiApiResponse response = callGemini(body);
        String text = extractText(response.root());
        if (text == null || text.trim().isEmpty()) {
          return new IntentDiagnostics(
              ParseStage.MODEL_EMPTY_RESPONSE,
              null,
              preview(response.rawBody()),
              "Gemini returned empty text content.");
        }

        String normalized = stripCodeFences(text).trim();

        JsonNode intentNode;
        try {
          intentNode = objectMapper.readTree(normalized);
        } catch (Exception jsonEx) {
          return new IntentDiagnostics(
              ParseStage.MODEL_NON_JSON_RESPONSE,
              null,
                preview(text),
              "Gemini response was not valid JSON for intent schema: " + jsonEx.getMessage());
        }

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

        ParsedIntent intent = new ParsedIntent(action, title, priority, status, statusQuery, hours, confidence, clarification);
        return new IntentDiagnostics(ParseStage.SUCCESS, intent, preview(text), null);
      } catch (Exception e) {
        ParseStage stage = classifyFailureStage(e);
        String detail = e.getMessage();
        if (allowHeuristicFallback) {
          logger.warn("Gemini parse failed at stage {}, falling back to heuristic parsing: {}", stage, detail);
          ParsedIntent fallback = heuristicIntent(userText);
          return new IntentDiagnostics(stage, fallback, null, "Heuristic fallback used: " + detail);
        }
        logger.warn("Gemini parse failed at stage {}: {}", stage, detail);
        return new IntentDiagnostics(stage, null, null, detail);
      }
    }

    private ParseStage classifyFailureStage(Exception e) {
      String msg = e.getMessage() == null ? "" : e.getMessage();
      if (msg.contains("GEMINI_API_KEY is not configured")) {
        return ParseStage.API_CONFIGURATION;
      }
      if (msg.contains("Gemini API call failed")) {
        return ParseStage.API_REQUEST_FAILED;
      }
      return ParseStage.PARSER_EXCEPTION;
    }

    private String preview(String raw) {
      if (raw == null) return "<null>";
      String cleaned = raw.replace("\n", " ").trim();
      return cleaned.length() <= 300 ? cleaned : cleaned.substring(0, 300) + "...";
    }

    private ParsedIntent heuristicIntent(String userText) {
      if (userText == null) {
        return new ParsedIntent(IntentAction.UNKNOWN, null, null, null, null, null, 0.0, null);
      }

      String raw = userText.trim();
      String lower = raw.toLowerCase(Locale.ROOT);

      if (lower.equals("help") || lower.contains("what can you do")) {
        return new ParsedIntent(IntentAction.HELP, null, null, null, null, null, 0.8, null);
      }

      String priority = null;
      String cleaned = raw;
      if (lower.contains("high priority")) {
        priority = "HIGH";
        cleaned = cleaned.replaceAll("(?i)\\bhigh\\s+priority\\b", "").trim();
      } else if (lower.contains("medium priority")) {
        priority = "MEDIUM";
        cleaned = cleaned.replaceAll("(?i)\\bmedium\\s+priority\\b", "").trim();
      } else if (lower.contains("low priority")) {
        priority = "LOW";
        cleaned = cleaned.replaceAll("(?i)\\blow\\s+priority\\b", "").trim();
      }

      Matcher createMatcher = Pattern.compile("(?i)^create(?:\\s+task)?\\s+(.+)$").matcher(cleaned);
      if (createMatcher.find()) {
        String title = createMatcher.group(1).trim();
        if (!title.isEmpty()) {
          return new ParsedIntent(IntentAction.CREATE_TASK, title, priority, null, null, null, 0.85, null);
        }
      }

      Matcher statusMatcher = Pattern.compile("(?i)^status(?:\\s+(.+))?$").matcher(raw);
      if (statusMatcher.find()) {
        String query = statusMatcher.group(1);
        if (query != null) query = query.trim();
        return new ParsedIntent(IntentAction.STATUS_SUMMARY, null, null, null, query == null || query.isEmpty() ? null : query, null, 0.8, null);
      }

      return new ParsedIntent(IntentAction.UNKNOWN, null, null, null, null, null, 0.0, null);
    }

    private GeminiApiResponse callGemini(String body) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured.");
        }

      String endpoint = "%s/interactions".formatted(baseUrl);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .timeout(Duration.ofSeconds(25))
            .header("Content-Type", "application/json")
        .header("x-goog-api-key", apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            logger.error("Gemini API call failed with status {} and body {}", response.statusCode(), response.body());
        throw new IllegalStateException(
          "Gemini API call failed: " + response.statusCode()
            + " endpoint=" + endpoint
            + " model=" + model
            + " body=" + preview(response.body()));
        }

        JsonNode root = objectMapper.readTree(response.body());
        return new GeminiApiResponse(root, response.body());
    }

    private String extractText(JsonNode root) {
      // Interactions API shape (documented): output[0].content
      JsonNode interactionsTextNode = root.path("output").path(0).path("content");
      if (!interactionsTextNode.isMissingNode() && !interactionsTextNode.isNull()) {
        String interactionsText = interactionsTextNode.asText("").trim();
        if (!interactionsText.isEmpty()) return interactionsText;
      }

      // Legacy generateContent shape fallback: candidates[0].content.parts[0].text
      JsonNode legacyTextNode = root.path("candidates")
        .path(0)
        .path("content")
        .path("parts")
        .path(0)
        .path("text");
      if (!legacyTextNode.isMissingNode() && !legacyTextNode.isNull()) {
        String legacyText = legacyTextNode.asText("").trim();
        if (!legacyText.isEmpty()) return legacyText;
      }

      // Common variant: output[0].content.parts[0].text
      JsonNode interactionsPartsText = root.path("output")
        .path(0)
        .path("content")
        .path("parts")
        .path(0)
        .path("text");
      if (!interactionsPartsText.isMissingNode() && !interactionsPartsText.isNull()) {
        String text = interactionsPartsText.asText("").trim();
        if (!text.isEmpty()) return text;
      }

      // Common variant: output_text
      JsonNode outputTextNode = root.path("output_text");
      if (!outputTextNode.isMissingNode() && !outputTextNode.isNull()) {
        String outputText = outputTextNode.asText("").trim();
        if (!outputText.isEmpty()) return outputText;
      }

      // Last resort: recursively search for the first non-empty "text" leaf.
      String recursiveText = findFirstNonEmptyText(root);
      if (recursiveText != null) return recursiveText;

      return "";
    }

    private String findFirstNonEmptyText(JsonNode node) {
      if (node == null || node.isNull() || node.isMissingNode()) return null;

      if (node.isObject()) {
        JsonNode textNode = node.get("text");
        if (textNode != null && textNode.isTextual()) {
          String text = textNode.asText().trim();
          if (!text.isEmpty()) return text;
        }
        var fields = node.fields();
        while (fields.hasNext()) {
          var entry = fields.next();
          String found = findFirstNonEmptyText(entry.getValue());
          if (found != null) return found;
        }
        return null;
      }

      if (node.isArray()) {
        for (JsonNode child : node) {
          String found = findFirstNonEmptyText(child);
          if (found != null) return found;
        }
      }

      return null;
    }

    private String buildTextRequestBody(String prompt) {
        return """
            {
              "model": "%s",
              "input": "%s"
            }
            """.formatted(model, prompt.replace("\"", "\\\"").replace("\n", "\\n"));
    }

    private String buildJsonResponseRequestBody(String prompt) {
        return """
            {
              "model": "%s",
              "input": "%s"
            }
            """.formatted(model, prompt.replace("\"", "\\\"").replace("\n", "\\n"));
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
