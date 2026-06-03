package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.enums.TaskStatus;
import com.springboot.MyTodoList.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    public List<Task> findAll() {
        return taskRepository.findAll();
    }

    public ResponseEntity<Task> getById(Long id) {
        Optional<Task> task = taskRepository.findById(id);
        return task.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    public Task add(Task task) {
        return taskRepository.save(task);
    }

    public Task update(Long id, Task updated) {
        Optional<Task> task = taskRepository.findById(id);
        if (task.isPresent()) {
            Task current = task.get();
            TaskStatus previousStatus = current.getStatus();
            current.setTitle(updated.getTitle());
            current.setDescription(updated.getDescription());
            current.setStatus(updated.getStatus());
            current.setPriority(updated.getPriority());
            current.setAssignedTo(updated.getAssignedTo());
            current.setCreatedBy(updated.getCreatedBy());
            current.setHoursDone(updated.getHoursDone());
            current.setExpectedHours(updated.getExpectedHours());
            current.setIsBug(updated.getIsBug());
            if (updated.getCreatedAt() != null) {
                current.setCreatedAt(updated.getCreatedAt());
            }
            if (TaskStatus.DONE.equals(updated.getStatus())) {
                if (current.getCompletedDate() == null || !TaskStatus.DONE.equals(previousStatus)) {
                    current.setCompletedDate(LocalDateTime.now());
                }
            } else {
                current.setCompletedDate(null);
            }
            current.setUpdatedAt(LocalDateTime.now());
            current.setInsight(updated.getInsight());
            return taskRepository.save(current);
        }
        return null;
    }

    public boolean delete(Long id) {
        try {
            taskRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}