package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.*;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/tasks")
public class ToDoItemController {

    @Autowired
    private ToDoItemService toDoItemService;

    @Autowired
    private UserService userService;

    @GetMapping
    public List<Task> getAllTasks() {
        return toDoItemService.findAll();
    }

    @GetMapping("/project/{projectId}")
    public List<Task> getTasksByProject(@PathVariable UUID projectId) {
        return toDoItemService.findByProjectId(projectId);
    }

    @GetMapping("/assignee/{assigneeId}")
    public List<Task> getTasksByAssignee(@PathVariable UUID assigneeId) {
        return toDoItemService.findByAssigneeId(assigneeId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable UUID id) {
        return toDoItemService.getItemById(id);
    }

    @PostMapping
    public ResponseEntity<Task> addTask(@RequestBody Task task) {
        Task saved = toDoItemService.addToDoItem(task);
        HttpHeaders headers = new HttpHeaders();
        headers.set("location", saved.getId().toString());
        headers.set("Access-Control-Expose-Headers", "location");
        return ResponseEntity.ok().headers(headers).build();
    }

    /**
     * changedBy is required whenever status changes — it is passed to app_ctx.set_actor
     * so trg_task_au can record the transition in task_state_histories.
     * Omitting it when status changes will cause ORA-20001 from the trigger.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@RequestBody Task task,
                                           @PathVariable UUID id,
                                           @RequestParam(required = false) UUID changedBy) {
        try {
            User actor = null;
            if (changedBy != null) {
                ResponseEntity<User> userResponse = userService.getUserById(changedBy);
                if (userResponse.getStatusCode().is2xxSuccessful()) {
                    actor = userResponse.getBody();
                }
            }
            Task updated = toDoItemService.updateToDoItem(id, task, actor, ChangeSource.WEB);
            if (updated == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** Updates only the status of a task. Actor is resolved from the JWT. */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Task> patchStatus(@PathVariable UUID id,
                                             @RequestBody Map<String, String> body,
                                             @AuthenticationPrincipal Jwt jwt) {
        String ociIamId = jwt.getSubject();
        String email    = jwt.getClaimAsString("email");
        if (email == null) email = ociIamId.contains("@") ? ociIamId : ociIamId + "@unknown";
        User actor = userService.findOrProvision(ociIamId, email);

        Task updated = toDoItemService.patchStatus(id, TaskStatus.valueOf(body.get("status")), actor);
        if (updated == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteTask(@PathVariable UUID id) {
        boolean flag = toDoItemService.deleteToDoItem(id);
        return new ResponseEntity<>(flag, flag ? HttpStatus.OK : HttpStatus.NOT_FOUND);
    }
}
