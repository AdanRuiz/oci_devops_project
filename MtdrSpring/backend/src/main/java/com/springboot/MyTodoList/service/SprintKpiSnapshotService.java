package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintKpiSnapshot;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.TaskStateHistory;
import com.springboot.MyTodoList.model.TaskStatus;
import com.springboot.MyTodoList.repository.SprintKpiSnapshotRepository;
import com.springboot.MyTodoList.repository.TaskStateHistoryRepository;
import com.springboot.MyTodoList.repository.TaskWorkLogRepository;
import com.springboot.MyTodoList.repository.ToDoItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SprintKpiSnapshotService {

    @Autowired
    private SprintKpiSnapshotRepository snapshotRepository;

    @Autowired
    private ToDoItemRepository taskRepository;

    @Autowired
    private TaskWorkLogRepository workLogRepository;

    @Autowired
    private TaskStateHistoryRepository stateHistoryRepository;

    public Optional<SprintKpiSnapshot> findBySprintId(UUID sprintId) {
        return snapshotRepository.findBySprint_Id(sprintId);
    }

    public SprintKpiSnapshot compute(Sprint sprint) {
        List<Task> tasks = taskRepository.findBySprint_Id(sprint.getId());

        // --- tasks completed ---
        List<Task> completed = tasks.stream()
            .filter(t -> t.getStatus() == TaskStatus.DONE && t.getCompletedAt() != null)
            .collect(Collectors.toList());

        // --- avg cycle time: entered_in_progress_at → completed_at ---
        BigDecimal avgCycleTime = null;
        List<Long> cycleMins = completed.stream()
            .filter(t -> t.getEnteredInProgressAt() != null)
            .map(t -> Duration.between(t.getEnteredInProgressAt(), t.getCompletedAt()).toMinutes())
            .collect(Collectors.toList());
        if (!cycleMins.isEmpty()) {
            double avg = cycleMins.stream().mapToLong(Long::longValue).average().getAsDouble();
            avgCycleTime = BigDecimal.valueOf(avg / 1440.0).setScale(2, RoundingMode.HALF_UP);
        }

        // --- scope creep: tasks added after sprint start / planned_task_count ---
        BigDecimal scopeCreep = null;
        int planned = sprint.getPlannedTaskCount();
        if (planned > 0) {
            long addedLate = tasks.stream()
                .filter(t -> t.getSprintAddedAt() != null
                    && t.getSprintAddedAt().toLocalDate().isAfter(sprint.getStartDate()))
                .count();
            scopeCreep = BigDecimal.valueOf((double) addedLate / planned * 100)
                .setScale(2, RoundingMode.HALF_UP);
        }

        // --- blocker resolution: time from entering BLOCKED to leaving BLOCKED ---
        // Walk each task's state history and pair to_status=BLOCKED entries with
        // the next from_status=BLOCKED entry to get each blocked duration.
        BigDecimal avgBlockerResolution = null;
        List<Long> blockerMins = new ArrayList<>();
        for (Task task : tasks) {
            List<TaskStateHistory> history =
                stateHistoryRepository.findByTask_IdOrderByChangedAtAsc(task.getId());

            TaskStateHistory blockedEntry = null;
            for (TaskStateHistory h : history) {
                if (h.getToStatus() == TaskStatus.BLOCKED) {
                    blockedEntry = h;
                } else if (blockedEntry != null && h.getFromStatus() == TaskStatus.BLOCKED
                        && h.getChangedAt() != null && blockedEntry.getChangedAt() != null) {
                    blockerMins.add(
                        Duration.between(blockedEntry.getChangedAt(), h.getChangedAt()).toMinutes()
                    );
                    blockedEntry = null;
                }
            }
        }
        if (!blockerMins.isEmpty()) {
            double avg = blockerMins.stream().mapToLong(Long::longValue).average().getAsDouble();
            avgBlockerResolution = BigDecimal.valueOf(avg / 1440.0).setScale(2, RoundingMode.HALF_UP);
        }

        // --- tasks reworked: moved backward out of DONE at least once ---
        int reworked = (int) tasks.stream().filter(t -> t.getReworkCount() > 0).count();

        // --- total days worked from work logs ---
        BigDecimal totalDays = tasks.stream()
            .flatMap(t -> workLogRepository.findByTask_Id(t.getId()).stream())
            .map(wl -> wl.getDaysWorked())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        SprintKpiSnapshot snapshot = snapshotRepository.findBySprint_Id(sprint.getId())
            .orElse(new SprintKpiSnapshot());
        snapshot.setSprint(sprint);
        snapshot.setAvgCycleTimeDays(avgCycleTime);
        snapshot.setScopeCreepRatePct(scopeCreep);
        snapshot.setBlockerResolutionDays(avgBlockerResolution);
        snapshot.setTasksReworked(reworked);
        snapshot.setTasksCompleted(completed.size());
        snapshot.setTotalDaysWorked(totalDays.compareTo(BigDecimal.ZERO) == 0 ? null : totalDays);

        return snapshotRepository.save(snapshot);
    }
}
