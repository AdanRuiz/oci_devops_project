package com.springboot.MyTodoList.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TASK")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TASKID")
    private Integer taskID;

    @Column(name = "NAME", nullable = false, length = 200)
    private String name;

    @Column(name = "DESCRIPTION", nullable = false, length = 300)
    private String description;

    @Column(name = "STATUS", nullable = false, length = 20)
    private String status;

    @Column(name = "TASKTYPE", nullable = false, length = 30)
    private String taskType;

    @Column(name = "STARTDATE", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "DEADLINE", nullable = false)
    private LocalDateTime deadline;

    @Column(name = "DEVELOPERID", nullable = false)
    private Integer developerID;

    @Column(name = "ESTIMATEDTIME", nullable = false)
    private Integer estimatedTime;

    @Column(name = "TIMESPENT")
    private Integer timeSpent;

    @Column(name = "PRIORITY", nullable = false, length = 20)
    private String priority;

    @Column(name = "PROJECTID", nullable = false)
    private Integer projectID;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @Column(name = "SPRINT")
    private Integer sprint;

    public Integer getTaskID() {
        return taskID;
    }

    public void setTaskID(Integer taskID) {
        this.taskID = taskID;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public Integer getDeveloperID() {
        return developerID;
    }

    public void setDeveloperID(Integer developerID) {
        this.developerID = developerID;
    }

    public Integer getEstimatedTime() {
        return estimatedTime;
    }

    public void setEstimatedTime(Integer estimatedTime) {
        this.estimatedTime = estimatedTime;
    }

    public Integer getTimeSpent() {
        return timeSpent;
    }

    public void setTimeSpent(Integer timeSpent) {
        this.timeSpent = timeSpent;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public Integer getProjectID() {
        return projectID;
    }

    public void setProjectID(Integer projectID) {
        this.projectID = projectID;
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

    public Integer getSprint() {
        return sprint;
    }

    public void setSprint(Integer sprint) {
        this.sprint = sprint;
    }
}
