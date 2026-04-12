package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.TaskAssignmentHistory;
import com.springboot.MyTodoList.repository.TaskAssignmentHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

// Read-only service. Rows in task_assignment_histories are written exclusively
// by trg_task_ai (on INSERT) and trg_task_au (on UPDATE) — the application
// must never insert or update this table directly.
@Service
public class TaskAssignmentHistoryService {

    @Autowired
    private TaskAssignmentHistoryRepository taskAssignmentHistoryRepository;

    public List<TaskAssignmentHistory> findByTaskId(UUID taskId) {
        return taskAssignmentHistoryRepository.findByTask_IdOrderByAssignedAtAsc(taskId);
    }
}
