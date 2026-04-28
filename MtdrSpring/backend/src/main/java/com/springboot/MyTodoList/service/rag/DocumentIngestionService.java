package com.springboot.MyTodoList.service.rag;

import com.springboot.MyTodoList.repository.VectorStoreRepository;
import com.springboot.MyTodoList.service.embedding.OCIEmbeddingService;
import com.springboot.MyTodoList.service.rag.source.DocumentRow;
import com.springboot.MyTodoList.service.rag.source.SourceReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DocumentIngestionService {

    private static final Logger LOG = LoggerFactory.getLogger(DocumentIngestionService.class);

    private final List<SourceReader> readers;
    private final OCIEmbeddingService embeddings;
    private final VectorStoreRepository store;

    @Autowired
    public DocumentIngestionService(List<SourceReader> readers,
                                    OCIEmbeddingService embeddings,
                                    VectorStoreRepository store) {
        this.readers = readers;
        this.embeddings = embeddings;
        this.store = store;
    }

    public Map<String, Integer> reindexAll() {
        Map<String, Integer> totals = new HashMap<>();
        for (SourceReader r : readers) {
            int n = reindexOne(r);
            totals.put(r.sourceType(), n);
        }
        LOG.info("Reindex completed: {}", totals);
        return totals;
    }

    public Map<String, Integer> reindex(String sourceType) {
        SourceReader reader = readers.stream()
                .filter(r -> r.sourceType().equalsIgnoreCase(sourceType))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown sourceType: " + sourceType));
        Map<String, Integer> totals = new HashMap<>();
        totals.put(reader.sourceType(), reindexOne(reader));
        return totals;
    }

    private int reindexOne(SourceReader reader) {
        long t0 = System.currentTimeMillis();
        List<DocumentRow> rows = reader.readAll();
        if (rows.isEmpty()) {
            LOG.info("[{}] no rows to index", reader.sourceType());
            store.deleteAllOfType(reader.sourceType());
            return 0;
        }

        List<String> texts = rows.stream()
                .map(DocumentRow::getContent)
                .collect(Collectors.toList());

        List<float[]> vectors = embeddings.embedBatch(texts);
        if (vectors.size() != rows.size()) {
            throw new IllegalStateException(
                "Embedding count mismatch: rows=" + rows.size() + " vectors=" + vectors.size());
        }

        // Replace-set semantics: delete all of this type, then upsert current rows.
        // For tiny datasets this is fine; for larger ones, use diffing later.
        store.deleteAllOfType(reader.sourceType());
        List<long[]> failed = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            DocumentRow row = rows.get(i);
            try {
                store.upsert(row.getSourceType(), row.getSourceId(), row.getContent(), vectors.get(i));
            } catch (RuntimeException ex) {
                LOG.warn("Failed to upsert {}#{}: {}", row.getSourceType(), row.getSourceId(), ex.getMessage());
                failed.add(new long[]{row.getSourceId()});
            }
        }
        long elapsed = System.currentTimeMillis() - t0;
        LOG.info("[{}] indexed {} rows ({} failed) in {} ms",
                reader.sourceType(), rows.size() - failed.size(), failed.size(), elapsed);
        return rows.size() - failed.size();
    }
}
