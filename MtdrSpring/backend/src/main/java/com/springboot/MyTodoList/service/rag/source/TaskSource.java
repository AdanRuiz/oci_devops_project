package com.springboot.MyTodoList.service.rag.source;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class TaskSource implements SourceReader {

    private final JdbcTemplate jdbc;

    @Autowired
    public TaskSource(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public String sourceType() { return "TASK"; }

    @Override
    public List<DocumentRow> readAll() {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT t.TASK_ID, t.TITLE, t.DESCRIPTION, t.STATUS, t.TASK_STAGE, t.PRIORITY, "
          + "       t.TYPE, t.ESTIMATED_HOURS, t.ACTUAL_HOURS, t.DUE_DATE, "
          + "       p.NAME AS PROJECT_NAME, s.NAME AS SPRINT_NAME, "
          + "       ua.FULL_NAME AS ASSIGNEE_NAME, uc.FULL_NAME AS CREATOR_NAME "
          + "FROM TASKS t "
          + "LEFT JOIN PROJECTS p ON p.PROJECT_ID = t.PROJECT_ID "
          + "LEFT JOIN SPRINTS  s ON s.SPRINT_ID  = t.SPRINT_ID "
          + "LEFT JOIN USERS ua  ON ua.USER_ID    = t.ASSIGNED_TO "
          + "LEFT JOIN USERS uc  ON uc.USER_ID    = t.CREATED_BY "
          + "WHERE NVL(t.IS_DELETED, 'N') = 'N'");

        List<DocumentRow> docs = new ArrayList<>(rows.size());
        for (Map<String, Object> r : rows) {
            long id = ((Number) r.get("TASK_ID")).longValue();
            docs.add(new DocumentRow(sourceType(), id, render(r)));
        }
        return docs;
    }

    private String render(Map<String, Object> r) {
        StringBuilder sb = new StringBuilder();
        sb.append("Task #").append(r.get("TASK_ID"))
          .append(" — \"").append(r.get("TITLE")).append("\"\n");
        if (r.get("PROJECT_NAME") != null) sb.append("Proyecto: ").append(r.get("PROJECT_NAME"));
        if (r.get("SPRINT_NAME")  != null) sb.append(" | Sprint: ").append(r.get("SPRINT_NAME"));
        sb.append(" | Stage: ").append(r.get("TASK_STAGE")).append("\n");
        sb.append("Status: ").append(r.get("STATUS"))
          .append(" | Priority: ").append(r.get("PRIORITY"));
        if (r.get("TYPE") != null) sb.append(" | Tipo: ").append(r.get("TYPE"));
        sb.append("\n");
        if (r.get("ASSIGNEE_NAME") != null) sb.append("Asignado a: ").append(r.get("ASSIGNEE_NAME"));
        if (r.get("CREATOR_NAME") != null) sb.append(" | Creado por: ").append(r.get("CREATOR_NAME"));
        sb.append("\n");
        if (r.get("ESTIMATED_HOURS") != null) sb.append("Estimadas: ").append(r.get("ESTIMATED_HOURS")).append("h");
        if (r.get("ACTUAL_HOURS") != null) sb.append(" | Reales: ").append(r.get("ACTUAL_HOURS")).append("h");
        if (r.get("DUE_DATE") != null) sb.append(" | Due: ").append(r.get("DUE_DATE"));
        sb.append("\n");
        Object desc = r.get("DESCRIPTION");
        if (desc != null) {
            String d = desc.toString().trim();
            if (!d.isEmpty()) sb.append("Descripción: ").append(d);
        }
        return sb.toString();
    }
}
