import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { outlinedButtonSx, containedButtonSx } from '../../styles/theme';

function getInitials(email = '') {
  const local = email.split('@')[0];
  const parts = local.split('.');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function getDisplayName(email = '') {
  const local = email.split('@')[0];
  return local
    .split('.')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getMemberEmail(m) {
  return m.user?.email ?? m.email ?? '';
}
function getMemberId(m) {
  return m.user?.id ?? m.id;
}

function StatColumn({ label, value }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.78rem', color: '#9E9E9E', mb: '4px', fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1A1A1A' }}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}

function MemberCard({ member, onRemove, isRemoving }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const userId = getMemberId(member);
  const email = getMemberEmail(member);
  const displayName = getDisplayName(email);

  return (
    <>
      <Card
        sx={{
          border: '1px solid #E8E8E8',
          borderRadius: '8px',
          boxShadow: 'none',
          bgcolor: '#ffffff',
        }}
      >
        <CardContent
          sx={{ p: '14px 16px !important', display: 'flex', alignItems: 'center', gap: '14px' }}
        >
          {/* Square avatar */}
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '8px',
              bgcolor: '#2B2B2B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
              {getInitials(email)}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1A1A1A' }} noWrap>
              {displayName}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#717171' }} noWrap>
              {email}
            </Typography>
          </Box>

          {onRemove && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setConfirmOpen(true)}
              sx={{
                ...outlinedButtonSx,
                color: '#C62828',
                borderColor: '#FFCDD2',
                flexShrink: 0,
                '&:hover': { bgcolor: '#FFEBEE', borderColor: '#FFCDD2' },
              }}
            >
              Remove
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: '12px', p: '8px', minWidth: 320 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: '8px' }}>
          Remove member?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>
            <strong style={{ color: '#1A1A1A' }}>{displayName}</strong> will be removed from the
            project and lose access immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: '24px', pb: '16px', gap: '8px' }}>
          <Button variant="outlined" onClick={() => setConfirmOpen(false)} sx={outlinedButtonSx}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={isRemoving}
            onClick={() => {
              onRemove(userId);
              setConfirmOpen(false);
            }}
            sx={{ ...containedButtonSx, bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' } }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function ProfileView({
  userEmail,
  userRole,
  projectName,
  totalMembers,
  members = [],
  isLoading,
  isManager,
  onRemoveMember,
  onInviteMember,
  isRemoving,
  isInviting,
  inviteError,
  inviteSuccess,
}) {
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = () => {
    const trimmed = inviteEmail.trim();
    if (!trimmed) return;
    onInviteMember(trimmed);
    setInviteEmail('');
  };

  const displayName = getDisplayName(userEmail);
  const initials = getInitials(userEmail);

  return (
    <Box>
      {/* Page title */}
      <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#1A1A1A' }}>
        Team Management
      </Typography>

      {/* Personal profile card */}
      <Card
        sx={{
          border: '1px solid #E8E8E8',
          borderRadius: '8px',
          boxShadow: 'none',
          bgcolor: '#ffffff',
          mb: '24px',
        }}
      >
        <CardContent sx={{ p: '28px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '40px' }}>
            {/* Avatar + name */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px', flexShrink: 0 }}>
              <Box
                sx={{
                  width: 130,
                  height: 130,
                  borderRadius: '12px',
                  bgcolor: '#2B2B2B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  sx={{
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '2.4rem',
                    letterSpacing: '0.04em',
                  }}
                >
                  {initials}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#1A1A1A' }}>
                  {displayName}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: '#717171', mt: '2px' }}>
                  {userRole}
                </Typography>
              </Box>
            </Box>

            {/* Stat columns */}
            <Box sx={{ display: 'flex', gap: '48px', pt: '8px', flexWrap: 'wrap' }}>
              <StatColumn label="Role" value={userRole} />
              <StatColumn label="Project" value={projectName} />
              <StatColumn
                label="Team"
                value={`${totalMembers} member${totalMembers !== 1 ? 's' : ''}`}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Team management card */}
      <Card
        sx={{
          border: '1px solid #E8E8E8',
          borderRadius: '8px',
          boxShadow: 'none',
          bgcolor: '#ffffff',
        }}
      >
        <CardContent sx={{ p: '28px !important' }}>
          {/* Invite section — managers only */}
          {isManager && (
            <Box data-testid="invite-section">
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', mb: '12px' }}>
                Invite member
              </Typography>
              <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start', mb: '32px' }}>
                <TextField
                  size="small"
                  placeholder="colleague@oracle.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  error={!!inviteError}
                  helperText={inviteError ?? (inviteSuccess ? 'Invite sent!' : undefined)}
                  FormHelperTextProps={{
                    sx: { color: inviteSuccess && !inviteError ? '#2E7D32' : undefined },
                  }}
                  sx={{
                    flexGrow: 1,
                    '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.875rem' },
                  }}
                />
                <Button
                  variant="contained"
                  disabled={isInviting || !inviteEmail.trim()}
                  onClick={handleInvite}
                  sx={{ ...containedButtonSx, flexShrink: 0, py: '8px' }}
                >
                  {isInviting ? 'Sending…' : 'Send invite'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Members list */}
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1A1A1A', mb: '12px' }}>
            Members{members.length > 0 ? ` (${members.length})` : ''}
          </Typography>

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: '40px' }}>
              <CircularProgress />
            </Box>
          )}

          {!isLoading && members.length === 0 && (
            <Typography sx={{ fontSize: '0.875rem', color: '#9E9E9E' }}>
              No members in this project yet.
            </Typography>
          )}

          <Box
            data-testid="members-list"
            sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            {members.map((m) => (
              <MemberCard
                key={getMemberId(m)}
                member={m}
                onRemove={isManager ? onRemoveMember : null}
                isRemoving={isRemoving}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
