import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Button, Card, CardActionArea, CardContent,
    Chip, CircularProgress, Grid, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import client from '../../api/client';
import { PRIORITY_COLOR } from '../../constants/taskEnums';

const fetchSprint = (id)       => client.get(`/sprints/${id}`).then(r => r.data);
const fetchTasks  = (sprintId) => client.get(`/sprints/${sprintId}/tasks`).then(r => r.data);

const COLUMNS = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

const COLUMN_LABEL = {
    TODO:        'To Do',
    IN_PROGRESS: 'In Progress',
    BLOCKED:     'Blocked',
    DONE:        'Done',
};

export default function SprintBoard() {
    const { projectId, sprintId } = useParams();
    const navigate = useNavigate();

    const { data: sprint, isLoading: loadingSprint } = useQuery({
        queryKey: ['sprint', sprintId],
        queryFn:  () => fetchSprint(sprintId),
    });

    const { data: tasks = [], isLoading: loadingTasks } = useQuery({
        queryKey: ['tasks', 'sprint', sprintId],
        queryFn:  () => fetchTasks(sprintId),
    });

    if (loadingSprint || loadingTasks) return <CircularProgress />;

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(`/projects/${projectId}`)}
                sx={{ mb: 2 }}
            >
                {sprint?.name ?? 'Sprint'}
            </Button>

            <Typography variant="h5" gutterBottom>{sprint?.name}</Typography>
            <Typography color="text.secondary" gutterBottom>
                {sprint?.startDate} → {sprint?.endDate}
                &nbsp;·&nbsp; {sprint?.plannedTaskCount} planned tasks
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
                {COLUMNS.map(col => {
                    const colTasks = tasks.filter(t => t.status === col);
                    return (
                        <Grid item xs={12} sm={6} md={3} key={col}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {COLUMN_LABEL[col]} ({colTasks.length})
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {colTasks.map(task => (
                                    <Card key={task.id} variant="outlined">
                                        <CardActionArea onClick={() => navigate(`/tasks/${task.id}`)}>
                                            <CardContent>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {task.title}
                                                </Typography>
                                                <Chip
                                                    label={task.priority}
                                                    color={PRIORITY_COLOR[task.priority] || 'default'}
                                                    size="small"
                                                    sx={{ mt: 1 }}
                                                />
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                ))}
                                {colTasks.length === 0 && (
                                    <Typography variant="body2" color="text.secondary">—</Typography>
                                )}
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}
