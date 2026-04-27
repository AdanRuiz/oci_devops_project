package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.config.BotProps;
import com.springboot.MyTodoList.service.GeminiService;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.service.telegram.TelegramLinkService;
import com.springboot.MyTodoList.util.BotActions;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.repository.ProjectMemberRepository;
import com.springboot.MyTodoList.repository.ProjectRepository;
import com.springboot.MyTodoList.repository.TaskWorkLogRepository;
import com.springboot.MyTodoList.repository.SprintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
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
@ConditionalOnExpression("'${telegram.bot.token:}'.length() > 0")
public class ToDoItemBotController  implements SpringLongPollingBot, LongPollingSingleThreadUpdateConsumer {

        private static final Logger logger = LoggerFactory.getLogger(ToDoItemBotController.class);
        private ToDoItemService toDoItemService;
        private GeminiService geminiService;
        private TelegramLinkService telegramLinkService;
        private UserRepository userRepository;
        private ProjectMemberRepository projectMemberRepository;
        private ProjectRepository projectRepository;
        private TaskWorkLogRepository taskWorkLogRepository;
        private SprintRepository sprintRepository;
        private final TelegramClient telegramClient;

        private final BotProps botProps;

        @Value("${telegram.bot.token}")
        private String telegramBotToken;

        @Value("${bot.parser.dry-run:false}")
        private boolean parserDryRun;

        @Value("${bot.parser.require-confirmation:false}")
        private boolean parserRequireConfirmation;

        @Value("${bot.parser.debug:false}")
        private boolean parserDebug;

        @Value("${bot.use-http-api:false}")
        private boolean botUseHttpApi;

        @Value("${bot.internal.api.base-url:http://localhost:8080}")
        private String botInternalApiBaseUrl;

        @Value("${bot.internal.api.key:}")
        private String botInternalApiKey;


        @Override
    public String getBotToken() {
                if(telegramBotToken != null && !telegramBotToken.trim().isEmpty()){
                return telegramBotToken;
                }else{
                        return botProps.getToken();
                }
    }


        public ToDoItemBotController( BotProps bp, ToDoItemService tsvc, GeminiService gs, TelegramLinkService tls, UserRepository ur, ProjectMemberRepository pmr, ProjectRepository pr, TaskWorkLogRepository twlr, SprintRepository sr) {
                this.botProps = bp;
                telegramClient = new OkHttpTelegramClient(getBotToken());
                toDoItemService = tsvc;
            geminiService = gs;
                telegramLinkService = tls;
                userRepository = ur;
                projectMemberRepository = pmr;
                projectRepository = pr;
                taskWorkLogRepository = twlr;
                sprintRepository = sr;
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

                BotActions actions = new BotActions(
                    telegramClient,
                    toDoItemService,
                    geminiService,
                    telegramLinkService,
                    userRepository,
                    projectMemberRepository,
                    projectRepository,
                    taskWorkLogRepository,
                    sprintRepository,
                    parserDryRun,
                    parserRequireConfirmation,
                    parserDebug,
                    botUseHttpApi,
                    botInternalApiBaseUrl,
                    botInternalApiKey
                );
                actions.setRequestText(messageTextFromTelegram);
                actions.setChatId(chatId);

actions.fnStart();
                actions.fnHelp();
                actions.fnLink();
                actions.fnCreate();
                actions.fnStatus();
                actions.fnDeleteCommand();
                actions.fnUpdateStatus();
                actions.fnLogHours();
		actions.fnListAll();
		actions.fnAddItem();
		actions.fnLLM();
		actions.fnElse();

	}

	@AfterBotRegistration
    public void afterRegistration(BotSession botSession) {
        logger.info("Registered bot running state is: {}", botSession.isRunning());
    }

}


