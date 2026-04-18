import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMembers, removeMember, inviteMember } from '../api/membersApi';

export const useMembers = (projectId) => useQuery({
    queryKey: ['members', projectId],
    queryFn: () => fetchMembers(projectId),
    enabled: !!projectId,
});

export const useRemoveMember = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId) => removeMember(projectId, userId),
        onSuccess: (_, userId) => {
            queryClient.setQueryData(['members', projectId], (old = []) =>
                old.filter(m => (m.user?.id ?? m.id) !== userId)
            );
        },
    });
};

export const useInviteMember = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (email) => inviteMember(projectId, email),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', projectId] });
        },
    });
};
