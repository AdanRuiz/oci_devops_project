package com.springboot.MyTodoList.agent;

public enum IntentType {
    HELP,
    LIST_TASKS,
    LIST_TASKS_BY_ASSIGNEE,
    LIST_TASKS_BY_STATUS,
    CREATE_TASK,
    DELETE_TASK,
    GET_DEVELOPER_KPI,
    CURRENT_SPRINT_SUMMARY,
    TEAM_LOAD_SUMMARY,
    UNKNOWN
}
