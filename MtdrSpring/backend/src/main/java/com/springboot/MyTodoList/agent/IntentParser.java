package com.springboot.MyTodoList.agent;

public interface IntentParser {
    /** Parse the incoming message text and return a ParsedIntent representation. */
    ParsedIntent parse(String messageText);
}
