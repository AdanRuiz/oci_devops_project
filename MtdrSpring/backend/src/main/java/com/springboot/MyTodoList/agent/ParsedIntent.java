package com.springboot.MyTodoList.agent;

public class ParsedIntent {

    private IntentType intent = IntentType.UNKNOWN;
    private String assignee;
    private String status;
    private String title;
    private Integer expectedHours;
    private Boolean isBug;
    private String sprintName;
    private String taskId;
    private String developerName;
    private boolean clarificationNeeded;
    private String clarificationQuestion;
    private String responseText;

    public IntentType getIntent() {
        return intent;
    }

    public void setIntent(IntentType intent) {
        this.intent = intent;
    }

    public String getAssignee() {
        return assignee;
    }

    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSprintName() {
        return sprintName;
    }

    public void setSprintName(String sprintName) {
        this.sprintName = sprintName;
    }

    public boolean isClarificationNeeded() {
        return clarificationNeeded;
    }

    public void setClarificationNeeded(boolean clarificationNeeded) {
        this.clarificationNeeded = clarificationNeeded;
    }

    public String getClarificationQuestion() {
        return clarificationQuestion;
    }

    public void setClarificationQuestion(String clarificationQuestion) {
        this.clarificationQuestion = clarificationQuestion;
    }

    public String getResponseText() {
        return responseText;
    }

    public void setResponseText(String responseText) {
        this.responseText = responseText;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getDeveloperName() {
        return developerName;
    }

    public void setDeveloperName(String developerName) {
        this.developerName = developerName;
    }

    public Integer getExpectedHours() {
        return expectedHours;
    }

    public void setExpectedHours(Integer expectedHours) {
        this.expectedHours = expectedHours;
    }

    public Boolean getIsBug() {
        return isBug;
    }

    public void setIsBug(Boolean isBug) {
        this.isBug = isBug;
    }
}
