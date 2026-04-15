import {
    Box, CircularProgress, Divider, FormControl, InputLabel,
    MenuItem, Select, Typography,
} from '@mui/material';

function KpiRow({ label, value, unit = '' }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography color="text.secondary">{label}</Typography>
            <Typography fontWeight="medium">
                {value != null ? `${value} ${unit}`.trim() : '—'}
            </Typography>
        </Box>
    );
}

export default function KpiDashboardView({
    projectName, sprints, sprintId,
    kpi, loadingKpi, onSprintChange,
}) {
    return (
        <Box>
            <Typography variant="h5" gutterBottom>KPI Dashboard</Typography>
            {projectName && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Project: <strong>{projectName}</strong>
                </Typography>
            )}

            <Box sx={{ mb: 3 }}>
                <FormControl sx={{ minWidth: 220 }} size="small">
                    <InputLabel>Sprint</InputLabel>
                    <Select
                        value={sprintId}
                        label="Sprint"
                        onChange={e => onSprintChange(e.target.value)}
                    >
                        {sprints.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {loadingKpi && <CircularProgress />}

            {!sprintId && (
                <Typography color="text.secondary">Select a sprint to view KPIs.</Typography>
            )}

            {sprintId && !loadingKpi && !kpi && (
                <Typography color="text.secondary">
                    No snapshot yet. Close the sprint to compute KPIs.
                </Typography>
            )}

            {kpi && (
                <Box sx={{ maxWidth: 480 }}>
                    <Divider sx={{ mb: 1 }} />
                    <KpiRow label="Avg Cycle Time"         value={kpi.avgCycleTimeDays}      unit="days" />
                    <KpiRow label="Scope Creep Rate"       value={kpi.scopeCreepRatePct}     unit="%" />
                    <KpiRow label="Avg Blocker Resolution" value={kpi.blockerResolutionDays} unit="days" />
                    <KpiRow label="Tasks Reworked"         value={kpi.tasksReworked} />
                    <KpiRow label="Tasks Completed"        value={kpi.tasksCompleted} />
                    <KpiRow label="Total Days Worked"      value={kpi.totalDaysWorked}       unit="days" />
                    <Divider sx={{ mt: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                        Computed: {kpi.calculatedAt}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
