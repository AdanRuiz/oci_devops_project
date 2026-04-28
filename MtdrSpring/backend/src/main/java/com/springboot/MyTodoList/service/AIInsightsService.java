package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.dto.AIQueryResponse;
import com.springboot.MyTodoList.repository.BotInteractionRepository;
import com.springboot.MyTodoList.service.rag.RAGRetrievalService;
import com.springboot.MyTodoList.service.rag.RetrievedDoc;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class AIInsightsService {

    private static final Logger LOG = LoggerFactory.getLogger(AIInsightsService.class);

    private static final String DEFAULT_SYSTEM_PROMPT =
        "Eres un asistente de gestión de proyectos. Responde en español usando "
      + "EXCLUSIVAMENTE la información del contexto provisto. Si la información no está en "
      + "el contexto, responde \"No tengo esa información en los datos del proyecto\". "
      + "Sé conciso. Cuando uses información de un documento, cita el tipo y ID al final "
      + "entre paréntesis, por ejemplo (PROJECT #12, TASK #234).";

    private final RAGRetrievalService retrieval;
    private final DeepSeekService deepSeek;
    private final BotInteractionRepository chatLog;
    private final int topK;
    private final String systemPromptBase;

    @Autowired
    public AIInsightsService(RAGRetrievalService retrieval,
                             DeepSeekService deepSeek,
                             BotInteractionRepository chatLog,
                             @Value("${ai.rag.top-k:5}") int topK,
                             @Value("${ai.rag.system-prompt-base:}") String systemPromptBase) {
        this.retrieval = retrieval;
        this.deepSeek = deepSeek;
        this.chatLog = chatLog;
        this.topK = topK;
        this.systemPromptBase = (systemPromptBase == null || systemPromptBase.isEmpty())
                ? DEFAULT_SYSTEM_PROMPT : systemPromptBase;
    }

    public AIQueryResponse ask(String question) throws IOException {
        if (question == null || question.trim().isEmpty()) {
            throw new IllegalArgumentException("question must not be empty");
        }

        List<RetrievedDoc> docs = retrieval.retrieve(question, topK);
        String contextBlock = buildContextBlock(docs);
        String systemPrompt = systemPromptBase + "\n\nContexto disponible:\n" + contextBlock;

        LOG.info("AI ask: question='{}' retrieved={} docs", truncate(question, 80), docs.size());
        String answer = deepSeek.chat(systemPrompt, question);

        try {
            chatLog.insert(null, question, answer);
        } catch (RuntimeException ex) {
            LOG.warn("Could not persist BOT_INTERACTIONS row: {}", ex.getMessage());
        }

        List<AIQueryResponse.Source> sources = new ArrayList<>(docs.size());
        for (RetrievedDoc d : docs) {
            sources.add(new AIQueryResponse.Source(d.getSourceType(), d.getSourceId(), d.getScore()));
        }
        return new AIQueryResponse(answer, sources);
    }

    private String buildContextBlock(List<RetrievedDoc> docs) {
        if (docs.isEmpty()) return "(sin documentos relevantes en el índice)";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < docs.size(); i++) {
            RetrievedDoc d = docs.get(i);
            if (i > 0) sb.append("\n---\n");
            sb.append("[").append(d.getSourceType()).append(" #").append(d.getSourceId()).append("]\n");
            sb.append(d.getContent());
        }
        return sb.toString();
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
