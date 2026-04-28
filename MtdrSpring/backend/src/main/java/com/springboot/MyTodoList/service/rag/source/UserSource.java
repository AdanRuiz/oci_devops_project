package com.springboot.MyTodoList.service.rag.source;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class UserSource implements SourceReader {

    private final JdbcTemplate jdbc;

    @Autowired
    public UserSource(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public String sourceType() { return "USER"; }

    @Override
    public List<DocumentRow> readAll() {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT u.USER_ID, u.FULL_NAME, u.EMAIL, u.STATUS, "
          + "       r.ROLE_NAME, t.NAME AS TEAM_NAME, "
          + "       (SELECT COUNT(*) FROM TASKS tk "
          + "         WHERE tk.ASSIGNED_TO = u.USER_ID "
          + "           AND NVL(tk.IS_DELETED,'N')='N' "
          + "           AND tk.STATUS IN ('PENDING','IN_PROGRESS','BLOCKED')) AS OPEN_TASKS "
          + "FROM USERS u "
          + "LEFT JOIN ROLES r ON r.ROLE_ID = u.ROLE_ID "
          + "LEFT JOIN TEAMS t ON t.TEAM_ID = u.TEAM_ID "
          + "WHERE NVL(u.IS_DELETED, 'N') = 'N'");

        List<DocumentRow> docs = new ArrayList<>(rows.size());
        for (Map<String, Object> r : rows) {
            long id = ((Number) r.get("USER_ID")).longValue();
            docs.add(new DocumentRow(sourceType(), id, render(r)));
        }
        return docs;
    }

    private String render(Map<String, Object> r) {
        StringBuilder sb = new StringBuilder();
        sb.append("Usuario #").append(r.get("USER_ID"))
          .append(" — ").append(r.get("FULL_NAME")).append("\n");
        sb.append("Email: ").append(r.get("EMAIL"))
          .append(" | Status: ").append(r.get("STATUS"));
        if (r.get("ROLE_NAME") != null) sb.append(" | Rol: ").append(r.get("ROLE_NAME"));
        if (r.get("TEAM_NAME") != null) sb.append(" | Equipo: ").append(r.get("TEAM_NAME"));
        sb.append("\n");
        Object open = r.get("OPEN_TASKS");
        sb.append("Tareas abiertas asignadas: ").append(open != null ? open : 0);
        return sb.toString();
    }
}
