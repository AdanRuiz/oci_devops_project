package com.springboot.MyTodoList.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "APP_USER", schema = "CHATBOT_USER")
public class AppUser {

    @Id
    @Column(name = "USER_ID")
    private String userId;

    @Column(name = "NAME")
    private String name;

    @Column(name = "EMAIL")
    private String email;

    @Column(name = "TELEGRAM_USER_ID")
    private String telegramUserId;

    @Column(name = "CREATED_AT")
    private OffsetDateTime createdAt;

    public AppUser() {}

    public String getUserId()             { return userId; }
    public void setUserId(String userId)  { this.userId = userId; }

    public String getName()               { return name; }
    public void setName(String name)      { this.name = name; }

    public String getEmail()              { return email; }
    public void setEmail(String email)    { this.email = email; }

    public String getTelegramUserId()                        { return telegramUserId; }
    public void setTelegramUserId(String telegramUserId)     { this.telegramUserId = telegramUserId; }

    public OffsetDateTime getCreatedAt()                     { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt)       { this.createdAt = createdAt; }
}
