package com.springboot.MyTodoList.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
public class AnalyticsController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/analytics/dashboard")
    public Map<String, Object> getDashboardData() {

        String sql =
            "SELECT " +
            "  u.NAME        AS developer, " +
            "  s.NAME        AS sprint_name, " +
            "  COUNT(DISTINCT wi.WORK_ITEM_ID)          AS tasks_completed, " +
            "  NVL(SUM(te.sprint_minutes), 0) / 60.0   AS real_hours " +
            "FROM CHATBOT_USER.WORK_ITEM wi " +
            "JOIN CHATBOT_USER.WORK_ITEM_ASSIGNMENT wia ON wi.WORK_ITEM_ID = wia.WORK_ITEM_ID " +
            "JOIN CHATBOT_USER.APP_USER u               ON wia.USER_ID     = u.USER_ID " +
            "JOIN CHATBOT_USER.SPRINT  s                ON wi.SPRINT_ID    = s.SPRINT_ID " +
            "LEFT JOIN ( " +
            "  SELECT WORK_ITEM_ID, SUM(MINUTES) AS sprint_minutes " +
            "  FROM CHATBOT_USER.TIME_ENTRY " +
            "  GROUP BY WORK_ITEM_ID " +
            ") te ON wi.WORK_ITEM_ID = te.WORK_ITEM_ID " +
            "WHERE wi.STATUS IN ('DONE', 'COMPLETED', 'CLOSED') " +
            "GROUP BY u.NAME, s.NAME " +
            "ORDER BY u.NAME, s.NAME";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        // ── KPIs ──────────────────────────────────────────────────────────────
        long   totalTasks = rows.stream()
                .mapToLong(r -> ((Number) r.get("TASKS_COMPLETED")).longValue())
                .sum();
        double totalHours = rows.stream()
                .mapToDouble(r -> ((Number) r.get("REAL_HOURS")).doubleValue())
                .sum();

        Set<String> devNames = new LinkedHashSet<>();
        rows.forEach(r -> devNames.add((String) r.get("DEVELOPER")));
        int numDevs = devNames.isEmpty() ? 1 : devNames.size();

        double avgTasks = (double) totalTasks / numDevs;
        double avgHours = totalHours / numDevs;

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalTasks",     totalTasks);
        kpis.put("totalHours",     round1(totalHours));
        kpis.put("avgTasksPerDev", round1(avgTasks));
        kpis.put("avgHoursPerDev", round1(avgHours));

        // ── Response ──────────────────────────────────────────────────────────
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("kpis",      kpis);
        result.put("chartData", rows);
        return result;
    }

    @GetMapping("/analytics/debug")
    public Map<String, Object> debug() {
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("workItems", jdbcTemplate.queryForList(
            "SELECT WORK_ITEM_ID, TITLE, STATUS, SPRINT_ID FROM CHATBOT_USER.WORK_ITEM WHERE WORK_ITEM_ID LIKE 'wi-d%' ORDER BY WORK_ITEM_ID"));
        result.put("assignments", jdbcTemplate.queryForList(
            "SELECT ASSIGNMENT_ID, WORK_ITEM_ID, USER_ID FROM CHATBOT_USER.WORK_ITEM_ASSIGNMENT WHERE WORK_ITEM_ID LIKE 'wi-d%' ORDER BY ASSIGNMENT_ID"));
        result.put("timeEntries", jdbcTemplate.queryForList(
            "SELECT TIME_ENTRY_ID, WORK_ITEM_ID, MINUTES FROM CHATBOT_USER.TIME_ENTRY WHERE WORK_ITEM_ID LIKE 'wi-d%' ORDER BY TIME_ENTRY_ID"));
        return result;
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
