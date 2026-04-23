import client from './client';

export const fetchTasks       = (sprintId) => client.get(`/sprints/${sprintId}/tasks`).then(r => r.data);
export const fetchTask        = (id) => client.get(`/tasks/${id}`).then(r => r.data);
export const fetchTaskHistory = (id) => client.get(`/tasks/${id}/history`).then(r => r.data);
export const fetchTaskWorkLogs = (id) => client.get(`/tasks/${id}/work-logs`).then(r => r.data);

export const createTask      = (sprintId, data) => client.post(`/sprints/${sprintId}/tasks`, data).then(r => r.data);
export const patchTaskStatus = (taskId, status) => client.patch(`/tasks/${taskId}/status`, { status }).then(r => r.data);
export const addWorkLog      = (taskId, data)   => client.post(`/tasks/${taskId}/work-logs`, data).then(r => r.data);
