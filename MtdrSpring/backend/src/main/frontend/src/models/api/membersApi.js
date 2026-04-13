import client from './client';

export const fetchMembers = (projectId) => client.get(`/projects/${projectId}/members`).then(r => r.data);
