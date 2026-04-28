package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.service.rag.EmbeddingEntry;
import com.springboot.MyTodoList.service.rag.RetrievedDoc;
import com.springboot.MyTodoList.service.rag.VectorMath;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Clob;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class VectorStoreRepository {

    private static final Logger LOG = LoggerFactory.getLogger(VectorStoreRepository.class);

    private final JdbcTemplate jdbc;
    private final ConcurrentHashMap<String, EmbeddingEntry> cache = new ConcurrentHashMap<>();

    @Autowired
    public VectorStoreRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PostConstruct
    void warmCache() {
        try {
            reloadCache();
        } catch (Exception e) {
            LOG.warn("Could not warm vector cache at startup (table may not exist yet): {}", e.getMessage());
        }
    }

    public synchronized void reloadCache() {
        cache.clear();
        jdbc.query(
            "SELECT SOURCE_TYPE, SOURCE_ID, CONTENT, EMBEDDING FROM PROJECT_DOC_EMBEDDINGS",
            (rs) -> {
                String type = rs.getString("SOURCE_TYPE");
                long id = rs.getLong("SOURCE_ID");
                String content = readClob(rs.getClob("CONTENT"));
                byte[] blob = rs.getBytes("EMBEDDING");
                float[] vec = VectorMath.bytesToFloats(blob);
                EmbeddingEntry e = new EmbeddingEntry(type, id, content, vec);
                cache.put(e.key(), e);
            });
        LOG.info("Vector cache loaded: {} entries", cache.size());
    }

    public void upsert(String sourceType, long sourceId, String content, float[] embedding) {
        byte[] blob = VectorMath.floatsToBytes(embedding);
        jdbc.update((java.sql.Connection con) -> {
            PreparedStatement ps = con.prepareStatement(
                "MERGE INTO PROJECT_DOC_EMBEDDINGS d "
              + "USING (SELECT ? AS ST, ? AS SID FROM dual) s "
              + "ON (d.SOURCE_TYPE = s.ST AND d.SOURCE_ID = s.SID) "
              + "WHEN MATCHED THEN UPDATE "
              + "  SET CONTENT = ?, EMBEDDING = ?, EMBED_DIM = ?, UPDATED_AT = SYSTIMESTAMP "
              + "WHEN NOT MATCHED THEN "
              + "  INSERT (SOURCE_TYPE, SOURCE_ID, CONTENT, EMBEDDING, EMBED_DIM) "
              + "  VALUES (?, ?, ?, ?, ?)");
            ps.setString(1, sourceType);
            ps.setLong(2, sourceId);
            ps.setString(3, content);
            ps.setBytes(4, blob);
            ps.setInt(5, embedding.length);
            ps.setString(6, sourceType);
            ps.setLong(7, sourceId);
            ps.setString(8, content);
            ps.setBytes(9, blob);
            ps.setInt(10, embedding.length);
            return ps;
        });
        EmbeddingEntry entry = new EmbeddingEntry(sourceType, sourceId, content, embedding);
        cache.put(entry.key(), entry);
    }

    public void deleteBySource(String sourceType, long sourceId) {
        jdbc.update(
            "DELETE FROM PROJECT_DOC_EMBEDDINGS WHERE SOURCE_TYPE = ? AND SOURCE_ID = ?",
            sourceType, sourceId);
        cache.remove(sourceType + ":" + sourceId);
    }

    public void deleteAllOfType(String sourceType) {
        jdbc.update("DELETE FROM PROJECT_DOC_EMBEDDINGS WHERE SOURCE_TYPE = ?", sourceType);
        cache.values().removeIf(e -> e.getSourceType().equals(sourceType));
    }

    public List<RetrievedDoc> searchTopK(float[] query, int k) {
        if (cache.isEmpty()) {
            return new ArrayList<>();
        }
        double normQ = VectorMath.norm(query);
        List<RetrievedDoc> scored = new ArrayList<>(cache.size());
        for (EmbeddingEntry e : cache.values()) {
            double s = VectorMath.cosine(query, normQ, e.getEmbedding(), e.getNorm());
            scored.add(new RetrievedDoc(e.getSourceType(), e.getSourceId(), e.getContent(), s));
        }
        scored.sort(Comparator.comparingDouble(RetrievedDoc::getScore).reversed());
        return scored.subList(0, Math.min(k, scored.size()));
    }

    public int size() {
        return cache.size();
    }

    private static String readClob(Clob clob) throws SQLException {
        if (clob == null) return "";
        long len = clob.length();
        return clob.getSubString(1, (int) len);
    }
}
