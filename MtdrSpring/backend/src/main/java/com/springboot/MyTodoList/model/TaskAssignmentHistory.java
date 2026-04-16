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
@Table(name = "TASK_ASSIGNMENT_HISTORIES")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TaskAssignmentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ID", columnDefinition = "RAW(16)", updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "TASK_ID", nullable = false, columnDefinition = "RAW(16)")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ASSIGNEE_ID", nullable = false, columnDefinition = "RAW(16)")
    private User assignee;

    // Both timestamps are set by trg_task_ai / trg_task_au — JPA must not write them.
    @Column(name = "ASSIGNED_AT", nullable = false, insertable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Column(name = "UNASSIGNED_AT", insertable = false, updatable = false)
    private LocalDateTime unassignedAt;
}
