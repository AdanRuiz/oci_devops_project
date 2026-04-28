package com.springboot.MyTodoList.service.rag.source;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class SprintSource implements SourceReader {

    private final JdbcTemplate jdbc;

    @Autowired
    public SprintSource(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public String sourceType() { return "SPRINT"; }

    @Override
    public List<DocumentRow> readAll() {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT s.SPRINT_ID, s.NAME, s.START_DATE, s.END_DATE, s.STATUS, s.TOTAL_HOURS "
          + "FROM SPRINTS s "
          + "WHERE NVL(s.IS_DELETED, 'N') = 'N'");

        Map<Long, String> projectsBySprint = loadProjectNames();
        Map<Long, Map<String, Long>> taskCountsBySprint = loadTaskCounts();

        List<DocumentRow> docs = new ArrayList<>(rows.size());
        for (Map<String, Object> r : rows) {
            long sid = ((Number) r.get("SPRINT_ID")).longValue();
            String projects = projectsBySprint.getOrDefault(sid, "(sin proyectos)");
            Map<String, Long> counts = taskCountsBySprint.getOrDefault(sid, new HashMap<>());
            docs.add(new DocumentRow(sourceType(), sid, render(r, projects, counts)));
        }
        return docs;
    }

    private Map<Long, String> loadProjectNames() {
        Map<Long, StringBuilder> tmp = new HashMap<>();
        jdbc.query(
            "SELECT ps.SPRINT_ID, p.NAME "
          + "FROM PROJECT_SPRINTS ps "
          + "JOIN PROJECTS p ON p.PROJECT_ID = ps.PROJECT_ID "
          + "WHERE NVL(p.IS_DELETED, 'N') = 'N'",
            (rs) -> {
                long sid = rs.getLong("SPRINT_ID");
                String name = rs.getString("NAME");
                tmp.computeIfAbsent(sid, k -> new StringBuilder())
                   .append(tmp.get(sid).length() == 0 ? "" : ", ")
                   .append(name);
            });
        Map<Long, String> out = new HashMap<>();
        for (Map.Entry<Long, StringBuilder> e : tmp.entrySet()) {
            out.put(e.getKey(), e.getValue().toString());
        }
        return out;
    }

    private Map<Long, Map<String, Long>> loadTaskCounts() {
        Map<Long, Map<String, Long>> out = new HashMap<>();
        jdbc.query(
            "SELECT t.SPRINT_ID, t.STATUS, COUNT(*) AS C "
          + "FROM TASKS t "
          + "WHERE t.SPRINT_ID IS NOT NULL AND NVL(t.IS_DELETED, 'N') = 'N' "
          + "GROUP BY t.SPRINT_ID, t.STATUS",
            (rs) -> {
                long sid = rs.getLong("SPRINT_ID");
                String status = rs.getString("STATUS");
                long c = rs.getLong("C");
                out.computeIfAbsent(sid, k -> new HashMap<>()).put(status, c);
            });
        return out;
    }

    private String render(Map<String, Object> r, String projects, Map<String, Long> counts) {
        StringBuilder sb = new StringBuilder();
        sb.append("Sprint #").append(r.get("SPRINT_ID"))
          .append(" — \"").append(r.get("NAME")).append("\"\n");
        sb.append("Periodo: ").append(r.get("START_DATE")).append(" a ").append(r.get("END_DATE"))
          .append(" | Status: ").append(r.get("STATUS"));
        if (r.get("TOTAL_HOURS") != null) sb.append(" | Horas: ").append(r.get("TOTAL_HOURS"));
        sb.append("\n");
        sb.append("Proyectos: ").append(projects).append("\n");
        if (counts.isEmpty()) {
            sb.append("Tareas: 0");
        } else {
            long total = counts.values().stream().mapToLong(Long::longValue).sum();
            sb.append("Tareas: ").append(total).append(" (");
            boolean first = true;
            for (Map.Entry<String, Long> e : counts.entrySet()) {
                if (!first) sb.append(", ");
                sb.append(e.getKey()).append(": ").append(e.getValue());
                first = false;
            }
            sb.append(")");
        }
        return sb.toString();
    }
}
