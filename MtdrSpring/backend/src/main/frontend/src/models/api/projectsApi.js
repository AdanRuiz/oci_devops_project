import client from './client';

export const fetchProjects = () => client.get('/projects').then(r => r.data);
export const fetchProject = (id) => client.get(`/projects/${id}`).then(r => r.data);
export const createProject = (data) => client.post('/projects', data);
