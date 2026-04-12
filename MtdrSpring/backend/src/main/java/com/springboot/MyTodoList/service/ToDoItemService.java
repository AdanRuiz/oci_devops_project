package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.ChangeSource;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.ToDoItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ToDoItemService {

    private static final Logger logger = LoggerFactory.getLogger(ToDoItemService.class);

    @Autowired
    private ToDoItemRepository toDoItemRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Task> findAll() {
        return toDoItemRepository.findAll();
    }

    public List<Task> findByProjectId(UUID projectId) {
        return toDoItemRepository.findByProject_Id(projectId);
    }

    public List<Task> findBySprintId(UUID sprintId) {
        return toDoItemRepository.findBySprint_Id(sprintId);
    }

    public List<Task> findByAssigneeId(UUID assigneeId) {
        return toDoItemRepository.findByAssignee_Id(assigneeId);
    }

    public ResponseEntity<Task> getItemById(UUID id) {
        Optional<Task> task = toDoItemRepository.findById(id);
        if (task.isPresent()) {
            return new ResponseEntity<>(task.get(), HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    public Task getToDoItemById(UUID id) {
        return toDoItemRepository.findById(id).orElse(null);
    }

    public Task addToDoItem(Task task) {
        return toDoItemRepository.save(task);
    }

    public boolean deleteToDoItem(UUID id) {
        try {
            toDoItemRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            logger.error("Failed to delete task {}", id, e);
            return false;
        }
    }

    /**
     * Updates a task. When changedBy is provided, sets the session-level app_ctx
     * so that trg_task_au can record the correct actor in task_state_histories.
     *
     * The DB triggers own:
     *   - temporal columns (entered_in_progress_at, blocked_at, completed_at,
     *                        assigned_at, sprint_added_at)
     *   - rework_count increment
     *   - task_state_histories insertion
     *   - task_assignment_histories rotation
     *   - sprints.planned_task_count maintenance
     */
    public Task updateToDoItem(UUID id, Task updates, User changedBy, ChangeSource source) {
        Optional<Task> existing = toDoItemRepository.findById(id);
        if (!existing.isPresent()) return null;

        Task task = existing.get();

        // Set session context so trg_task_au knows who made this change.
        // Must be called before the JPA save (which issues the UPDATE).
        // If status is changing and changedBy is null, the trigger will raise ORA-20001.
        if (changedBy != null) {
            String hexId = changedBy.getId().toString().replace("-", "");
            String src = (source != null ? source : ChangeSource.WEB).name();
            jdbcTemplate.update("BEGIN app_ctx.set_actor(HEXTORAW(?), ?); END;", hexId, src);
        }

        // Update only the fields the application layer owns.
        // All timestamp columns and history tables are managed by DB triggers.
        task.setTitle(updates.getTitle());
        task.setDescription(updates.getDescription());
        task.setStatus(updates.getStatus());
        task.setPriority(updates.getPriority());
        task.setSprint(updates.getSprint());
        task.setAssignee(updates.getAssignee());

        return toDoItemRepository.save(task);
    }

    // Convenience overload used by the bot (no user context — status changes will
    // fail at the DB level with ORA-20001 unless the session actor was already set).
    public Task updateToDoItem(UUID id, Task updates) {
        return updateToDoItem(id, updates, null, null);
    }
}
