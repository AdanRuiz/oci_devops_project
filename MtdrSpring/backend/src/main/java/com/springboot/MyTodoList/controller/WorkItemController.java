package com.springboot.MyTodoList.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/workitems")
public class WorkItemController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // GET /workitems — todas las tasks con info de usuario y sprint
    @GetMapping
    public List<Map<String, Object>> getAllWorkItems() {
        String sql =
            "SELECT wi.WORK_ITEM_ID, wi.TITLE, wi.DESCRIPTION, wi.STATUS, wi.PRIORITY, " +
            "       wi.WORK_TYPE, wi.DUE_DATE, wi.CREATED_AT, wi.ESTIMATED_MINUTES, " +
            "       s.NAME AS SPRINT_NAME, wi.SPRINT_ID, " +
            "       u.NAME AS ASSIGNEE_NAME, u.USER_ID AS ASSIGNEE_ID " +
            "FROM CHATBOT_USER.WORK_ITEM wi " +
            "LEFT JOIN CHATBOT_USER.SPRINT s ON wi.SPRINT_ID = s.SPRINT_ID " +
            "LEFT JOIN CHATBOT_USER.WORK_ITEM_ASSIGNMENT wia ON wi.WORK_ITEM_ID = wia.WORK_ITEM_ID " +
            "  AND wia.UNASSIGNED_AT IS NULL " +
            "LEFT JOIN CHATBOT_USER.APP_USER u ON wia.USER_ID = u.USER_ID " +
            "ORDER BY wi.CREATED_AT DESC";
        return jdbcTemplate.queryForList(sql);
    }

    // GET /workitems/user/{telegramUserId} — tasks de un usuario por su Telegram ID (para el bot)
    @GetMapping("/user/{telegramUserId}")
    public List<Map<String, Object>> getWorkItemsByTelegramUser(@PathVariable String telegramUserId) {
        String sql =
            "SELECT wi.WORK_ITEM_ID, wi.TITLE, wi.STATUS, wi.PRIORITY, wi.DUE_DATE, " +
            "       s.NAME AS SPRINT_NAME " +
            "FROM CHATBOT_USER.WORK_ITEM wi " +
            "JOIN CHATBOT_USER.WORK_ITEM_ASSIGNMENT wia ON wi.WORK_ITEM_ID = wia.WORK_ITEM_ID " +
            "  AND wia.UNASSIGNED_AT IS NULL " +
            "JOIN CHATBOT_USER.APP_USER u ON wia.USER_ID = u.USER_ID " +
            "LEFT JOIN CHATBOT_USER.SPRINT s ON wi.SPRINT_ID = s.SPRINT_ID " +
            "WHERE u.TELEGRAM_USER_ID = ? " +
            "ORDER BY wi.CREATED_AT DESC";
        return jdbcTemplate.queryForList(sql, telegramUserId);
    }

    // POST /workitems — crear task y asignarla a un usuario
    @PostMapping
    public ResponseEntity<Map<String, Object>> createWorkItem(@RequestBody Map<String, Object> body) {
        String workItemId = UUID.randomUUID().toString();
        String title       = (String) body.get("title");
        String description = (String) body.getOrDefault("description", "");
        String workType    = body.getOrDefault("workType", "TASK").toString();
        String priority    = body.getOrDefault("priority", "MEDIUM").toString();
        String sprintId    = (String) body.get("sprintId");
        String createdBy   = body.getOrDefault("createdByUserId", "u-001").toString();
        String dueDate     = (String) body.get("dueDateStr");

        jdbcTemplate.update(
            "INSERT INTO CHATBOT_USER.WORK_ITEM " +
            "(WORK_ITEM_ID, TITLE, DESCRIPTION, WORK_TYPE, STATUS, PRIORITY, SPRINT_ID, " +
            " CREATED_BY_USER_ID, CREATED_AT, UPDATED_AT, DUE_DATE) " +
            "VALUES (?, ?, ?, ?, 'NEW', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, " +
            "  CASE WHEN ? IS NOT NULL THEN TO_DATE(?, 'YYYY-MM-DD') ELSE NULL END)",
            workItemId, title, description, workType, priority, sprintId,
            createdBy, dueDate, dueDate
        );

        String assigneeId = (String) body.get("assigneeUserId");
        if (assigneeId != null && !assigneeId.isBlank()) {
            jdbcTemplate.update(
                "INSERT INTO CHATBOT_USER.WORK_ITEM_ASSIGNMENT " +
                "(ASSIGNMENT_ID, WORK_ITEM_ID, USER_ID, ASSIGNMENT_ROLE, ASSIGNED_AT) " +
                "VALUES (?, ?, ?, 'ASSIGNEE', CURRENT_TIMESTAMP)",
                UUID.randomUUID().toString(), workItemId, assigneeId
            );
        }

        return ResponseEntity.ok(Map.of("workItemId", workItemId, "status", "created"));
    }

    // DELETE /workitems/{id} — eliminar task
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkItem(@PathVariable String id) {
        jdbcTemplate.update("DELETE FROM CHATBOT_USER.WORK_ITEM_ASSIGNMENT WHERE WORK_ITEM_ID = ?", id);
        int rows = jdbcTemplate.update("DELETE FROM CHATBOT_USER.WORK_ITEM WHERE WORK_ITEM_ID = ?", id);
        if (rows == 0) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }

    // PUT /workitems/{id}/status — cambiar status
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable String id,
                                                             @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if ("TODO".equals(newStatus)) newStatus = "NEW";
        boolean isDone = "DONE".equals(newStatus) || "COMPLETED".equals(newStatus);

        int rows = jdbcTemplate.update(
            "UPDATE CHATBOT_USER.WORK_ITEM SET STATUS = ?, UPDATED_AT = CURRENT_TIMESTAMP, " +
            "COMPLETED_AT = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END " +
            "WHERE WORK_ITEM_ID = ?",
            newStatus, isDone ? 1 : 0, id
        );

        if (rows == 0) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("workItemId", id, "status", newStatus));
    }
}
