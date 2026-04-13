import { useQuery } from '@tanstack/react-query';
import { fetchMembers } from '../api/membersApi';

export const useMembers = (projectId) => useQuery({
    queryKey: ['members', projectId],
    queryFn: () => fetchMembers(projectId),
});
