package com.springboot.MyTodoList.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "WORK_ITEM", schema = "CHATBOT_USER")
public class WorkItem {

    @Id
    @Column(name = "WORK_ITEM_ID")
    private String workItemId;

    @Column(name = "SPRINT_ID")
    private String sprintId;

    @Column(name = "CREATED_BY_USER_ID")
    private String createdByUserId;

    @Column(name = "WORK_TYPE")
    private String workType;

    @Column(name = "TITLE")
    private String title;

    @Column(name = "DESCRIPTION", columnDefinition = "CLOB")
    private String description;

    @Column(name = "STATUS")
    private String status;

    @Column(name = "PRIORITY")
    private String priority;

    @Column(name = "EXTERNAL_LINK")
    private String externalLink;

    @Column(name = "ESTIMATED_MINUTES")
    private Integer estimatedMinutes;

    @Column(name = "DUE_DATE")
    private LocalDate dueDate;

    @Column(name = "CREATED_AT")
    private OffsetDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private OffsetDateTime updatedAt;

    @Column(name = "COMPLETED_AT")
    private OffsetDateTime completedAt;

    public WorkItem() {}

    public String getWorkItemId()                        { return workItemId; }
    public void setWorkItemId(String workItemId)         { this.workItemId = workItemId; }

    public String getSprintId()                          { return sprintId; }
    public void setSprintId(String sprintId)             { this.sprintId = sprintId; }

    public String getCreatedByUserId()                           { return createdByUserId; }
    public void setCreatedByUserId(String createdByUserId)       { this.createdByUserId = createdByUserId; }

    public String getWorkType()                          { return workType; }
    public void setWorkType(String workType)             { this.workType = workType; }

    public String getTitle()                             { return title; }
    public void setTitle(String title)                   { this.title = title; }

    public String getDescription()                       { return description; }
    public void setDescription(String description)       { this.description = description; }

    public String getStatus()                            { return status; }
    public void setStatus(String status)                 { this.status = status; }

    public String getPriority()                          { return priority; }
    public void setPriority(String priority)             { this.priority = priority; }

    public String getExternalLink()                      { return externalLink; }
    public void setExternalLink(String externalLink)     { this.externalLink = externalLink; }

    public Integer getEstimatedMinutes()                         { return estimatedMinutes; }
    public void setEstimatedMinutes(Integer estimatedMinutes)    { this.estimatedMinutes = estimatedMinutes; }

    public LocalDate getDueDate()                        { return dueDate; }
    public void setDueDate(LocalDate dueDate)            { this.dueDate = dueDate; }

    public OffsetDateTime getCreatedAt()                 { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt)   { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt()                 { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt)   { this.updatedAt = updatedAt; }

    public OffsetDateTime getCompletedAt()                       { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt)       { this.completedAt = completedAt; }
}
