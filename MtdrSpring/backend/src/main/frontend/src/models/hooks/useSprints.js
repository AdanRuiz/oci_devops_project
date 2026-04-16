import { useQuery } from '@tanstack/react-query';
import { fetchSprints, fetchSprint } from '../api/sprintsApi';

export const useSprints = (projectId) => useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => fetchSprints(projectId),
    enabled: !!projectId,
});

export const useSprint = (sprintId) => useQuery({
    queryKey: ['sprint', sprintId],
    queryFn: () => fetchSprint(sprintId),
});
