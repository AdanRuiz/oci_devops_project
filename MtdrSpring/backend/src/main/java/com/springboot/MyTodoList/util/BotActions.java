package com.springboot.MyTodoList.util;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.DeepSeekService;
import com.springboot.MyTodoList.service.ToDoItemService;
import org.springframework.jdbc.core.JdbcTemplate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public class BotActions{

    private static final Logger logger = LoggerFactory.getLogger(BotActions.class);

    String requestText;
    long chatId;
    TelegramClient telegramClient;
    boolean exit;

    ToDoItemService todoService;
    DeepSeekService deepSeekService;
    JdbcTemplate jdbcTemplate;

    public BotActions(TelegramClient tc, ToDoItemService ts, DeepSeekService ds, JdbcTemplate jt){
        telegramClient = tc;
        todoService = ts;
        deepSeekService = ds;
        jdbcTemplate = jt;
        exit = false;
    }

    public void setRequestText(String cmd){
        requestText=cmd;
    }

    public void setChatId(long chId){
        chatId=chId;
    }

    public void setTelegramClient(TelegramClient tc){
        telegramClient=tc;
    }

    public void setTodoService(ToDoItemService tsvc){
        todoService = tsvc;
    }

    public ToDoItemService getTodoService(){
        return todoService;
    }

    public void setDeepSeekService(DeepSeekService dssvc){
        deepSeekService = dssvc;
    }

    public DeepSeekService getDeepSeekService(){
        return deepSeekService;
    }


    

    public void fnStart() {
        if (!(requestText.equals(BotCommands.START_COMMAND.getCommand()) || requestText.equals(BotLabels.SHOW_MAIN_SCREEN.getLabel())) || exit) 
            return;

        BotHelper.sendMessageToTelegram(chatId, BotMessages.HELLO_MYTODO_BOT.getMessage(), telegramClient,  ReplyKeyboardMarkup
            .builder()
            .keyboardRow(new KeyboardRow(BotLabels.LIST_ALL_ITEMS.getLabel(),BotLabels.ADD_NEW_ITEM.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.SHOW_MAIN_SCREEN.getLabel(),BotLabels.HIDE_MAIN_SCREEN.getLabel()))
            .build()
        );
        exit = true;
    }

    public void fnDone() {
        if (!(requestText.indexOf(BotLabels.DONE.getLabel()) != -1) || exit) 
            return;
            
        String done = requestText.substring(0, requestText.indexOf(BotLabels.DASH.getLabel()));
        Integer id = Integer.valueOf(done);

        try {

            ToDoItem item = todoService.getToDoItemById(id);
            item.setDone(true);
            todoService.updateToDoItem(id, item);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_DONE.getMessage(), telegramClient);

        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnUndo() {
        if (requestText.indexOf(BotLabels.UNDO.getLabel()) == -1 || exit)
            return;

        String undo = requestText.substring(0,
                requestText.indexOf(BotLabels.DASH.getLabel()));
        Integer id = Integer.valueOf(undo);

        try {

            ToDoItem item = todoService.getToDoItemById(id);
            item.setDone(false);
            todoService.updateToDoItem(id, item);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_UNDONE.getMessage(), telegramClient);

        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnDelete(){
        if (requestText.indexOf(BotLabels.DELETE.getLabel()) == -1 || exit)
            return;

        String delete = requestText.substring(0,
                requestText.indexOf(BotLabels.DASH.getLabel()));
        Integer id = Integer.valueOf(delete);

        try {
            todoService.deleteToDoItem(id);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_DELETED.getMessage(), telegramClient);

        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnHide(){
        if (requestText.equals(BotCommands.HIDE_COMMAND.getCommand())
				|| requestText.equals(BotLabels.HIDE_MAIN_SCREEN.getLabel()) && !exit)
			BotHelper.sendMessageToTelegram(chatId, BotMessages.BYE.getMessage(), telegramClient);
        else
            return;
        exit = true;
    }

    public void fnListAll(){
        if (!(requestText.equals(BotCommands.TODO_LIST.getCommand())
				|| requestText.equals(BotLabels.LIST_ALL_ITEMS.getLabel())
				|| requestText.equals(BotLabels.MY_TODO_LIST.getLabel())) || exit)
            return;

        String telegramUserId = String.valueOf(chatId);

        // Buscar tasks asignadas a este usuario via TELEGRAM_USER_ID
        List<Map<String, Object>> myTasks = List.of();
        try {
            String sql =
                "SELECT wi.WORK_ITEM_ID, wi.TITLE, wi.STATUS, s.NAME AS SPRINT_NAME " +
                "FROM CHATBOT_USER.WORK_ITEM wi " +
                "JOIN CHATBOT_USER.WORK_ITEM_ASSIGNMENT wia ON wi.WORK_ITEM_ID = wia.WORK_ITEM_ID " +
                "  AND wia.UNASSIGNED_AT IS NULL " +
                "JOIN CHATBOT_USER.APP_USER u ON wia.USER_ID = u.USER_ID " +
                "LEFT JOIN CHATBOT_USER.SPRINT s ON wi.SPRINT_ID = s.SPRINT_ID " +
                "WHERE u.TELEGRAM_USER_ID = ? " +
                "ORDER BY wi.CREATED_AT DESC";
            myTasks = jdbcTemplate.queryForList(sql, telegramUserId);
        } catch (Exception e) {
            logger.warn("Could not query WORK_ITEM for user {}: {}", telegramUserId, e.getMessage());
        }

        if (myTasks.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId,
                "You have no tasks assigned yet. Ask your manager to assign tasks to you.", telegramClient);
            exit = true;
            return;
        }

        StringBuilder sb = new StringBuilder("📋 *Your Tasks:*\n\n");
        for (Map<String, Object> task : myTasks) {
            String status = String.valueOf(task.get("STATUS"));
            String emoji = status.equals("DONE") || status.equals("COMPLETED") ? "✅" :
                           status.equals("IN_PROGRESS") ? "🔄" :
                           status.equals("BLOCKED") ? "🚫" : "⏳";
            sb.append(emoji).append(" *").append(task.get("TITLE")).append("*");
            if (task.get("SPRINT_NAME") != null) {
                sb.append(" — ").append(task.get("SPRINT_NAME"));
            }
            sb.append(" `[").append(status).append("]`\n");
        }

        BotHelper.sendMessageToTelegram(chatId, sb.toString(), telegramClient);
        exit = true;
    }

    public void fnAddItem(){
        logger.info("Adding item");
		if (!(requestText.contains(BotCommands.ADD_ITEM.getCommand())
				|| requestText.contains(BotLabels.ADD_NEW_ITEM.getLabel())) || exit )
            return;
        logger.info("Adding item by BotHelper");
        BotHelper.sendMessageToTelegram(chatId, BotMessages.TYPE_NEW_TODO_ITEM.getMessage(), telegramClient);
        exit = true;
    }

    public void fnElse(){
        if(exit)
            return;
        ToDoItem newItem = new ToDoItem();
        newItem.setDescription(requestText);
        newItem.setCreation_ts(OffsetDateTime.now());
        newItem.setDone(false);
        todoService.addToDoItem(newItem);

        BotHelper.sendMessageToTelegram(chatId, BotMessages.NEW_ITEM_ADDED.getMessage(), telegramClient, null);
    }

    public void fnLLM(){
        logger.info("Calling LLM");
        if (!(requestText.contains(BotCommands.LLM_REQ.getCommand())) || exit)
            return;
        
        String prompt = "Dame los datos del clima en mty";
        String out = "<empty>";
        try{
            out = deepSeekService.generateText(prompt);
        }catch(Exception exc){

        }

        BotHelper.sendMessageToTelegram(chatId, "LLM: "+out, telegramClient, null);

    }


}