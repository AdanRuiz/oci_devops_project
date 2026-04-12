package com.springboot.MyTodoList.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "BOT_CONVERSATIONS")
@Getter
@Setter
@NoArgsConstructor
public class BotConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ID", columnDefinition = "RAW(16)", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "USER_ID", nullable = false, unique = true, columnDefinition = "RAW(16)")
    private User user;

    @Column(name = "TELEGRAM_CHAT_ID", nullable = false, length = 64)
    private String telegramChatId;

    @Lob
    @Column(name = "MESSAGE_HISTORY", nullable = false, columnDefinition = "CLOB")
    private String messageHistory;

    @Column(name = "LAST_ACTIVE_AT", nullable = false)
    private LocalDateTime lastActiveAt;

    @PrePersist
    @PreUpdate
    private void touch() {
        lastActiveAt = LocalDateTime.now();
    }
}
