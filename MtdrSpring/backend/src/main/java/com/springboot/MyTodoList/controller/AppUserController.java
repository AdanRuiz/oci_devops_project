package com.springboot.MyTodoList.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appusers")
public class AppUserController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return jdbcTemplate.queryForList(
            "SELECT USER_ID AS \"userId\", NAME AS \"name\", EMAIL AS \"email\", " +
            "TELEGRAM_USER_ID AS \"telegramUserId\" FROM CHATBOT_USER.APP_USER ORDER BY NAME"
        );
    }
}
