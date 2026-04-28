package com.springboot.MyTodoList.service.rag.source;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class KpiValueSource implements SourceReader {

    private final JdbcTemplate jdbc;

    @Autowired
    public KpiValueSource(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public String sourceType() { return "KPI_VALUE"; }

    @Override
    public List<DocumentRow> readAll() {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT KPI_VALUE_ID, KPI_TYPE_NAME, KPI_CATEGORY, KPI_UNIT, "
          + "       SCOPE_TYPE, USER_NAME, PROJECT_NAME, SPRINT_NAME, "
          + "       VALUE, RECORDED_AT "
          + "FROM ( "
          + "  SELECT kv.KPI_VALUE_ID, kt.NAME AS KPI_TYPE_NAME, "
          + "         kt.CATEGORY AS KPI_CATEGORY, kt.UNIT AS KPI_UNIT, "
          + "         kv.SCOPE_TYPE, "
          + "         u.FULL_NAME AS USER_NAME, "
          + "         p.NAME AS PROJECT_NAME, "
          + "         s.NAME AS SPRINT_NAME, "
          + "         kv.VALUE, kv.RECORDED_AT, "
          + "         ROW_NUMBER() OVER ( "
          + "           PARTITION BY kv.KPI_TYPE_ID, kv.SCOPE_TYPE, kv.USER_ID, kv.PROJECT_ID, kv.SPRINT_ID "
          + "           ORDER BY kv.RECORDED_AT DESC NULLS LAST "
          + "         ) AS RN "
          + "  FROM KPI_VALUES kv "
          + "  JOIN KPI_TYPES kt ON kt.KPI_TYPE_ID = kv.KPI_TYPE_ID "
          + "  LEFT JOIN USERS u    ON u.USER_ID    = kv.USER_ID "
          + "  LEFT JOIN PROJECTS p ON p.PROJECT_ID = kv.PROJECT_ID "
          + "  LEFT JOIN SPRINTS s  ON s.SPRINT_ID  = kv.SPRINT_ID "
          + ") "
          + "WHERE RN = 1");

        List<DocumentRow> docs = new ArrayList<>(rows.size());
        for (Map<String, Object> r : rows) {
            long id = ((Number) r.get("KPI_VALUE_ID")).longValue();
            docs.add(new DocumentRow(sourceType(), id, render(r)));
        }
        return docs;
    }

    private String render(Map<String, Object> r) {
        StringBuilder sb = new StringBuilder();
        sb.append("KPI \"").append(r.get("KPI_TYPE_NAME")).append("\"");
        if (r.get("KPI_CATEGORY") != null) sb.append(" (categoría: ").append(r.get("KPI_CATEGORY")).append(")");
        sb.append("\n");
        sb.append("Valor: ").append(r.get("VALUE"));
        if (r.get("KPI_UNIT") != null) sb.append(" ").append(r.get("KPI_UNIT"));
        if (r.get("RECORDED_AT") != null) sb.append(" (registrado ").append(r.get("RECORDED_AT")).append(")");
        sb.append("\n");
        sb.append("Scope: ").append(r.get("SCOPE_TYPE"));
        if (r.get("USER_NAME") != null) sb.append(" | Usuario: ").append(r.get("USER_NAME"));
        if (r.get("PROJECT_NAME") != null) sb.append(" | Proyecto: ").append(r.get("PROJECT_NAME"));
        if (r.get("SPRINT_NAME") != null) sb.append(" | Sprint: ").append(r.get("SPRINT_NAME"));
        return sb.toString();
    }
}
