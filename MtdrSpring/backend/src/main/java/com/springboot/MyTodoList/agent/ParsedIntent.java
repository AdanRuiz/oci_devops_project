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
    /** Return the detected intent type for the parsed message. */
        return intent;
    }

    public void setIntent(IntentType intent) {
    /** Set the detected intent type. */
        this.intent = intent == null ? IntentType.UNKNOWN : intent;
    }

    public String getAssignee() {
    /** Return parsed assignee name if present. */
        return assignee;
    }

    public void setAssignee(String assignee) {
    /** Set the parsed assignee name. */
        this.assignee = assignee;
    }

    public String getStatus() {
    /** Return parsed task status filter if present. */
        return status;
    }

    public void setStatus(String status) {
    /** Set the parsed status filter. */
        this.status = status;
    }

    public String getTitle() {
    /** Return parsed task title when present in intent. */
        return title;
    }

    public void setTitle(String title) {
    /** Set the parsed task title. */
        this.title = title;
    }

    public String getSprintName() {
    /** Return parsed sprint name if included in the intent. */
        return sprintName;
    }

    public void setSprintName(String sprintName) {
    /** Set the parsed sprint name. */
        this.sprintName = sprintName;
    }

    public boolean isClarificationNeeded() {
    /** Return true when more info is required to fulfill the intent. */
        return clarificationNeeded;
    }

    public void setClarificationNeeded(boolean clarificationNeeded) {
    /** Mark whether a follow-up clarification is required. */
        this.clarificationNeeded = clarificationNeeded;
    }

    public String getClarificationQuestion() {
    /** Return the clarification question suggested to the user. */
        return clarificationQuestion;
    }

    public void setClarificationQuestion(String clarificationQuestion) {
    /** Set a single, concrete clarification question for missing information. */
        this.clarificationQuestion = clarificationQuestion;
    }

    public String getResponseText() {
    /** Return an explicit response text to send back instead of executing an action. */
        return responseText;
    }

    public void setResponseText(String responseText) {
    /** Set an explicit response text produced by the parser or LLM. */
        this.responseText = responseText;
    }

    public String getTaskId() {
    /** Return a parsed task id when present. */
        return taskId;
    }

    public void setTaskId(String taskId) {
    /** Set the parsed task id. */
        this.taskId = taskId;
    }

    public String getDeveloperName() {
    /** Return a developer name parsed from the message. */
        return developerName;
    }

    public void setDeveloperName(String developerName) {
    /** Set the parsed developer name. */
        this.developerName = developerName;
    }

    public Integer getExpectedHours() {
    /** Return parsed expected hours (estimate) when present. */
        return expectedHours;
    }

    public void setExpectedHours(Integer expectedHours) {
    /** Set the parsed expected hours (estimate). */
        this.expectedHours = expectedHours;
    }

    public Boolean getIsBug() {
    /** Return true if the parser detected the task is a bug. */
        return isBug;
    }

    public void setIsBug(Boolean isBug) {
    /** Mark whether the parsed task should be treated as a bug. */
        this.isBug = isBug;
    }
}
