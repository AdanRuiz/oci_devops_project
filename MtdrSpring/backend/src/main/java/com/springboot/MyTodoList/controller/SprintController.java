package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.service.SprintService;
import com.springboot.MyTodoList.service.ToDoItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class SprintController {

    @Autowired
    private SprintService sprintService;

    @Autowired
    private ToDoItemService toDoItemService;

    @GetMapping("/projects/{projectId}/sprints")
    public List<Sprint> getSprintsByProject(@PathVariable UUID projectId) {
        return sprintService.findByProjectId(projectId);
    }

    @PostMapping("/projects/{projectId}/sprints")
    public ResponseEntity<Sprint> createSprint(@PathVariable UUID projectId,
                                                @RequestBody Sprint sprint) {
        Sprint saved = sprintService.save(sprint);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @GetMapping("/sprints/{id}")
    public ResponseEntity<Sprint> getSprintById(@PathVariable UUID id) {
        return sprintService.findById(id)
            .map(s -> new ResponseEntity<>(s, HttpStatus.OK))
            .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PutMapping("/sprints/{id}")
    public ResponseEntity<Sprint> updateSprint(@PathVariable UUID id, @RequestBody Sprint sprint) {
        Sprint updated = sprintService.update(id, sprint);
        if (updated == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/sprints/{id}")
    public ResponseEntity<Boolean> deleteSprint(@PathVariable UUID id) {
        boolean deleted = sprintService.delete(id);
        return new ResponseEntity<>(deleted, deleted ? HttpStatus.OK : HttpStatus.NOT_FOUND);
    }

    @GetMapping("/sprints/{id}/tasks")
    public List<Task> getTasksBySprint(@PathVariable UUID id) {
        return toDoItemService.findBySprintId(id);
    }
}
