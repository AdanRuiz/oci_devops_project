package com.springboot.MyTodoList.service.rag.source;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class DeploymentSource implements SourceReader {

    private final JdbcTemplate jdbc;

    @Autowired
    public DeploymentSource(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public String sourceType() { return "DEPLOYMENT"; }

    @Override
    public List<DocumentRow> readAll() {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT d.DEPLOYMENT_ID, d.VERSION, d.ENVIRONMENT, d.STATUS, "
          + "       d.RECOVERY_TIME_MIN, d.DEPLOYED_AT, "
          + "       p.NAME AS PROJECT_NAME "
          + "FROM DEPLOYMENTS d "
          + "LEFT JOIN PROJECTS p ON p.PROJECT_ID = d.PROJECT_ID");

        List<DocumentRow> docs = new ArrayList<>(rows.size());
        for (Map<String, Object> r : rows) {
            long id = ((Number) r.get("DEPLOYMENT_ID")).longValue();
            docs.add(new DocumentRow(sourceType(), id, render(r)));
        }
        return docs;
    }

    private String render(Map<String, Object> r) {
        StringBuilder sb = new StringBuilder();
        sb.append("Deployment #").append(r.get("DEPLOYMENT_ID"));
        if (r.get("VERSION") != null) sb.append(" — versión ").append(r.get("VERSION"));
        sb.append("\n");
        if (r.get("PROJECT_NAME") != null) sb.append("Proyecto: ").append(r.get("PROJECT_NAME")).append(" | ");
        sb.append("Ambiente: ").append(r.get("ENVIRONMENT"))
          .append(" | Status: ").append(r.get("STATUS"));
        if (r.get("DEPLOYED_AT") != null) sb.append(" | Fecha: ").append(r.get("DEPLOYED_AT"));
        sb.append("\n");
        if (r.get("RECOVERY_TIME_MIN") != null) {
            sb.append("Tiempo de recuperación: ").append(r.get("RECOVERY_TIME_MIN")).append(" min");
        }
        return sb.toString();
    }
}
