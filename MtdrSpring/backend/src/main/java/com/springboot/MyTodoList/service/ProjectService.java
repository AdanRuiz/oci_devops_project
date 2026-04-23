package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Project;
import com.springboot.MyTodoList.model.ProjectMember;
import com.springboot.MyTodoList.model.ProjectRole;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.ProjectMemberRepository;
import com.springboot.MyTodoList.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProjectService {

    private static final Logger logger = LoggerFactory.getLogger(ProjectService.class);

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    public List<Project> findAll() {
        return projectRepository.findAll();
    }

    public List<Project> findByOwnerId(UUID ownerId) {
        return projectRepository.findByOwner_Id(ownerId);
    }

    public List<Project> findByMemberId(UUID userId) {
        return projectRepository.findByMembers_User_Id(userId);
    }

    public Optional<Project> findById(UUID id) {
        return projectRepository.findById(id);
    }

    public Project save(Project project) {
        return projectRepository.save(project);
    }

    /** Creates a project and auto-adds the creator as PROJECT_MANAGER member. */
    public Project createWithOwner(Project project, User owner) {
        project.setOwner(owner);
        Project saved = projectRepository.save(project);

        ProjectMember membership = new ProjectMember();
        membership.setProject(saved);
        membership.setUser(owner);
        membership.setRole(ProjectRole.PROJECT_MANAGER);
        projectMemberRepository.save(membership);

        return saved;
    }

    public Project update(UUID id, Project updates) {
        return projectRepository.findById(id).map(project -> {
            project.setName(updates.getName());
            project.setDescription(updates.getDescription());
            return projectRepository.save(project);
        }).orElse(null);
    }

    public boolean delete(UUID id) {
        try {
            projectRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            logger.error("Failed to delete project {}", id, e);
            return false;
        }
    }
}
