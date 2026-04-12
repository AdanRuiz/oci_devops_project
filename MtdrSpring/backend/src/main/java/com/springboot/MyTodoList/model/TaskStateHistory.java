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
@Table(name = "TASK_STATE_HISTORIES")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TaskStateHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ID", columnDefinition = "RAW(16)", updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "TASK_ID", nullable = false, columnDefinition = "RAW(16)")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CHANGED_BY", nullable = false, columnDefinition = "RAW(16)")
    private User changedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "FROM_STATUS", length = 16)
    private TaskStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "TO_STATUS", nullable = false, length = 16)
    private TaskStatus toStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "SOURCE", nullable = false, length = 16)
    private ChangeSource source = ChangeSource.WEB;

    // Set by DEFAULT SYSTIMESTAMP via trg_task_au — JPA must not write this column.
    @Column(name = "CHANGED_AT", nullable = false, insertable = false, updatable = false)
    private LocalDateTime changedAt;
}
