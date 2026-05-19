package com.springboot.MyTodoList.agent;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import org.springframework.stereotype.Component;

@Component
public class AgentOrchestrator {

    private final LlmIntentParser llmIntentParser;
    private final ProjectWorkspaceService workspaceService;

    public AgentOrchestrator(LlmIntentParser llmIntentParser, ProjectWorkspaceService workspaceService) {
        this.llmIntentParser = llmIntentParser;
        this.workspaceService = workspaceService;
    }

    public String handleMessage(String messageText) {
        return handleMessage(messageText, null);
    }

    public String handleMessage(String messageText, String userRole) {
        ParsedIntent parsedIntent = llmIntentParser.parse(messageText);

        if (parsedIntent.getResponseText() != null && !parsedIntent.getResponseText().isBlank()) {
            return parsedIntent.getResponseText();
        }

        if (parsedIntent.isClarificationNeeded()) {
            return parsedIntent.getClarificationQuestion();
        }

        return switch (parsedIntent.getIntent()) {
            case HELP -> helpText(userRole);
            case LIST_TASKS -> formatTasks("Estas son las tareas registradas:", workspaceService.findAllTasks());
            case LIST_TASKS_BY_ASSIGNEE -> formatTasks("Estas son las tareas de " + safe(parsedIntent.getAssignee()) + ":",
                workspaceService.findTasksByAssignee(parsedIntent.getAssignee()));
            case LIST_TASKS_BY_STATUS -> formatTasks("Estas son las tareas con estado " + safe(parsedIntent.getStatus()) + ":",
                workspaceService.findTasksByStatus(parsedIntent.getStatus()));
            case CREATE_TASK -> createTask(parsedIntent);
            case DELETE_TASK -> deleteTaskResponse(parsedIntent);
            case GET_DEVELOPER_KPI -> getDeveloperKpiResponse(parsedIntent);
            case CURRENT_SPRINT_SUMMARY -> sprintSummary();
            case TEAM_LOAD_SUMMARY -> teamLoadSummary();
            default -> "No pude interpretar la solicitud. Escribe ayuda para ver ejemplos.";
        };
    }

    private String createTask(ParsedIntent parsedIntent) {
        if (parsedIntent.getTitle() == null || parsedIntent.getTitle().isBlank()) {
            return "Necesito el titulo de la tarea para poder crearla.";
        }

        TaskItem task = workspaceService.createTask(
            parsedIntent.getTitle(),
            parsedIntent.getAssignee(),
            parsedIntent.getExpectedHours() == null ? 1 : parsedIntent.getExpectedHours().intValue(),
            parsedIntent.getSprintName(),
            Boolean.TRUE.equals(parsedIntent.getIsBug())
        );

        return """
            Tarea creada correctamente.
            Id: %d
            Titulo: %s
            Responsable: %s
            Estado: %s
            Horas esperadas: %d
            Horas realizadas: %d
            Bug: %s
            Sprint: %s
            """.formatted(
                task.getId(),
                task.getTitle(),
                task.getAssignee(),
                task.getStatus(),
                task.getExpectedHours(),
                task.getHoursDone(),
                task.isBug() ? "si" : "no",
                task.getSprintName());
    }

    private String deleteTaskResponse(ParsedIntent parsedIntent) {
        if (parsedIntent.getTaskId() == null && parsedIntent.getTitle() == null) {
            return "Necesito el ID o nombre de la tarea para poder eliminarla.";
        }
        
        return "Para eliminar la tarea, usa el comando: /deletetask " 
            + (parsedIntent.getTaskId() != null ? parsedIntent.getTaskId() : parsedIntent.getTitle());
    }

    private String getDeveloperKpiResponse(ParsedIntent parsedIntent) {
        if (parsedIntent.getTaskId() == null && parsedIntent.getDeveloperName() == null) {
            return "Necesito el ID o nombre del desarrollador para ver sus KPIs.";
        }
        
        return "Para ver los KPIs del desarrollador, usa el comando: /teamkpis " 
            + (parsedIntent.getTaskId() != null ? parsedIntent.getTaskId() : parsedIntent.getDeveloperName());
    }

    private String sprintSummary() {
        SprintInfo sprint = workspaceService.getCurrentSprint();
        if (sprint == null) {
            return "No hay un sprint activo en este momento.";
        }

        List<TaskItem> sprintTasks = workspaceService.findAllTasks().stream()
            .filter(task -> sprint.getName().equals(task.getSprintName()))
            .collect(java.util.stream.Collectors.toList());

        long done = sprintTasks.stream().filter(task -> "DONE".equals(task.getStatus())).count();
        long inProgress = sprintTasks.stream().filter(task -> "IN_PROGRESS".equals(task.getStatus())).count();
        long pending = sprintTasks.stream().filter(task -> "PENDING".equals(task.getStatus())).count();
        int expectedHours = sprintTasks.stream().mapToInt(TaskItem::getExpectedHours).sum();
        int doneHours = sprintTasks.stream()
            .filter(task -> "DONE".equals(task.getStatus()))
            .mapToInt(TaskItem::getHoursDone)
            .sum();

        return """
            Resumen del sprint actual
            Sprint: %s
            Inicio: %s
            Fin: %s
            Tareas: %d
            DONE: %d
            IN_PROGRESS: %d
            PENDING: %d
            Horas esperadas: %d
            Horas realizadas: %d
            """.formatted(
                sprint.getName(),
                sprint.getStartDate(),
                sprint.getEndDate(),
                sprintTasks.size(),
                done,
                inProgress,
                pending,
                expectedHours,
                doneHours);
    }

    private String teamLoadSummary() {
        Map<String, Integer> totals = workspaceService.storyPointsByAssignee();
        StringJoiner joiner = new StringJoiner("\n", "Carga actual del equipo\n", "");
        totals.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
            .forEach(entry -> joiner.add("- " + entry.getKey() + ": " + entry.getValue() + " pts"));
        return joiner.toString().trim();
    }

    private String formatTasks(String title, List<TaskItem> tasks) {
        if (tasks.isEmpty()) {
            return title + "\nNo encontré tareas para ese criterio.";
        }

        StringJoiner joiner = new StringJoiner("\n", title + "\n", "");
        for (TaskItem task : tasks) {
            joiner.add(String.format("- %d [%s] %s | %s | %d/%d h%s | %s",
                task.getId(),
                task.getStatus(),
                task.getTitle(),
                task.getAssignee(),
                task.getHoursDone(),
                task.getExpectedHours(),
                task.isBug() ? " | BUG" : "",
                task.getSprintName()
            ));
        }
        return joiner.toString().trim();
    }

    private String helpText(String userRole) {
        String help = """
            Puedo ayudarte con consultas y acciones del proyecto, incluso en lenguaje natural.

            Ejemplos:
            - que tareas tiene ana
            - que tareas siguen pendientes
            - crea una tarea llamada revisar la api con descripcion validar contratos asignada a luis de prioridad alta con 4 horas
            - como va el sprint actual
            - quien tiene mas carga

            Comandos disponibles:
            /register - Registrarse como usuario
            /addtask - Agregar nueva tarea
            /deletetask - Eliminar una tarea
            /assigntask - Asignar tarea a un sprint
            /completetask - Marcar tarea como completada
            /mytasks - Ver mis tareas
            /llm - Hacer pregunta libre a la IA
            """;
        
        if ("MANAGER".equalsIgnoreCase(userRole)) {
            help += """

                Comandos de GERENTE:
                /teamkpis <desarrollador> - Ver KPIs de un desarrollador
                /teamtasks - Ver todas las tareas del equipo
                """;
        }
        
        return help;
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "sin filtro" : value;
    }
}
