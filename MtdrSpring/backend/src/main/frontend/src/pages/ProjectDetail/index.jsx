import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Button, Chip, CircularProgress, Divider,
    List, ListItem, ListItemButton, ListItemText, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import client from '../../api/client';

const fetchProject = (id) => client.get(`/projects/${id}`).then(r => r.data);
const fetchSprints  = (id) => client.get(`/projects/${id}/sprints`).then(r => r.data);
const fetchMembers  = (id) => client.get(`/projects/${id}/members`).then(r => r.data);

const STATUS_COLOR = { UPCOMING: 'default', ACTIVE: 'primary', COMPLETED: 'success' };

export default function ProjectDetail() {
    const { projectId } = useParams();
    const navigate      = useNavigate();

    const { data: project, isLoading: loadingProject } = useQuery({
        queryKey: ['project', projectId],
        queryFn:  () => fetchProject(projectId),
    });

    const { data: sprints = [], isLoading: loadingSprints } = useQuery({
        queryKey: ['sprints', projectId],
        queryFn:  () => fetchSprints(projectId),
    });

    const { data: members = [] } = useQuery({
        queryKey: ['members', projectId],
        queryFn:  () => fetchMembers(projectId),
    });

    if (loadingProject) return <CircularProgress />;

    return (
        <Box>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} sx={{ mb: 2 }}>
                Projects
            </Button>

            <Typography variant="h5" gutterBottom>{project?.name}</Typography>
            {project?.description && (
                <Typography color="text.secondary" gutterBottom>{project.description}</Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Sprints</Typography>
            {loadingSprints ? <CircularProgress size={20} /> : (
                <List>
                    {sprints.length === 0 && (
                        <Typography color="text.secondary">No sprints yet.</Typography>
                    )}
                    {sprints.map(s => (
                        <ListItem key={s.id} disablePadding>
                            <ListItemButton
                                onClick={() => navigate(`/projects/${projectId}/sprints/${s.id}`)}
                            >
                                <ListItemText
                                    primary={s.name}
                                    secondary={`${s.startDate} → ${s.endDate}`}
                                />
                                <Chip
                                    label={s.status}
                                    color={STATUS_COLOR[s.status] || 'default'}
                                    size="small"
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Members</Typography>
            <List dense>
                {members.map(m => (
                    <ListItem key={m.id}>
                        <ListItemText
                            primary={m.user?.email ?? m.user?.id}
                            secondary={m.role}
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}
