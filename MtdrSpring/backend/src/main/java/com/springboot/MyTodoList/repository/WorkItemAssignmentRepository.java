package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.WorkItemAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkItemAssignmentRepository extends JpaRepository<WorkItemAssignment, String> {
    List<WorkItemAssignment> findByWorkItemId(String workItemId);
    List<WorkItemAssignment> findByUserId(String userId);
}
