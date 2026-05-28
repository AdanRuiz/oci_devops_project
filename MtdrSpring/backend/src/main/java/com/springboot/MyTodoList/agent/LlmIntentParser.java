package com.springboot.MyTodoList.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.springboot.MyTodoList.config.AiProps;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class LlmIntentParser implements IntentParser {

    private static final Logger logger = LoggerFactory.getLogger(LlmIntentParser.class);

    private final AiProps aiProps;
    private final ObjectMapper objectMapper;
    private final RuleBasedIntentParser fallbackParser;

    /** Initialize the parser with configuration, JSON mapper and a rule-based fallback. */
    public LlmIntentParser(AiProps aiProps, ObjectMapper objectMapper, RuleBasedIntentParser fallbackParser) {
        this.aiProps = Objects.requireNonNull(aiProps, "aiProps must not be null");
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper must not be null");
        this.fallbackParser = Objects.requireNonNull(fallbackParser, "fallbackParser must not be null");
    }

    @Override
    /**
     * Use LLM-based classification to parse the message when enabled; falls back to rules.
     * Returns a ParsedIntent which may include intent, responseText, or clarification request.
     */
    public ParsedIntent parse(String messageText) {
        ParsedIntent basicIntent = fallbackParser.parse(messageText);
        if (basicIntent == null) {
            basicIntent = new ParsedIntent();
        }

        if (basicIntent.getIntent() != IntentType.UNKNOWN || basicIntent.getResponseText() != null) {
            return basicIntent;
        }

        if (!aiProps.isEnabled() || aiProps.getApiKey() == null || aiProps.getApiKey().isBlank()) {
            return basicIntent;
        }

        try {
            ParsedIntent parsedIntent = requestIntentClassification(messageText);
            if (parsedIntent == null) {
                return basicIntent;
            }

            if (parsedIntent.isClarificationNeeded()) {
                return parsedIntent;
            }

            if (parsedIntent.getIntent() == IntentType.UNKNOWN
                && (parsedIntent.getResponseText() == null || parsedIntent.getResponseText().isBlank())) {
                String responseText = requestGeneralResponse(messageText);
                if (responseText != null && !responseText.isBlank()) {
                    parsedIntent.setResponseText(responseText);
                }
            }

            if (parsedIntent.getIntent() == IntentType.UNKNOWN
                && (parsedIntent.getResponseText() == null || parsedIntent.getResponseText().isBlank())) {
                return basicIntent;
            }

            return parsedIntent;
        } catch (Exception ex) {
            logger.warn("Falló el parser LLM. Uso fallback local.", ex);
            return basicIntent;
        }
    }

    private ParsedIntent requestIntentClassification(String messageText) throws Exception {
        /**
         * Send a classification request to the configured LLM endpoint and parse the JSON response
         * into a ParsedIntent instance. Returns null on unexpected or empty replies.
         */
        RestClient client = createClient();
        String endpoint = aiProps.getBaseUrl().replaceAll("/$", "") + "/chat/completions";

        String systemPrompt = "Eres un clasificador y planificador de acciones para un asistente en espanol.\n"
            + "Debes responder solo JSON valido, sin bloques de codigo ni texto extra.\n\n"
            + "Tu trabajo es hacer una de estas dos cosas:\n"
            + "1. Clasificar consultas informativas que el sistema ya sabe ejecutar.\n"
            + "2. Convertir una solicitud natural en un comando canonico que el bot pueda ejecutar.\n\n"
            + "Intenciones permitidas:\n"
            + "HELP\n"
            + "LIST_TASKS\n"
            + "LIST_TASKS_BY_ASSIGNEE\n"
            + "LIST_TASKS_BY_STATUS\n"
            + "CREATE_TASK\n"
            + "DELETE_TASK\n"
            + "GET_DEVELOPER_KPI\n"
            + "CURRENT_SPRINT_SUMMARY\n"
            + "TEAM_LOAD_SUMMARY\n"
            + "UNKNOWN\n\n"
            + "Devuelve JSON con estas claves:\n"
            + "intent, assignee, status, title, expectedHours, isBug, sprintName, taskId, developerName, clarificationNeeded, clarificationQuestion, responseText.\n\n"
            + "Reglas:\n"
            + "- Si el usuario pide una accion ejecutable y hay informacion suficiente, usa intent UNKNOWN y coloca en responseText el comando canonico exacto a ejecutar.\n"
            + "- Si el usuario pide una consulta que ya conoce el sistema, usa el intent correspondiente y deja responseText vacio.\n"
            + "- Si falta informacion importante para ejecutar una accion, usa clarificationNeeded=true y formula una sola pregunta concreta.\n"
            + "- Si el usuario pregunta como usar comandos, formatos o ejemplos, devuelve una respuesta util en responseText y deja clarificationNeeded=false.\n\n"
            + "Comandos canonicos disponibles:\n"
            + commandCatalog() + "\n"
            + "Ejemplos de traduccion:\n"
            + "- 'crea una tarea llamada x con descripcion y asignada a persona z de prioridad alta con cantidad de horas 2' => intent UNKNOWN, responseText='/addtask \"x\" | \"y\" | 2 | HIGH | false | z'\n"
            + "- 'muestrame los KPIs del usuario con ID 6' => intent GET_DEVELOPER_KPI, taskId='6'\n"
            + "- 'elimina la tarea 5' => intent DELETE_TASK, taskId='5'\n"
            + "- 'borra la tarea revisar API' => intent DELETE_TASK, title='revisar API'\n"
            + "- 'muestrame las tareas de ana' => intent LIST_TASKS_BY_ASSIGNEE, assignee='Ana'\n"
            + "- 'que tareas siguen en progreso' => intent LIST_TASKS_BY_STATUS, status='IN_PROGRESS'\n"
            + "- 'como uso el bot para completar una tarea' => intent UNKNOWN, responseText con una explicacion breve del comando /completetask\n";

        List<Map<String, Object>> messages = buildMessages(systemPrompt, messageText);

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
            return null;
        }

        String jsonPayload = extractJsonPayload(content.asText());
        if (jsonPayload == null || jsonPayload.isBlank()) {
            return null;
        }

        return objectMapper.readValue(jsonPayload, ParsedIntent.class);
    }

    private String requestGeneralResponse(String messageText) throws Exception {
        /**
         * Ask the LLM for a general short human response (used when no actionable intent
         * is extracted but a helpful reply is desired).
         */
        RestClient client = createClient();
        String endpoint = aiProps.getBaseUrl().replaceAll("/$", "") + "/chat/completions";

        String systemPrompt = "Eres un asistente general en espanol.\n"
            + "Responde de forma breve, clara y util a cualquier pregunta del usuario.\n"
            + "No uses bloques de codigo ni texto extra.\n"
            + "Si hace falta, da pasos concretos.\n\n"
            + "Si la pregunta es sobre como usar el bot o como ejecutar acciones, responde con el formato exacto de los comandos disponibles:\n"
            + commandCatalog() + "\n"
            + "Cuando el usuario pregunte algo como 'Como agrego una tarea?', prioriza explicar /addtask con un ejemplo completo y en espanol.";

        List<Map<String, Object>> messages = buildMessages(systemPrompt, messageText);

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", aiProps.getModel());
        payload.put("messages", messages);
        payload.put("temperature", 0.2);

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
    }

    private RestClient createClient() {
        /** Build an HTTP client with authorization and JSON content headers. */
        return RestClient.builder()
            .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + aiProps.getApiKey())
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    private List<Map<String, Object>> buildMessages(String systemPrompt, String messageText) {
        /** Compose the messages payload for the chat completion API. */
        return List.of(
            buildMessage("system", systemPrompt),
            buildMessage("user", messageText == null ? "" : messageText)
        );
    }

    private Map<String, Object> buildMessage(String role, String content) {
        /** Create a single message entry for the chat API payload. */
        Map<String, Object> message = new HashMap<>();
        message.put("role", role);
        message.put("content", content);
        return message;
    }

    private String commandCatalog() {
        /** Return a textual catalog of supported canonical commands for prompts. */
        return "- /start: muestra el mensaje de bienvenida.\n"
            + "- /register: valida al usuario Telegram actual.\n"
            + "- /addtask \"<titulo>\" | \"<descripcion>\" | <horas esperadas> | <prioridad (LOW, MEDIUM, HIGH)> | <es bug (true/false)> | <ID o nombre de usuario>: crea una tarea.\n"
            + "- /deletetask <ID o titulo de tarea>: elimina una tarea.\n"
            + "- /assigntask <ID o titulo de tarea> | <ID o nombre de sprint>: asigna una tarea a un sprint y la mueve a IN_PROGRESS.\n"
            + "- /completetask <ID o titulo de tarea> | <horas>: marca la tarea como DONE y guarda las horas trabajadas.\n"
            + "- /mytasks: lista las tareas asignadas al usuario Telegram actual.\n"
            + "- /teamkpis <ID o nombre de desarrollador>: muestra los KPIs de un desarrollador (solo para gerentes).\n"
            + "- /teamtasks: muestra todas las tareas del equipo del gerente (solo para gerentes).\n"
            + "- /llm <pregunta>: envia una pregunta libre al modelo de IA.\n"
            + "- GET /tasks, POST /tasks, PUT /tasks/{id}, DELETE /tasks/{id}: CRUD de tareas del backend.\n"
            + "- GET /sprints, POST /sprints, PUT /sprints/{id}, DELETE /sprints/{id}: CRUD de sprints.\n"
            + "- GET /teams, POST /teams, PUT /teams/{id}, DELETE /teams/{id}: CRUD de equipos.\n"
            + "- GET /users, POST /adduser, PUT /updateUser/{id}, DELETE /deleteUser/{id}: CRUD de usuarios.\n"
            + "- GET /sprint-tasks, POST /sprint-tasks, PUT /sprint-tasks/{sprintId}/{taskId}, DELETE /sprint-tasks/{sprintId}/{taskId}: relacion sprint-tarea.\n"
            + "- GET /team-members, POST /team-members, PUT /team-members/{teamId}/{userId}, DELETE /team-members/{teamId}/{userId}: relacion equipo-usuario.\n"
            + "- GET /todolist, POST /todolist, PUT /todolist/{id}, DELETE /todolist/{id}: lista legada de tareas.\n";
    }

    private String extractJsonPayload(String content) {
        /**
         * Extract the first JSON object found in a text block. Handles code fences and
         * searches for balanced braces while ignoring strings and escapes.
         */
        String trimmed = content == null ? "" : content.trim();
        if (trimmed.isEmpty()) {
            return trimmed;
        }

        if (trimmed.startsWith("```")) {
            int firstNewLine = trimmed.indexOf('\n');
            if (firstNewLine >= 0) {
                trimmed = trimmed.substring(firstNewLine + 1).trim();
            }

            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3).trim();
            }
        }

        int jsonStart = findJsonStart(trimmed);
        if (jsonStart < 0) {
            return trimmed;
        }

        int jsonEnd = findJsonEnd(trimmed, jsonStart);
        if (jsonEnd < 0) {
            return trimmed.substring(jsonStart);
        }

        return trimmed.substring(jsonStart, jsonEnd + 1);
    }

    private int findJsonStart(String content) {
        // Find the first '{' character (start of JSON object) or -1 if none.
        for (int index = 0; index < content.length(); index++) {
            if (content.charAt(index) == '{') {
                return index;
            }
        }
        return -1;
    }

    private int findJsonEnd(String content, int startIndex) {
        // Walk the content from startIndex to find the matching closing '}' taking
        // into account nested objects, quoted strings and escape sequences.
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;

        for (int index = startIndex; index < content.length(); index++) {
            char current = content.charAt(index);

            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (current == '\\') {
                    escaped = true;
                } else if (current == '"') {
                    inString = false;
                }
                continue;
            }

            if (current == '"') {
                inString = true;
                continue;
            }

            if (current == '{') {
                depth++;
            } else if (current == '}') {
                depth--;
                if (depth == 0) {
                    return index;
                }
            }
        }

        return -1;
    }
}
