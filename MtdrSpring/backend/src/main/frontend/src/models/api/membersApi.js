import client from './client';

export const fetchMembers  = (projectId)         => client.get(`/projects/${projectId}/members`).then(r => r.data);
export const removeMember  = (projectId, userId)  => client.delete(`/projects/${projectId}/members/${userId}`);
export const inviteMember  = (projectId, email)   => client.post(`/projects/${projectId}/members`, { email });
