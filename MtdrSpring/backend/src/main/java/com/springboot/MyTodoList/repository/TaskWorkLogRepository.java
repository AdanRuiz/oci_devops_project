package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.TaskWorkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskWorkLogRepository extends JpaRepository<TaskWorkLog, UUID> {

    List<TaskWorkLog> findByTask_Id(UUID taskId);

    List<TaskWorkLog> findByUser_Id(UUID userId);

    @Query("SELECT wl FROM TaskWorkLog wl WHERE wl.task.sprint.id = :sprintId")
    List<TaskWorkLog> findBySprintId(@Param("sprintId") UUID sprintId);
}
