package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.controller.dto.SprintSummaryResponse;
import com.springboot.MyTodoList.controller.dto.TaskWithSprintResponse;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintTask;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.repository.SprintRepository;
import com.springboot.MyTodoList.repository.SprintTaskRepository;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
public class TaskController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private SprintTaskRepository sprintTaskRepository;

    @Autowired
    private SprintRepository sprintRepository;

    @GetMapping(value = "/tasks")
    public List<TaskWithSprintResponse> getAllTasks() {
        List<Task> tasks = taskService.findAll();
        List<TaskWithSprintResponse> response = new ArrayList<>();
        for (Task task : tasks) {
            response.add(buildTaskWithSprint(task));
        }
        return response;
    }

    @GetMapping(value = "/tasks/{id}")
    public ResponseEntity<TaskWithSprintResponse> getTaskById(@PathVariable Long id) {
        ResponseEntity<Task> taskResponse = taskService.getById(id);
        if (taskResponse.getStatusCode() != HttpStatus.OK || taskResponse.getBody() == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return new ResponseEntity<>(buildTaskWithSprint(taskResponse.getBody()), HttpStatus.OK);
    }

    @GetMapping(value = "/sprints/{sprintId}/tasks")
    public ResponseEntity<List<TaskWithSprintResponse>> getTasksBySprint(@PathVariable Long sprintId) {
        if (!sprintRepository.existsById(sprintId)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        List<SprintTask> sprintTasks = sprintTaskRepository.findByIdSprintId(sprintId);
        List<TaskWithSprintResponse> response = new ArrayList<>();
        for (SprintTask sprintTask : sprintTasks) {
            if (sprintTask.getTaskId() == null) {
                continue;
            }
            Optional<Task> task = taskRepository.findById(sprintTask.getTaskId());
            if (task.isPresent()) {
                response.add(buildTaskWithSprint(task.get()));
            }
        }

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping(value = "/tasks")
    public ResponseEntity<TaskWithSprintResponse> addTask(@RequestBody Task task) {
        Task dbTask = taskService.add(task);
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("location", "" + dbTask.getId());
        responseHeaders.set("Access-Control-Expose-Headers", "location");

        return ResponseEntity.status(HttpStatus.CREATED)
                .headers(responseHeaders)
                .body(buildTaskWithSprint(dbTask));
    }

    @PutMapping(value = "/tasks/{id}")
    public ResponseEntity<TaskWithSprintResponse> updateTask(@RequestBody Task task, @PathVariable Long id) {
        Task dbTask = taskService.update(id, task);
        if (dbTask == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return new ResponseEntity<>(buildTaskWithSprint(dbTask), HttpStatus.OK);
    }

    @DeleteMapping(value = "/tasks/{id}")
    public ResponseEntity<Boolean> deleteTask(@PathVariable("id") Long id) {
        boolean deleted = taskService.delete(id);
        if (!deleted) {
            return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(true, HttpStatus.OK);
    }

    private TaskWithSprintResponse buildTaskWithSprint(Task task) {
        Optional<SprintTask> sprintTask = sprintTaskRepository.findByIdTaskId(task.getId()).stream()
            .filter(link -> link.getRemovedAt() == null)
            .max((left, right) -> {
                if (left.getAddedAt() == null && right.getAddedAt() == null) {
                    return 0;
                }
                if (left.getAddedAt() == null) {
                    return -1;
                }
                if (right.getAddedAt() == null) {
                    return 1;
                }
                return left.getAddedAt().compareTo(right.getAddedAt());
            });
        SprintSummaryResponse sprintSummary = null;

        if (sprintTask.isPresent() && sprintTask.get().getSprintId() != null) {
            Optional<Sprint> sprint = sprintRepository.findById(sprintTask.get().getSprintId());
            if (sprint.isPresent()) {
                sprintSummary = new SprintSummaryResponse(sprint.get());
            }
        }

        return new TaskWithSprintResponse(task, sprintSummary);
    }
}
