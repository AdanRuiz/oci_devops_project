package com.springboot.MyTodoList.agent;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class RuleBasedIntentParser implements IntentParser {

    private static final Pattern CREATE_TASK_PATTERN =
        Pattern.compile("crea(?:r)? (?:una tarea|un bug) para (.+?)(?= y asigna| con \\d|$)(?: y asigna(?:la)? a ((?:(?! con \\d)[a-zA-ZáéíóúÁÉÍÓÚñÑ ])+))?", Pattern.CASE_INSENSITIVE);

    private static final Pattern EXPECTED_HOURS_PATTERN =
        Pattern.compile("(\\d+)\\s*horas?\\s*(?:esperadas?|estimadas?)", Pattern.CASE_INSENSITIVE);

    @Override
    /**
     * Parse the provided message using rule-based patterns and return a ParsedIntent.
     * This is a best-effort local fallback that recognizes common Spanish commands.
     */
    public ParsedIntent parse(String messageText) {
        String text = messageText == null ? "" : messageText.trim();
        String normalized = text.toLowerCase(Locale.ROOT);
        ParsedIntent intent = new ParsedIntent();

        if (normalized.equals("/start") || normalized.equals("ayuda") || normalized.equals("/help")) {
            intent.setIntent(IntentType.HELP);
            return intent;
        }

        if (normalized.contains("sprint actual") || normalized.contains("como va el sprint")) {
            intent.setIntent(IntentType.CURRENT_SPRINT_SUMMARY);
            return intent;
        }

        if (normalized.contains("quien tiene mas carga") || normalized.contains("carga del equipo")) {
            intent.setIntent(IntentType.TEAM_LOAD_SUMMARY);
            return intent;
        }

        if (normalized.contains("tareas tiene ")) {
            intent.setIntent(IntentType.LIST_TASKS_BY_ASSIGNEE);
            intent.setAssignee(capitalize(normalized.substring(normalized.indexOf("tareas tiene ") + "tareas tiene ".length()).trim()));
            return intent;
        }

        if (normalized.contains("tareas pendientes") || normalized.contains("tareas siguen ") || normalized.contains("tareas done")) {
            intent.setIntent(IntentType.LIST_TASKS_BY_STATUS);
            if (normalized.contains("done")) {
                intent.setStatus("DONE");
            } else if (normalized.contains("progreso")) {
                intent.setStatus("IN_PROGRESS");
            } else {
                intent.setStatus("PENDING");
            }
            return intent;
        }

        if (normalized.equals("/todolist") || normalized.equals("lista de tareas")) {
            intent.setIntent(IntentType.LIST_TASKS);
            return intent;
        }

        if (normalized.contains("muestra mis tareas") || normalized.contains("ver mis tareas") || 
            normalized.contains("que tareas tengo") || normalized.contains("mis tareas")) {
            intent.setIntent(IntentType.LIST_TASKS_BY_ASSIGNEE);
            intent.setResponseText("/mytasks");
            return intent;
        }

        if (isKpiQuery(normalized)) {
            intent.setIntent(IntentType.GET_DEVELOPER_KPI);
            // Extract the developer ID or name
            Pattern kpiPattern = Pattern.compile("(?:del (?:usuario|desarrollador) (?:con )?id )?(\\d+)|(?:del (?:usuario|desarrollador) )([a-zA-ZáéíóúÁÉÍÓÚñÑ ]+)", Pattern.CASE_INSENSITIVE);
            Matcher kpiMatcher = kpiPattern.matcher(text);
            if (kpiMatcher.find()) {
                if (kpiMatcher.group(1) != null) {
                    intent.setTaskId(kpiMatcher.group(1));
                } else if (kpiMatcher.group(2) != null) {
                    intent.setDeveloperName(capitalize(kpiMatcher.group(2).trim()));
                }
            }
            return intent;
        }

        // Delete task queries: "elimina la tarea 5", "borra la tarea revisar api", etc.
        if (normalized.contains("elimina") || normalized.contains("borra") || normalized.contains("delete")) {
            if (normalized.contains("tarea")) {
                intent.setIntent(IntentType.DELETE_TASK);
                // Try to extract task ID
                Pattern deletePattern = Pattern.compile("(?:tarea )?(\\d+)|(?:tarea )([a-zA-ZáéíóúÁÉÍÓÚñÑ ]+)", Pattern.CASE_INSENSITIVE);
                Matcher deleteMatcher = deletePattern.matcher(text);
                if (deleteMatcher.find()) {
                    if (deleteMatcher.group(1) != null) {
                        intent.setTaskId(deleteMatcher.group(1));
                    } else if (deleteMatcher.group(2) != null) {
                        intent.setTitle(capitalize(deleteMatcher.group(2).trim()));
                    }
                }
                return intent;
            }
        }

        Matcher matcher = CREATE_TASK_PATTERN.matcher(text);
        if (matcher.find()) {
            intent.setIntent(IntentType.CREATE_TASK);
            intent.setTitle(matcher.group(1) == null ? null : matcher.group(1).trim());
            intent.setAssignee(matcher.group(2) == null ? null : capitalize(matcher.group(2).trim()));

            Matcher hoursMatcher = EXPECTED_HOURS_PATTERN.matcher(text);
            if (hoursMatcher.find()) {
                intent.setExpectedHours(Integer.parseInt(hoursMatcher.group(1)));
            }

            if (normalized.contains("bug")) {
                intent.setIsBug(true);
            }

            return intent;
        }

        intent.setIntent(IntentType.UNKNOWN);
        intent.setClarificationNeeded(true);
        intent.setClarificationQuestion(
            "No entendi la solicitud. Tambien puedo explicar formatos de comandos.\n"
                + "Ejemplo para crear tarea: /addtask \"<titulo>\" | \"<descripcion>\" | <horas esperadas> | <prioridad (LOW, MEDIUM, HIGH)> | <es bug (true/false)> | <ID de Usuario>"
        );
        return intent;
    }

    private String capitalize(String value) {
        // Capitalize the first character of a non-empty string using locale-safe rules.
        if (value == null || value.isBlank()) {
            return value;
        }
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1);
    }

    private boolean isKpiQuery(String normalized) {
        // Heuristic: consider it a KPI query when 'kpi' appears along with user/developer mention.
        return normalized.contains("kpi")
            && (normalized.contains("usuario") || normalized.contains("desarrollador"));
    }
}
