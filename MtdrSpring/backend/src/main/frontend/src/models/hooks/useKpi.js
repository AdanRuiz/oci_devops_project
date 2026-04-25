import { useQuery } from '@tanstack/react-query';
import { fetchKpi } from '../api/kpiApi';

export const useKpi = (sprintId) =>
  useQuery({
    queryKey: ['kpi', sprintId],
    queryFn: () => fetchKpi(sprintId),
    enabled: !!sprintId,
  });
