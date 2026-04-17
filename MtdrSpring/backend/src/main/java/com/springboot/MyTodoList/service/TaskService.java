package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {
    private final TaskRepository taskRepository;

    @Value("${bot.task.defaultProjectId:-1}")
    private int defaultProjectId;

    @Value("${bot.task.defaultDeveloperId:-1}")
    private int defaultDeveloperId;

    @Value("${bot.task.defaultTaskType:new-feature}")
    private String defaultTaskType;

    @Value("${bot.task.defaultPriority:MEDIUM}")
    private String defaultPriority;

    @Value("${bot.task.defaultEstimatedTime:1}")
    private int defaultEstimatedTime;

    @Value("${bot.task.defaultDeadlineDays:7}")
    private int defaultDeadlineDays;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public Task addTaskFromBot(String taskName) {
        if (defaultProjectId <= 0 || defaultDeveloperId <= 0) {
            throw new IllegalStateException("Missing bot.task.defaultProjectId or bot.task.defaultDeveloperId");
        }

        LocalDateTime now = LocalDateTime.now();
        Task task = new Task();
        task.setName(taskName);
        task.setDescription(taskName);
        task.setStatus("open");
        task.setTaskType(defaultTaskType);
        task.setStartDate(now);
        task.setDeadline(now.plusDays(defaultDeadlineDays));
        task.setDeveloperID(defaultDeveloperId);
        task.setEstimatedTime(defaultEstimatedTime);
        task.setPriority(defaultPriority);
        task.setProjectID(defaultProjectId);
        task.setCreatedAt(now);
        task.setUpdatedAt(now);
        return taskRepository.save(task);
    }

    public List<Task> findAllTasks() {
        return taskRepository.findAll();
    }

    public Optional<Task> findTaskById(int id) {
        return taskRepository.findById(id);
    }

    public Optional<Task> updateTaskStatus(int id, String status) {
        if (!"open".equals(status) && !"in_progress".equals(status) && !"closed".equals(status)) {
            throw new IllegalArgumentException("Invalid task status: " + status);
        }
        Optional<Task> taskOpt = taskRepository.findById(id);
        if (taskOpt.isEmpty()) {
            return Optional.empty();
        }
        Task task = taskOpt.get();
        task.setStatus(status);
        task.setUpdatedAt(LocalDateTime.now());
        return Optional.of(taskRepository.save(task));
    }
}
