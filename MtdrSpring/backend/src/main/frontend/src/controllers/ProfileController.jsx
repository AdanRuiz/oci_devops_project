import { useState } from 'react';
import { useActiveProject } from '../models/ProjectContext';
import { useMembers, useRemoveMember, useInviteMember } from '../models/hooks/useMembers';
import { APP_USER_EMAIL, APP_USER_ROLE } from '../views/common/Layout';
import ProfileView from '../views/profile/ProfileView';

export default function ProfileController() {
    const { activeProject } = useActiveProject();
    const projectId = activeProject?.id;

    const [inviteSuccess, setInviteSuccess] = useState(false);

    const { data: allMembers = [], isLoading } = useMembers(projectId);
    const removeMutation = useRemoveMember(projectId);
    const inviteMutation = useInviteMember(projectId);

    const members = allMembers.filter(
        m => (m.user?.email ?? m.email) !== APP_USER_EMAIL
    );

    const handleInvite = (email) => {
        setInviteSuccess(false);
        inviteMutation.mutate(email, {
            onSuccess: () => setInviteSuccess(true),
        });
    };

    return (
        <ProfileView
            userEmail={APP_USER_EMAIL}
            userRole={APP_USER_ROLE}
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
