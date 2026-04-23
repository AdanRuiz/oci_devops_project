import { useState } from 'react';
import {
    Box, Button, Card, CardContent, CircularProgress,
    Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, LinearProgress, TextField, Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { ORANGE_ACCENT, outlinedButtonSx, containedButtonSx } from '../../styles/theme';

const PROGRESS_COLOR = '#245d63';

const STATUS_STYLE = {
    COMPLETED: { bgcolor: '#F5E6D0', color: '#7A5230' },
    ACTIVE:    { bgcolor: '#D6EDDB', color: '#2E6B3E' },
    UPCOMING:  { bgcolor: '#E2E8F0', color: '#4A5568' },
};

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function DeleteDialog({ open, sprint, onClose, onConfirm }) {
    const [input, setInput]       = useState('');
    const [submitting, setSubmitting] = useState(false);
    const sprintName = sprint?.name ?? '';
    const confirmed  = input === sprintName;

    const handleClose = () => {
        setInput('');
        onClose();
    };

    const handleDelete = async () => {
        setSubmitting(true);
        try {
            await onConfirm(sprint.id);
            handleClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Delete sprint</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    This will permanently delete <strong style={{ color: '#1A1A1A' }}>{sprintName}</strong> and
                    all of its associated data. This action cannot be undone.
                </Typography>
                <TextField
                    label={`Type "${sprintName}" to confirm`}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    autoFocus
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    disabled={!confirmed || submitting}
                    onClick={handleDelete}
                    sx={{
                        bgcolor: confirmed ? '#E57373' : '#FDECEA',
                        color: confirmed ? '#fff' : '#E57373',
                        '&:hover': { bgcolor: confirmed ? '#EF5350' : '#FDECEA' },
                        '&.Mui-disabled': { bgcolor: '#FDECEA', color: '#E57373' },
                    }}
                >
                    {submitting ? 'Deleting…' : 'Delete sprint'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function StatusBadge({ status }) {
    const style = STATUS_STYLE[status] ?? STATUS_STYLE.UPCOMING;
    const label = status.charAt(0) + status.slice(1).toLowerCase();
    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: '10px',
                py: '3px',
                borderRadius: '20px',
                bgcolor: style.bgcolor,
            }}
        >
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: style.color }}>
                {label}
            </Typography>
        </Box>
    );
}

function SprintCard({ sprint, onClick, onDeleteClick }) {
    const total = sprint.plannedTaskCount ?? 0;
    const done  = sprint.doneTaskCount ?? 0;
    const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
        <Card
            onClick={onClick}
            sx={{
                border: '1px solid #E8E8E8',
                borderRadius: '8px',
                boxShadow: 'none',
                bgcolor: '#ffffff',
                mb: '12px',
                cursor: 'pointer',
                '&:hover': { borderColor: '#d0cecc', bgcolor: '#faf9f8' },
                transition: 'border-color 0.15s, background-color 0.15s',
            }}
        >
            <CardContent
                sx={{
                    p: '20px 24px !important',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#1A1A1A' }}>
                            {sprint.name}
                        </Typography>
                        <StatusBadge status={sprint.status} />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: '20px', mr: '8px' }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#9E9E9E', mb: '3px' }}>
                            Start
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1A1A1A' }}>
                            {formatDate(sprint.startDate)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#9E9E9E', mb: '3px' }}>
                            End
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1A1A1A' }}>
                            {formatDate(sprint.endDate)}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ textAlign: 'center', minWidth: '90px' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#717171', mb: '4px' }}>
                        Tasks Done
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px' }}>
                        <Typography sx={{ fontWeight: 400, fontSize: '1.5rem', color: '#1A1A1A', lineHeight: 1 }}>
                            {done}
                        </Typography>
                        <Typography sx={{ fontWeight: 400, fontSize: '1.5rem', color: '#1A1A1A', lineHeight: 1 }}>
                            /{total}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ minWidth: '180px' }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#717171', textAlign: 'center', mb: '6px' }}>
                        {pct}% Complete
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                            height: 8,
                            borderRadius: '100px',
                            bgcolor: '#E8E8E8',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: PROGRESS_COLOR,
                                borderRadius: '100px',
                            },
                        }}
                    />
                </Box>

                {onDeleteClick && (
                    <Box
                        sx={{ display: 'flex', gap: '4px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <IconButton
                            size="small"
                            onClick={() => onDeleteClick(sprint)}
                            sx={{ color: '#E57373', '&:hover': { color: '#C62828' } }}
                        >
                            <DeleteOutlineIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

function CreateSprintDialog({ open, onClose, onSubmit }) {
    const [name, setName]           = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate]     = useState('');
    const [error, setError]         = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleClose = () => {
        setName(''); setStartDate(''); setEndDate(''); setError('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!name.trim())        { setError('Sprint name is required.'); return; }
        if (!startDate)          { setError('Start date is required.'); return; }
        if (!endDate)            { setError('End date is required.'); return; }
        if (endDate < startDate) { setError('End date must be after start date.'); return; }
        setSubmitting(true); setError('');
        try {
            await onSubmit({ name: name.trim(), startDate, endDate });
            handleClose();
        } catch {
            setError('Failed to create sprint. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>
                Create Sprint
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                <TextField
                    label="Sprint name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    fullWidth
                    autoFocus
                />
                <TextField
                    label="Start date"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="End date"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />
                {error && (
                    <Typography sx={{ fontSize: '0.82rem', color: '#E57373' }}>{error}</Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ px: '24px', pb: '16px' }}>
                <Button onClick={handleClose} variant="outlined" size="small" sx={outlinedButtonSx}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} variant="contained" size="small" sx={containedButtonSx}>
                    {submitting ? 'Creating…' : 'Create Sprint'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function ProjectDetailView({
    project, sprints, loadingSprints, isManager, onSprintSelect, onCreateSprint, onDeleteSprint,
}) {
    const [deletingSprint, setDeletingSprint] = useState(null);
    const [createOpen, setCreateOpen]         = useState(false);

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '28px' }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#1A1A1A', mb: '2px' }}>
                        Sprints
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>
                        {project?.name}{sprints.length > 0 ? ` - ${sprints.length} Sprint${sprints.length !== 1 ? 's' : ''}` : ''}
                    </Typography>
                </Box>
                {isManager && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateOpen(true)}
                        sx={outlinedButtonSx}
                    >
                        Create Sprint
                    </Button>
                )}
            </Box>

            {loadingSprints && <CircularProgress size={24} />}

            {!loadingSprints && sprints.length === 0 && (
                <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>No sprints yet.</Typography>
            )}

            {!loadingSprints && sprints.map(s => (
                <SprintCard
                    key={s.id}
                    sprint={s}
                    onClick={() => onSprintSelect(s.id)}
                    onDeleteClick={isManager ? (sprint) => setDeletingSprint(sprint) : null}
                />
            ))}

            <DeleteDialog
                open={!!deletingSprint}
                sprint={deletingSprint}
                onClose={() => setDeletingSprint(null)}
                onConfirm={onDeleteSprint}
            />

            <CreateSprintDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={onCreateSprint}
            />
        </Box>
    );
}
