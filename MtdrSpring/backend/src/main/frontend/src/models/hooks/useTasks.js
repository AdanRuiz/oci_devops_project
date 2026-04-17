import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, fetchTask, fetchTaskHistory, fetchTaskWorkLogs } from '../api/tasksApi';

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

// Status changes, task creation, and work logs are local-only until auth is implemented.

export const useAddWorkLog = (taskId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => Promise.resolve({
            id: crypto.randomUUID(),
            workDate: payload.workDate,
            daysWorked: payload.daysWorked,
            note: payload.note ?? '',
        }),
        onSuccess: (fakeLog) => {
            queryClient.setQueryData(['task', taskId, 'logs'], (old = []) => [...old, fakeLog]);
        },
    });
};

export const useCreateTask = (sprintId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => Promise.resolve({
            id: crypto.randomUUID(),
            title: payload.title,
            description: payload.description ?? null,
            priority: payload.priority ?? 'MEDIUM',
            status: 'TODO',
        }),
        onSuccess: (fakeTask) => {
            queryClient.setQueryData(['tasks', 'sprint', sprintId], (old = []) => [...old, fakeTask]);
        },
    });
};

export const useUpdateTaskStatus = (sprintId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => Promise.resolve(),
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
    });
};
