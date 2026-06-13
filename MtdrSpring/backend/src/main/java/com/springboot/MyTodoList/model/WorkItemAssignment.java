package com.springboot.MyTodoList.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "WORK_ITEM_ASSIGNMENT", schema = "CHATBOT_USER")
public class WorkItemAssignment {

    @Id
    @Column(name = "ASSIGNMENT_ID")
    private String assignmentId;

    @Column(name = "WORK_ITEM_ID")
    private String workItemId;

    @Column(name = "USER_ID")
    private String userId;

    @Column(name = "ASSIGNMENT_ROLE")
    private String assignmentRole;

    @Column(name = "ASSIGNED_AT")
    private OffsetDateTime assignedAt;

    @Column(name = "UNASSIGNED_AT")
    private OffsetDateTime unassignedAt;

    @Column(name = "ASSIGNED_BY_USER_ID")
    private String assignedByUserId;

    public WorkItemAssignment() {}

    public String getAssignmentId()                          { return assignmentId; }
    public void setAssignmentId(String assignmentId)         { this.assignmentId = assignmentId; }

    public String getWorkItemId()                            { return workItemId; }
    public void setWorkItemId(String workItemId)             { this.workItemId = workItemId; }

    public String getUserId()                                { return userId; }
    public void setUserId(String userId)                     { this.userId = userId; }

    public String getAssignmentRole()                        { return assignmentRole; }
    public void setAssignmentRole(String assignmentRole)     { this.assignmentRole = assignmentRole; }

    public OffsetDateTime getAssignedAt()                    { return assignedAt; }
    public void setAssignedAt(OffsetDateTime assignedAt)     { this.assignedAt = assignedAt; }

    public OffsetDateTime getUnassignedAt()                      { return unassignedAt; }
    public void setUnassignedAt(OffsetDateTime unassignedAt)     { this.unassignedAt = unassignedAt; }

    public String getAssignedByUserId()                          { return assignedByUserId; }
    public void setAssignedByUserId(String assignedByUserId)     { this.assignedByUserId = assignedByUserId; }
}
