package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.ProjectMember;
import com.springboot.MyTodoList.service.ProjectMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/projects/{projectId}/members")
public class ProjectMemberController {

    @Autowired
    private ProjectMemberService projectMemberService;

    @GetMapping
    public List<ProjectMember> getMembersByProject(@PathVariable UUID projectId) {
        return projectMemberService.findByProjectId(projectId);
    }

    @PostMapping
    public ResponseEntity<ProjectMember> addMember(@PathVariable UUID projectId,
                                                    @RequestBody ProjectMember member) {
        ProjectMember saved = projectMemberService.save(member);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ProjectMember> updateMemberRole(@PathVariable UUID projectId,
                                                           @PathVariable UUID userId,
                                                           @RequestBody ProjectMember member) {
        ProjectMember updated = projectMemberService.updateRole(projectId, userId, member);
        if (updated == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Boolean> removeMember(@PathVariable UUID projectId,
                                                 @PathVariable UUID userId) {
        boolean removed = projectMemberService.removeFromProject(projectId, userId);
        return new ResponseEntity<>(removed, removed ? HttpStatus.OK : HttpStatus.NOT_FOUND);
    }
}
