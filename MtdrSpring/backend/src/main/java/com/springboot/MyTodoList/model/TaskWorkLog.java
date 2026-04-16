package com.springboot.MyTodoList.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "TASK_WORK_LOGS",
       uniqueConstraints = @UniqueConstraint(columnNames = {"TASK_ID", "USER_ID", "WORK_DATE"}))
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TaskWorkLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ID", columnDefinition = "RAW(16)", updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "TASK_ID", nullable = false, columnDefinition = "RAW(16)")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "USER_ID", nullable = false, columnDefinition = "RAW(16)")
    private User user;

    @Column(name = "WORK_DATE", nullable = false)
    private LocalDate workDate;

    @Column(name = "DAYS_WORKED", nullable = false, precision = 3, scale = 1)
    private BigDecimal daysWorked = BigDecimal.ONE;

    @Column(name = "NOTE", length = 500)
    private String note;
}
