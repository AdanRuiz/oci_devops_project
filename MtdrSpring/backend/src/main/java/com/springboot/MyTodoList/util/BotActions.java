package com.springboot.MyTodoList.util;

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
import com.springboot.MyTodoList.service.DeepSeekService;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.service.telegram.TelegramLinkService;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public class BotActions {

    private static final Logger logger = LoggerFactory.getLogger(BotActions.class);

    String requestText;
    long chatId;
    TelegramClient telegramClient;
    boolean exit;

    ToDoItemService todoService;
    DeepSeekService deepSeekService;
    TelegramLinkService telegramLinkService;
    UserRepository userRepository;
    ProjectMemberRepository projectMemberRepository;
    ProjectRepository projectRepository;
    TaskWorkLogRepository taskWorkLogRepository;
    SprintRepository sprintRepository;

    public BotActions(TelegramClient tc, ToDoItemService ts, DeepSeekService ds, TelegramLinkService tls, UserRepository ur, ProjectMemberRepository pmr, ProjectRepository pr, TaskWorkLogRepository twlr, SprintRepository sr) {
        telegramClient = tc;
        todoService = ts;
        deepSeekService = ds;
        telegramLinkService = tls;
        userRepository = ur;
        projectMemberRepository = pmr;
        projectRepository = pr;
        taskWorkLogRepository = twlr;
        sprintRepository = sr;
        exit = false;
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

    public void setRequestText(String cmd) { requestText = cmd; }
    public void setChatId(long chId) { chatId = chId; }
    public void setTelegramClient(TelegramClient tc) { telegramClient = tc; }
    public void setTodoService(ToDoItemService tsvc) { todoService = tsvc; }
    public ToDoItemService getTodoService() { return todoService; }
    public void setDeepSeekService(DeepSeekService dssvc) { deepSeekService = dssvc; }
    public DeepSeekService getDeepSeekService() { return deepSeekService; }

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
                         "/status - Get a quick summary of tasks\n" +
                         "/create <title> - Create a new task (e.g. /create Fix DB bug)\n" +
                         "/delete <title> - Delete a task by matching title\n" +
                         "/updatestatus <IN_PROGRESS/BLOCKED/DONE> <task title> - Update task status\n" +
                         "/loghours <hours> <task title> - Log hours worked on a task";
        BotHelper.sendMessageToTelegram(chatId, helpMsg, telegramClient);
        exit = true;
    }

    public void fnStatus() {
        if (!requestText.equals("/status") || exit) return;
        
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

        List<Task> tasks = todoService.findByProjectId(project.getId());
        long todo = tasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
        long inProgress = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long blocked = tasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count();
        long done = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        
        String msg = String.format("Status for Project: %s\nTODO: %d\nIN_PROGRESS: %d\nBLOCKED: %d\nDONE: %d", 
                                   project.getName(), todo, inProgress, blocked, done);
        BotHelper.sendMessageToTelegram(chatId, msg, telegramClient);
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
        
        String title = requestText.substring(7).trim();
        if (title.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, "Usage: /create <task title>", telegramClient);
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
        t.setPriority(TaskPriority.MEDIUM);
        t.setStatus(TaskStatus.TODO);
        
        try {
            todoService.addToDoItem(t, user, com.springboot.MyTodoList.model.ChangeSource.TELEGRAM);
            String location = sprint != null ? "sprint '" + sprint.getName() + "'" : "backlog";
            BotHelper.sendMessageToTelegram(chatId, "✅ Task created successfully in " + location + ":\n" + title, telegramClient);
        } catch (Exception e) {
            logger.error("Failed to create task", e);
            BotHelper.sendMessageToTelegram(chatId, "Failed to create task due to a server error.", telegramClient);
        }
        exit = true;
    }

    public void fnDeleteCommand() {
        if (!requestText.startsWith("/delete ") || exit) return;
        
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
        
        List<Task> matchingTasks = tasks.stream()
            .filter(t -> t.getTitle().equalsIgnoreCase(title))
            .collect(Collectors.toList());
            
        if (matchingTasks.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, "Could not find a task matching: " + title, telegramClient);
        } else if (matchingTasks.size() > 1) {
            BotHelper.sendMessageToTelegram(chatId, "Found multiple tasks with that title. Please use the web UI to delete, or ensure task titles are unique.", telegramClient);
        } else {
            boolean deleted = todoService.deleteToDoItem(matchingTasks.get(0).getId());
            if (deleted) {
                BotHelper.sendMessageToTelegram(chatId, "Task deleted successfully.", telegramClient);
            } else {
                BotHelper.sendMessageToTelegram(chatId, "Failed to delete task due to an error.", telegramClient);
            }
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

            List<Task> matchingTasks = todoService.findByProjectId(projectId).stream()
                .filter(t -> t.getTitle().equalsIgnoreCase(title))
                .collect(Collectors.toList());

            if (matchingTasks.isEmpty()) {
                BotHelper.sendMessageToTelegram(chatId, "Task not found.", telegramClient);
            } else if (matchingTasks.size() > 1) {
                BotHelper.sendMessageToTelegram(chatId, "Multiple tasks found with that title, please use web UI.", telegramClient);
            } else {
                Task t = matchingTasks.get(0);
                boolean assignedToSprint = t.getSprint() == null && activeSprint != null;
                todoService.patchStatusAndSprint(t.getId(), newStatus, activeSprint, user, com.springboot.MyTodoList.model.ChangeSource.TELEGRAM);

                String msg = "✅ Task status updated to " + newStatus;
                if (assignedToSprint) {
                    msg += " in sprint '" + activeSprint.getName() + "'";
                }
                BotHelper.sendMessageToTelegram(chatId, msg, telegramClient);
            }
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
        
        
        List<Task> matchingTasks = todoService.findByProjectId(projectId).stream()
            .filter(t -> t.getTitle().equalsIgnoreCase(title))
            .collect(Collectors.toList());
            
        if (matchingTasks.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, "Task not found.", telegramClient);
        } else if (matchingTasks.size() > 1) {
            BotHelper.sendMessageToTelegram(chatId, "Multiple tasks found.", telegramClient);
        } else {
            Task t = matchingTasks.get(0);
            
            // Move to active sprint if it is logged without a sprint
            if (t.getSprint() == null && activeSprint != null) {
                t.setSprint(activeSprint);
                todoService.updateToDoItem(t.getId(), t, user, com.springboot.MyTodoList.model.ChangeSource.TELEGRAM);
            }
            
            TaskWorkLog log = new TaskWorkLog();
            log.setTask(t);
            log.setUser(user);
            log.setWorkDate(LocalDate.now());
            log.setHoursWorked(BigDecimal.valueOf(hours));
            taskWorkLogRepository.save(log);
            BotHelper.sendMessageToTelegram(chatId, "Logged " + hours + " hours to task: " + title, telegramClient);
        }
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

        logger.warn("Unrecognized command from chatId={}: {}", chatId, requestText);
        BotHelper.sendMessageToTelegram(chatId,
            "I didn't understand that command. Use /help to see available commands.", telegramClient, null);
    }

    public void fnLLM() {
        logger.info("Calling LLM");
        if (!requestText.contains(BotCommands.LLM_REQ.getCommand()) || exit)
            return;

        String prompt = "Dame los datos del clima en mty";
        String out = "<empty>";
        try {
            out = deepSeekService.generateText(prompt);
        } catch (Exception exc) {
            logger.error("LLM call failed", exc);
        }

        BotHelper.sendMessageToTelegram(chatId, "LLM: " + out, telegramClient, null);
    }
}
