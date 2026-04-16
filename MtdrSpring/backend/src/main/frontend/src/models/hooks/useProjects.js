import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjects, fetchProject, createProject } from '../api/projectsApi';

export const useProjects = () => useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
});

export const useProject = (projectId) => useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
});

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProject,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    });
};
