import {
    Box, Button, Chip, Divider,
    List, ListItem, ListItemText, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { STATUS_COLOR, PRIORITY_COLOR } from '../../constants/taskEnums';

export default function TaskDetailView({ task, history, logs, onBack }) {
    return (
        <Box>
            <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
                Back
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h5">{task?.title}</Typography>
                <Chip label={task?.status}   color={STATUS_COLOR[task?.status]   ?? 'default'} size="small" />
                <Chip label={task?.priority} color={PRIORITY_COLOR[task?.priority] ?? 'default'} size="small" />
            </Box>

            {task?.description && (
                <Typography color="text.secondary" gutterBottom>{task.description}</Typography>
            )}

            <Typography variant="body2" sx={{ mt: 1 }}>
                Assignee: {task?.assignee?.email ?? 'Unassigned'}
            </Typography>
            <Typography variant="body2">
                Created: {task?.createdAt}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>State History</Typography>
            <List dense>
                {history.length === 0 && (
                    <Typography color="text.secondary" variant="body2">No transitions yet.</Typography>
                )}
                {history.map(h => (
                    <ListItem key={h.id}>
                        <ListItemText
                            primary={`${h.fromStatus ?? '—'} → ${h.toStatus}`}
                            secondary={`${h.changedAt} · ${h.source} · ${h.changedBy?.email ?? ''}`}
                        />
                    </ListItem>
                ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Work Logs</Typography>
            <List dense>
                {logs.length === 0 && (
                    <Typography color="text.secondary" variant="body2">No work logged yet.</Typography>
                )}
                {logs.map(l => (
                    <ListItem key={l.id}>
                        <ListItemText
                            primary={`${l.daysWorked} day(s) — ${l.workDate}`}
                            secondary={l.note}
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}
