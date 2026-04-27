import client from './client';

export const fetchKpi = (sprintId) => client.get(`/sprints/${sprintId}/kpi`).then((r) => r.data);

export const fetchDeveloperStats = (sprintId) =>
  client.get(`/sprints/${sprintId}/kpi/developer-stats`).then((r) => r.data);
