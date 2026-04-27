import { useState, useEffect } from 'react';
import { useActiveProject } from '../models/ProjectContext';
import { useSprints } from '../models/hooks/useSprints';
import { useKpi } from '../models/hooks/useKpi';
import { useDeveloperStats } from '../models/hooks/useDeveloperStats';
import { useCurrentUser } from '../models/CurrentUserContext';
import KpiDashboardView from '../views/kpi/KpiDashboardView';

const STORAGE_KEY = 'kpiSelectedSprintId';

function pickDefaultSprint(sprints) {
  if (!sprints.length) return null;
  return (
    sprints.find((s) => s.status === 'ACTIVE') ??
    sprints.find((s) => s.status === 'COMPLETED') ??
    sprints[sprints.length - 1]
  );
}

export default function KpiDashboardController() {
  const { activeProject } = useActiveProject();
  const { currentUser } = useCurrentUser();
  const [sprintId, setSprintId] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');

  const { data: sprints = [] } = useSprints(activeProject?.id);
  const { data: kpi, isLoading: loadingKpi } = useKpi(sprintId);
  const { data: developerStats = [], isLoading: loadingStats } = useDeveloperStats(sprintId);

  // Clear stored sprint when switching projects so stale data isn't shown
  useEffect(() => {
    setSprintId('');
    localStorage.removeItem(STORAGE_KEY);
  }, [activeProject?.id]);

  // Auto-select a sprint when sprints load and none is selected
  useEffect(() => {
    if (sprintId || !sprints.length) return;
    const defaultSprint = pickDefaultSprint(sprints);
    if (defaultSprint) {
      setSprintId(defaultSprint.id);
      localStorage.setItem(STORAGE_KEY, defaultSprint.id);
    }
  }, [sprints, sprintId]);

  const handleSprintChange = (id) => {
    setSprintId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <KpiDashboardView
      projectName={activeProject?.name}
      sprints={sprints}
      sprintId={sprintId}
      kpi={kpi ?? null}
      developerStats={developerStats}
      currentUserEmail={currentUser?.email ?? null}
      loadingStats={loadingStats || loadingKpi}
      onSprintChange={handleSprintChange}
    />
  );
}
