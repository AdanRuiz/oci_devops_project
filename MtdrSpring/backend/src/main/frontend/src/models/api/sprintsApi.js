import client from './client';

export const fetchSprints = (projectId) => client.get(`/projects/${projectId}/sprints`).then(r => r.data);
export const fetchSprint = (id) => client.get(`/sprints/${id}`).then(r => r.data);
