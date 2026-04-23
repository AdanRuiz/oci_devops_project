package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.*;
import com.springboot.MyTodoList.service.ProjectService;
import com.springboot.MyTodoList.service.SprintService;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class SprintController {

    @Autowired
    private SprintService sprintService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ToDoItemService toDoItemService;

    @Autowired
    private UserService userService;

    @GetMapping("/projects/{projectId}/sprints")
    public List<Sprint> getSprintsByProject(@PathVariable UUID projectId) {
        return sprintService.findByProjectId(projectId);
    }

    @PostMapping("/projects/{projectId}/sprints")
    public ResponseEntity<Sprint> createSprint(@PathVariable UUID projectId,
                                                @RequestBody Sprint sprint) {
        Project project = projectService.findById(projectId).orElse(null);
        if (project == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        sprint.setProject(project);
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

    /** Creates a task inside a sprint. Creator is resolved from the JWT. */
    @PostMapping("/sprints/{sprintId}/tasks")
    public ResponseEntity<Task> createTask(@PathVariable UUID sprintId,
                                            @RequestBody Map<String, Object> body,
                                            @AuthenticationPrincipal Jwt jwt) {
        Sprint sprint = sprintService.findById(sprintId).orElse(null);
        if (sprint == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

        // Use projectId from request body to avoid lazy-loading sprint.project
        String projectIdStr = (String) body.getOrDefault("projectId", null);
        if (projectIdStr == null) return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        Project project = projectService.findById(UUID.fromString(projectIdStr)).orElse(null);
        if (project == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

        String ociIamId = jwt.getSubject();
        String email    = jwt.getClaimAsString("email");
        if (email == null) email = ociIamId.contains("@") ? ociIamId : ociIamId + "@unknown";
        User creator = userService.findOrProvision(ociIamId, email);

        Task task = new Task();
        task.setTitle((String) body.get("title"));
        task.setDescription((String) body.getOrDefault("description", null));
        task.setPriority(TaskPriority.valueOf((String) body.getOrDefault("priority", "MEDIUM")));
        task.setStatus(TaskStatus.TODO);
        task.setProject(project);
        task.setSprint(sprint);
        task.setCreatedBy(creator);

        String assigneeIdStr = (String) body.getOrDefault("assigneeId", null);
        if (assigneeIdStr != null) {
            ResponseEntity<User> resp = userService.getUserById(UUID.fromString(assigneeIdStr));
            if (resp.getStatusCode().is2xxSuccessful()) task.setAssignee(resp.getBody());
        }

        Task saved = toDoItemService.addToDoItem(task);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }
}
