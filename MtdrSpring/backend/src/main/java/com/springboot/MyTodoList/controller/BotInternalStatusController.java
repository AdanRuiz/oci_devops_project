package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Project;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.TaskStatus;
import com.springboot.MyTodoList.repository.ProjectRepository;
import com.springboot.MyTodoList.repository.SprintRepository;
import com.springboot.MyTodoList.service.ToDoItemService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/internal/bot-status")
public class BotInternalStatusController {

    private final ToDoItemService toDoItemService;
    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;

    @Value("${bot.internal.api.key:}")
    private String internalApiKey;

    public BotInternalStatusController(ToDoItemService toDoItemService, SprintRepository sprintRepository, ProjectRepository projectRepository) {
        this.toDoItemService = toDoItemService;
        this.sprintRepository = sprintRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<Map<String, String>> getStatus(
        @PathVariable UUID projectId,
        @RequestParam(required = false) String query,
        @RequestHeader(value = "X-Bot-Api-Key", required = false) String providedApiKey
    ) {
        if (internalApiKey != null && !internalApiKey.isBlank() && !internalApiKey.equals(providedApiKey)) {
            return new ResponseEntity<>(Map.of("message", "Unauthorized internal bot API key."), HttpStatus.UNAUTHORIZED);
        }

        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            return new ResponseEntity<>(Map.of("message", "Project not found."), HttpStatus.NOT_FOUND);
        }

        String arg = query == null ? "" : query.trim();
        if (arg.isEmpty()) {
            List<Task> tasks = toDoItemService.findByProjectId(projectId);
            String message = buildSummary("Project", project.getName(), tasks);
            return ResponseEntity.ok(Map.of("message", message));
        }

        List<Sprint> sprints = sprintRepository.findByProject_Id(projectId);
        Sprint sprintMatch = sprints.stream()
            .filter(s -> s.getName().equalsIgnoreCase(arg))
            .findFirst()
            .orElse(null);

        if (sprintMatch != null) {
            List<Task> sprintTasks = toDoItemService.findBySprintId(sprintMatch.getId());
            String message = buildSummary("Sprint", sprintMatch.getName(), sprintTasks);
            return ResponseEntity.ok(Map.of("message", message));
        }

        List<Task> exactTaskMatches = toDoItemService.findByProjectId(projectId).stream()
            .filter(t -> t.getTitle().equalsIgnoreCase(arg))
            .collect(Collectors.toList());

        if (exactTaskMatches.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No sprint or task found with that name/title. Use /status for project summary."));
        }

        if (exactTaskMatches.size() > 1) {
            return ResponseEntity.ok(Map.of("message", "Multiple tasks found with that title. Please use a unique task title."));
        }

        Task task = exactTaskMatches.get(0);
        String message = String.format(
            "Task Status\nTitle: %s\nStatus: %s\nPriority: %s",
            task.getTitle(),
            task.getStatus(),
            task.getPriority()
        );
        return ResponseEntity.ok(Map.of("message", message));
    }

    private String buildSummary(String scope, String name, List<Task> tasks) {
        long todo = tasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
        long inProgress = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long blocked = tasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count();
        long done = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();

        return String.format(
            "Status for %s: %s\nTODO: %d\nIN_PROGRESS: %d\nBLOCKED: %d\nDONE: %d",
            scope,
            name,
            todo,
            inProgress,
            blocked,
            done
        );
    }
}
