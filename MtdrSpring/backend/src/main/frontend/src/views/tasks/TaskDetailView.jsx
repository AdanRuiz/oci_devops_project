import {
    Box, Button, Card, CardContent, Grid, Typography,
} from '@mui/material';
import WestIcon from '@mui/icons-material/West';

const ORANGE_ACCENT = '#F77E47';

const STATUS_STYLE = {
    TODO:        { bgcolor: '#e2e3e5', color: '#383d41', label: 'To Do' },
    IN_PROGRESS: { bgcolor: '#fff3cd', color: '#856404', label: 'In Progress' },
    BLOCKED:     { bgcolor: '#f8d7da', color: '#721c24', label: 'Blocked' },
    DONE:        { bgcolor: '#cee6b4', color: '#2E7D1F', label: 'Done' },
};

const PRIORITY_STYLE = {
    LOW:    { bgcolor: '#e2e3e5', color: '#383d41' },
    MEDIUM: { bgcolor: '#fff3cd', color: '#856404' },
    HIGH:   { bgcolor: '#f8d7da', color: '#721c24' },
};

function formatPriority(p) {
    if (!p) return '—';
    return p.charAt(0) + p.slice(1).toLowerCase();
}

function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        + ' at '
        + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function SectionTitle({ children, accent = ORANGE_ACCENT }) {
    return (
        <Box sx={{ mb: '16px' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#2B2B2B', lineHeight: 1.3 }}>
                {children}
            </Typography>
            <Box sx={{ width: 24, height: 3, bgcolor: accent, mt: '4px', borderRadius: '2px' }} />
        </Box>
    );
}

function Badge({ label, bgcolor, color }) {
    return (
        <Box sx={{ display: 'inline-flex', px: '10px', py: '3px', borderRadius: '20px', bgcolor }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color }}>
                {label}
            </Typography>
        </Box>
    );
}

function MetaRow({ label, children }) {
    return (
        <Box sx={{ mb: '16px' }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9E9E9E', mb: '5px' }}>
                {label}
            </Typography>
            {children}
        </Box>
    );
}

function HistoryTimeline({ history }) {
    if (history.length === 0) {
        return <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>No transitions yet.</Typography>;
    }
    return (
        <Box>
            {history.map((h, i) => {
                const fromStyle = STATUS_STYLE[h.fromStatus] ?? { bgcolor: '#e2e3e5', color: '#383d41', label: h.fromStatus ?? '—' };
                const toStyle   = STATUS_STYLE[h.toStatus]   ?? { bgcolor: '#e2e3e5', color: '#383d41', label: h.toStatus };
                return (
                    <Box key={h.id}>
                        {i > 0 && <Box sx={{ height: '1px', bgcolor: '#F0EEEC', mx: 0, my: '10px' }} />}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            {/* Transition */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Badge label={fromStyle.label} bgcolor={fromStyle.bgcolor} color={fromStyle.color} />
                                <Typography sx={{ fontSize: '0.78rem', color: '#C0C0C0' }}>→</Typography>
                                <Badge label={toStyle.label} bgcolor={toStyle.bgcolor} color={toStyle.color} />
                            </Box>
                            {/* Meta */}
                            <Typography sx={{ fontSize: '0.73rem', color: '#B0B0B0', whiteSpace: 'nowrap' }}>
                                {formatDateTime(h.changedAt)}
                                {h.changedBy?.email && ` · ${h.changedBy.email}`}
                            </Typography>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}

function WorkLogSection({ logs }) {
    const total = logs.reduce((s, l) => s + Number(l.hoursWorked ?? 0), 0);

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '16px' }}>
                <SectionTitle accent="#2196F3">Work Logs</SectionTitle>
                {logs.length > 0 && (
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.68rem', color: '#9E9E9E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</Typography>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1A1A1A' }}>{total.toFixed(1)} hrs</Typography>
                    </Box>
                )}
            </Box>

            {logs.length === 0 ? (
                <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>No work logged yet.</Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {logs.map(l => (
                        <Card key={l.id} sx={{ border: '1px solid #E8E8E8', borderRadius: '8px', boxShadow: 'none', bgcolor: '#fbf9f8' }}>
                            <CardContent sx={{ p: '12px 16px !important', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1A1A1A' }}>
                                        {l.user?.email ?? 'Unknown'} · {formatDate(l.workDate)}
                                    </Typography>
                                    {l.note && (
                                        <Typography sx={{ fontSize: '0.78rem', color: '#717171', mt: '2px' }}>{l.note}</Typography>
                                    )}
                                </Box>
                                <Box sx={{ px: '10px', py: '3px', bgcolor: '#e2e3e5', borderRadius: '20px' }}>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#383d41' }}>
                                        {l.hoursWorked}h
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}
        </>
    );
}

/* Main view */

export default function TaskDetailView({ task, history, logs, onBack }) {
    const statusStyle   = STATUS_STYLE[task?.status]     ?? STATUS_STYLE.TODO;
    const priorityStyle = PRIORITY_STYLE[task?.priority] ?? PRIORITY_STYLE.MEDIUM;

    return (
        <Box>
            {/* Back button */}
            <Button
                variant="outlined"
                size="small"
                startIcon={<WestIcon sx={{ fontSize: '0.85rem !important' }} />}
                onClick={onBack}
                sx={{
                    color: '#2B2B2B', borderColor: '#e0dedc', bgcolor: '#ffffff',
                    fontWeight: 500, fontSize: '0.85rem',
                    px: '16px', py: '6px', mb: '24px', textTransform: 'none',
                    '&:hover': { bgcolor: '#e0dedc', borderColor: '#e0dedc' },
                }}
            >
                Back
            </Button>

            {/* Title + badges */}
            <Box sx={{ mb: '6px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#1A1A1A' }}>
                    {task?.title}
                </Typography>
                <Badge label={statusStyle.label}              bgcolor={statusStyle.bgcolor}   color={statusStyle.color} />
                <Badge label={formatPriority(task?.priority)} bgcolor={priorityStyle.bgcolor} color={priorityStyle.color} />
            </Box>

            {task?.description && (
                <Typography sx={{ fontSize: '0.875rem', color: '#717171', mb: '4px', lineHeight: 1.6 }}>
                    {task.description}
                </Typography>
            )}

            {/* Orange accent */}
            <Box sx={{ width: 32, height: 3, bgcolor: ORANGE_ACCENT, borderRadius: '2px', mt: '16px', mb: '28px' }} />

            {/* Two-column layout */}
            <Grid container spacing="28px" alignItems="flex-start">

                {/* Left — main content */}
                <Grid item xs={12} md={8}>
                    {/* State History */}
                    <Card data-testid="state-history" sx={{ border: '1px solid #E8E8E8', borderRadius: '8px', boxShadow: 'none', bgcolor: '#fbf9f8', mb: '20px' }}>
                        <CardContent sx={{ p: '20px !important' }}>
                            <SectionTitle>State History</SectionTitle>
                            <HistoryTimeline history={history} />
                        </CardContent>
                    </Card>

                    {/* Work Logs */}
                    <Card data-testid="work-logs" sx={{ border: '1px solid #E8E8E8', borderRadius: '8px', boxShadow: 'none', bgcolor: '#fbf9f8' }}>
                        <CardContent sx={{ p: '20px !important' }}>
                            <WorkLogSection logs={logs} />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right, metadata sidebar */}
                <Grid item xs={12} md={4}>
                    <Card data-testid="task-details-sidebar" sx={{ border: '1px solid #E8E8E8', borderRadius: '8px', boxShadow: 'none', bgcolor: '#fbf9f8' }}>
                        <CardContent sx={{ p: '20px !important' }}>
                            <SectionTitle accent="#9C27B0">Details</SectionTitle>

                            <MetaRow label="Status">
                                <Badge label={statusStyle.label} bgcolor={statusStyle.bgcolor} color={statusStyle.color} />
                            </MetaRow>

                            <MetaRow label="Priority">
                                <Badge label={formatPriority(task?.priority)} bgcolor={priorityStyle.bgcolor} color={priorityStyle.color} />
                            </MetaRow>

                            <MetaRow label="Assignee">
                                <Typography sx={{ fontSize: '0.875rem', color: '#1A1A1A', fontWeight: 500 }}>
                                    {task?.assignee?.email ?? 'Unassigned'}
                                </Typography>
                            </MetaRow>

                            <MetaRow label="Created">
                                <Typography sx={{ fontSize: '0.875rem', color: '#1A1A1A' }}>
                                    {formatDate(task?.createdAt)}
                                </Typography>
                            </MetaRow>

                            {task?.enteredInProgressAt && (
                                <MetaRow label="Started">
                                    <Typography sx={{ fontSize: '0.875rem', color: '#1A1A1A' }}>
                                        {formatDate(task.enteredInProgressAt)}
                                    </Typography>
                                </MetaRow>
                            )}

                            {task?.completedAt && (
                                <MetaRow label="Completed">
                                    <Typography sx={{ fontSize: '0.875rem', color: '#1A1A1A' }}>
                                        {formatDate(task.completedAt)}
                                    </Typography>
                                </MetaRow>
                            )}

                            {task?.reworkCount > 0 && (
                                <MetaRow label="Rework Count">
                                    <Box sx={{ display: 'inline-flex', px: '10px', py: '3px', borderRadius: '20px', bgcolor: '#f8d7da' }}>
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#721c24' }}>
                                            {task.reworkCount}x reworked
                                        </Typography>
                                    </Box>
                                </MetaRow>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
