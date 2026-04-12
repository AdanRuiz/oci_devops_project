package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.TaskWorkLog;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.List;
import java.util.UUID;

@Repository
@Transactional
@EnableTransactionManagement
public interface TaskWorkLogRepository extends JpaRepository<TaskWorkLog, UUID> {

    List<TaskWorkLog> findByTask_Id(UUID taskId);

    List<TaskWorkLog> findByUser_Id(UUID userId);
}
