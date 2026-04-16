import {
    Box, Card, CardContent, CircularProgress,
    FormControl, Grid, MenuItem, Select, Typography,
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ORANGE_ACCENT } from '../../styles/theme';

const BAR_TASKS = '#31a09c';
const BAR_HOURS = '#d7790e';

const STAT_BORDERS = {
    tasks:    '#2196F3',
    hours:    '#4CAF50',
    avgTasks: '#9C27B0',
    avgHours: ORANGE_ACCENT,
};

const TOOLTIP_STYLE = {
    borderRadius: '8px',
    border: '1px solid #E8E8E8',
    fontSize: '0.8rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

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

function StatCard({ label, value, description, borderColor }) {
    return (
        <Card sx={{ border: '1px solid #E8E8E8', borderRadius: '8px', boxShadow: 'none', bgcolor: '#fbf9f8', height: '100%' }}>
            <CardContent sx={{ p: '20px !important' }}>
                <Box sx={{ height: '3px', bgcolor: borderColor, borderRadius: '10px', mb: '14px' }} />
                <Typography sx={{ fontSize: '0.9rem', color: '#1A1A1A', mb: '10px' }}>{label}</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', lineHeight: 1, color: '#1A1A1A', mb: '10px' }}>
                    {value ?? '—'}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: '#717171' }}>{description}</Typography>
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, children }) {
    return (
        <Card sx={{ border: '1px solid #E8E8E8', borderRadius: '8px', boxShadow: 'none', bgcolor: '#fbf9f8' }}>
            <CardContent sx={{ p: '20px !important' }}>
                <Box sx={{ mb: '20px' }}><SectionTitle>{title}</SectionTitle></Box>
                {children}
            </CardContent>
        </Card>
    );
}

function StatBarChart({ data, dataKey, fill, tooltipFormatter }) {
    return (
        <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 36 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#717171' }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#717171' }} allowDecimals={false} width={28} axisLine={false} tickLine={false} />
                <Tooltip formatter={tooltipFormatter} contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey={dataKey} fill={fill} radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default function KpiDashboardView({
    projectName, sprints, sprintId,
    developerStats, loadingStats, onSprintChange,
}) {
    const totalTasks = developerStats.reduce((s, d) => s + d.totalAssigned, 0);
    const totalHours = developerStats.reduce((s, d) => s + Number(d.totalDaysWorked ?? 0), 0) * 8;
    const devCount   = developerStats.length || 1;
    const avgTasks   = developerStats.length ? (developerStats.reduce((s, d) => s + d.tasksCompleted, 0) / devCount).toFixed(1) : '—';
    const avgHours   = developerStats.length ? (totalHours / devCount).toFixed(1) : '—';

    const chartData = developerStats.map(d => ({
        name: d.email.split('@')[0],
        tasksCompleted: d.tasksCompleted,
        totalHours: Number((Number(d.totalDaysWorked ?? 0) * 8).toFixed(1)),
    }));

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '28px' }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#1A1A1A', mb: '2px' }}>
                        KPI Dashboard
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>
                        Performance metrics per developer
                    </Typography>
                </Box>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                        value={sprintId}
                        onChange={e => onSprintChange(e.target.value)}
                        displayEmpty
                        sx={{
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: '#2B2B2B',
                            '& .MuiSelect-select': { fontSize: '0.85rem', fontWeight: 500 },
                            bgcolor: '#fbf9f8',
                            borderRadius: '8px',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E8E8' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E8E8' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E8E8' },
                            '& .MuiSelect-icon': { color: '#2B2B2B' },
                            '&:hover': { bgcolor: '#fbf9f8' },
                        }}
                    >
                        <MenuItem value="" disabled sx={{ fontSize: '0.85rem', color: '#717171' }}>
                            Select sprint…
                        </MenuItem>
                        {sprints.map(s => (
                            <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#2B2B2B' }}>
                                {s.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {!sprintId && (
                <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>
                    Select a sprint to view KPIs.
                </Typography>
            )}

            {sprintId && loadingStats && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: '60px' }}>
                    <CircularProgress />
                </Box>
            )}

            {sprintId && !loadingStats && (
                <>
                    <Grid container spacing="28px" sx={{ mb: '40px' }}>
                        <Grid item xs={12} md={6}>
                            <ChartCard title="Sprint Totals">
                                <Grid container spacing="12px">
                                    <Grid item xs={6}>
                                        <StatCard
                                            label="Total Tasks"
                                            value={totalTasks}
                                            description="All tasks assigned this sprint"
                                            borderColor={STAT_BORDERS.tasks}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <StatCard
                                            label="Total Real Hours"
                                            value={totalHours.toFixed(1)}
                                            description="Sum of hours logged by all developers"
                                            borderColor={STAT_BORDERS.hours}
                                        />
                                    </Grid>
                                </Grid>
                            </ChartCard>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <ChartCard title="Per-Developer Averages">
                                <Grid container spacing="12px">
                                    <Grid item xs={6}>
                                        <StatCard
                                            label="Avg Tasks / Developer"
                                            value={avgTasks}
                                            description="Mean completed tasks per developer"
                                            borderColor={STAT_BORDERS.avgTasks}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <StatCard
                                            label="Avg Hours / Developer"
                                            value={avgHours}
                                            description="Mean hours worked per developer"
                                            borderColor={STAT_BORDERS.avgHours}
                                        />
                                    </Grid>
                                </Grid>
                            </ChartCard>
                        </Grid>
                    </Grid>

                    {developerStats.length === 0 ? (
                        <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>
                            No developer data found for this sprint.
                        </Typography>
                    ) : (
                        <Grid container spacing="28px">
                            <Grid item xs={12} md={6}>
                                <ChartCard title="Completed Tasks by Developer">
                                    <StatBarChart
                                        data={chartData}
                                        dataKey="tasksCompleted"
                                        fill={BAR_TASKS}
                                        tooltipFormatter={v => [v, 'Completed Tasks']}
                                    />
                                </ChartCard>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <ChartCard title="Real Hours by Developer">
                                    <StatBarChart
                                        data={chartData}
                                        dataKey="totalHours"
                                        fill={BAR_HOURS}
                                        tooltipFormatter={v => [`${v}h`, 'Hours Worked']}
                                    />
                                </ChartCard>
                            </Grid>
                        </Grid>
                    )}
                </>
            )}
        </Box>
    );
}
