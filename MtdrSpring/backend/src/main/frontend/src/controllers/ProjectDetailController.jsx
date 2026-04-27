import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { useProject } from '../models/hooks/useProjects';
import { useSprints, useCreateSprint, useDeleteSprint } from '../models/hooks/useSprints';
import { useMembers } from '../models/hooks/useMembers';
import { useProjectRole } from '../models/hooks/useProjectRole';
import ProjectDetailView from '../views/projects/ProjectDetailView';

export default function ProjectDetailController() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: sprints = [], isLoading: loadingSprints } = useSprints(projectId);
  const { data: members = [] } = useMembers(projectId);
  const createSprint = useCreateSprint(projectId);
  const deleteSprint = useDeleteSprint(projectId);
  const { isManager } = useProjectRole();

  if (loadingProject) return <CircularProgress />;

  return (
    <ProjectDetailView
      project={project}
      sprints={sprints}
      loadingSprints={loadingSprints}
      isManager={isManager}
      onSprintSelect={(sprintId) => navigate(`/projects/${projectId}/sprints/${sprintId}`)}
      onCreateSprint={(data) => createSprint.mutateAsync(data)}
      onDeleteSprint={(sprintId) => deleteSprint.mutateAsync(sprintId)}
    />
  );
}
