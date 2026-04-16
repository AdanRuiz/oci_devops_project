package com.springboot.MyTodoList.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Formula;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "SPRINTS")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Sprint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ID", columnDefinition = "RAW(16)", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "NAME", nullable = false, length = 100)
    private String name;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "PROJECT_ID", nullable = false, columnDefinition = "RAW(16)")
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 16)
    private SprintStatus status = SprintStatus.UPCOMING;

    @Column(name = "START_DATE", nullable = false)
    private LocalDate startDate;

    @Column(name = "END_DATE", nullable = false)
    private LocalDate endDate;

    @Formula("(SELECT COUNT(*) FROM TASKS t WHERE t.SPRINT_ID = ID)")
    private int plannedTaskCount = 0;

    @Formula("(SELECT COUNT(*) FROM TASKS t WHERE t.SPRINT_ID = ID AND t.STATUS = 'DONE')")
    private int doneTaskCount = 0;
}
