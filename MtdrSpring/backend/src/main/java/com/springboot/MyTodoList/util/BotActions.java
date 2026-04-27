package com.springboot.MyTodoList.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.TaskStatus;
import com.springboot.MyTodoList.model.TaskPriority;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.Project;
import com.springboot.MyTodoList.model.ProjectMember;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.repository.ProjectMemberRepository;
import com.springboot.MyTodoList.repository.ProjectRepository;
import com.springboot.MyTodoList.repository.TaskWorkLogRepository;
import com.springboot.MyTodoList.repository.SprintRepository;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintStatus;
import com.springboot.MyTodoList.model.TaskWorkLog;
import com.springboot.MyTodoList.service.GeminiService;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.service.telegram.TelegramLinkService;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public class BotActions {

    private static final Logger logger = LoggerFactory.getLogger(BotActions.class);
    private static final long CONFIRMATION_TTL_MS = 5 * 60 * 1000;
    private static final Map<Long, PendingCommand> pendingCommands = new ConcurrentHashMap<>();

    private record PendingCommand(String command, long createdAtMs) {}

    String requestText;
    long chatId;
    TelegramClient telegramClient;
    boolean exit;
    boolean parserDryRun;
    boolean parserRequireConfirmation;
    boolean parserDebug;
    boolean useHttpApi;
    String internalApiBaseUrl;
    String internalApiKey;

    ToDoItemService todoService;
    GeminiService geminiService;
    TelegramLinkService telegramLinkService;
    UserRepository userRepository;
    ProjectMemberRepository projectMemberRepository;
    ProjectRepository projectRepository;
    TaskWorkLogRepository taskWorkLogRepository;
    SprintRepository sprintRepository;
    final HttpClient internalHttpClient;
    final ObjectMapper objectMapper;

    public BotActions(TelegramClient tc, ToDoItemService ts, GeminiService gs, TelegramLinkService tls, UserRepository ur, ProjectMemberRepository pmr, ProjectRepository pr, TaskWorkLogRepository twlr, SprintRepository sr, boolean dryRun, boolean requireConfirmation, boolean debug, boolean useHttpApi, String internalApiBaseUrl, String internalApiKey) {
        telegramClient = tc;
        todoService = ts;
        geminiService = gs;
        telegramLinkService = tls;
        userRepository = ur;
        projectMemberRepository = pmr;
        projectRepository = pr;
        taskWorkLogRepository = twlr;
        sprintRepository = sr;
        parserDryRun = dryRun;
        parserRequireConfirmation = requireConfirmation;
        parserDebug = debug;
        this.useHttpApi = useHttpApi;
        this.internalApiBaseUrl = internalApiBaseUrl;
        this.internalApiKey = internalApiKey;
        this.internalHttpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        this.objectMapper = new ObjectMapper();
        exit = false;
    }

    private String fetchStatusViaHttp(UUID projectId, String arg) throws Exception {
        String base = internalApiBaseUrl == null || internalApiBaseUrl.isBlank() ? "http://localhost:8080" : internalApiBaseUrl;
        String url = base + "/internal/bot-status/project/" + projectId;
        if (arg != null && !arg.isBlank()) {
            url += "?query=" + URLEncoder.encode(arg, StandardCharsets.UTF_8);
        }

        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(Duration.ofSeconds(10))
            .header("Accept", "application/json")
            .GET();

        if (internalApiKey != null && !internalApiKey.isBlank()) {
            builder.header("X-Bot-Api-Key", internalApiKey);
        }

        HttpResponse<String> response = internalHttpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Internal bot status API failed: " + response.statusCode() + " body=" + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode messageNode = root.path("message");
        if (messageNode.isMissingNode() || messageNode.isNull()) {
            throw new IllegalStateException("Internal bot status API did not return a message field.");
        }
        return messageNode.asText();
    }

    private boolean tryHandlePendingConfirmation() {
        PendingCommand pending = pendingCommands.get(chatId);
        if (pending == null) return false;

        long now = System.currentTimeMillis();
        if (now - pending.createdAtMs() > CONFIRMATION_TTL_MS) {
            pendingCommands.remove(chatId);
            BotHelper.sendMessageToTelegram(chatId,
                "Pending confirmation expired. Please send your request again.",
                telegramClient,
                null);
            exit = true;
            return true;
        }

        String normalized = requestText == null ? "" : requestText.trim().toLowerCase();
        if (normalized.equals("confirm") || normalized.equals("yes")) {
            pendingCommands.remove(chatId);
            executeCommand(pending.command());
            return true;
        }

        if (normalized.equals("cancel") || normalized.equals("no")) {
            pendingCommands.remove(chatId);
            BotHelper.sendMessageToTelegram(chatId,
                "Cancelled. No changes were applied.",
                telegramClient,
                null);
            exit = true;
            return true;
        }

        BotHelper.sendMessageToTelegram(chatId,
            "You have a pending command. Reply 'confirm' to execute or 'cancel' to discard.",
            telegramClient,
            null);
        exit = true;
        return true;
    }

    private void executeCommand(String commandText) {
        requestText = commandText;

        if (commandText.startsWith("/create")) {
            fnCreate();
            return;
        }
        if (commandText.startsWith("/updatestatus")) {
            fnUpdateStatus();
            return;
        }
        if (commandText.startsWith("/loghours")) {
            fnLogHours();
            return;
        }
        if (commandText.startsWith("/_deleteconfirm")) {
            fnDeleteCommand();
            return;
        }
        if (commandText.startsWith("/delete")) {
            fnDeleteCommand();
            return;
        }
        if (commandText.startsWith("/status")) {
            fnStatus();
            return;
        }
        if (commandText.startsWith("/help")) {
            fnHelp();
            return;
        }

        BotHelper.sendMessageToTelegram(chatId,
            "Failed to execute pending command. Please try again.",
            telegramClient,
            null);
        exit = true;
    }

    private Sprint getActiveSprint(UUID projectId) {
        List<Sprint> activeSprints = sprintRepository.findByProject_IdAndStatus(projectId, SprintStatus.ACTIVE);
        LocalDate today = LocalDate.now();

        if (activeSprints.isEmpty()) {
            List<Sprint> allSprints = sprintRepository.findByProject_Id(projectId);
            if (allSprints.isEmpty()) return null;
            return allSprints.stream()
                .min(java.util.Comparator.comparingLong(s -> Math.abs(s.getStartDate().toEpochDay() - today.toEpochDay())))
                .orElse(allSprints.get(0));
        }

        if (activeSprints.size() == 1) return activeSprints.get(0);
        
        List<Sprint> currentSprints = activeSprints.stream()
            .filter(s -> !today.isBefore(s.getStartDate()) && !today.isAfter(s.getEndDate()))
            .collect(Collectors.toList());
            
        if (currentSprints.size() == 1) return currentSprints.get(0);
        
        return activeSprints.stream()
            .min(java.util.Comparator.comparingLong(s -> Math.abs(s.getStartDate().toEpochDay() - today.toEpochDay())))
            .orElse(activeSprints.get(0));
    }

    private record ResolvedReference(String kind, UUID id, String label, double confidence) {}

    private GeminiService.SemanticSelection resolveCandidate(String userQuery, String context, List<GeminiService.SemanticCandidate> candidates) {
        if (userQuery == null || userQuery.trim().isEmpty() || candidates == null || candidates.isEmpty()) {
            return null;
        }
        return geminiService.resolveSemanticCandidate(userQuery.trim(), context, candidates);
    }

    private ResolvedReference resolveStatusReference(Project project, String userQuery, List<Sprint> sprints, List<Task> tasks) {
        List<GeminiService.SemanticCandidate> candidates = new ArrayList<>();
        Map<String, Sprint> sprintById = new HashMap<>();
        Map<String, Task> taskById = new HashMap<>();

        for (Sprint sprint : sprints) {
            String sprintId = sprint.getId().toString();
            sprintById.put(sprintId, sprint);
            candidates.add(new GeminiService.SemanticCandidate(
                sprintId,
                "SPRINT",
                sprint.getName(),
                String.format("Sprint status=%s start=%s end=%s", sprint.getStatus(), sprint.getStartDate(), sprint.getEndDate())
            ));
        }

        for (Task task : tasks) {
            String taskId = task.getId().toString();
            taskById.put(taskId, task);
            candidates.add(new GeminiService.SemanticCandidate(
                taskId,
                "TASK",
                task.getTitle(),
                String.format("Task status=%s priority=%s", task.getStatus(), task.getPriority())
            ));
        }

        GeminiService.SemanticSelection selection = resolveCandidate(userQuery, "Resolve whether the user is referring to a sprint or a task in project status queries.", candidates);
        if (selection == null || selection.id() == null) {
            return null;
        }

        if ("SPRINT".equalsIgnoreCase(selection.kind()) && sprintById.containsKey(selection.id())) {
            Sprint sprint = sprintById.get(selection.id());
            return new ResolvedReference("SPRINT", sprint.getId(), sprint.getName(), selection.confidence());
        }

        if ("TASK".equalsIgnoreCase(selection.kind()) && taskById.containsKey(selection.id())) {
            Task task = taskById.get(selection.id());
            return new ResolvedReference("TASK", task.getId(), task.getTitle(), selection.confidence());
        }

        return null;
    }

    private ResolvedReference resolveTaskReference(String userQuery, String context, List<Task> tasks) {
        List<GeminiService.SemanticCandidate> candidates = new ArrayList<>();
        Map<String, Task> taskById = new HashMap<>();

        for (Task task : tasks) {
            String taskId = task.getId().toString();
            taskById.put(taskId, task);
            candidates.add(new GeminiService.SemanticCandidate(
                taskId,
                "TASK",
                task.getTitle(),
                String.format("Task status=%s priority=%s", task.getStatus(), task.getPriority())
            ));
        }

        GeminiService.SemanticSelection selection = resolveCandidate(userQuery, context, candidates);
        if (selection == null || selection.id() == null) {
            return null;
        }

        if (taskById.containsKey(selection.id())) {
            Task task = taskById.get(selection.id());
            return new ResolvedReference("TASK", task.getId(), task.getTitle(), selection.confidence());
        }

        return null;
    }

    public void setRequestText(String cmd) { requestText = cmd; }
    public void setChatId(long chId) { chatId = chId; }
    public void setTelegramClient(TelegramClient tc) { telegramClient = tc; }
    public void setTodoService(ToDoItemService tsvc) { todoService = tsvc; }
    public ToDoItemService getTodoService() { return todoService; }
    public void setGeminiService(GeminiService gsvc) { geminiService = gsvc; }
    public GeminiService getGeminiService() { return geminiService; }

    public void fnLink() {
        if (requestText == null || !requestText.startsWith("/link")) return;
        
        String[] parts = requestText.split(" ");
        if (parts.length == 2) {
            String code = parts[1];
            boolean linked = telegramLinkService.linkAccount(code, String.valueOf(chatId));
            if (linked) {
                BotHelper.sendMessageToTelegram(chatId, "Account successfully linked!", telegramClient);
            } else {
                BotHelper.sendMessageToTelegram(chatId, "Invalid or expired linking code.", telegramClient);
            }
        } else {
            BotHelper.sendMessageToTelegram(chatId, "Usage: /link <code>", telegramClient);
        }
        exit = true;
    }

    public void fnStart() {
        if (!(requestText.equals(BotCommands.START_COMMAND.getCommand())
                || requestText.equals(BotLabels.SHOW_MAIN_SCREEN.getLabel())) || exit)
            return;

        BotHelper.sendMessageToTelegram(chatId, "Welcome to the Oracle Project Manager Bot!\nUse /help to see all available commands.\nIf you haven't linked your account, use /link <code>.", telegramClient,
            ReplyKeyboardMarkup.builder()
                .keyboardRow(new KeyboardRow("/help", "/status", "/create New Task"))
                .build());
        exit = true;
    }

    public void fnHelp() {
        if (!requestText.equals("/help") || exit) return;
        String helpMsg = "Available Commands:\n" +
                         "/start - View welcome message\n" +
                         "/link <code> - Link your Telegram account\n" +
                         "/help - Show available commands\n" +
                         "/status [sprint name | task title] - Get project summary, sprint summary, or task status\n" +
                         "/create <title> | <LOW|MEDIUM|HIGH> - Create a task with priority (e.g. /create Fix DB bug | HIGH)\n" +
                         "/delete <title> - Request deletion for a matching task (requires confirmation)\n" +
                         "/updatestatus <IN_PROGRESS/BLOCKED/DONE> <task title> - Update task status\n" +
                         "/loghours <hours> <task title> - Log hours worked on a task";
        BotHelper.sendMessageToTelegram(chatId, helpMsg, telegramClient);
        exit = true;
    }

    public void fnStatus() {
        if (requestText == null || !requestText.toLowerCase().startsWith("/status") || exit) return;
        
        User user = userRepository.findByTelegramChatId(String.valueOf(chatId)).orElse(null);
        if (user == null) {
            BotHelper.sendMessageToTelegram(chatId, "To check status via bot, please link your account first with /link <code>.", telegramClient);
            exit = true;
            return;
        }
        
        List<ProjectMember> memberships = projectMemberRepository.findByUser_Id(user.getId());
        if (memberships.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, "You are not assigned to any projects.", telegramClient);
            exit = true;
            return;
        }
        
        // Use eager fetching or explicitly load project data via its own repository if LazyInitialization happens
        UUID projectId = memberships.get(0).getProject().getId();
        Project project = projectRepository.findById(projectId).orElse(null);
        
        if (project == null) {
            BotHelper.sendMessageToTelegram(chatId, "Project not found.", telegramClient);
            exit = true;
            return;
        }

        String arg = requestText.trim().length() > 7 ? requestText.trim().substring(7).trim() : "";
        List<Sprint> sprints = sprintRepository.findByProject_Id(project.getId());
        List<Task> projectTasks = todoService.findByProjectId(project.getId());
        ResolvedReference statusReference = null;

        if (!arg.isEmpty()) {
            statusReference = resolveStatusReference(project, arg, sprints, projectTasks);
        }

        if (useHttpApi) {
            try {
                String message = fetchStatusViaHttp(project.getId(), statusReference != null ? statusReference.label() : arg);
                BotHelper.sendMessageToTelegram(chatId, message, telegramClient);
                exit = true;
                return;
            } catch (Exception e) {
                logger.error("HTTP status mode failed, falling back to in-process status handling.", e);
                BotHelper.sendMessageToTelegram(chatId,
                    "HTTP status mode failed; using local status mode.",
                    telegramClient);
            }
            // Continue to local mode fallback if HTTP mode errored.
        }

        if (arg.isEmpty()) {
            long todo = projectTasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
            long inProgress = projectTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
            long blocked = projectTasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count();
            long done = projectTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();

            String msg = String.format("Status for Project: %s\nTODO: %d\nIN_PROGRESS: %d\nBLOCKED: %d\nDONE: %d",
                                       project.getName(), todo, inProgress, blocked, done);
            BotHelper.sendMessageToTelegram(chatId, msg, telegramClient);
            exit = true;
            return;
        }

        Sprint sprintMatch = null;
        Task taskMatch = null;
        final String resolvedKind = statusReference != null ? statusReference.kind() : null;
        final UUID resolvedId = statusReference != null ? statusReference.id() : null;

        if (statusReference != null) {
            if ("SPRINT".equalsIgnoreCase(resolvedKind)) {
                sprintMatch = sprints.stream()
                    .filter(s -> s.getId().equals(resolvedId))
                    .findFirst()
                    .orElse(null);
            } else if ("TASK".equalsIgnoreCase(resolvedKind)) {
                taskMatch = projectTasks.stream()
                    .filter(t -> t.getId().equals(resolvedId))
                    .findFirst()
                    .orElse(null);
            }
        }

        if (sprintMatch == null && taskMatch == null) {
            sprintMatch = sprints.stream()
                .filter(s -> s.getName().equalsIgnoreCase(arg))
                .findFirst()
                .orElse(null);
        }

        if (sprintMatch != null) {
            List<Task> sprintTasks = todoService.findBySprintId(sprintMatch.getId());
            long todo = sprintTasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
            long inProgress = sprintTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
            long blocked = sprintTasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count();
            long done = sprintTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();

            String msg = String.format(
                "Status for Sprint: %s\nTODO: %d\nIN_PROGRESS: %d\nBLOCKED: %d\nDONE: %d",
                sprintMatch.getName(),
                todo,
                inProgress,
                blocked,
                done
            );
            BotHelper.sendMessageToTelegram(chatId, msg, telegramClient);
            exit = true;
            return;
        }

        if (taskMatch == null) {
            taskMatch = projectTasks.stream()
                .filter(t -> t.getTitle().equalsIgnoreCase(arg))
                .findFirst()
                .orElse(null);
        }

        if (taskMatch != null) {
            String msg = String.format(
                "Task Status\nTitle: %s\nStatus: %s\nPriority: %s",
                taskMatch.getTitle(),
                taskMatch.getStatus(),
                taskMatch.getPriority()
            );
            BotHelper.sendMessageToTelegram(chatId, msg, telegramClient);
            exit = true;
            return;
        }

        List<Task> exactTaskMatches = projectTasks.stream()
            .filter(t -> t.getTitle().equalsIgnoreCase(arg))
            .collect(Collectors.toList());

        if (exactTaskMatches.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId,
                "No sprint or task found with that name/title. Use /status for project summary.",
                telegramClient);
        } else if (exactTaskMatches.size() > 1) {
            BotHelper.sendMessageToTelegram(chatId,
                "Multiple tasks found with that title. Please use a unique task title.",
                telegramClient);
        } else {
            Task task = exactTaskMatches.get(0);
            String msg = String.format(
                "Task Status\nTitle: %s\nStatus: %s\nPriority: %s",
                task.getTitle(),
                task.getStatus(),
                task.getPriority()
            );
            BotHelper.sendMessageToTelegram(chatId, msg, telegramClient);
        }
        exit = true;
    }

    public void fnCreate() {
        if (!requestText.startsWith("/create") || exit) return;
        
        User user = userRepository.findByTelegramChatId(String.valueOf(chatId)).orElse(null);
        if (user == null) {
            BotHelper.sendMessageToTelegram(chatId, "To create tasks via bot, please link your account first with /link <code>.", telegramClient);
            exit = true;
            return;
        }
        
        String createArgs = requestText.substring(7).trim();
        if (createArgs.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, "Usage: /create <task title> | <LOW|MEDIUM|HIGH>", telegramClient);
            exit = true;
            return;
        }

        String title = createArgs;
        TaskPriority priority = TaskPriority.MEDIUM;

        if (createArgs.contains("|")) {
            String[] createParts = createArgs.split("\\|", 2);
            title = createParts[0].trim();
            String priorityRaw = createParts[1].trim().toUpperCase();

            if (title.isEmpty()) {
                BotHelper.sendMessageToTelegram(chatId, "Task title cannot be empty.", telegramClient);
                exit = true;
                return;
            }

            try {
                priority = TaskPriority.valueOf(priorityRaw);
            } catch (IllegalArgumentException e) {
                BotHelper.sendMessageToTelegram(chatId, "Invalid priority. Use LOW, MEDIUM, or HIGH.", telegramClient);
                exit = true;
                return;
            }
        } else if (title.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, "Task title cannot be empty.", telegramClient);
            exit = true;
            return;
        }
        
        List<ProjectMember> memberships = projectMemberRepository.findByUser_Id(user.getId());
        if (memberships.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, "You are not assigned to any projects. Cannot create task.", telegramClient);
            exit = true;
            return;
        }
        
        Project project = projectRepository.findById(memberships.get(0).getProject().getId()).orElse(null);
        
        if (project == null) {
            BotHelper.sendMessageToTelegram(chatId, "Project not found.", telegramClient);
            exit = true;
            return;
        }

        Sprint sprint = getActiveSprint(project.getId());

        Task t = new Task();
        t.setTitle(title);
        t.setProject(project);
        t.setSprint(sprint);
        t.setCreatedBy(user);
        t.setAssignee(user);
        t.setPriority(priority);
        t.setStatus(TaskStatus.TODO);
        
        try {
            todoService.addToDoItem(t, user, com.springboot.MyTodoList.model.ChangeSource.TELEGRAM);
            String location = sprint != null ? "sprint '" + sprint.getName() + "'" : "backlog";
            BotHelper.sendMessageToTelegram(chatId, "Task created successfully in " + location + " with priority " + priority + ":\n" + title, telegramClient);
        } catch (Exception e) {
            logger.error("Failed to create task", e);
            BotHelper.sendMessageToTelegram(chatId, "Failed to create task due to a server error.", telegramClient);
        }
        exit = true;
    }

    public void fnDeleteCommand() {
        if (!(requestText.startsWith("/delete ") || requestText.startsWith("/_deleteconfirm ")) || exit) return;
        
        User user = userRepository.findByTelegramChatId(String.valueOf(chatId)).orElse(null);
        if (user == null) {
            BotHelper.sendMessageToTelegram(chatId, "Please link your account first with /link <code>.", telegramClient);
            exit = true;
            return;
        }
        
        String title = requestText.substring(8).trim();
        if (title.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, "Usage: /delete <task title>", telegramClient);
            exit = true;
            return;
        }
        
        List<ProjectMember> memberships = projectMemberRepository.findByUser_Id(user.getId());
        if (memberships.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, "You are not assigned to any projects.", telegramClient);
            exit = true;
            return;
        }
        
        UUID projectId = memberships.get(0).getProject().getId();
        List<Task> tasks = todoService.findByProjectId(projectId);

        if (requestText.startsWith("/_deleteconfirm ")) {
            String idRaw = requestText.substring("/_deleteconfirm ".length()).trim();
            UUID taskId;
            try {
                taskId = UUID.fromString(idRaw);
            } catch (IllegalArgumentException e) {
                BotHelper.sendMessageToTelegram(chatId, "Delete confirmation failed due to an invalid task id. Please try /delete again.", telegramClient);
                exit = true;
                return;
            }

            Task taskToDelete = tasks.stream()
                .filter(t -> t.getId().equals(taskId))
                .findFirst()
                .orElse(null);

            if (taskToDelete == null) {
                BotHelper.sendMessageToTelegram(chatId, "Task no longer exists or you no longer have access to it.", telegramClient);
                exit = true;
                return;
            }

            boolean deleted = todoService.deleteToDoItem(taskToDelete.getId());
            if (deleted) {
                BotHelper.sendMessageToTelegram(chatId, "Task deleted successfully: " + taskToDelete.getTitle(), telegramClient);
            } else {
                BotHelper.sendMessageToTelegram(chatId, "Failed to delete task due to an error.", telegramClient);
            }
            exit = true;
            return;
        }

        ResolvedReference taskReference = resolveTaskReference(title, "Resolve the task to delete.", tasks);
        Task selectedTask = null;
        if (taskReference != null) {
            selectedTask = tasks.stream().filter(t -> t.getId().equals(taskReference.id())).findFirst().orElse(null);
        }

        if (selectedTask == null) {
            List<Task> matchingTasks = tasks.stream()
                .filter(t -> t.getTitle().equalsIgnoreCase(title))
                .collect(Collectors.toList());

            if (matchingTasks.isEmpty()) {
                BotHelper.sendMessageToTelegram(chatId, "Could not find a task matching: " + title, telegramClient);
            } else if (matchingTasks.size() > 1) {
                BotHelper.sendMessageToTelegram(chatId, "Found multiple tasks with that title. Please use the web UI to delete, or ensure task titles are unique.", telegramClient);
            } else {
                selectedTask = matchingTasks.get(0);
            }
        }

        if (selectedTask != null) {
            PendingCommand previousPending = pendingCommands.put(
                chatId,
                new PendingCommand("/_deleteconfirm " + selectedTask.getId(), System.currentTimeMillis())
            );
            String baseConfirmMsg = String.format(
                "Please confirm task deletion.\nTitle: %s\nStatus: %s\nPriority: %s\n\nReply 'confirm' to delete or 'cancel' to keep it.",
                selectedTask.getTitle(),
                selectedTask.getStatus(),
                selectedTask.getPriority()
            );
            String confirmMsg = baseConfirmMsg;
            if (previousPending != null && previousPending.command() != null && previousPending.command().startsWith("/_deleteconfirm ")) {
                confirmMsg = "Previous delete request replaced.\n\n" + baseConfirmMsg;
            }
            BotHelper.sendMessageToTelegram(chatId, confirmMsg, telegramClient, null);
        }
        exit = true;
    }

    public void fnUpdateStatus() {
        if (exit || requestText == null || !requestText.toLowerCase().startsWith("/updatestatus")) return;

        try {
            User user = userRepository.findByTelegramChatId(String.valueOf(chatId)).orElse(null);
            if (user == null) {
                BotHelper.sendMessageToTelegram(chatId, "Please /link your account first.", telegramClient);
                exit = true;
                return;
            }

            String[] parts = requestText.trim().split("\\s+", 3);
            if (parts.length < 3) {
                BotHelper.sendMessageToTelegram(chatId, "Usage: /updatestatus <IN_PROGRESS|BLOCKED|DONE|TODO> <task title>", telegramClient);
                exit = true;
                return;
            }

            String statusStr = parts[1].toUpperCase();
            String title = parts[2].trim();
            TaskStatus newStatus;
            try {
                newStatus = TaskStatus.valueOf(statusStr);
            } catch (IllegalArgumentException e) {
                BotHelper.sendMessageToTelegram(chatId, "Invalid status. Use TODO, IN_PROGRESS, BLOCKED, or DONE.", telegramClient);
                exit = true;
                return;
            }

            List<ProjectMember> memberships = projectMemberRepository.findByUser_Id(user.getId());
            if (memberships.isEmpty()) {
                BotHelper.sendMessageToTelegram(chatId, "You have no projects.", telegramClient);
                exit = true;
                return;
            }

            UUID projectId = memberships.get(0).getProject().getId();
            Sprint activeSprint = getActiveSprint(projectId);

            List<Task> projectTasks = todoService.findByProjectId(projectId);
            ResolvedReference taskReference = resolveTaskReference(title, "Resolve the task for a status update.", projectTasks);
            Task selectedTask = null;
            if (taskReference != null) {
                selectedTask = projectTasks.stream().filter(t -> t.getId().equals(taskReference.id())).findFirst().orElse(null);
            }

            if (selectedTask == null) {
                List<Task> matchingTasks = projectTasks.stream()
                    .filter(t -> t.getTitle().equalsIgnoreCase(title))
                    .collect(Collectors.toList());

                if (matchingTasks.isEmpty()) {
                    BotHelper.sendMessageToTelegram(chatId, "Task not found.", telegramClient);
                    exit = true;
                    return;
                } else if (matchingTasks.size() > 1) {
                    BotHelper.sendMessageToTelegram(chatId, "Multiple tasks found with that title, please use web UI.", telegramClient);
                    exit = true;
                    return;
                }

                selectedTask = matchingTasks.get(0);
            }

            if (selectedTask == null) {
                BotHelper.sendMessageToTelegram(chatId, "Task not found.", telegramClient);
                exit = true;
                return;
            }

            boolean assignedToSprint = selectedTask.getSprint() == null && activeSprint != null;
            todoService.patchStatusAndSprint(selectedTask.getId(), newStatus, activeSprint, user, com.springboot.MyTodoList.model.ChangeSource.TELEGRAM);

            String msg = "Task status updated to " + newStatus;
            if (assignedToSprint) {
                msg += " in sprint '" + activeSprint.getName() + "'";
            }
            BotHelper.sendMessageToTelegram(chatId, msg, telegramClient);
        } catch (Exception e) {
            logger.error("Failed to update task status for chatId={}", chatId, e);
            BotHelper.sendMessageToTelegram(chatId, "Failed to update task status due to a server error.", telegramClient);
        }

        exit = true;
    }

    public void fnLogHours() {
        if (!requestText.startsWith("/loghours ") || exit) return;
        
        User user = userRepository.findByTelegramChatId(String.valueOf(chatId)).orElse(null);
        if (user == null) {BotHelper.sendMessageToTelegram(chatId, "Please /link your account first.", telegramClient); exit = true; return;}
        
        String[] parts = requestText.split(" ", 3);
        if (parts.length < 3) {
            BotHelper.sendMessageToTelegram(chatId, "Usage: /loghours <hours> <task title>", telegramClient);
            exit = true; return;
        }
        
        double hours;
        try {
            hours = Double.parseDouble(parts[1]);
            if (hours <= 0 || hours > 100) throw new NumberFormatException();
        } catch(NumberFormatException e) {
            BotHelper.sendMessageToTelegram(chatId, "Invalid hours. Must be a number between 0.1 and 100.", telegramClient);
            exit = true; return;
        }

        String title = parts[2].trim();
        List<ProjectMember> memberships = projectMemberRepository.findByUser_Id(user.getId());
        if (memberships.isEmpty()) {BotHelper.sendMessageToTelegram(chatId, "You have no projects.", telegramClient); exit = true; return;}
        
        UUID projectId = memberships.get(0).getProject().getId();
        Sprint activeSprint = getActiveSprint(projectId);

        List<Task> projectTasks = todoService.findByProjectId(projectId);
        ResolvedReference taskReference = resolveTaskReference(title, "Resolve the task for logging hours.", projectTasks);
        Task selectedTask = null;
        if (taskReference != null) {
            selectedTask = projectTasks.stream().filter(t -> t.getId().equals(taskReference.id())).findFirst().orElse(null);
        }

        if (selectedTask == null) {
            List<Task> matchingTasks = projectTasks.stream()
                .filter(t -> t.getTitle().equalsIgnoreCase(title))
                .collect(Collectors.toList());

            if (matchingTasks.isEmpty()) {
                BotHelper.sendMessageToTelegram(chatId, "Task not found.", telegramClient);
                exit = true;
                return;
            } else if (matchingTasks.size() > 1) {
                BotHelper.sendMessageToTelegram(chatId, "Multiple tasks found.", telegramClient);
                exit = true;
                return;
            }

            selectedTask = matchingTasks.get(0);
        }

        if (selectedTask == null) {
            BotHelper.sendMessageToTelegram(chatId, "Task not found.", telegramClient);
            exit = true;
            return;
        }

        // Move to active sprint if it is logged without a sprint
        if (selectedTask.getSprint() == null && activeSprint != null) {
            selectedTask.setSprint(activeSprint);
            todoService.updateToDoItem(selectedTask.getId(), selectedTask, user, com.springboot.MyTodoList.model.ChangeSource.TELEGRAM);
        }

        TaskWorkLog log = new TaskWorkLog();
        log.setTask(selectedTask);
        log.setUser(user);
        log.setWorkDate(LocalDate.now());
        log.setHoursWorked(BigDecimal.valueOf(hours));
        taskWorkLogRepository.save(log);
        BotHelper.sendMessageToTelegram(chatId, "Logged " + hours + " hours to task: " + selectedTask.getTitle(), telegramClient);
        exit = true;
    }

    public void fnDone() {
        if (!requestText.contains(BotLabels.DASH.getLabel() + BotLabels.DONE.getLabel()) || exit)
            return;

        String idStr = requestText.substring(0, requestText.indexOf(BotLabels.DASH.getLabel()));
        try {
            UUID id = UUID.fromString(idStr);
            Task task = todoService.getToDoItemById(id);
            if (task != null) {
                task.setStatus(TaskStatus.DONE);
                // completedAt is set by trg_task_bu — do not set here.
                todoService.updateToDoItem(id, task);
                BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_DONE.getMessage(), telegramClient);
            }
        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnUndo() {
        if (!requestText.contains(BotLabels.DASH.getLabel() + BotLabels.UNDO.getLabel()) || exit)
            return;

        String idStr = requestText.substring(0, requestText.indexOf(BotLabels.DASH.getLabel()));
        try {
            UUID id = UUID.fromString(idStr);
            Task task = todoService.getToDoItemById(id);
            if (task != null) {
                task.setStatus(TaskStatus.TODO);
                // completedAt cleared and reworkCount incremented by trg_task_bu — do not set here.
                todoService.updateToDoItem(id, task);
                BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_UNDONE.getMessage(), telegramClient);
            }
        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnDelete() {
        if (!requestText.contains(BotLabels.DASH.getLabel() + BotLabels.DELETE.getLabel()) || exit)
            return;

        String idStr = requestText.substring(0, requestText.indexOf(BotLabels.DASH.getLabel()));
        try {
            UUID id = UUID.fromString(idStr);
            todoService.deleteToDoItem(id);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_DELETED.getMessage(), telegramClient);
        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnHide() {
        if (requestText.equals(BotCommands.HIDE_COMMAND.getCommand())
                || requestText.equals(BotLabels.HIDE_MAIN_SCREEN.getLabel()) && !exit)
            BotHelper.sendMessageToTelegram(chatId, BotMessages.BYE.getMessage(), telegramClient);
        else
            return;
        exit = true;
    }

    public void fnListAll() {
        if (!(requestText.equals(BotCommands.TODO_LIST.getCommand())
                || requestText.equals(BotLabels.LIST_ALL_ITEMS.getLabel())
                || requestText.equals(BotLabels.MY_TODO_LIST.getLabel())) || exit)
            return;

        logger.info("todoSvc: " + todoService);
        List<Task> allTasks = todoService.findAll();
        ReplyKeyboardMarkup keyboardMarkup = ReplyKeyboardMarkup.builder()
            .resizeKeyboard(true)
            .oneTimeKeyboard(false)
            .selective(true)
            .build();

        List<KeyboardRow> keyboard = new ArrayList<>();

        KeyboardRow mainScreenRowTop = new KeyboardRow();
        mainScreenRowTop.add(BotLabels.SHOW_MAIN_SCREEN.getLabel());
        keyboard.add(mainScreenRowTop);

        KeyboardRow firstRow = new KeyboardRow();
        firstRow.add(BotLabels.ADD_NEW_ITEM.getLabel());
        keyboard.add(firstRow);

        KeyboardRow titleRow = new KeyboardRow();
        titleRow.add(BotLabels.MY_TODO_LIST.getLabel());
        keyboard.add(titleRow);

        List<Task> activeTasks = allTasks.stream()
            .filter(t -> t.getStatus() != TaskStatus.DONE)
            .collect(Collectors.toList());

        for (Task task : activeTasks) {
            KeyboardRow row = new KeyboardRow();
            row.add(task.getTitle());
            row.add(task.getId() + BotLabels.DASH.getLabel() + BotLabels.DONE.getLabel());
            keyboard.add(row);
        }

        List<Task> doneTasks = allTasks.stream()
            .filter(t -> t.getStatus() == TaskStatus.DONE)
            .collect(Collectors.toList());

        for (Task task : doneTasks) {
            KeyboardRow row = new KeyboardRow();
            row.add(task.getTitle());
            row.add(task.getId() + BotLabels.DASH.getLabel() + BotLabels.UNDO.getLabel());
            row.add(task.getId() + BotLabels.DASH.getLabel() + BotLabels.DELETE.getLabel());
            keyboard.add(row);
        }

        KeyboardRow mainScreenRowBottom = new KeyboardRow();
        mainScreenRowBottom.add(BotLabels.SHOW_MAIN_SCREEN.getLabel());
        keyboard.add(mainScreenRowBottom);

        keyboardMarkup.setKeyboard(keyboard);
        BotHelper.sendMessageToTelegram(chatId, BotLabels.MY_TODO_LIST.getLabel(), telegramClient, keyboardMarkup);
        exit = true;
    }

    public void fnAddItem() {
        logger.info("Adding item");
        if (!(requestText.contains(BotCommands.ADD_ITEM.getCommand())
                || requestText.contains(BotLabels.ADD_NEW_ITEM.getLabel())) || exit)
            return;
        logger.info("Adding item by BotHelper");
        BotHelper.sendMessageToTelegram(chatId, BotMessages.TYPE_NEW_TODO_ITEM.getMessage(), telegramClient);
        exit = true;
    }

    public void fnElse() {
        if (exit) return;

        if (requestText == null || requestText.trim().isEmpty()) return;

        if (tryHandlePendingConfirmation()) {
            return;
        }

        // Keep slash commands deterministic. Unknown slash commands should not go to LLM parsing.
        if (requestText.trim().startsWith("/")) {
            logger.warn("Unrecognized slash command from chatId={}: {}", chatId, requestText);
            BotHelper.sendMessageToTelegram(chatId,
                "I didn't understand that command. Use /help to see available commands.", telegramClient, null);
            return;
        }

        try {
            GeminiService.IntentDiagnostics diagnostics = geminiService.parseIntentWithDiagnostics(requestText);
            GeminiService.ParsedIntent intent = diagnostics.intent();

            logger.info(
                "Parser diagnostics chatId={} stage={} confidence={} action={} error={} preview={}",
                chatId,
                diagnostics.stage(),
                intent == null ? null : intent.confidence(),
                intent == null ? null : intent.action(),
                diagnostics.errorDetail(),
                diagnostics.modelTextPreview()
            );

            if (parserDebug) {
                String diagMsg = String.format(
                    "Parser debug\nStage: %s\nAction: %s\nConfidence: %s\nError: %s\nModel preview: %s",
                    diagnostics.stage(),
                    intent == null ? "<null>" : intent.action(),
                    intent == null ? "<null>" : String.format("%.2f", intent.confidence()),
                    diagnostics.errorDetail() == null ? "<none>" : diagnostics.errorDetail(),
                    diagnostics.modelTextPreview() == null ? "<none>" : diagnostics.modelTextPreview()
                );
                BotHelper.sendMessageToTelegram(chatId, diagMsg, telegramClient, null);
            }

            if (intent == null) {
                String error = diagnostics.errorDetail() == null ? "" : diagnostics.errorDetail();
                String msg;
                switch (diagnostics.stage()) {
                    case API_CONFIGURATION:
                        msg = "Parser is unavailable: GEMINI_API_KEY is missing in runtime environment.";
                        break;
                    case API_REQUEST_FAILED:
                        if (error.toLowerCase().contains("model") && error.toLowerCase().contains("not found")) {
                            msg = "Parser is unavailable: configured Gemini model was not found. Verify GEMINI_MODEL for your account/tier.";
                        } else {
                            msg = "Parser is unavailable: Gemini API request failed (quota/network/auth).";
                        }
                        break;
                    case MODEL_EMPTY_RESPONSE:
                        msg = "Parser error: Gemini returned an empty response.";
                        break;
                    case MODEL_NON_JSON_RESPONSE:
                        msg = "Parser error: Gemini response format was not valid JSON for the intent schema.";
                        break;
                    default:
                        msg = "Parser failed before intent mapping. Try again or use /help.";
                        break;
                }
                if (parserDebug && !error.isBlank()) {
                    msg += " Details: " + error;
                }
                BotHelper.sendMessageToTelegram(chatId, msg, telegramClient, null);
                exit = true;
                return;
            }

            if (intent == null || intent.action() == GeminiService.IntentAction.UNKNOWN || intent.confidence() < 0.65) {
                BotHelper.sendMessageToTelegram(chatId,
                    "I couldn't confidently map that request. Please rephrase, or use /help for command format.",
                    telegramClient,
                    null);
                exit = true;
                return;
            }

            String previewCommand;
            switch (intent.action()) {
                case CREATE_TASK:
                    String previewPriority = "MEDIUM";
                    if (intent.priority() != null && !intent.priority().isBlank()) {
                        previewPriority = intent.priority().trim().toUpperCase();
                    }
                    previewCommand = intent.title() == null || intent.title().isBlank()
                        ? "<invalid create intent: missing title>"
                        : "/create " + intent.title().trim() + " | " + previewPriority;
                    break;
                case UPDATE_STATUS:
                    previewCommand = (intent.status() == null || intent.title() == null)
                        ? "<invalid update status intent>"
                        : "/updatestatus " + intent.status().trim().toUpperCase() + " " + intent.title().trim();
                    break;
                case LOG_HOURS:
                    previewCommand = (intent.hours() == null || intent.title() == null)
                        ? "<invalid log hours intent>"
                        : "/loghours " + intent.hours() + " " + intent.title().trim();
                    break;
                case DELETE_TASK:
                    previewCommand = intent.title() == null || intent.title().isBlank()
                        ? "<invalid delete intent: missing title>"
                        : "/delete " + intent.title().trim();
                    break;
                case STATUS_SUMMARY:
                    previewCommand = (intent.statusQuery() != null && !intent.statusQuery().isBlank())
                        ? "/status " + intent.statusQuery().trim()
                        : "/status";
                    break;
                case HELP:
                    previewCommand = "/help";
                    break;
                default:
                    previewCommand = "<unknown>";
                    break;
            }

            if (parserDryRun) {
                String dryRunMsg = String.format(
                    "Parser dry-run mode is ON.\nAction: %s\nConfidence: %.2f\nWould run: %s\n\nParsed fields:\n- title: %s\n- priority: %s\n- status: %s\n- statusQuery: %s\n- hours: %s",
                    intent.action(),
                    intent.confidence(),
                    previewCommand,
                    intent.title() == null ? "<null>" : intent.title(),
                    intent.priority() == null ? "<null>" : intent.priority(),
                    intent.status() == null ? "<null>" : intent.status(),
                    intent.statusQuery() == null ? "<null>" : intent.statusQuery(),
                    intent.hours() == null ? "<null>" : intent.hours().toString()
                );
                BotHelper.sendMessageToTelegram(chatId, dryRunMsg, telegramClient, null);
                exit = true;
                return;
            }

            if (parserRequireConfirmation) {
                if (!previewCommand.startsWith("/")) {
                    BotHelper.sendMessageToTelegram(chatId,
                        "I parsed your request but it is incomplete. Please rephrase with more details.",
                        telegramClient,
                        null);
                    exit = true;
                    return;
                }

                pendingCommands.put(chatId, new PendingCommand(previewCommand, System.currentTimeMillis()));
                String confirmMsg = String.format(
                    "Parser confirmation mode is ON.\nAction: %s\nConfidence: %.2f\nWould run: %s\n\nReply 'confirm' to execute or 'cancel' to discard.",
                    intent.action(),
                    intent.confidence(),
                    previewCommand
                );
                BotHelper.sendMessageToTelegram(chatId, confirmMsg, telegramClient, null);
                exit = true;
                return;
            }

            switch (intent.action()) {
                case CREATE_TASK:
                    if (intent.title() == null || intent.title().isBlank()) {
                        BotHelper.sendMessageToTelegram(chatId, "Please provide a task title.", telegramClient, null);
                        exit = true;
                        return;
                    }
                    String normalizedPriority = "MEDIUM";
                    if (intent.priority() != null && !intent.priority().isBlank()) {
                        String p = intent.priority().trim().toUpperCase();
                        if (!("LOW".equals(p) || "MEDIUM".equals(p) || "HIGH".equals(p))) {
                            BotHelper.sendMessageToTelegram(chatId,
                                "Parsed an invalid priority. Please use LOW, MEDIUM, or HIGH.",
                                telegramClient,
                                null);
                            exit = true;
                            return;
                        }
                        normalizedPriority = p;
                    }
                    requestText = "/create " + intent.title().trim() + " | " + normalizedPriority;
                    fnCreate();
                    return;
                case UPDATE_STATUS:
                    if (intent.status() == null || intent.status().isBlank() || intent.title() == null || intent.title().isBlank()) {
                        BotHelper.sendMessageToTelegram(chatId,
                            "I need both task title and status (TODO, IN_PROGRESS, BLOCKED, DONE).",
                            telegramClient,
                            null);
                        exit = true;
                        return;
                    }
                    requestText = "/updatestatus " + intent.status().trim().toUpperCase() + " " + intent.title().trim();
                    fnUpdateStatus();
                    return;
                case LOG_HOURS:
                    if (intent.hours() == null || intent.title() == null || intent.title().isBlank()) {
                        BotHelper.sendMessageToTelegram(chatId,
                            "I need both hours and task title to log work.",
                            telegramClient,
                            null);
                        exit = true;
                        return;
                    }
                    requestText = "/loghours " + intent.hours() + " " + intent.title().trim();
                    fnLogHours();
                    return;
                case DELETE_TASK:
                    if (intent.title() == null || intent.title().isBlank()) {
                        BotHelper.sendMessageToTelegram(chatId, "Please provide the task title to delete.", telegramClient, null);
                        exit = true;
                        return;
                    }
                    requestText = "/delete " + intent.title().trim();
                    fnDeleteCommand();
                    return;
                case STATUS_SUMMARY:
                    if (intent.statusQuery() != null && !intent.statusQuery().isBlank()) {
                        requestText = "/status " + intent.statusQuery().trim();
                    } else {
                        requestText = "/status";
                    }
                    fnStatus();
                    return;
                case HELP:
                    requestText = "/help";
                    fnHelp();
                    return;
                default:
                    break;
            }
        } catch (Exception e) {
            logger.error("Natural language parsing failed for chatId={}", chatId, e);
            String msg = "I couldn't process that with the parser right now. Try a direct command with /help.";
            String err = e.getMessage() == null ? "" : e.getMessage();
            if (err.contains("GEMINI_API_KEY") || err.contains("Gemini API call failed")) {
                msg = "Parser is unavailable right now (Gemini configuration/API). Verify GEMINI_API_KEY and try again.";
            }
            BotHelper.sendMessageToTelegram(chatId,
                msg,
                telegramClient,
                null);
            exit = true;
            return;
        }

        logger.warn("Unrecognized command from chatId={}: {}", chatId, requestText);
        BotHelper.sendMessageToTelegram(chatId,
            "I didn't understand that command. Use /help to see available commands.", telegramClient, null);
    }

    public void fnLLM() {
        logger.info("Calling LLM");
        if (!requestText.contains(BotCommands.LLM_REQ.getCommand()) || exit)
            return;

        String prompt = "Give a one-line health-check response for the bot parser.";
        String out = "<empty>";
        try {
            out = geminiService.generateText(prompt);
        } catch (Exception exc) {
            logger.error("LLM call failed", exc);
        }

        BotHelper.sendMessageToTelegram(chatId, "LLM: " + out, telegramClient, null);
    }
}
