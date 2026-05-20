package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.controller.dto.GenAiChatRequest;
import com.springboot.MyTodoList.controller.dto.GenAiChatResponse;
import com.springboot.MyTodoList.service.GenAiChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GenAiController {

    private final GenAiChatService genAiChatService;

    public GenAiController(GenAiChatService genAiChatService) {
        this.genAiChatService = genAiChatService;
    }

    @PostMapping("/api/genai/chat")
    public ResponseEntity<GenAiChatResponse> chat(@RequestBody GenAiChatRequest request) {
        String reply = genAiChatService.reply(request);
        return ResponseEntity.ok(new GenAiChatResponse(reply));
    }
}
