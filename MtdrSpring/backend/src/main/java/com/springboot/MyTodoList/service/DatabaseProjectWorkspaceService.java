package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.agent.ProjectWorkspaceService;
import com.springboot.MyTodoList.agent.SprintInfo;
import com.springboot.MyTodoList.agent.TaskItem;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintTask;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.enums.TaskPriority;
import com.springboot.MyTodoList.model.enums.TaskStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class DatabaseProjectWorkspaceService implements ProjectWorkspaceService {

    private final TaskService taskService;
    private final SprintService sprintService;
    private final SprintTaskService sprintTaskService;
    private final UserService userService;

    public DatabaseProjectWorkspaceService(TaskService taskService,
                                           SprintService sprintService,
                                           SprintTaskService sprintTaskService,
                                           UserService userService) {
        this.taskService = taskService;
        this.sprintService = sprintService;
        this.sprintTaskService = sprintTaskService;
        this.userService = userService;
    }

    @Override
    public List<TaskItem> findAllTasks() {
        syncCarryOverLinks();
        return buildTaskItems(taskService.findAll());
    }

    @Override
    public List<TaskItem> findTasksByAssignee(String assignee) {
        if (assignee == null || assignee.isBlank()) {
            return findAllTasks();
        }
        syncCarryOverLinks();
        String normalized = assignee.trim().toLowerCase(Locale.ROOT);
        List<Task> all = taskService.findAll();
        List<User> users = userService.findAll();

        Map<Long, String> userNameById = users.stream()
            .collect(Collectors.toMap(User::getId, u -> u.getName() != null ? u.getName() : ""));

        List<Task> filtered = all.stream()
            .filter(task -> {
                String name = userNameById.getOrDefault(task.getAssignedTo(), "").toLowerCase(Locale.ROOT);
                return name.contains(normalized);
            })
            .collect(Collectors.toList());

        return buildTaskItems(filtered);
    }

    @Override
    public List<TaskItem> findTasksByStatus(String status) {
        syncCarryOverLinks();
        String normalized = normalizeStatus(status);
        List<Task> all = taskService.findAll();
        List<Task> filtered = all.stream()
            .filter(task -> task.getStatus() != null && task.getStatus().name().equalsIgnoreCase(normalized))
            .collect(Collectors.toList());
        return buildTaskItems(filtered);
    }

    @Override
    public TaskItem createTask(String title, String assignee, int expectedHours, String sprintName, boolean bug) {
        List<User> users = userService.findAll();

        User assignedUser = null;
        if (assignee != null && !assignee.isBlank()) {
            String normalizedAssignee = assignee.trim().toLowerCase(Locale.ROOT);
            assignedUser = users.stream()
                .filter(u -> u.getName() != null && u.getName().toLowerCase(Locale.ROOT).contains(normalizedAssignee))
                .findFirst()
                .orElse(null);
        }
        if (assignedUser == null && !users.isEmpty()) {
            assignedUser = users.get(0);
        }

        Long assignedToId = assignedUser != null && assignedUser.getId() != null ? assignedUser.getId().longValue() : 1L;

        Task task = new Task();
        task.setTitle(title);
        task.setDescription("");
        task.setStatus(TaskStatus.PENDING);
        task.setPriority(hoursToPriority(expectedHours));
        task.setAssignedTo(assignedToId);
        task.setCreatedBy(assignedToId);
        task.setExpectedHours(expectedHours);
        task.setHoursDone(0);
        task.setIsBug(bug);

        Task saved = taskService.add(task);

        // Link to sprint if provided or default to current sprint
        Sprint sprint = resolveSprint(sprintName);
        if (sprint != null) {
            SprintTask sprintTask = new SprintTask();
            sprintTask.setTaskId(saved.getId());
            sprintTask.setSprintId(sprint.getId());
            sprintTask.setAddedAt(LocalDateTime.now());
            sprintTaskService.add(sprintTask);
        }

        String resolvedSprintName = sprint != null ? sprint.getName() : "Sin sprint";
        String assigneeName = assignedUser != null && assignedUser.getName() != null
            ? assignedUser.getName()
            : "Sin asignar";

        Integer savedExpectedHours = saved.getExpectedHours();
        Integer savedHoursDone = saved.getHoursDone();

        return new TaskItem(
            saved.getId(),
            saved.getTitle(),
            assigneeName,
            saved.getStatus().name(),
            savedExpectedHours == null ? Math.max(expectedHours, 0) : savedExpectedHours.intValue(),
            savedHoursDone == null ? 0 : savedHoursDone.intValue(),
            Boolean.TRUE.equals(saved.getIsBug()),
            resolvedSprintName
        );
    }

    @Override
    public SprintInfo getCurrentSprint() {
        List<Sprint> sprints = sprintService.findAll();
        if (sprints.isEmpty()) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();
        // Prefer a sprint currently active (start <= now <= end)
        return sprints.stream()
            .filter(s -> s.getStartDate() != null && s.getEndDate() != null
                && !s.getStartDate().isAfter(now) && !s.getEndDate().isBefore(now))
            .max(Comparator.comparing(Sprint::getStartDate))
            .map(s -> new SprintInfo(s.getName(),
                s.getStartDate().toLocalDate(),
                s.getEndDate().toLocalDate()))
            .orElseGet(() -> {
                // Fall back to most recently created sprint
                Sprint latest = sprints.stream()
                    .max(Comparator.comparing(s -> s.getCreatedAt() != null ? s.getCreatedAt() : LocalDateTime.MIN))
                    .orElse(sprints.get(sprints.size() - 1));
                LocalDate start = latest.getStartDate() != null ? latest.getStartDate().toLocalDate() : LocalDate.now();
                LocalDate end = latest.getEndDate() != null ? latest.getEndDate().toLocalDate() : LocalDate.now().plusWeeks(2);
                return new SprintInfo(latest.getName(), start, end);
            });
    }

    @Override
    public Map<String, Integer> storyPointsByAssignee() {
        syncCarryOverLinks();
        List<Task> tasks = taskService.findAll();
        List<User> users = userService.findAll();
        Map<Long, String> userNameById = users.stream()
            .collect(Collectors.toMap(User::getId, u -> u.getName() != null ? u.getName() : "Usuario " + u.getId()));

        Map<String, Integer> totals = new LinkedHashMap<>();
        for (Task task : tasks) {
            String name = userNameById.getOrDefault(task.getAssignedTo(), "Sin asignar");
            Integer taskHoursDone = task.getHoursDone();
            Integer taskExpectedHours = task.getExpectedHours();
            int pts = task.getStatus() == TaskStatus.DONE
                ? (taskHoursDone == null ? 0 : taskHoursDone.intValue())
                : (taskExpectedHours == null ? 0 : taskExpectedHours.intValue());
            totals.merge(name, pts, Integer::sum);
        }
        return totals;
    }

    private List<TaskItem> buildTaskItems(List<Task> tasks) {
        List<User> users = userService.findAll();
        List<SprintTask> sprintTasks = sprintTaskService.findAll();
        List<Sprint> sprints = sprintService.findAll();

        Map<Long, String> userNameById = users.stream()
            .collect(Collectors.toMap(User::getId, u -> u.getName() != null ? u.getName() : "Usuario " + u.getId()));

        Map<Long, String> sprintNameById = sprints.stream()
            .collect(Collectors.toMap(Sprint::getId, Sprint::getName));

        // For each task, find its latest active sprint assignment
        Map<Long, String> sprintNameByTaskId = new HashMap<>();
        sprintTasks.stream()
            .filter(st -> st.getRemovedAt() == null)
            .sorted(Comparator.comparing(SprintTask::getAddedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
            .forEach(st -> {
                String sprintName = sprintNameById.get(st.getSprintId());
                if (sprintName != null && st.getTaskId() != null) {
                    sprintNameByTaskId.put(st.getTaskId(), sprintName);
                }
            });

        return tasks.stream()
            .sorted(Comparator.comparing(Task::getId))
            .map(task -> new TaskItem(
                task.getId(),
                task.getTitle(),
                userNameById.getOrDefault(task.getAssignedTo(), "Sin asignar"),
                task.getStatus() != null ? task.getStatus().name() : "PENDING",
                task.getExpectedHours() == null ? 0 : task.getExpectedHours().intValue(),
                task.getHoursDone() == null ? 0 : task.getHoursDone().intValue(),
                Boolean.TRUE.equals(task.getIsBug()),
                sprintNameByTaskId.getOrDefault(task.getId(), "Sin sprint")
            ))
            .collect(Collectors.toList());
    }

    private Sprint resolveSprint(String sprintName) {
        List<Sprint> sprints = sprintService.findAll();
        if (sprints.isEmpty()) {
            return null;
        }
        if (sprintName != null && !sprintName.isBlank()) {
            String normalized = sprintName.trim().toLowerCase(Locale.ROOT);
            Sprint found = sprints.stream()
                .filter(s -> s.getName() != null && s.getName().toLowerCase(Locale.ROOT).contains(normalized))
                .findFirst()
                .orElse(null);
            if (found != null) {
                return found;
            }
        }
        // Fall back to current sprint
        LocalDateTime now = LocalDateTime.now();
        return sprints.stream()
            .filter(s -> s.getStartDate() != null && s.getEndDate() != null
                && !s.getStartDate().isAfter(now) && !s.getEndDate().isBefore(now))
            .max(Comparator.comparing(Sprint::getStartDate))
            .orElseGet(() -> sprints.stream()
                .max(Comparator.comparing(s -> s.getCreatedAt() != null ? s.getCreatedAt() : LocalDateTime.MIN))
                .orElse(null));
    }

    private String normalizeStatus(String value) {
        if (value == null) {
            return "PENDING";
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "pendiente", "pending" -> "PENDING";
            case "en progreso", "in progress", "in_progress" -> "IN_PROGRESS";
            case "done", "hecha", "terminada" -> "DONE";
            default -> normalized.toUpperCase(Locale.ROOT);
        };
    }

    private TaskPriority hoursToPriority(int hours) {
        if (hours <= 1) {
            return TaskPriority.LOW;
        } else if (hours >= 5) {
            return TaskPriority.HIGH;
        } else {
            return TaskPriority.MEDIUM;
        }
    }

    private void syncCarryOverLinks() {
        List<Sprint> sprints = sprintService.findAll();
        if (sprints.size() < 2) {
            return;
        }

        List<SprintTask> sprintTasks = sprintTaskService.findAll();
        LocalDateTime now = LocalDateTime.now();

        List<Sprint> endedSprints = sprints.stream()
            .filter(sprint -> sprint.getEndDate() != null && sprint.getEndDate().isBefore(now))
            .sorted(Comparator.comparing(Sprint::getEndDate))
            .collect(Collectors.toList());

        for (Sprint endedSprint : endedSprints) {
            Sprint nextSprint = sprints.stream()
                .filter(candidate -> candidate.getStartDate() != null && endedSprint.getEndDate() != null
                    && candidate.getStartDate().isAfter(endedSprint.getEndDate()))
                .sorted(Comparator.comparing(Sprint::getStartDate))
                .findFirst()
                .orElse(null);

            if (nextSprint == null) {
                continue;
            }

            List<SprintTask> endedSprintTasks = sprintTasks.stream()
                .filter(link -> endedSprint.getId().equals(link.getSprintId()) && link.getRemovedAt() == null)
                .collect(Collectors.toList());

            for (SprintTask link : endedSprintTasks) {
                if (link.getTaskId() == null) {
                    continue;
                }

                Task task = taskService.getById(link.getTaskId()).getBody();
                if (task == null || task.getStatus() == TaskStatus.DONE) {
                    continue;
                }

                boolean alreadyCarried = sprintTasks.stream().anyMatch(existing ->
                    nextSprint.getId().equals(existing.getSprintId())
                        && link.getTaskId().equals(existing.getTaskId())
                        && existing.getRemovedAt() == null);
                if (alreadyCarried) {
                    continue;
                }

                SprintTask carried = new SprintTask();
                carried.setSprintId(nextSprint.getId());
                carried.setTaskId(link.getTaskId());
                carried.setAddedAt(now);
                sprintTaskService.add(carried);
            }
        }
    }
}
