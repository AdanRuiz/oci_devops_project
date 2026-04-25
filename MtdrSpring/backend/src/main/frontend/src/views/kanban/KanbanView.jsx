import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { ORANGE_ACCENT } from '../../styles/theme';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

const COLUMN_META = {
  TODO: { label: 'To-do', accent: '#2196F3' },
  IN_PROGRESS: { label: 'In progress', accent: '#d7790e' },
  BLOCKED: { label: 'Blocked', accent: '#F44336' },
  DONE: { label: 'Done', accent: '#4CAF50' },
};

const PRIORITY_BADGE = {
  LOW: { bgcolor: '#e8f5e9', color: '#2E7D32' },
  MEDIUM: { bgcolor: '#fff3cd', color: '#856404' },
  HIGH: { bgcolor: '#f8d7da', color: '#721c24' },
};

function PriorityBadge({ priority }) {
  const style = PRIORITY_BADGE[priority] ?? PRIORITY_BADGE.MEDIUM;
  const label = priority.charAt(0) + priority.slice(1).toLowerCase();
  return (
    <Box
      sx={{
        display: 'inline-flex',
        px: '8px',
        py: '2px',
        borderRadius: '20px',
        bgcolor: style.bgcolor,
      }}
    >
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: style.color }}>
        {label}
      </Typography>
    </Box>
  );
}

function TaskCard({ task, onTaskSelect }) {
  const projectName = task.projectName ?? 'Cloud PM Tool';
  const taskCode = `TS-${task.id}`;

  return (
    <Card
      onClick={() => onTaskSelect?.(task.id)}
      sx={{
        border: '1px solid #E8E8E8',
        borderRadius: '8px',
        boxShadow: 'none',
        bgcolor: '#ffffff',
        cursor: onTaskSelect ? 'pointer' : 'default',
        mb: '8px',
        '&:hover': onTaskSelect ? { borderColor: '#d0cecc', bgcolor: '#faf9f8' } : {},
      }}
    >
      <CardContent sx={{ p: '14px 16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: '8px' }}>
          <PriorityBadge priority={task.priority ?? 'MEDIUM'} />
        </Box>
        <Typography
          sx={{
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#1A1A1A',
            mb: '6px',
            lineHeight: 1.4,
          }}
        >
          {task.title}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: '#9E9E9E', mb: '4px' }}>
          {projectName}
        </Typography>
      </CardContent>
    </Card>
  );
}

function UserRow({ user, tasks, onTaskSelect }) {
  const userName = getUserName(user.email) ?? `User ${user.id}`;
  const totalTasks = tasks.length;

  return (
    <Box sx={{ mb: '32px' }} data-testid={`user-row-${user.id}`}>
      {/* User name */}
      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1A1A1A', mb: '12px' }}>
        {userName}{' '}
        <Typography
          component="span"
          sx={{ fontWeight: 400, color: '#9E9E9E', fontSize: '0.95rem' }}
        >
          ({totalTasks})
        </Typography>
      </Typography>

      {/* 4-column grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col);
          return (
            <Box
              key={col}
              sx={{
                bgcolor: '#f5f5f0',
                borderRadius: '8px',
                p: '12px',
                minHeight: '80px',
              }}
            >
              {colTasks.length === 0
                ? null
                : colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onTaskSelect={onTaskSelect} />
                  ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
const getUserName = (userEmail) => {
  // return everything before the @ in the email
  return userEmail.split('@')[0];
};
export default function KanbanView({
  projectName,
  sprints = [],
  sprintId = '',
  users = [],
  tasks = [],
  isLoading,
  onSprintChange,
  onTaskSelect,
}) {
  return (
    <Box>
      {/* Header row: title + sprint selector */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: '28px',
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#1A1A1A', mb: '2px' }}>
            Kanban Board
          </Typography>
          {projectName && (
            <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>{projectName}</Typography>
          )}
        </Box>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={sprintId}
            onChange={(e) => onSprintChange(e.target.value)}
            displayEmpty
            sx={{
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#2B2B2B',
              '& .MuiSelect-select': { fontSize: '0.85rem', fontWeight: 500 },
              bgcolor: '#fbf9f8',
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E8E8' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E8E8' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E8E8' },
              '& .MuiSelect-icon': { color: '#2B2B2B' },
            }}
          >
            <MenuItem value="" disabled sx={{ fontSize: '0.85rem', color: '#717171' }}>
              Select sprint…
            </MenuItem>
            {sprints.map((s) => (
              <MenuItem
                key={s.id}
                value={s.id}
                sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#2B2B2B' }}
              >
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!sprintId && (
        <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>
          Select a sprint to view the board.
        </Typography>
      )}

      {sprintId && isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '60px' }}>
          <CircularProgress />
        </Box>
      )}

      {sprintId && !isLoading && (
        <>
          {/* Column headers */}
          <Box
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', mb: '16px' }}
          >
            {COLUMNS.map((col) => (
              <Typography key={col} sx={{ fontWeight: 600, fontSize: '1rem', color: '#1A1A1A' }}>
                {COLUMN_META[col].label}
              </Typography>
            ))}
          </Box>

          {/* One row per user */}
          {users.map((user) => {
            const userId = user.id;
            const userTasks = tasks.filter((t) => (t.assignee?.id ?? t.assigneeId) === userId);
            return (
              <UserRow key={userId} user={user} tasks={userTasks} onTaskSelect={onTaskSelect} />
            );
          })}

          {/* Unassigned tasks */}
          {(() => {
            const assignedIds = new Set(users.map((u) => u.id));
            const unassigned = tasks.filter((t) => !t.assignee || !assignedIds.has(t.assignee.id));
            if (!unassigned.length) return null;
            return (
              <UserRow
                key="unassigned"
                user={{ id: 'unassigned', email: 'Unassigned' }}
                tasks={unassigned}
                onTaskSelect={onTaskSelect}
              />
            );
          })()}

          {users.length === 0 && tasks.length === 0 && (
            <Typography sx={{ fontSize: '0.875rem', color: '#9E9E9E' }}>
              No members found.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
