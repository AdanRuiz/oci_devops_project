package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.TaskStateHistory;
import com.springboot.MyTodoList.service.TaskStateHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tasks/{taskId}/history")
public class TaskStateHistoryController {

    @Autowired
    private TaskStateHistoryService taskStateHistoryService;

    @GetMapping
    public List<TaskStateHistory> getHistory(@PathVariable UUID taskId) {
        return taskStateHistoryService.findByTaskId(taskId);
    }
}
