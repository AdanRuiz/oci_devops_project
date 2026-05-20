package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.agent.AgentOrchestrator;
import com.springboot.MyTodoList.controller.dto.GenAiChatMessage;
import com.springboot.MyTodoList.controller.dto.GenAiChatRequest;
import com.springboot.MyTodoList.service.LumiActionPlan.Action;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class GenAiChatService {

    private static final String AGENT_FALLBACK = "No pude interpretar la solicitud. Escribe ayuda para ver ejemplos.";

    private final LumiActionService lumiActionService;
    private final LumiIntentService lumiIntentService;
    private final AgentOrchestrator agentOrchestrator;
    private final GroqChatService groqChatService;

    public GenAiChatService(LumiActionService lumiActionService,
                            LumiIntentService lumiIntentService,
                            AgentOrchestrator agentOrchestrator,
                            GroqChatService groqChatService) {
        this.lumiActionService = lumiActionService;
        this.lumiIntentService = lumiIntentService;
        this.agentOrchestrator = agentOrchestrator;
        this.groqChatService = groqChatService;
    }

    public String reply(GenAiChatRequest request) {
        String message = request.getMessage() == null ? "" : request.getMessage().trim();
        if (message.isBlank()) {
            return "Send a message to start chatting with Lumi.";
        }

        Optional<String> ruleReply = lumiActionService.tryHandle(message);
        if (ruleReply.isPresent()) {
            return ruleReply.get();
        }

        if (lumiIntentService.isAvailable()) {
            Optional<LumiActionPlan> plan = lumiIntentService.extractPlan(message, request.getHistory());
            if (plan.isPresent()) {
                LumiActionPlan resolved = plan.get();
                if (resolved.isNeedsClarification()
                    && resolved.getClarificationQuestion() != null
                    && !resolved.getClarificationQuestion().isBlank()) {
                    return resolved.getClarificationQuestion().trim();
                }
                Optional<String> executed = lumiActionService.executePlan(resolved);
                if (executed.isPresent()) {
                    return executed.get();
                }
                if (resolved.getAction() == Action.TASK_QUERY) {
                    String agentReply = agentOrchestrator.handleMessage(message, request.getUserRole());
                    if (isUsefulAgentReply(agentReply)) {
                        return agentReply;
                    }
                }
            }
        }

        if (looksLikeTaskQuery(message)) {
            String agentReply = agentOrchestrator.handleMessage(message, request.getUserRole());
            if (isUsefulAgentReply(agentReply)) {
                return agentReply;
            }
        }

        List<GenAiChatMessage> history = request.getHistory();
        String groqReply = groqChatService.chat(message, history);
        if (groqReply != null && !groqReply.isBlank()) {
            return groqReply;
        }

        if (!groqChatService.isAvailable()) {
            return """
                Lumi needs GROQ_API_KEY in application-local.properties to understand natural language.

                You can still ask plainly, for example:
                "Set up a team called Platform Crew with Alex and Jessie"
                """.trim();
        }

        return "Tell me what you'd like — create a team, project, or sprint, or ask about workload. I'll do it in the workspace.";
    }

    private boolean looksLikeTaskQuery(String message) {
        String lower = message.toLowerCase(Locale.ROOT);
        return lower.contains("task")
            || lower.contains("tarea")
            || lower.contains("sprint")
            || lower.contains("kpi")
            || lower.contains("assignee")
            || lower.contains("asignad")
            || lower.contains("pending")
            || lower.contains("pendiente");
    }

    private boolean isUsefulAgentReply(String agentReply) {
        return agentReply != null
            && !agentReply.isBlank()
            && !AGENT_FALLBACK.equals(agentReply.trim());
    }
}
