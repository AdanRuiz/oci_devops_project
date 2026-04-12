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
@Table(name = "PROJECT_MEMBERS",
       uniqueConstraints = @UniqueConstraint(columnNames = {"PROJECT_ID", "USER_ID"}))
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ID", columnDefinition = "RAW(16)", updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "PROJECT_ID", nullable = false, columnDefinition = "RAW(16)")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "USER_ID", nullable = false, columnDefinition = "RAW(16)")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE", nullable = false, length = 32)
    private ProjectRole role = ProjectRole.DEVELOPER;

    @Column(name = "JOINED_AT", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    private void prePersist() {
        if (joinedAt == null) joinedAt = LocalDateTime.now();
    }
}
