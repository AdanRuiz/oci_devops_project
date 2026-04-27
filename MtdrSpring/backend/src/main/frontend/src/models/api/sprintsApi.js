import client from './client';

export const fetchSprints = (projectId) =>
  client.get(`/projects/${projectId}/sprints`).then((r) => r.data);
export const fetchSprint = (id) => client.get(`/sprints/${id}`).then((r) => r.data);
export const createSprint = (projectId, data) =>
  client.post(`/projects/${projectId}/sprints`, data).then((r) => r.data);
export const deleteSprint = (id) => client.delete(`/sprints/${id}`).then((r) => r.data);
