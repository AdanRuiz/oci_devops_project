import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { useProject } from '../models/hooks/useProjects';
import { useSprints } from '../models/hooks/useSprints';
import { useMembers } from '../models/hooks/useMembers';
import ProjectDetailView from '../views/projects/ProjectDetailView';

export default function ProjectDetailController() {
    const { projectId } = useParams();
    const navigate      = useNavigate();

    const { data: project, isLoading: loadingProject } = useProject(projectId);
    const { data: sprints = [], isLoading: loadingSprints } = useSprints(projectId);
    const { data: members = [] } = useMembers(projectId);

    if (loadingProject) return <CircularProgress />;

    return (
        <ProjectDetailView
            project={project}
            sprints={sprints}
            members={members}
            loadingSprints={loadingSprints}
            onBack={() => navigate('/projects')}
            onSprintSelect={(sprintId) => navigate(`/projects/${projectId}/sprints/${sprintId}`)}
        />
    );
}
