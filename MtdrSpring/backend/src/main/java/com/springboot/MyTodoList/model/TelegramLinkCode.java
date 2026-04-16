package com.springboot.MyTodoList.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "TELEGRAM_LINK_CODES")
@Getter
@Setter
@NoArgsConstructor
public class TelegramLinkCode {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ID", columnDefinition = "RAW(16)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "USER_ID", nullable = false, columnDefinition = "RAW(16)")
    private User user;

    @Column(name = "CODE", nullable = false, unique = true, length = 8)
    private String code;

    @Column(name = "EXPIRES_AT", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "USED", nullable = false, columnDefinition = "NUMBER(1)")
    private boolean used = false;
}
