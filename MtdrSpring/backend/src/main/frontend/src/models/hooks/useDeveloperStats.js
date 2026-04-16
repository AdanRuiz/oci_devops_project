import { useQuery } from '@tanstack/react-query';
import { fetchDeveloperStats } from '../api/kpiApi';

export const useDeveloperStats = (sprintId) => useQuery({
    queryKey: ['developerStats', sprintId],
    queryFn: () => fetchDeveloperStats(sprintId),
    enabled: !!sprintId,
});
