import { useState } from 'react';
import { useActiveProject } from '../models/ProjectContext';
import { useSprints } from '../models/hooks/useSprints';
import { useDeveloperStats } from '../models/hooks/useDeveloperStats';
import KpiDashboardView from '../views/kpi/KpiDashboardView';

const STORAGE_KEY = 'kpiSelectedSprintId';

export default function KpiDashboardController() {
    const { activeProject } = useActiveProject();
    const [sprintId, setSprintId] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');

    const { data: sprints = [] } = useSprints(activeProject?.id);
    const { data: developerStats = [], isLoading: loadingStats } = useDeveloperStats(sprintId);

    const handleSprintChange = (id) => {
        setSprintId(id);
        localStorage.setItem(STORAGE_KEY, id);
    };

    return (
        <KpiDashboardView
            projectName={activeProject?.name}
            sprints={sprints}
            sprintId={sprintId}
            developerStats={developerStats}
            loadingStats={loadingStats}
            onSprintChange={handleSprintChange}
        />
    );
}
