import { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useActiveProject } from '../models/ProjectContext';
import { useMembers, useRemoveMember, useInviteMember } from '../models/hooks/useMembers';
import ProfileView from '../views/profile/ProfileView';

export default function ProfileController() {
    const auth = useAuth();
    const { activeProject } = useActiveProject();
    const projectId = activeProject?.id;
    const userEmail = auth.user?.profile?.email || auth.user?.profile?.preferred_username || '';
    const userRole = auth.user?.profile?.job_title || auth.user?.profile?.role || 'Team member';

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
