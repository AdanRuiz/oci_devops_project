package com.springboot.MyTodoList.controller.dto;

import com.springboot.MyTodoList.model.Task;

import java.time.LocalDateTime;

public class TaskWithSprintResponse {

    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private Long assignedTo;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedDate;
    private String vector;
    private Integer hoursDone;
    private Integer expectedHours;
    private Boolean isBug;
    private SprintSummaryResponse sprint;

    public TaskWithSprintResponse() {
    }

    public TaskWithSprintResponse(Task task, SprintSummaryResponse sprint) {
        this.id = task.getId();
        this.title = task.getTitle();
        this.description = task.getDescription();
        this.status = task.getStatus() != null ? task.getStatus().name() : null;
        this.priority = task.getPriority() != null ? task.getPriority().name() : null;
        this.assignedTo = task.getAssignedTo();
        this.createdBy = task.getCreatedBy();
        this.createdAt = task.getCreatedAt();
        this.updatedAt = task.getUpdatedAt();
        this.completedDate = task.getCompletedDate();
        this.vector = task.getVector();
        this.hoursDone = task.getHoursDone();
        this.expectedHours = task.getExpectedHours();
        this.isBug = task.getIsBug();
        this.sprint = sprint;
    }

    public Integer getHoursDone() {
        return hoursDone;
    }

    public void setHoursDone(Integer hoursDone) {
        this.hoursDone = hoursDone;
    }

    public Integer getExpectedHours() {
        return expectedHours;
    }

    public void setExpectedHours(Integer expectedHours) {
        this.expectedHours = expectedHours;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }


    public Boolean getIsBug() {
        return isBug;
    }

    public void setIsBug(Boolean isBug) {
        this.isBug = isBug;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getCompletedDate() {
        return completedDate;
    }

    public void setCompletedDate(LocalDateTime completedDate) {
        this.completedDate = completedDate;
    }

    public String getVector() {
        return vector;
    }

    public void setVector(String vector) {
        this.vector = vector;
    }

    public SprintSummaryResponse getSprint() {
        return sprint;
    }

    public void setSprint(SprintSummaryResponse sprint) {
        this.sprint = sprint;
    }
}
