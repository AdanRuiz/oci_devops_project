import { useNavigate } from 'react-router-dom';
import { CircularProgress, Typography } from '@mui/material';
import { useProjects, useCreateProject } from '../models/hooks/useProjects';
import ProjectListView from '../views/projects/ProjectListView';

export default function ProjectsController() {
    const navigate = useNavigate();
    const { data: projects = [], isLoading, isError } = useProjects();
    const create = useCreateProject();

    if (isLoading) return <CircularProgress />;
    if (isError)   return <Typography color="error">Failed to load projects.</Typography>;

    return (
        <ProjectListView
            projects={projects}
            onCreate={(data) => create.mutateAsync(data)}
            onSelect={(id) => navigate(`/projects/${id}`)}
            isCreating={create.isPending}
        />
    );
}
