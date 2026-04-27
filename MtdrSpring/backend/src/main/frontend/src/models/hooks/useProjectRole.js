import { useMemo } from 'react';
import { useCurrentUser } from '../CurrentUserContext';
import { useMembers } from './useMembers';
import { useActiveProject } from '../ProjectContext';

/**
 * Returns the current user's role in the active project.
 * role: 'PROJECT_MANAGER' | 'DEVELOPER' | null (not a member / loading)
 * isManager: true if PROJECT_MANAGER
 */
export function useProjectRole() {
  const { currentUser } = useCurrentUser();
  const { activeProject } = useActiveProject();
  const { data: members = [] } = useMembers(activeProject?.id);

  const role = useMemo(() => {
    if (!currentUser || !members.length) return null;
    const membership = members.find((m) => m.user?.id === currentUser.id);
    return membership?.role ?? null;
  }, [currentUser, members]);

  return { role, isManager: role === 'PROJECT_MANAGER' };
}
