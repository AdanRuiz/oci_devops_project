package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintStatus;
import com.springboot.MyTodoList.repository.SprintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SprintService {

    private static final Logger logger = LoggerFactory.getLogger(SprintService.class);

    @Autowired
    private SprintRepository sprintRepository;

    public List<Sprint> findByProjectId(UUID projectId) {
        return sprintRepository.findByProject_Id(projectId);
    }

    public List<Sprint> findByProjectIdAndStatus(UUID projectId, SprintStatus status) {
        return sprintRepository.findByProject_IdAndStatus(projectId, status);
    }

    public Optional<Sprint> findById(UUID id) {
        return sprintRepository.findById(id);
    }

    public Sprint save(Sprint sprint) {
        return sprintRepository.save(sprint);
    }

    public Sprint update(UUID id, Sprint updates) {
        return sprintRepository.findById(id).map(sprint -> {
            sprint.setName(updates.getName());
            sprint.setStatus(updates.getStatus());
            sprint.setStartDate(updates.getStartDate());
            sprint.setEndDate(updates.getEndDate());
            // plannedTaskCount is maintained by trg_task_sprint_count — do not set here.
            return sprintRepository.save(sprint);
        }).orElse(null);
    }

    public boolean delete(UUID id) {
        try {
            sprintRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            logger.error("Failed to delete sprint {}", id, e);
            return false;
        }
    }
}
