package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.TaskWorkLog;
import com.springboot.MyTodoList.service.TaskWorkLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tasks/{taskId}/work-logs")
public class TaskWorkLogController {

    @Autowired
    private TaskWorkLogService taskWorkLogService;

    @GetMapping
    public List<TaskWorkLog> getWorkLogs(@PathVariable UUID taskId) {
        return taskWorkLogService.findByTaskId(taskId);
    }

    @PostMapping
    public ResponseEntity<TaskWorkLog> addWorkLog(@PathVariable UUID taskId,
                                                   @RequestBody TaskWorkLog workLog) {
        TaskWorkLog saved = taskWorkLogService.save(workLog);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteWorkLog(@PathVariable UUID taskId,
                                                  @PathVariable UUID id) {
        boolean deleted = taskWorkLogService.delete(id);
        return new ResponseEntity<>(deleted, deleted ? HttpStatus.OK : HttpStatus.NOT_FOUND);
    }
}
