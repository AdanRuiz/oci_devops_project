package com.springboot.MyTodoList.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/sprints")
public class SprintController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return jdbcTemplate.queryForList(
            "SELECT SPRINT_ID AS \"sprintId\", NAME AS \"name\", STATUS AS \"status\", " +
            "START_DATE AS \"startDate\", END_DATE AS \"endDate\" " +
            "FROM CHATBOT_USER.SPRINT ORDER BY START_DATE DESC"
        );
    }
}
