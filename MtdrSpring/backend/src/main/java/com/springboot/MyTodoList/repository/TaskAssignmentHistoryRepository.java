package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.TaskAssignmentHistory;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
@EnableTransactionManagement
public interface TaskAssignmentHistoryRepository extends JpaRepository<TaskAssignmentHistory, UUID> {

    List<TaskAssignmentHistory> findByTask_IdOrderByAssignedAtAsc(UUID taskId);

    Optional<TaskAssignmentHistory> findByTask_IdAndUnassignedAtIsNull(UUID taskId);
}
