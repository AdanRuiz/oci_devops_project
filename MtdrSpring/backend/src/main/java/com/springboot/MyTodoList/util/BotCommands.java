package com.springboot.MyTodoList.util;

public enum BotCommands {

	START_COMMAND("/start"), 
	REGISTER_COMMAND("/register"), 
	ADD_TASK("/addtask"),
	DELETE_TASK("/deletetask"),
	ASSIGN_TASK("/assigntask"),
	COMPLETE_TASK("/completetask"),
	LIST_TASKS("/mytasks"),
	TEAM_KPIS("/teamkpis"),
	TEAM_TASKS("/teamtasks"),
	LLM_REQ("/llm");

	private final String command;

	BotCommands(String enumCommand) {
		this.command = enumCommand;
	}

	public String getCommand() {
		return command;
	}
}
