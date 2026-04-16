import {
    Box, Button, Card, CardContent, Grid, Typography,
} from '@mui/material';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';

const ORANGE_ACCENT  = '#F77E47';

const STAT_BORDERS = {
    openTasks:    '#2196F3',
    completed:    '#4CAF50',
    blocked:      '#F44336',
    avgCycleTime: '#9C27B0',
};

const BAR = {
    todo:       '#245d63',
    inProgress: '#d7790e',
    blocked:    '#31a09c',
    done:       '#4e4137',
};

const STATUS_BADGE = {
    TODO:        { bgcolor: '#e2e3e5', color: '#383d41', label: 'To Do' },
    IN_PROGRESS: { bgcolor: '#fff3cd', color: '#856404', label: 'In Progress' },
    BLOCKED:     { bgcolor: '#f8d7da', color: '#721c24', label: 'Blocked' },
    DONE:        { bgcolor: '#cee6b4', color: '#2E7D1F', label: 'Done' },
};

function SectionTitle({ children }) {
    return (
        <Box>
            <Typography
                variant="h6"
                sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#2B2B2B', lineHeight: 1.3 }}
            >
                {children}
            </Typography>
            <Box sx={{ width: 32, height: 3, bgcolor: ORANGE_ACCENT, mt: '5px', borderRadius: '2px' }} />
        </Box>
    );
}

function StatCard({ label, value, subtitle, borderColor, subtitleContent }) {
    return (
        <Card
            sx={{
                border: '1px solid #E8E8E8',
                borderRadius: '8px',
                boxShadow: 'none',
                bgcolor: '#fbf9f8',
                height: '100%',
            }}
        >
            <CardContent sx={{ p: '20px !important' }}>
                <Box
                    sx={{
                        height: '3px',
                        bgcolor: borderColor,
                        borderRadius: '10px',
                        mb: '14px',
                    }}
                />
                <Typography sx={{ fontSize: '0.9rem', color: '#1A1A1A', mb: '10px' }}>
                    {label}
                </Typography>
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontSize: 'clamp(2rem, 3.5vw, 2.6rem)',
                        lineHeight: 1,
                        color: '#1A1A1A',
                        mb: '10px',
                    }}
                >
                    {value}
                </Typography>
                {subtitleContent ?? (
                    <Typography sx={{ fontSize: '0.82rem', color: '#717171' }}>
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

function SprintProgressBar({ todo, inProgress, blocked, done }) {
    const total = todo + inProgress + blocked + done || 1;
    const pct   = (v) => `${(v / total) * 100}%`;

    return (
        <Box>
            <Box sx={{ display: 'flex', height: 14, borderRadius: '100px', overflow: 'hidden' }}>
                {todo       > 0 && <Box sx={{ width: pct(todo),       bgcolor: BAR.todo }} />}
                {inProgress > 0 && <Box sx={{ width: pct(inProgress), bgcolor: BAR.inProgress }} />}
                {blocked    > 0 && <Box sx={{ width: pct(blocked),    bgcolor: BAR.blocked }} />}
                {done       > 0 && <Box sx={{ width: pct(done),       bgcolor: BAR.done }} />}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px 14px', mt: '8px' }}>
                {[
                    { label: `${todo} Todo`,              color: BAR.todo },
                    { label: `${inProgress} In Progress`, color: BAR.inProgress },
                    { label: `${blocked} Blocked`,        color: BAR.blocked },
                    { label: `${done} Done`,              color: BAR.done },
                ].map(({ label, color }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Box sx={{ width: 9, height: 9, bgcolor: color, borderRadius: '2px', flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.72rem', color: '#717171' }}>
                            {label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

function ProjectSprintCard({ projectName, sprintName, todo, inProgress, blocked, done }) {
    return (
        <Card
            variant="outlined"
            sx={{
                mb: '10px',
                boxShadow: 'none',
                border: '1px solid #e9e7e7',
                borderRadius: '8px',
            }}
        >
            <CardContent sx={{ p: '16px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '12px' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#1A1A1A' }}>
                        {projectName}
                    </Typography>
                    <Box
                        sx={{
                            px: '10px',
                            py: '3px',
                            bgcolor: '#d0e2e8',
                            borderRadius: '10px',
                        }}
                    >
                        <Typography sx={{ fontSize: '0.72rem', color: '#717171', fontWeight: 500 }}>
                            {sprintName}
                        </Typography>
                    </Box>
                </Box>
                <SprintProgressBar
                    todo={todo}
                    inProgress={inProgress}
                    blocked={blocked}
                    done={done}
                />
            </CardContent>
        </Card>
    );
}

function TaskItem({ status, title }) {
    return (
        <Card
            variant="outlined"
            sx={{
                mb: '8px',
                boxShadow: 'none',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
            }}
        >
            <CardContent
                sx={{
                    py: '10px !important',
                    px: '14px !important',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}
            >
                <Box
                    sx={{
                        px: '10px',
                        py: '3px',
                        bgcolor: (STATUS_BADGE[status] ?? STATUS_BADGE.TODO).bgcolor,
                        borderRadius: '10px',
                        flexShrink: 0,
                    }}
                >
                    <Typography sx={{ fontSize: '0.72rem', color: (STATUS_BADGE[status] ?? STATUS_BADGE.TODO).color, fontWeight: 500 }}>
                        {(STATUS_BADGE[status] ?? STATUS_BADGE.TODO).label}
                    </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.875rem', color: '#1A1A1A', flexGrow: 1 }}>
                    {title}
                </Typography>
                <KeyboardDoubleArrowUpIcon
                sx={{ color: '#C0392B', flexShrink: 0, fontSize: '1.1rem', fontWeight: 700 }}
                />
            </CardContent>
        </Card>
    );
}

export default function DashboardView({
    userName,
    activeSprintName,
    stats,
    projectSprints,
    myTasks,
    onViewBoard,
}) {
    return (
        <Box>
            {/* Welcome */}
            <Box sx={{ mb: '28px' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#1A1A1A', mb: '2px' }}>
                    Welcome back, {userName}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>
                    Here is what is happening with {activeSprintName} today.
                </Typography>
            </Box>

            {/* KPI stat cards */}
            <Grid container spacing="12px" sx={{ mb: '40px' }}>
                <Grid item xs={6} md={3}>
                    <StatCard
                        label="Open Tasks"
                        value={stats.openTasks}
                        subtitle={`Across ${stats.projectCount} projects`}
                        borderColor={STAT_BORDERS.openTasks}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        label="Completed"
                        value={stats.completed}
                        subtitle="This Sprint"
                        borderColor={STAT_BORDERS.completed}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        label="Blocked"
                        value={stats.blocked}
                        subtitle="Needs Attention"
                        borderColor={STAT_BORDERS.blocked}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        label="Avg cycle time"
                        value={`${stats.avgCycleTime} days`}
                        borderColor={STAT_BORDERS.avgCycleTime}
                        subtitleContent={
                            <Typography sx={{ fontSize: '0.78rem', color: '#C0392B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                ↓ {stats.cycleTimeChange}% vs Last sprint
                            </Typography>
                        }
                    />
                </Grid>
            </Grid>

            {/* Active Sprint Health + My Tasks */}
            <Grid container spacing="28px" alignItems="flex-start">
                {/* Left */}
                <Grid item xs={12} md={7}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '17px' }}>
                        <SectionTitle>Active Sprint Health</SectionTitle>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={onViewBoard}
                            sx={{
                                color: '#2B2B2B',
                                borderColor: '#e0dedc',
                                bgcolor: '#ffffff',
                                fontWeight: 500,
                                fontSize: '0.85rem',
                                px: '16px',
                                py: '6px',
                                '&:hover': { bgcolor: '#e0dedc', borderColor: '#e0dedc' },
                            }}
                        >
                            View Board
                        </Button>
                    </Box>

                    {projectSprints.length === 0 ? (
                        <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>No active sprints.</Typography>
                    ) : (
                        projectSprints.map(ps => (
                            <ProjectSprintCard
                                key={ps.projectId}
                                projectName={ps.projectName}
                                sprintName={ps.sprintName}
                                todo={ps.todo}
                                inProgress={ps.inProgress}
                                blocked={ps.blocked}
                                done={ps.done}
                            />
                        ))
                    )}
                </Grid>

                {/* Right */}
                <Grid item xs={12} md={5}>
                    <Box sx={{ mb: '19px' }}>
                        <SectionTitle>My Tasks</SectionTitle>
                    </Box>

                    {myTasks.length === 0 ? (
                        <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>No tasks assigned to you.</Typography>
                    ) : (
                        myTasks.map(task => (
                            <TaskItem key={task.id} status={task.status} title={task.title} />
                        ))
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
