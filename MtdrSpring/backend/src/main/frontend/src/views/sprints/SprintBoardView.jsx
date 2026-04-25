import { useState } from 'react';
import {
    DndContext, DragOverlay, PointerSensor,
    useSensor, useSensors, useDroppable, useDraggable,
    closestCenter,
} from '@dnd-kit/core';
import {
    Box, Button, Card, CardContent, Dialog, DialogActions,
    DialogContent, DialogTitle, Grid, InputAdornment, MenuItem,
    TextField, Typography,
} from '@mui/material';
import WestIcon from '@mui/icons-material/West';
import AddIcon from '@mui/icons-material/Add';
import { ORANGE_ACCENT, outlinedButtonSx, containedButtonSx } from '../../styles/theme';

const COLUMN_META = {
    TODO:        { label: 'To Do',       accent: '#2196F3', badgeBg: '#e2e3e5', badgeColor: '#383d41' },
    IN_PROGRESS: { label: 'In Progress', accent: '#d7790e', badgeBg: '#fff3cd', badgeColor: '#856404' },
    BLOCKED:     { label: 'Blocked',     accent: '#F44336', badgeBg: '#f8d7da', badgeColor: '#721c24' },
    DONE:        { label: 'Done',        accent: '#4CAF50', badgeBg: '#cee6b4', badgeColor: '#2E7D1F' },
};

const PRIORITY_BADGE = {
    LOW:    { bgcolor: '#e2e3e5', color: '#383d41' },
    MEDIUM: { bgcolor: '#fff3cd', color: '#856404' },
    HIGH:   { bgcolor: '#f8d7da', color: '#721c24' },
};

const COLUMNS = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SectionTitle({ children }) {
    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#2B2B2B', lineHeight: 1.3 }}>
                {children}
            </Typography>
            <Box sx={{ width: 32, height: 3, bgcolor: ORANGE_ACCENT, mt: '5px', borderRadius: '2px' }} />
        </Box>
    );
}

function PriorityBadge({ priority }) {
    const style = PRIORITY_BADGE[priority] ?? PRIORITY_BADGE.MEDIUM;
    return (
        <Box sx={{ display: 'inline-flex', px: '8px', py: '2px', borderRadius: '20px', bgcolor: style.bgcolor, mt: '8px' }}>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: style.color }}>
                {priority.charAt(0) + priority.slice(1).toLowerCase()}
            </Typography>
        </Box>
    );
}

function TaskCardContent({ task }) {
    return (
        <CardContent sx={{ p: '14px 16px !important' }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1A1A1A' }}>
                {task.title}
            </Typography>
            <PriorityBadge priority={task.priority} />
        </CardContent>
    );
}

function DraggableTaskCard({ task, onTaskSelect }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

    return (
        <Card
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={() => !isDragging && onTaskSelect(task.id)}
            sx={{
                border: '1px solid #E8E8E8',
                borderRadius: '8px',
                boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
                bgcolor: isDragging ? '#f5f3f1' : '#ffffff',
                cursor: isDragging ? 'grabbing' : 'grab',
                opacity: isDragging ? 0.4 : 1,
                transition: 'box-shadow 0.15s, opacity 0.15s',
                '&:hover': { borderColor: '#d0cecc', bgcolor: '#faf9f8' },
            }}
        >
            <TaskCardContent task={task} />
        </Card>
    );
}

function DroppableColumn({ status, tasks, onTaskSelect, isOver }) {
    const meta = COLUMN_META[status];
    const { setNodeRef } = useDroppable({ id: status });

    return (
        <Box data-testid={`column-${status}`}>
            {/* Column header */}
            <Card sx={{
                border: '1px solid #E8E8E8',
                borderRadius: '8px',
                boxShadow: 'none',
                bgcolor: '#fbf9f8',
                mb: '12px',
            }}>
                <CardContent sx={{ p: '14px 16px !important' }}>
                    <Box sx={{ height: '3px', bgcolor: meta.accent, borderRadius: '10px', mb: '10px' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1A1A1A' }}>
                            {meta.label}
                        </Typography>
                        <Box sx={{ px: '8px', py: '2px', bgcolor: meta.badgeBg, borderRadius: '20px' }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: meta.badgeColor }}>
                                {tasks.length}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Drop zone */}
            <Box
                ref={setNodeRef}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minHeight: '80px',
                    borderRadius: '8px',
                    border: isOver ? `2px dashed ${meta.accent}` : '2px solid transparent',
                    p: isOver ? '6px' : '0px',
                    transition: 'border 0.15s, padding 0.15s',
                }}
            >
                {tasks.length === 0 ? (
                    <Typography sx={{ fontSize: '0.82rem', color: '#C0C0C0', px: '4px', pt: '4px' }}>
                        {isOver ? 'Drop here' : 'No tasks'}
                    </Typography>
                ) : (
                    tasks.map(task => (
                        <DraggableTaskCard key={task.id} task={task} onTaskSelect={onTaskSelect} />
                    ))
                )}
            </Box>
        </Box>
    );
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

function AddTaskDialog({ open, members, sprintId, projectId, onClose, onSubmit }) {
    const [title, setTitle]         = useState('');
    const [description, setDesc]    = useState('');
    const [priority, setPriority]   = useState('MEDIUM');
    const [assigneeId, setAssignee] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]         = useState('');

    const handleClose = () => {
        setTitle(''); setDesc(''); setPriority('MEDIUM'); setAssignee(''); setError('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!title.trim()) { setError('Title is required.'); return; }
        if (!assigneeId)   { setError('Please select an assignee.'); return; }
        setSubmitting(true); setError('');
        try {
            await onSubmit({
                title: title.trim(),
                description: description.trim() || null,
                priority,
                projectId,
                sprintId,
                createdById: assigneeId,
                assigneeId,
            });
            handleClose();
        } catch {
            setError('Failed to create task. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" data-testid="add-task-dialog">
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>
                Add Task
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                <TextField
                    label="Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    fullWidth
                    autoFocus
                />
                <TextField
                    label="Description (optional)"
                    value={description}
                    onChange={e => setDesc(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                />
                <TextField
                    select
                    label="Priority"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    fullWidth
                >
                    {PRIORITIES.map(p => (
                        <MenuItem key={p} value={p} sx={{ fontSize: '0.85rem' }}>
                            {p.charAt(0) + p.slice(1).toLowerCase()}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Assignee"
                    value={assigneeId}
                    onChange={e => setAssignee(e.target.value)}
                    fullWidth
                >
                    {members.map(m => (
                        <MenuItem key={m.user?.id ?? m.id} value={m.user?.id ?? m.id} sx={{ fontSize: '0.85rem' }}>
                            {m.user?.email ?? m.email}
                        </MenuItem>
                    ))}
                </TextField>
                {error && (
                    <Typography sx={{ fontSize: '0.82rem', color: '#E57373' }}>{error}</Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ px: '24px', pb: '16px' }}>
                <Button onClick={handleClose} variant="outlined" size="small" sx={outlinedButtonSx}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    variant="contained"
                    size="small"
                    sx={containedButtonSx}
                >
                    {submitting ? 'Creating…' : 'Create Task'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function LogHoursDialog({ open, taskTitle, onClose, onConfirm }) {
    const [hours, setHours]       = useState('');
    const [note, setNote]         = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]       = useState('');

    const handleClose = () => {
        setHours(''); setNote(''); setError('');
        onClose();
    };

    const handleConfirm = async () => {
        const val = parseFloat(hours);
        if (!hours || isNaN(val) || val <= 0) {
            setError('Please enter a valid number of hours greater than 0.');
            return;
        }
        if (val > 100) {
            setError('Hours cannot exceed 100 per entry.');
            return;
        }
        // round to nearest 0.5
        const rounded = Math.round(val * 2) / 2;
        setSubmitting(true);
        setError('');
        try {
            await onConfirm({ hoursWorked: rounded, note: note.trim() || null });
            handleClose();
        } catch {
            setError('Failed to log hours. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" data-testid="log-hours-dialog">
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>
                Log Hours
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                {taskTitle && (
                    <Typography sx={{ fontSize: '0.85rem', color: '#717171', mb: '-4px' }}>
                        {taskTitle}
                    </Typography>
                )}
                <TextField
                    label="Hours worked"
                    type="number"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    inputProps={{ min: 0.5, max: 100, step: 0.5 }}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                    }}
                    fullWidth
                    autoFocus
                />
                <TextField
                    label="Note (optional)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                />
                {error && (
                    <Typography sx={{ fontSize: '0.82rem', color: '#E57373' }}>{error}</Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ px: '24px', pb: '16px' }}>
                <Button onClick={handleClose} variant="outlined" size="small" sx={outlinedButtonSx}>
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={submitting}
                    variant="contained"
                    size="small"
                    sx={containedButtonSx}
                >
                    {submitting ? 'Saving…' : 'Confirm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function SprintBoardView({ sprint, tasks, members = [], projectId, onBack, onTaskSelect, onStatusChange, onCreateTask, onLogWork }) {
    const [activeTask, setActiveTask]       = useState(null);
    const [overId, setOverId]               = useState(null);
    const [addTaskOpen, setAddTaskOpen]     = useState(false);
    const [pendingChange, setPendingChange] = useState(null); // { task, newStatus, changedById }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragStart = ({ active }) => {
        setActiveTask(tasks.find(t => t.id === active.id) ?? null);
    };

    const handleDragOver = ({ over }) => {
        setOverId(over?.id ?? null);
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveTask(null);
        setOverId(null);
        if (!over) return;
        const newStatus = over.id;
        const task = tasks.find(t => t.id === active.id);
        if (!task || task.status === newStatus) return;
        const changedById = task.createdBy?.id ?? task.assignee?.id ?? null;
        if (newStatus === 'DONE') {
            setPendingChange({ task, newStatus, changedById });
        } else {
            onStatusChange(task.id, newStatus, changedById);
        }
    };

    const handleLogHoursConfirm = async (payload) => {
        if (!pendingChange) return;
        const { task, newStatus, changedById } = pendingChange;
        await onLogWork(task.id, payload);
        onStatusChange(task.id, newStatus, changedById);
        setPendingChange(null);
    };

    const handleLogHoursCancel = () => {
        setPendingChange(null);
    };

    return (
        <Box>
            <Button
                variant="outlined"
                size="small"
                startIcon={<WestIcon sx={{ fontSize: '0.85rem !important' }} />}
                onClick={onBack}
                sx={{ ...outlinedButtonSx, mb: '24px' }}
            >
                Back to Sprints
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '28px' }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#1A1A1A', mb: '8px' }}>
                        {sprint?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#9E9E9E', mb: '2px' }}>Start</Typography>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1A1A1A' }}>{formatDate(sprint?.startDate)}</Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#9E9E9E', mb: '2px' }}>End</Typography>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1A1A1A' }}>{formatDate(sprint?.endDate)}</Typography>
                        </Box>
                        {sprint?.plannedTaskCount > 0 && (
                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#9E9E9E', mb: '2px' }}>Planned</Typography>
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1A1A1A' }}>{sprint.plannedTaskCount} tasks</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setAddTaskOpen(true)}
                    sx={outlinedButtonSx}
                >
                    Add Task
                </Button>
            </Box>

            <Box sx={{ width: 32, height: 3, bgcolor: ORANGE_ACCENT, borderRadius: '2px', mb: '24px' }} />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <Grid container spacing="16px">
                    {COLUMNS.map(col => (
                        <Grid item xs={12} sm={6} md={3} key={col}>
                            <DroppableColumn
                                status={col}
                                tasks={tasks.filter(t => t.status === col)}
                                onTaskSelect={onTaskSelect}
                                isOver={overId === col}
                            />
                        </Grid>
                    ))}
                </Grid>

                {/* Floating drag preview */}
                <DragOverlay dropAnimation={null}>
                    {activeTask && (
                        <Card sx={{
                            border: '1px solid #d0cecc',
                            borderRadius: '8px',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                            bgcolor: '#ffffff',
                            cursor: 'grabbing',
                            transform: 'rotate(2deg)',
                        }}>
                            <TaskCardContent task={activeTask} />
                        </Card>
                    )}
                </DragOverlay>
            </DndContext>

            <AddTaskDialog
                open={addTaskOpen}
                members={members}
                sprintId={sprint?.id}
                projectId={projectId}
                onClose={() => setAddTaskOpen(false)}
                onSubmit={onCreateTask}
            />

            <LogHoursDialog
                open={!!pendingChange}
                taskTitle={pendingChange?.task?.title}
                onClose={handleLogHoursCancel}
                onConfirm={handleLogHoursConfirm}
            />
        </Box>
    );
}
