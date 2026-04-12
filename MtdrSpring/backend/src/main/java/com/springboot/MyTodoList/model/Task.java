package com.springboot.MyTodoList.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "TASKS")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ID", columnDefinition = "RAW(16)", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "TITLE", nullable = false, length = 100)
    private String title;

    @Column(name = "DESCRIPTION", length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 16)
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(name = "PRIORITY", nullable = false, length = 8)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "PROJECT_ID", nullable = false, columnDefinition = "RAW(16)")
    private Project project;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SPRINT_ID", columnDefinition = "RAW(16)")
    private Sprint sprint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ASSIGNEE_ID", columnDefinition = "RAW(16)")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CREATED_BY", nullable = false, columnDefinition = "RAW(16)")
    private User createdBy;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Columns below are owned by DB triggers (trg_task_bi, trg_task_bu).
    // JPA must not write them — insertable=false, updatable=false keeps them read-only.
    @Column(name = "SPRINT_ADDED_AT", insertable = false, updatable = false)
    private LocalDateTime sprintAddedAt;

    @Column(name = "ASSIGNED_AT", insertable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Column(name = "ENTERED_IN_PROGRESS_AT", insertable = false, updatable = false)
    private LocalDateTime enteredInProgressAt;

    @Column(name = "BLOCKED_AT", insertable = false, updatable = false)
    private LocalDateTime blockedAt;

    @Column(name = "COMPLETED_AT", insertable = false, updatable = false)
    private LocalDateTime completedAt;

    @Column(name = "REWORK_COUNT", nullable = false, insertable = false, updatable = false)
    private int reworkCount = 0;

    @PrePersist
    private void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
