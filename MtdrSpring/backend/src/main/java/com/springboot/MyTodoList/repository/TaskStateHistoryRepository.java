package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.TaskStateHistory;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.List;
import java.util.UUID;

@Repository
@Transactional
@EnableTransactionManagement
public interface TaskStateHistoryRepository extends JpaRepository<TaskStateHistory, UUID> {

    List<TaskStateHistory> findByTask_IdOrderByChangedAtAsc(UUID taskId);
}
