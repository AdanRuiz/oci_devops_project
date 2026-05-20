package com.springboot.MyTodoList.controller.dto;

public class GenAiChatMessage {

    private String role;
    private String content;

    public GenAiChatMessage() {
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
