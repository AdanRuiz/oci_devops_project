package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.config.BotProps;
import com.springboot.MyTodoList.service.DeepSeekService;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.util.BotActions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.client.okhttp.OkHttpTelegramClient;
import org.telegram.telegrambots.longpolling.BotSession;
import org.telegram.telegrambots.longpolling.interfaces.LongPollingUpdateConsumer;
import org.telegram.telegrambots.longpolling.starter.AfterBotRegistration;
import org.telegram.telegrambots.longpolling.starter.SpringLongPollingBot;
import org.telegram.telegrambots.longpolling.util.LongPollingSingleThreadUpdateConsumer;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

@Component
@ConditionalOnExpression("!'${telegram.bot.token:}'.trim().isEmpty()")
public class ToDoItemBotController  implements SpringLongPollingBot, LongPollingSingleThreadUpdateConsumer {

	private static final Logger logger = LoggerFactory.getLogger(ToDoItemBotController.class);
	private ToDoItemService toDoItemService;
	private DeepSeekService deepSeekService;
	private final TelegramClient telegramClient;
	
	private final BotProps botProps;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Value("${telegram.bot.token}")
	private String telegramBotToken;


	@Override
    public String getBotToken() {
		if(telegramBotToken != null && !telegramBotToken.trim().isEmpty()){
        	return telegramBotToken;
		}else{
			return botProps.getToken();
		}
    }


	public ToDoItemBotController(BotProps bp, ToDoItemService tsvc, DeepSeekService ds) {
		this.botProps = bp;
		telegramClient = new OkHttpTelegramClient(getBotToken());
		toDoItemService = tsvc;
		deepSeekService = ds;
	}

	@Override
    public LongPollingUpdateConsumer getUpdatesConsumer() {
        return this;
    }

	@Override
	public void consume(Update update) {

		if (!update.hasMessage() || !update.getMessage().hasText()) return;

		

		String messageTextFromTelegram = update.getMessage().getText();
		long chatId = update.getMessage().getChatId();
		String fromUsername = update.getMessage().getFrom() != null ? update.getMessage().getFrom().getUserName() : "unknown";
		String fromName = update.getMessage().getFrom() != null ? update.getMessage().getFrom().getFirstName() : "unknown";
		logger.info("📨 Message from {} (@{}) — chatId: {}", fromName, fromUsername, chatId);

		BotActions actions = new BotActions(telegramClient, toDoItemService, deepSeekService, jdbcTemplate);
		actions.setRequestText(messageTextFromTelegram);
		actions.setChatId(chatId);
		if(actions.getTodoService()==null){
			logger.info("todosvc error");
			actions.setTodoService(toDoItemService);
		}


		actions.fnStart();
		actions.fnDone();
		actions.fnUndo();
		actions.fnDelete();
		actions.fnHide();
		actions.fnListAll();
		actions.fnAddItem();
		actions.fnLLM();
		actions.fnElse();

	}

	@AfterBotRegistration
    public void afterRegistration(BotSession botSession) {
        System.out.println("Registered bot running state is: " + botSession.isRunning());
    }

}


