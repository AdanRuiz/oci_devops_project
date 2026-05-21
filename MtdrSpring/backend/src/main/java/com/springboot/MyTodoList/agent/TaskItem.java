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

    /** Construct a TaskItem with the provided properties. */
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

    /** Return the unique task id. */
    public long getId() {
        return id;
    }

    /** Return the task title. */
    public String getTitle() {
        return title;
    }

    /** Update the task title. */
    public void setTitle(String title) {
        this.title = title;
    }

    /** Return the assignee (owner) of the task. */
    public String getAssignee() {
        return assignee;
    }

    /** Set or change the assignee of the task. */
    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }

    /** Return the current status of the task (e.g., PENDING, IN_PROGRESS, DONE). */
    public String getStatus() {
        return status;
    }

    /** Update the task status. */
    public void setStatus(String status) {
        this.status = status;
    }

    /** Return the expected (estimated) hours for the task. */
    public int getExpectedHours() {
        return expectedHours;
    }

    /** Set the expected (estimated) hours for the task. */
    public void setExpectedHours(int expectedHours) {
        this.expectedHours = expectedHours;
    }

    /** Return the number of hours already spent on the task. */
    public int getHoursDone() {
        return hoursDone;
    }

    /** Update the number of hours completed for the task. */
    public void setHoursDone(int hoursDone) {
        this.hoursDone = hoursDone;
    }

    /** Return true if the task is marked as a bug. */
    public boolean isBug() {
        return bug;
    }

    /** Mark or unmark the task as a bug. */
    public void setBug(boolean bug) {
        this.bug = bug;
    }

    /** Return the sprint name this task belongs to. */
    public String getSprintName() {
        return sprintName;
    }

    /** Assign or change the sprint name for this task. */
    public void setSprintName(String sprintName) {
        this.sprintName = sprintName;
    }
}
