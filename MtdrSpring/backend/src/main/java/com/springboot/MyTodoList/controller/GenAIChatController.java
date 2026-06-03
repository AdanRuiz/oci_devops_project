package com.springboot.MyTodoList.controller;

// 1. Imports de Java estándar
import java.util.Map;

// 2. Imports de Spring Web y Core
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// 3. Imports base de Spring AI (Clases comunes de Chat)
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;

// 4. Import específico del nuevo modelo de Google GenAI
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
// 5. Import de Project Reactor (Para el manejo de flujos asíncronos con Flux)
import reactor.core.publisher.Flux;

@RestController
public class GenAIChatController {

    private final GoogleGenAiChatModel chatModel;

    @Autowired
    public GenAIChatController(GoogleGenAiChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/ai/generate")
    public Map generate(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        return Map.of("generation", this.chatModel.call(message));
    }

    @GetMapping("/ai/generateStream")
	public Flux<ChatResponse> generateStream(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        Prompt prompt = new Prompt(new UserMessage(message));
        return this.chatModel.stream(prompt);
    }
}