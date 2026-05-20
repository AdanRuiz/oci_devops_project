import moment from 'moment';
import API_LIST from '../../API';

export const DEV_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DONE', label: 'Done' },
];

export function buildTaskPutBody(task, patch = {}) {
  return {
    title: patch.title ?? task.title,
    description: patch.description ?? task.description ?? '',
    status: patch.status ?? task.status,
    priority: patch.priority ?? task.priority,
    expectedHours: Number(patch.expectedHours ?? task.expectedHours ?? 0),
    hoursDone: task.hoursDone ?? 0,
    isBug: patch.isBug ?? task.isBug ?? false,
    assignedTo: task.assignedTo ?? 1,
    createdBy: task.createdBy ?? 1,
    vector: task.vector ?? 'web',
  };
}

export async function fetchTaskById(id) {
  const response = await fetch(`${API_LIST}/${id}`);
  if (!response.ok) throw new Error('Could not reload task');
  return response.json();
}

export async function updateTask(task, patch) {
  const response = await fetch(`${API_LIST}/${task.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildTaskPutBody(task, patch)),
  });
  if (!response.ok) throw new Error('Could not update task');
  return response.json();
}

export async function updateTaskSprint(task, newSprintId) {
  const previousSprintId = task.sprint?.id ?? null;
  const nextSprintId = newSprintId ? Number(newSprintId) : null;

  if (previousSprintId === nextSprintId) {
    return fetchTaskById(task.id);
  }

  if (previousSprintId) {
    const unlink = await fetch(`/sprint-tasks/${previousSprintId}/${task.id}`, { method: 'DELETE' });
    if (!unlink.ok) throw new Error('Could not remove task from previous sprint');
  }

  if (nextSprintId) {
    const link = await fetch('/sprint-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: { sprintId: nextSprintId, taskId: task.id },
        addedAt: moment().format('YYYY-MM-DDTHH:mm:ss'),
      }),
    });
    if (!link.ok) throw new Error('Could not assign task to sprint');
  }

  return fetchTaskById(task.id);
}

export async function saveTaskEdits(task, formData) {
  const updated = await updateTask(task, {
    title: formData.title.trim(),
    description: formData.description.trim(),
    priority: formData.priority,
    expectedHours: Number(formData.expectedHours),
    isBug: formData.isBug,
  });
  return updateTaskSprint(updated, formData.sprintId ? Number(formData.sprintId) : null);
}

export function nextStatus(current) {
  const normalized = String(current || 'PENDING').toUpperCase();
  if (normalized === 'PENDING') return 'IN_PROGRESS';
  if (normalized === 'IN_PROGRESS') return 'DONE';
  return 'DONE';
}
