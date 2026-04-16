package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.TaskStateHistory;
import com.springboot.MyTodoList.repository.TaskStateHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

// Read-only service. Rows in task_state_histories are written exclusively
// by trg_task_au — the application must never insert into this table directly.
@Service
public class TaskStateHistoryService {

    @Autowired
    private TaskStateHistoryRepository taskStateHistoryRepository;

    public List<TaskStateHistory> findByTaskId(UUID taskId) {
        return taskStateHistoryRepository.findByTask_IdOrderByChangedAtAsc(taskId);
    }
}
