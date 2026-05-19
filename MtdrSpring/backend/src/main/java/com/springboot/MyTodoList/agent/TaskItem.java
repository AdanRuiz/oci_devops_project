package com.springboot.MyTodoList.agent;

public class TaskItem {

    private final long id;
    private String title;
    private String assignee;
    private String status;
    private int expectedHours;
    private int hoursDone;
    private boolean bug;
    private String sprintName;

    public TaskItem(long id, String title, String assignee, String status, int expectedHours, int hoursDone, boolean bug, String sprintName) {
        this.id = id;
        this.title = title;
        this.assignee = assignee;
        this.status = status;
        this.expectedHours = expectedHours;
        this.hoursDone = hoursDone;
        this.bug = bug;
        this.sprintName = sprintName;
    }

    public long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public int getExpectedHours() {
        return expectedHours;
    }

    public void setExpectedHours(int expectedHours) {
        this.expectedHours = expectedHours;
    }

    public int getHoursDone() {
        return hoursDone;
    }

    public void setHoursDone(int hoursDone) {
        this.hoursDone = hoursDone;
    }

    public boolean isBug() {
        return bug;
    }

    public void setBug(boolean bug) {
        this.bug = bug;
    }

    public String getSprintName() {
        return sprintName;
    }

    public void setSprintName(String sprintName) {
        this.sprintName = sprintName;
    }
}
