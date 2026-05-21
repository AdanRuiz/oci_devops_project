package com.springboot.MyTodoList.agent;

import java.util.List;
import java.util.Map;

public interface ProjectWorkspaceService {
    /** Return all tasks in the project workspace. */
    List<TaskItem> findAllTasks();

    /** Return tasks filtered by assignee name. */
    List<TaskItem> findTasksByAssignee(String assignee);

    /** Return tasks filtered by their status. */
    List<TaskItem> findTasksByStatus(String status);

    /** Create a new task and return the created TaskItem. */
    TaskItem createTask(String title, String assignee, int expectedHours, String sprintName, boolean bug);

    /** Return information about the current active sprint, or null if none. */
    SprintInfo getCurrentSprint();

    /** Compute story points totals grouped by assignee. */
    Map<String, Integer> storyPointsByAssignee();
}
