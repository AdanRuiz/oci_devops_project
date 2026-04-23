import { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useActiveProject } from '../models/ProjectContext';
import { useCurrentUser } from '../models/CurrentUserContext';
import { useMembers, useRemoveMember, useInviteMember } from '../models/hooks/useMembers';
import ProfileView from '../views/profile/ProfileView';

export default function ProfileController() {
    const auth = useAuth();
    const { activeProject } = useActiveProject();
    const { currentUser } = useCurrentUser();
    const projectId = activeProject?.id;
    const userEmail = currentUser?.email ?? auth.user?.profile?.email ?? '';
    const userRole  = currentUser?.systemRole === 'PROJECT_MANAGER' ? 'Project Manager'
                    : currentUser?.systemRole === 'ADMIN'           ? 'Admin'
                    : 'Developer';

    const [inviteSuccess, setInviteSuccess] = useState(false);

    const { data: allMembers = [], isLoading } = useMembers(projectId);
    const removeMutation = useRemoveMember(projectId);
    const inviteMutation = useInviteMember(projectId);

    const members = allMembers.filter(
        m => (m.user?.email ?? m.email) !== userEmail
    );

    const handleInvite = (email) => {
        setInviteSuccess(false);
        inviteMutation.mutate(email, {
            onSuccess: () => setInviteSuccess(true),
        });
    };

    return (
        <ProfileView
            userEmail={userEmail}
            userRole={userRole}
            projectName={activeProject?.name}
            members={members}
            isLoading={isLoading}
            onRemoveMember={(userId) => removeMutation.mutate(userId)}
            onInviteMember={handleInvite}
            isRemoving={removeMutation.isPending}
            isInviting={inviteMutation.isPending}
            inviteError={inviteMutation.error?.message}
            inviteSuccess={inviteSuccess}
        />
    );
}
