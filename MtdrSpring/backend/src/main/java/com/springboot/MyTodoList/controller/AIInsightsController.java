package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.dto.AIQueryRequest;
import com.springboot.MyTodoList.dto.AIQueryResponse;
import com.springboot.MyTodoList.service.AIInsightsService;
import com.springboot.MyTodoList.service.rag.DocumentIngestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIInsightsController {

    private static final Logger LOG = LoggerFactory.getLogger(AIInsightsController.class);

    private final AIInsightsService insights;
    private final DocumentIngestionService ingestion;

    @Autowired
    public AIInsightsController(AIInsightsService insights, DocumentIngestionService ingestion) {
        this.insights = insights;
        this.ingestion = ingestion;
    }

    @PostMapping("/ask")
    public ResponseEntity<?> ask(@RequestBody AIQueryRequest req) {
        if (req == null || req.getQuestion() == null || req.getQuestion().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "question is required"));
        }
        try {
            AIQueryResponse resp = insights.ask(req.getQuestion());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (IOException ex) {
            LOG.error("AI ask failed: {}", ex.getMessage(), ex);
            return ResponseEntity.status(502).body(Map.of("error", "upstream LLM error: " + ex.getMessage()));
        } catch (RuntimeException ex) {
            LOG.error("AI ask failed: {}", ex.getMessage(), ex);
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/reindex")
    public ResponseEntity<?> reindexAll() {
        try {
            Map<String, Integer> totals = ingestion.reindexAll();
            return ResponseEntity.ok(Map.of("ok", true, "indexed", totals));
        } catch (RuntimeException ex) {
            LOG.error("Reindex failed: {}", ex.getMessage(), ex);
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/reindex/{sourceType}")
    public ResponseEntity<?> reindexOne(@PathVariable String sourceType) {
        try {
            Map<String, Integer> totals = ingestion.reindex(sourceType);
            return ResponseEntity.ok(Map.of("ok", true, "indexed", totals));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (RuntimeException ex) {
            LOG.error("Reindex failed: {}", ex.getMessage(), ex);
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }
}
