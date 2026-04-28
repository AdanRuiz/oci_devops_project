package com.springboot.MyTodoList.service.rag.source;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class ProjectSource implements SourceReader {

    private final JdbcTemplate jdbc;

    @Autowired
    public ProjectSource(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public String sourceType() { return "PROJECT"; }

    @Override
    public List<DocumentRow> readAll() {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT p.PROJECT_ID, p.NAME, p.STATUS, p.TOTAL_HOURS, p.DESCRIPTION, "
          + "       u.FULL_NAME AS MANAGER_NAME "
          + "FROM PROJECTS p "
          + "LEFT JOIN USERS u ON u.USER_ID = p.MANAGER_ID "
          + "WHERE NVL(p.IS_DELETED, 'N') = 'N'");

        List<DocumentRow> docs = new ArrayList<>(rows.size());
        for (Map<String, Object> r : rows) {
            long pid = ((Number) r.get("PROJECT_ID")).longValue();
            String members = loadMembers(pid);
            String content = render(r, members);
            docs.add(new DocumentRow(sourceType(), pid, content));
        }
        return docs;
    }

    private String loadMembers(long projectId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT u.FULL_NAME, pm.ROLE_IN_PROJECT "
          + "FROM PROJECT_MEMBERS pm "
          + "JOIN USERS u ON u.USER_ID = pm.USER_ID "
          + "WHERE pm.PROJECT_ID = ? AND NVL(pm.IS_DELETED, 'N') = 'N'",
            projectId);
        if (rows.isEmpty()) return "(sin miembros)";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < rows.size(); i++) {
            if (i > 0) sb.append(", ");
            Map<String, Object> m = rows.get(i);
            sb.append(m.get("FULL_NAME"));
            Object role = m.get("ROLE_IN_PROJECT");
            if (role != null) sb.append(" (").append(role).append(")");
        }
        return sb.toString();
    }

    private String render(Map<String, Object> r, String members) {
        StringBuilder sb = new StringBuilder();
        sb.append("Proyecto #").append(r.get("PROJECT_ID"))
          .append(" — \"").append(r.get("NAME")).append("\"\n");
        sb.append("Status: ").append(r.get("STATUS"));
        if (r.get("MANAGER_NAME") != null) sb.append(" | Manager: ").append(r.get("MANAGER_NAME"));
        if (r.get("TOTAL_HOURS") != null) sb.append(" | Horas estimadas: ").append(r.get("TOTAL_HOURS"));
        sb.append("\n");
        Object desc = r.get("DESCRIPTION");
        if (desc != null) {
            String d = desc.toString().trim();
            if (!d.isEmpty()) sb.append("Descripción: ").append(d).append("\n");
        }
        sb.append("Miembros: ").append(members);
        return sb.toString();
    }
}
