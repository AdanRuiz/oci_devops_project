import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box, CircularProgress, Divider, FormControl, InputLabel,
    MenuItem, Select, Typography,
} from '@mui/material';
import client from '../../api/client';

const fetchProjects = ()           => client.get('/projects').then(r => r.data);
const fetchSprints  = (projectId)  => client.get(`/projects/${projectId}/sprints`).then(r => r.data);
const fetchKpi      = (sprintId)   => client.get(`/sprints/${sprintId}/kpi`).then(r => r.data);

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

export default function KpiDashboard() {
    const [projectId, setProjectId] = useState('');
    const [sprintId,  setSprintId]  = useState('');

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn:  fetchProjects,
    });

    const { data: sprints = [] } = useQuery({
        queryKey: ['sprints', projectId],
        queryFn:  () => fetchSprints(projectId),
        enabled:  !!projectId,
    });

    const { data: kpi, isLoading: loadingKpi } = useQuery({
        queryKey: ['kpi', sprintId],
        queryFn:  () => fetchKpi(sprintId),
        enabled:  !!sprintId,
    });

    return (
        <Box>
            <Typography variant="h5" gutterBottom>KPI Dashboard</Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl sx={{ minWidth: 220 }} size="small">
                    <InputLabel>Project</InputLabel>
                    <Select
                        value={projectId}
                        label="Project"
                        onChange={e => { setProjectId(e.target.value); setSprintId(''); }}
                    >
                        {projects.map(p => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 220 }} size="small" disabled={!projectId}>
                    <InputLabel>Sprint</InputLabel>
                    <Select
                        value={sprintId}
                        label="Sprint"
                        onChange={e => setSprintId(e.target.value)}
                    >
                        {sprints.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {loadingKpi && <CircularProgress />}

            {!sprintId && (
                <Typography color="text.secondary">Select a project and sprint to view KPIs.</Typography>
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
