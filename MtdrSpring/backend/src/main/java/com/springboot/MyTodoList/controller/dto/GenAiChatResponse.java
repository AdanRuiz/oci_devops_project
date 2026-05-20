package com.springboot.MyTodoList.controller.dto;

public class GenAiChatResponse {

    private String reply;

    public GenAiChatResponse() {
    }

    public GenAiChatResponse(String reply) {
        this.reply = reply;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}
