import { useState } from 'react';
import { useProjects } from '../models/hooks/useProjects';
import { useSprints } from '../models/hooks/useSprints';
import { useKpi } from '../models/hooks/useKpi';
import KpiDashboardView from '../views/kpi/KpiDashboardView';

export default function KpiDashboardController() {
    const [projectId, setProjectId] = useState('');
    const [sprintId,  setSprintId]  = useState('');

    const { data: projects = [] } = useProjects();
    const { data: sprints = [] } = useSprints(projectId);
    const { data: kpi, isLoading: loadingKpi } = useKpi(sprintId);

    return (
        <KpiDashboardView
            projects={projects}
            sprints={sprints}
            projectId={projectId}
            sprintId={sprintId}
            kpi={kpi}
            loadingKpi={loadingKpi}
            onProjectChange={(id) => { setProjectId(id); setSprintId(''); }}
            onSprintChange={(id) => setSprintId(id)}
        />
    );
}
