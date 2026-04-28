package com.springboot.MyTodoList.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class BotInteractionRepository {

    private final JdbcTemplate jdbc;

    @Autowired
    public BotInteractionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(Long userId, String message, String response) {
        jdbc.update(
            "INSERT INTO BOT_INTERACTIONS (USER_ID, MESSAGE, RESPONSE, CREATED_AT) "
          + "VALUES (?, ?, ?, SYSTIMESTAMP)",
            userId, message, response);
    }
}
