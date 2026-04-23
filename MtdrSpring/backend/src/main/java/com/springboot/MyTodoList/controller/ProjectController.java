package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Project;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.ProjectService;
import com.springboot.MyTodoList.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserService userService;

    /** Returns only projects where the caller is a member. */
    @GetMapping("/mine")
    public List<Project> getMyProjects(@AuthenticationPrincipal Jwt jwt) {
        String ociIamId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        if (email == null) email = ociIamId.contains("@") ? ociIamId : ociIamId + "@unknown";
        User caller = userService.findOrProvision(ociIamId, email);
        return projectService.findByMemberId(caller.getId());
    }

    @GetMapping
    public List<Project> getAllProjects() {
        return projectService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable UUID id) {
        return projectService.findById(id)
            .map(p -> new ResponseEntity<>(p, HttpStatus.OK))
            .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /** Creates a project and auto-adds the caller as PROJECT_MANAGER member. */
    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project project,
                                                  @AuthenticationPrincipal Jwt jwt) {
        String ociIamId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        if (email == null) email = ociIamId.contains("@") ? ociIamId : ociIamId + "@unknown";
        User caller = userService.findOrProvision(ociIamId, email);
        Project saved = projectService.createWithOwner(project, caller);
        HttpHeaders headers = new HttpHeaders();
        headers.set("location", saved.getId().toString());
        headers.set("Access-Control-Expose-Headers", "location");
        return ResponseEntity.ok().headers(headers).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable UUID id, @RequestBody Project project) {
        Project updated = projectService.update(id, project);
        if (updated == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteProject(@PathVariable UUID id) {
        boolean deleted = projectService.delete(id);
        return new ResponseEntity<>(deleted, deleted ? HttpStatus.OK : HttpStatus.NOT_FOUND);
    }
}
