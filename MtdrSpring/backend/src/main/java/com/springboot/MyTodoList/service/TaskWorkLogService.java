package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.TaskWorkLog;
import com.springboot.MyTodoList.repository.TaskWorkLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class TaskWorkLogService {

    @Autowired
    private TaskWorkLogRepository taskWorkLogRepository;

    public List<TaskWorkLog> findByTaskId(UUID taskId) {
        return taskWorkLogRepository.findByTask_Id(taskId);
    }

    public List<TaskWorkLog> findByUserId(UUID userId) {
        return taskWorkLogRepository.findByUser_Id(userId);
    }

    public TaskWorkLog save(TaskWorkLog workLog) {
        return taskWorkLogRepository.save(workLog);
    }

    public boolean delete(UUID id) {
        try {
            taskWorkLogRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
