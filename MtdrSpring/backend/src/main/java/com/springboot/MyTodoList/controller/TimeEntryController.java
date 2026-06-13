package com.springboot.MyTodoList.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/time-entries")
public class TimeEntryController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping
    public ResponseEntity<Map<String, Object>> logTime(@RequestBody Map<String, Object> body) {
        String workItemId = (String) body.get("workItemId");
        String userId     = (String) body.get("userId");
        int minutes       = ((Number) body.getOrDefault("minutes", 0)).intValue();
        String note       = (String) body.getOrDefault("note", "");

        String id = UUID.randomUUID().toString();
        jdbcTemplate.update(
            "INSERT INTO CHATBOT_USER.TIME_ENTRY " +
            "(TIME_ENTRY_ID, WORK_ITEM_ID, USER_ID, MINUTES, STARTED_AT, ENDED_AT, CREATED_AT, NOTE) " +
            "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)",
            id, workItemId, userId, minutes, note
        );

        return ResponseEntity.ok(Map.of("timeEntryId", id, "minutes", minutes));
    }
}
