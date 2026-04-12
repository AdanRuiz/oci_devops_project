package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Project;
import com.springboot.MyTodoList.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    public List<Project> findAll() {
        return projectRepository.findAll();
    }

    public List<Project> findByOwnerId(UUID ownerId) {
        return projectRepository.findByOwner_Id(ownerId);
    }

    public Optional<Project> findById(UUID id) {
        return projectRepository.findById(id);
    }

    public Project save(Project project) {
        return projectRepository.save(project);
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
            return false;
        }
    }
}
