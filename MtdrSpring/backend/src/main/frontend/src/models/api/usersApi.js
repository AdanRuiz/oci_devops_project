import client from './client';

export const fetchUsers = () => client.get('/users').then((r) => r.data);
export const fetchMe = () => client.get('/users/me').then((r) => r.data);
