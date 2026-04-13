import client from './client';

export const fetchKpi = (sprintId) => client.get(`/sprints/${sprintId}/kpi`).then(r => r.data);
