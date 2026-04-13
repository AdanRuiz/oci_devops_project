import { useQuery } from '@tanstack/react-query';
import { fetchTasks, fetchTask, fetchTaskHistory, fetchTaskWorkLogs } from '../api/tasksApi';

export const useSprintTasks = (sprintId) => useQuery({
    queryKey: ['tasks', 'sprint', sprintId],
    queryFn: () => fetchTasks(sprintId),
});

export const useTask = (taskId) => useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId),
});

export const useTaskHistory = (taskId) => useQuery({
    queryKey: ['task', taskId, 'history'],
    queryFn: () => fetchTaskHistory(taskId),
});

export const useTaskWorkLogs = (taskId) => useQuery({
    queryKey: ['task', taskId, 'logs'],
    queryFn: () => fetchTaskWorkLogs(taskId),
});
