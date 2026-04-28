package com.springboot.MyTodoList.service.rag.source;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class IncidentSource implements SourceReader {

    private final JdbcTemplate jdbc;

    @Autowired
    public IncidentSource(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public String sourceType() { return "INCIDENT"; }

    @Override
    public List<DocumentRow> readAll() {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT i.INCIDENT_ID, i.TYPE, i.SEVERITY, i.OCCURRED_AT, i.RESOLVED_AT, "
          + "       i.DESCRIPTION, p.NAME AS PROJECT_NAME "
          + "FROM INCIDENTS i "
          + "LEFT JOIN PROJECTS p ON p.PROJECT_ID = i.PROJECT_ID "
          + "WHERE NVL(i.IS_DELETED, 'N') = 'N'");

        List<DocumentRow> docs = new ArrayList<>(rows.size());
        for (Map<String, Object> r : rows) {
            long id = ((Number) r.get("INCIDENT_ID")).longValue();
            docs.add(new DocumentRow(sourceType(), id, render(r)));
        }
        return docs;
    }

    private String render(Map<String, Object> r) {
        StringBuilder sb = new StringBuilder();
        sb.append("Incidente #").append(r.get("INCIDENT_ID"));
        if (r.get("TYPE") != null) sb.append(" — ").append(r.get("TYPE"));
        sb.append("\n");
        if (r.get("PROJECT_NAME") != null) sb.append("Proyecto: ").append(r.get("PROJECT_NAME")).append(" | ");
        sb.append("Severidad: ").append(r.get("SEVERITY"));
        if (r.get("OCCURRED_AT") != null) sb.append(" | Ocurrió: ").append(r.get("OCCURRED_AT"));
        if (r.get("RESOLVED_AT") != null) sb.append(" | Resuelto: ").append(r.get("RESOLVED_AT"));
        else sb.append(" | Resuelto: NO");
        sb.append("\n");
        Object desc = r.get("DESCRIPTION");
        if (desc != null) {
            String d = desc.toString().trim();
            if (!d.isEmpty()) sb.append("Descripción: ").append(d);
        }
        return sb.toString();
    }
}
