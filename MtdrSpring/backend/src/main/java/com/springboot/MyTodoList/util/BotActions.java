package com.springboot.MyTodoList.util;

import com.springboot.MyTodoList.agent.AgentOrchestrator;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintTask;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.TeamMember;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.enums.TaskPriority;
import com.springboot.MyTodoList.model.enums.TaskStatus;
import com.springboot.MyTodoList.service.TaskService;
import com.springboot.MyTodoList.service.SprintService;
import com.springboot.MyTodoList.service.SprintTaskService;
import com.springboot.MyTodoList.service.UserService;
import com.springboot.MyTodoList.service.TeamService;
import com.springboot.MyTodoList.service.TeamMemberService;
import com.springboot.MyTodoList.service.DeepSeekService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public class BotActions{

    private static final Logger logger = LoggerFactory.getLogger(BotActions.class);

    String requestText;
    long chatId;
    Long telegramUserId;
    TelegramClient telegramClient;
    boolean exit;

    TaskService taskService;
    SprintService sprintService;
    SprintTaskService sprintTaskService;
    UserService userService;
    TeamService teamService;
    TeamMemberService teamMemberService;
    DeepSeekService deepSeekService;
    AgentOrchestrator agentOrchestrator;

    public BotActions(TelegramClient tc, TaskService ts, SprintService ss, SprintTaskService sts, UserService us, TeamService tms, TeamMemberService tmms, DeepSeekService ds, AgentOrchestrator ao) {
        telegramClient = tc;
        taskService = ts;
        sprintService = ss;
        sprintTaskService = sts;
        userService = us;
        teamService = tms;
        teamMemberService = tmms;
        deepSeekService = ds;
        agentOrchestrator = ao;
        deepSeekService = ds;
        agentOrchestrator = ao;
        exit  = false;
    }

    public void setRequestText(String cmd){
        requestText=cmd;
    }

    public void setChatId(long chId){
        chatId=chId;
    }

    public void setTelegramUserId(Long tgUserId){
        telegramUserId = tgUserId;
    }

    public void setTelegramClient(TelegramClient tc){
        telegramClient=tc;
    }

    public void setDeepSeekService(DeepSeekService dssvc){
        deepSeekService = dssvc;
    }

    public DeepSeekService getDeepSeekService(){
        return deepSeekService;
    }

    private User findUserByTelegramId(String telegramId) {
        List<User> users = userService.findAll();

        for (User u : users) {
            if (u.getTelegramId() != null &&
                u.getTelegramId().equals(telegramId)) {
                return u;
            }
        }

        return null;
    }

    private User findUserById(Long userId) {
        if (userId == null) {
            return null;
        }
        List<User> users = userService.findAll();
        for (User u : users) {
            if (u.getId() != null && u.getId().equals(userId)) {
                return u;
            }
        }
        return null;
    }

    

    public void fnStart() {
        if (!(requestText.equals(BotCommands.START_COMMAND.getCommand()) || requestText.equals(BotLabels.SHOW_MAIN_SCREEN.getLabel())) || exit) 
            return;

        BotHelper.sendMessageToTelegram(chatId, BotMessages.WELCOME.getMessage(), telegramClient);
        exit = true;
    }

    public void fnRegister() {
        if (!requestText.startsWith(BotCommands.REGISTER_COMMAND.getCommand()) || exit) return;

        List<User> users = userService.findAll();

        for (User u : users) {
            if (u.getTelegramId() != null &&
                u.getTelegramId().equals(String.valueOf(telegramUserId))) {

                String nombre =(u.getName() != null) ? u.getName() : "usuario";

                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.USER_OK.getMessage() + " " + nombre + "!",
                        telegramClient);

                exit = true;
                return;
            }
        }

        BotHelper.sendMessageToTelegram(chatId,
                BotMessages.USER_NOT_FOUND.getMessage(),
                telegramClient);

        exit = true;
    }

    public void fnAddTask() {
        if (!requestText.startsWith(BotCommands.ADD_TASK.getCommand()) || exit) return;

        try {
            String[] parts = requestText.replace("/addtask", "").trim().split("\\|");

            if (parts.length < 6) {
                throw new IllegalArgumentException("Formato incompleto para /addtask");
            }

            for (int i = 0; i < parts.length; i++) {
                parts[i] = parts[i].trim();
            }

            String title = extractQuotedValue(parts[0]);
            String description = extractQuotedValue(parts[1]);

            int expectedHours = Integer.parseInt(parts[2]);

            User user = findUserByTelegramId(String.valueOf(telegramUserId));

            if (user == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.USER_NOT_FOUND.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            Long assignedUserId = resolveUserId(parts[5], false);

            if (assignedUserId == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.USER_NOT_FOUND.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            Boolean isBug = parts.length > 4 ? Boolean.parseBoolean(parts[4]) : false;

            Task task = new Task();
            task.setTitle(title);
            task.setDescription(description);
            task.setExpectedHours(expectedHours);
            task.setHoursDone(0);
            task.setPriority(parsePriority(parts[3]));
            task.setIsBug(isBug);
            task.setAssignedTo(assignedUserId);
            task.setCreatedBy(user.getId());
            task.setStatus(TaskStatus.PENDING);
            task.setVector("TELEGRAM");

            taskService.add(task);

            logger.info("Task creada: " + task.getTitle());

            BotHelper.sendMessageToTelegram(chatId,
                    BotMessages.TASK_CREATED.getMessage(),
                    telegramClient);

        } catch (Exception e) {
            logger.error("Error creando task", e);

            BotHelper.sendMessageToTelegram(chatId,
                    BotMessages.TASK_ERROR.getMessage(),
                    telegramClient);
        }

        exit = true;
    }

    private String extractQuotedValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Valor nulo");
        }

        String trimmed = value.trim();
        if (trimmed.length() < 2 || !trimmed.startsWith("\"") || !trimmed.endsWith("\"")) {
            throw new IllegalArgumentException("El titulo y la descripcion deben estar entre comillas dobles");
        }

        String unquoted = trimmed.substring(1, trimmed.length() - 1).trim();
        if (unquoted.isEmpty()) {
            throw new IllegalArgumentException("Valor vacio");
        }

        return unquoted;
    }

    public void fnAssignTask() {
        if (!requestText.startsWith(BotCommands.ASSIGN_TASK.getCommand()) || exit) return;

        try {
            String[] parts = requestText.replace("/assigntask", "").trim().split("\\|");

            for (int i = 0; i < parts.length; i++) {
                parts[i] = parts[i].trim();
            }

            Long taskId = resolveTaskId(parts[0]);
            Long sprintId = resolveSprintId(parts[1]);

            if (taskId == null || sprintId == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.TASK_ASSIGN_ERROR.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            Task task = taskService.getById(taskId).getBody();

            if (task == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.TASK_NOT_FOUND.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            task.setStatus(TaskStatus.IN_PROGRESS);
            taskService.update(taskId, task);

            SprintTask st = new SprintTask();
            st.setTaskId(taskId);
            st.setSprintId(sprintId);
            st.setAddedAt(LocalDateTime.now());

            sprintTaskService.add(st);

            logger.info("Task asignada");

            BotHelper.sendMessageToTelegram(chatId,
                    BotMessages.TASK_ASSIGNED.getMessage(),
                    telegramClient);

        } catch (Exception e) {
            logger.error("Error assign", e);

            BotHelper.sendMessageToTelegram(chatId,
                    BotMessages.TASK_ASSIGN_ERROR.getMessage(),
                    telegramClient);
        }

        exit = true;
    }


    public void fnCompleteTask() {
        if (!requestText.startsWith(BotCommands.COMPLETE_TASK.getCommand()) || exit) return;

        try {
            String[] parts = requestText.replace("/completetask", "").trim().split("\\|");

            for (int i = 0; i < parts.length; i++) {
                parts[i] = parts[i].trim();
            }

            Long taskId = resolveTaskId(parts[0]);
            if (taskId == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.TASK_NOT_FOUND.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            int horas = Integer.parseInt(parts[1]);

            Task task = taskService.getById(taskId).getBody();

            if (task == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.TASK_NOT_FOUND.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            task.setStatus(TaskStatus.DONE);
            task.setHoursDone(horas);
            taskService.update(taskId, task);

            logger.info("Task completada");

            BotHelper.sendMessageToTelegram(chatId,
                    BotMessages.TASK_COMPLETED.getMessage() + " (" + horas + "h)",
                    telegramClient);

        } catch (Exception e) {
            logger.error("Error complete", e);

            BotHelper.sendMessageToTelegram(chatId,
                    BotMessages.TASK_COMPLETE_ERROR.getMessage(),
                    telegramClient);
        }

        exit = true;
    }

    public void fnDeleteTask() {
        if (!requestText.startsWith(BotCommands.DELETE_TASK.getCommand()) || exit) return;

        try {
            String taskIdStr = requestText.replace("/deletetask", "").trim();

            if (taskIdStr.isEmpty()) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.TASK_DELETE_ERROR.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            Long taskId = resolveTaskId(taskIdStr);
            if (taskId == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.TASK_NOT_FOUND.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            Task task = taskService.getById(taskId).getBody();

            if (task == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.TASK_NOT_FOUND.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            taskService.delete(taskId);

            logger.info("Task eliminada");

            BotHelper.sendMessageToTelegram(chatId,
                    BotMessages.TASK_DELETED.getMessage(),
                    telegramClient);

        } catch (Exception e) {
            logger.error("Error delete", e);

            BotHelper.sendMessageToTelegram(chatId,
                    BotMessages.TASK_DELETE_ERROR.getMessage(),
                    telegramClient);
        }

        exit = true;
    }

    public void fnListTasks() {
        if (!requestText.startsWith(BotCommands.LIST_TASKS.getCommand()) || exit) return;

        User user = findUserByTelegramId(String.valueOf(telegramUserId));
        if (user == null) {
            BotHelper.sendMessageToTelegram(chatId,
                    BotMessages.USER_NOT_FOUND.getMessage(),
                    telegramClient);
            exit = true;
            return;
        }

        List<Task> tasks = taskService.findAll();
        List<Task> assignedTasks = tasks.stream()
                .filter(t -> user.getId() != null && user.getId().equals(t.getAssignedTo()))
                .collect(Collectors.toList());

        String msg = BotMessages.TASK_LIST_HEADER.getMessage();

        for (Task t : assignedTasks) {
            msg += "ID: " + t.getId()
                    + " | " + t.getTitle()
                    + " | " + t.getStatus()
                    + "\n";
        }

        if (assignedTasks.isEmpty()) {
            msg += "\nNo tienes tareas asignadas.";
        }

        BotHelper.sendMessageToTelegram(chatId, msg, telegramClient);

        exit = true;
    }

    public void fnTeamKpis() {
        if (!requestText.startsWith(BotCommands.TEAM_KPIS.getCommand()) || exit) return;

        try {
            User manager = findUserByTelegramId(String.valueOf(telegramUserId));
            if (manager == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.USER_NOT_FOUND.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            if (!"MANAGER".equalsIgnoreCase(manager.getRole())) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.MANAGER_ONLY.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            String[] parts = requestText.replace("/teamkpis", "").trim().split("\\|");
            if (parts.length < 1 || parts[0].trim().isEmpty()) {
                BotHelper.sendMessageToTelegram(chatId,
                        "Error: /teamkpis <ID o nombre de desarrollador>",
                        telegramClient);
                exit = true;
                return;
            }

            Long developerId = resolveUserId(parts[0], false);
            if (developerId == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.USER_NOT_FOUND.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            List<Team> managerTeams = teamService.findAll().stream()
                    .filter(t -> manager.getId() != null && manager.getId().equals(t.getManagerId()))
                    .collect(Collectors.toList());

            boolean developerInTeam = false;
            for (Team team : managerTeams) {
                List<TeamMember> members = teamMemberService.findAll().stream()
                        .filter(tm -> team.getId().equals(tm.getTeamId()) && developerId.equals(tm.getMemberUserId()))
                        .collect(Collectors.toList());
                if (!members.isEmpty()) {
                    developerInTeam = true;
                    break;
                }
            }

            if (!developerInTeam) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.DEVELOPER_NOT_IN_TEAM.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            User developer = findUserById(developerId);
            if (developer == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.USER_NOT_FOUND.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            List<Task> allTasks = taskService.findAll();
            List<Task> developerTasks = allTasks.stream()
                    .filter(t -> developerId.equals(t.getAssignedTo()))
                    .collect(Collectors.toList());

            long completedTasks = developerTasks.stream()
                    .filter(t -> TaskStatus.DONE.equals(t.getStatus()))
                    .count();

            int totalHoursDone = developerTasks.stream()
                    .filter(t -> TaskStatus.DONE.equals(t.getStatus()) && t.getHoursDone() != null)
                    .mapToInt(Task::getHoursDone)
                    .sum();

            double avgHoursPerTask = completedTasks > 0
                    ? (double) totalHoursDone / completedTasks
                    : 0;

            long inProgressTasks = developerTasks.stream()
                    .filter(t -> TaskStatus.IN_PROGRESS.equals(t.getStatus()))
                    .count();

            long pendingTasks = developerTasks.stream()
                    .filter(t -> TaskStatus.PENDING.equals(t.getStatus()))
                    .count();

            String kpisMsg = BotMessages.TEAM_KPIS_HEADER.getMessage() + "\n";
            kpisMsg += "Desarrollador: " + developer.getName() + "\n";
            kpisMsg += "─────────────────────────────\n";
            kpisMsg += "Total de tareas completadas: " + completedTasks + "\n";
            kpisMsg += "Total de horas trabajadas: " + totalHoursDone + "h\n";
            kpisMsg += "Promedio de horas por tarea: " + String.format("%.2f", avgHoursPerTask) + "h\n";
            kpisMsg += "Tareas en progreso: " + inProgressTasks + "\n";
            kpisMsg += "Tareas pendientes: " + pendingTasks + "\n";
            kpisMsg += "─────────────────────────────\n";

            kpisMsg += "Tareas completadas por prioridad:\n";
                kpisMsg += buildCompletedTasksByPrioritySection(developerTasks);

            BotHelper.sendMessageToTelegram(chatId, kpisMsg, telegramClient);

        } catch (Exception e) {
            logger.error("Error en fnTeamKpis", e);
            BotHelper.sendMessageToTelegram(chatId,
                    "Error al obtener KPIs del desarrollador.",
                    telegramClient);
        }

        exit = true;
    }

    public void fnTeamTasks() {
        if (!requestText.startsWith(BotCommands.TEAM_TASKS.getCommand()) || exit) return;

        try {
            User manager = findUserByTelegramId(String.valueOf(telegramUserId));
            if (manager == null) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.USER_NOT_FOUND.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            if (!"MANAGER".equalsIgnoreCase(manager.getRole())) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.MANAGER_ONLY.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            List<Team> managerTeams = teamService.findAll().stream()
                    .filter(t -> manager.getId() != null && manager.getId().equals(t.getManagerId()))
                    .collect(Collectors.toList());

            if (managerTeams.isEmpty()) {
                BotHelper.sendMessageToTelegram(chatId,
                        "No tienes equipos asignados.",
                        telegramClient);
                exit = true;
                return;
            }

            List<TeamMember> teamMembers = new ArrayList<>();
            for (Team team : managerTeams) {
                teamMembers.addAll(teamMemberService.findAll().stream()
                        .filter(tm -> team.getId().equals(tm.getTeamId()))
                        .collect(Collectors.toList()));
            }

            List<Task> allTasks = taskService.findAll();
            List<Task> teamTasks = new ArrayList<>();

            for (TeamMember member : teamMembers) {
                Long memberId = member.getMemberUserId();
                for (Task task : allTasks) {
                    if (memberId != null && memberId.equals(task.getAssignedTo())) {
                        teamTasks.add(task);
                    }
                }
            }

            if (teamTasks.isEmpty()) {
                BotHelper.sendMessageToTelegram(chatId,
                        BotMessages.TEAM_TASKS_EMPTY.getMessage(),
                        telegramClient);
                exit = true;
                return;
            }

            String tasksMsg = BotMessages.TEAM_TASKS_HEADER.getMessage() + "\n";
            tasksMsg += "─────────────────────────────\n";

            for (Task task : teamTasks) {
                User assignedUser = findUserById(task.getAssignedTo());
                String userName = assignedUser != null ? assignedUser.getName() : "Desconocido";

                tasksMsg += "ID: " + task.getId()
                        + " | " + task.getTitle()
                        + " | " + task.getStatus()
                        + " | " + task.getPriority()
                        + " | Asignado a: " + userName + "\n";
            }

            tasksMsg += "─────────────────────────────\n";
            tasksMsg += "Total de tareas: " + teamTasks.size();

            BotHelper.sendMessageToTelegram(chatId, tasksMsg, telegramClient);

        } catch (Exception e) {
            logger.error("Error en fnTeamTasks", e);
            BotHelper.sendMessageToTelegram(chatId,
                    "Error al obtener tareas del equipo.",
                    telegramClient);
        }

        exit = true;
    }

        private String buildCompletedTasksByPrioritySection(List<Task> developerTasks) {
        long highPriorityDone = developerTasks.stream()
            .filter(t -> TaskStatus.DONE.equals(t.getStatus()) && TaskPriority.HIGH.equals(t.getPriority()))
            .count();

        long mediumPriorityDone = developerTasks.stream()
            .filter(t -> TaskStatus.DONE.equals(t.getStatus()) && TaskPriority.MEDIUM.equals(t.getPriority()))
            .count();

        long lowPriorityDone = developerTasks.stream()
            .filter(t -> TaskStatus.DONE.equals(t.getStatus()) && TaskPriority.LOW.equals(t.getPriority()))
            .count();

        return "  - Alta: " + highPriorityDone + "\n"
            + "  - Media: " + mediumPriorityDone + "\n"
            + "  - Baja: " + lowPriorityDone;
        }

    public void fnLLM() {
        if (!requestText.startsWith(BotCommands.LLM_REQ.getCommand()) || exit) return;

        try {
            String response = deepSeekService.generateText(requestText);

            BotHelper.sendMessageToTelegram(chatId,
                    BotMessages.LLM_RESPONSE.getMessage() + response,
                    telegramClient);

        } catch (Exception e) {
            logger.error("Error con LLM", e);

            BotHelper.sendMessageToTelegram(chatId,
                    "Error al generar respuesta con IA",
                    telegramClient);
        }

        exit = true;
    }

    private TaskPriority parsePriority(String value) {
        if (value == null || value.isBlank()) {
            return TaskPriority.MEDIUM;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        switch (normalized) {
            case "LOW":
            case "BAJA":
                return TaskPriority.LOW;
            case "HIGH":
            case "ALTA":
                return TaskPriority.HIGH;
            case "MEDIUM":
            case "MEDIA":
            default:
                return TaskPriority.MEDIUM;
        }
    }

    public void fnElse() {
        if (exit) return;

        try {
            User currentUser = findUserByTelegramId(String.valueOf(telegramUserId));
            String userRole = currentUser != null ? currentUser.getRole() : null;
            String response = agentOrchestrator.handleMessage(requestText, userRole);
            if (response != null && !response.isBlank()) {
                if (isCommandLike(response)) {
                    if (dispatchDerivedCommand(response.trim())) {
                        return;
                    }
                }

                BotHelper.sendMessageToTelegram(chatId, response, telegramClient);
            }
        } catch (Exception e) {
            logger.error("Error con el agente de IA", e);
            BotHelper.sendMessageToTelegram(chatId,
                    BotMessages.UNKNOWN_COMMAND.getMessage(),
                    telegramClient);
        }
    }

    private boolean dispatchDerivedCommand(String derivedCommand) {
        String previousRequestText = requestText;
        boolean previousExit = exit;

        requestText = derivedCommand;
        exit = false;

        fnStart();
        fnRegister();
        fnAddTask();
        fnDeleteTask();
        fnAssignTask();
        fnCompleteTask();
        fnListTasks();
        fnTeamKpis();
        fnTeamTasks();
        fnLLM();

        boolean handled = exit;
        if (!handled) {
            requestText = previousRequestText;
            exit = previousExit;
        }

        return handled;
    }

    private boolean isCommandLike(String response) {
        String trimmed = response == null ? "" : response.trim();
        return trimmed.startsWith("/") && trimmed.matches("^/[a-zA-Z]+.*");
    }

    private Long resolveUserId(String value, boolean allowCurrentUserFallback) {
        if (value == null || value.isBlank()) {
            return allowCurrentUserFallback ? resolveCurrentUserId() : null;
        }

        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ignored) {
            // Fall through to name lookup.
        }

        String trimmed = value.trim();
        String normalized = trimmed.toLowerCase(Locale.ROOT);
        for (User user : userService.findAll()) {
            String name = user.getName();
            if (name != null && name.toLowerCase(Locale.ROOT).contains(normalized)) {
                return user.getId();
            }
        }

        return allowCurrentUserFallback ? resolveCurrentUserId() : null;
    }

    private Long resolveTaskId(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ignored) {
            // Fall through to title lookup.
        }

        String trimmed = value.trim();
        String normalized = trimmed.toLowerCase(Locale.ROOT);
        for (Task task : taskService.findAll()) {
            String title = task.getTitle();
            if (title != null && title.toLowerCase(Locale.ROOT).contains(normalized)) {
                return task.getId();
            }
        }

        return null;
    }

    private Long resolveSprintId(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ignored) {
            // Fall through to name lookup.
        }

        String trimmed = value.trim();
        String normalized = trimmed.toLowerCase(Locale.ROOT);
        for (Sprint sprint : sprintService.findAll()) {
            String name = sprint.getName();
            if (name != null && name.toLowerCase(Locale.ROOT).contains(normalized)) {
                return sprint.getId();
            }
        }

        return null;
    }

    private Long resolveCurrentUserId() {
        User user = findUserByTelegramId(String.valueOf(telegramUserId));
        return user != null ? user.getId() : null;
    }

}