package com.springboot.MyTodoList.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "SPRINT", schema = "CHATBOT_USER")
public class Sprint {

    @Id
    @Column(name = "SPRINT_ID")
    private String sprintId;

    @Column(name = "TEAM_ID")
    private String teamId;

    @Column(name = "NAME")
    private String name;

    @Column(name = "GOAL")
    private String goal;

    @Column(name = "START_DATE")
    private LocalDate startDate;

    @Column(name = "END_DATE")
    private LocalDate endDate;

    @Column(name = "STATUS")
    private String status;

    @Column(name = "CREATED_AT")
    private OffsetDateTime createdAt;

    @Column(name = "CREATED_BY_USER_ID")
    private String createdByUserId;

    public Sprint() {}

    public String getSprintId()                        { return sprintId; }
    public void setSprintId(String sprintId)           { this.sprintId = sprintId; }

    public String getTeamId()                          { return teamId; }
    public void setTeamId(String teamId)               { this.teamId = teamId; }

    public String getName()                            { return name; }
    public void setName(String name)                   { this.name = name; }

    public String getGoal()                            { return goal; }
    public void setGoal(String goal)                   { this.goal = goal; }

    public LocalDate getStartDate()                    { return startDate; }
    public void setStartDate(LocalDate startDate)      { this.startDate = startDate; }

    public LocalDate getEndDate()                      { return endDate; }
    public void setEndDate(LocalDate endDate)          { this.endDate = endDate; }

    public String getStatus()                          { return status; }
    public void setStatus(String status)               { this.status = status; }

    public OffsetDateTime getCreatedAt()               { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public String getCreatedByUserId()                         { return createdByUserId; }
    public void setCreatedByUserId(String createdByUserId)     { this.createdByUserId = createdByUserId; }
}
