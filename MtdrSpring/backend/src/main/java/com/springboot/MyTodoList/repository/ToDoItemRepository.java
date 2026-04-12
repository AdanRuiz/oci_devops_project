package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.TaskStatus;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.List;
import java.util.UUID;

@Repository
@Transactional
@EnableTransactionManagement
public interface ToDoItemRepository extends JpaRepository<Task, UUID> {

    List<Task> findByStatus(TaskStatus status);

    List<Task> findByStatusNot(TaskStatus status);

    List<Task> findByProject_Id(UUID projectId);

    List<Task> findBySprint_Id(UUID sprintId);

    List<Task> findByAssignee_Id(UUID assigneeId);

    List<Task> findByProject_IdAndSprint_Id(UUID projectId, UUID sprintId);
}
