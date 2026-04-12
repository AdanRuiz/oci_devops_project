package com.springboot.MyTodoList.util;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.TaskStatus;
import com.springboot.MyTodoList.service.DeepSeekService;
import com.springboot.MyTodoList.service.ToDoItemService;
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

    public BotActions(TelegramClient tc, ToDoItemService ts, DeepSeekService ds) {
        telegramClient = tc;
        todoService = ts;
        deepSeekService = ds;
        exit = false;
    }

    public void setRequestText(String cmd) { requestText = cmd; }
    public void setChatId(long chId) { chatId = chId; }
    public void setTelegramClient(TelegramClient tc) { telegramClient = tc; }
    public void setTodoService(ToDoItemService tsvc) { todoService = tsvc; }
    public ToDoItemService getTodoService() { return todoService; }
    public void setDeepSeekService(DeepSeekService dssvc) { deepSeekService = dssvc; }
    public DeepSeekService getDeepSeekService() { return deepSeekService; }

    public void fnStart() {
        if (!(requestText.equals(BotCommands.START_COMMAND.getCommand())
                || requestText.equals(BotLabels.SHOW_MAIN_SCREEN.getLabel())) || exit)
            return;

        BotHelper.sendMessageToTelegram(chatId, BotMessages.HELLO_MYTODO_BOT.getMessage(), telegramClient,
            ReplyKeyboardMarkup.builder()
                .keyboardRow(new KeyboardRow(BotLabels.LIST_ALL_ITEMS.getLabel(), BotLabels.ADD_NEW_ITEM.getLabel()))
                .keyboardRow(new KeyboardRow(BotLabels.SHOW_MAIN_SCREEN.getLabel(), BotLabels.HIDE_MAIN_SCREEN.getLabel()))
                .build());
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

        // TODO: Task requires a project and createdBy user.
        // Look up the user by telegramChatId and assign a default project
        // before saving. For now this is a no-op until user linking is implemented.
        logger.warn("Cannot create task from bot message: project and user context required. chatId={}", chatId);
        BotHelper.sendMessageToTelegram(chatId,
            "To create tasks via bot, please link your account first with /start.", telegramClient, null);
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
