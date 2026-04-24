package com.springboot.MyTodoList.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "SPRINT_KPI_SNAPSHOTS")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SprintKpiSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ID", columnDefinition = "RAW(16)", updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "SPRINT_ID", nullable = false, unique = true, columnDefinition = "RAW(16)")
    private Sprint sprint;

    @Column(name = "AVG_CYCLE_TIME_DAYS", precision = 8, scale = 2)
    private BigDecimal avgCycleTimeDays;

    @Column(name = "SCOPE_CREEP_RATE_PCT", precision = 5, scale = 2)
    private BigDecimal scopeCreepRatePct;

    @Column(name = "BLOCKER_RESOLUTION_DAYS", precision = 8, scale = 2)
    private BigDecimal blockerResolutionDays;

    @Column(name = "TASKS_REWORKED", nullable = false)
    private int tasksReworked = 0;

    @Column(name = "TASKS_COMPLETED", nullable = false)
    private int tasksCompleted = 0;

    @Column(name = "TOTAL_HOURS_WORKED", precision = 8, scale = 2)
    private BigDecimal totalHoursWorked;

    @Column(name = "CALCULATED_AT", nullable = false, updatable = false)
    private LocalDateTime calculatedAt;

    @PrePersist
    private void prePersist() {
        if (calculatedAt == null) calculatedAt = LocalDateTime.now();
    }
}
