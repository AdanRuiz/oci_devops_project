import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSprints, fetchSprint, createSprint, deleteSprint } from '../api/sprintsApi';

export const useSprints = (projectId) => useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => fetchSprints(projectId),
    enabled: !!projectId,
});

export const useSprint = (sprintId) => useQuery({
    queryKey: ['sprint', sprintId],
    queryFn: () => fetchSprint(sprintId),
});

export const useCreateSprint = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => createSprint(projectId, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sprints', projectId] }),
    });
};

export const useDeleteSprint = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (sprintId) => deleteSprint(sprintId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sprints', projectId] }),
    });
};
