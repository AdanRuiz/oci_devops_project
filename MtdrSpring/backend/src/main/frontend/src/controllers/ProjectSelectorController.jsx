import { useNavigate } from 'react-router-dom';
import { CircularProgress, Typography } from '@mui/material';
import { useProjects, useCreateProject } from '../models/hooks/useProjects';
import { useActiveProject } from '../models/ProjectContext';
import ProjectSelectorView from '../views/projects/ProjectSelectorView';

export default function ProjectSelectorController() {
  const navigate = useNavigate();
  const { selectProject } = useActiveProject();
  const { data: projects = [], isLoading, isError } = useProjects();
  const create = useCreateProject();

  if (isLoading) return <CircularProgress />;
  if (isError) return <Typography color="error">Failed to load projects.</Typography>;

  const handleSelect = (project) => {
    selectProject(project);
    navigate('/dashboard');
  };

  return (
    <ProjectSelectorView
      projects={projects}
      onCreate={(data) => create.mutateAsync(data)}
      onSelect={handleSelect}
      isCreating={create.isPending}
    />
  );
}
