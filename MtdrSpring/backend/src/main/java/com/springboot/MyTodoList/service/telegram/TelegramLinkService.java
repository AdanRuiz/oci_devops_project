package com.springboot.MyTodoList.service.telegram;

import java.util.UUID;

public interface TelegramLinkService {
    String generateLinkingCode(UUID userId);
    boolean linkAccount(String code, String telegramChatId);
}
