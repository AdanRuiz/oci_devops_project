package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.ProjectMember;
import com.springboot.MyTodoList.repository.ProjectMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProjectMemberService {

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    public List<ProjectMember> findByProjectId(UUID projectId) {
        return projectMemberRepository.findByProject_Id(projectId);
    }

    public List<ProjectMember> findByUserId(UUID userId) {
        return projectMemberRepository.findByUser_Id(userId);
    }

    public Optional<ProjectMember> findByProjectAndUser(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProject_IdAndUser_Id(projectId, userId);
    }

    public ProjectMember save(ProjectMember member) {
        return projectMemberRepository.save(member);
    }

    public ProjectMember updateRole(UUID projectId, UUID userId, ProjectMember updates) {
        return projectMemberRepository.findByProject_IdAndUser_Id(projectId, userId)
            .map(member -> {
                member.setRole(updates.getRole());
                return projectMemberRepository.save(member);
            }).orElse(null);
    }

    public boolean removeFromProject(UUID projectId, UUID userId) {
        try {
            projectMemberRepository.deleteByProject_IdAndUser_Id(projectId, userId);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
