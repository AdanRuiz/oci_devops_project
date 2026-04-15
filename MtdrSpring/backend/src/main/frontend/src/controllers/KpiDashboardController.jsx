import { useState } from 'react';
import { useActiveProject } from '../models/ProjectContext';
import { useSprints } from '../models/hooks/useSprints';
import { useKpi } from '../models/hooks/useKpi';
import KpiDashboardView from '../views/kpi/KpiDashboardView';

export default function KpiDashboardController() {
    const { activeProject } = useActiveProject();
    const [sprintId, setSprintId] = useState('');

    const { data: sprints = [] } = useSprints(activeProject?.id);
    const { data: kpi, isLoading: loadingKpi } = useKpi(sprintId);

    return (
        <KpiDashboardView
            projectName={activeProject?.name}
            sprints={sprints}
            sprintId={sprintId}
            kpi={kpi}
            loadingKpi={loadingKpi}
            onSprintChange={(id) => setSprintId(id)}
        />
    );
}
