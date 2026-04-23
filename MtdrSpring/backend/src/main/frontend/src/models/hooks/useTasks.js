import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, fetchTask, fetchTaskHistory, fetchTaskWorkLogs, createTask, patchTaskStatus, addWorkLog } from '../api/tasksApi';

export const useSprintTasks = (sprintId) => useQuery({
    queryKey: ['tasks', 'sprint', sprintId],
    queryFn: () => fetchTasks(sprintId),
    enabled: !!sprintId,
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

export const useAddWorkLog = (taskId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => addWorkLog(taskId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId, 'logs'] });
        },
    });
};

export const useCreateTask = (sprintId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => createTask(sprintId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', 'sprint', sprintId] });
        },
    });
};

export const useUpdateTaskStatus = (sprintId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, status }) => patchTaskStatus(taskId, status),
        onMutate: async ({ taskId, status }) => {
            await queryClient.cancelQueries({ queryKey: ['tasks', 'sprint', sprintId] });
            const previous = queryClient.getQueryData(['tasks', 'sprint', sprintId]);
            queryClient.setQueryData(['tasks', 'sprint', sprintId], (old = []) =>
                old.map(t => t.id === taskId ? { ...t, status } : t)
            );
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) queryClient.setQueryData(['tasks', 'sprint', sprintId], ctx.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', 'sprint', sprintId] });
        },
    });
};
