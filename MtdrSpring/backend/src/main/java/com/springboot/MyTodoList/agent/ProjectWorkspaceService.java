package com.springboot.MyTodoList.agent;

import java.util.List;
import java.util.Map;

public interface ProjectWorkspaceService {

    List<TaskItem> findAllTasks();

    List<TaskItem> findTasksByAssignee(String assignee);

    List<TaskItem> findTasksByStatus(String status);

    TaskItem createTask(String title, String assignee, int expectedHours, String sprintName, boolean bug);

    SprintInfo getCurrentSprint();

    Map<String, Integer> storyPointsByAssignee();
}
