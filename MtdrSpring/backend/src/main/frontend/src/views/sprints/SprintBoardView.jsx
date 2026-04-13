import {
    Box, Button, Card, CardActionArea, CardContent,
    Chip, Grid, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PRIORITY_COLOR } from '../../constants/taskEnums';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

const COLUMN_LABEL = {
    TODO:        'To Do',
    IN_PROGRESS: 'In Progress',
    BLOCKED:     'Blocked',
    DONE:        'Done',
};

export default function SprintBoardView({ sprint, tasks, onBack, onTaskSelect }) {
    return (
        <Box>
            <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
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
                                        <CardActionArea onClick={() => onTaskSelect(task.id)}>
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
