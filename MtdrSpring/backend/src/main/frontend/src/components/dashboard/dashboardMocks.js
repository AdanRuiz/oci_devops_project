/** Frontend-only samples when /teams (or peers) are unreachable. */

export const MOCK_TEAMS = [
  {
    id: 1,
    name: 'Lumen Core',
    managerId: 1,
    users: [
      { id: 1, name: 'Alex Rivera', email: 'alex@lumen.app' },
      { id: 2, name: 'James Cole', email: 'james@lumen.app' },
      { id: 3, name: 'Jessie Park', email: 'jessie@lumen.app' },
    ],
  },
  {
    id: 2,
    name: 'Mobile App',
    managerId: 1,
    users: [
      { id: 4, name: 'Jacob Lee', email: 'jacob@lumen.app' },
      { id: 5, name: 'Jean Martin', email: 'jean@lumen.app' },
    ],
  },
  {
    id: 3,
    name: 'Platform Ops',
    managerId: 2,
    users: [
      { id: 6, name: 'Morgan Blake', email: 'morgan@lumen.app' },
      { id: 7, name: 'Sam Ortiz', email: 'sam@lumen.app' },
      { id: 8, name: 'Taylor Kim', email: 'taylor@lumen.app' },
      { id: 9, name: 'Riley Chen', email: 'riley@lumen.app' },
    ],
  },
  {
    id: 4,
    name: 'Legacy Release',
    managerId: 1,
    users: [{ id: 10, name: 'Pat Rivera', email: 'pat@lumen.app' }],
  },
];

export const MOCK_TASKS = [
  {
    id: 1,
    title: 'Auth middleware',
    status: 'IN_PROGRESS',
    assignedTo: 1,
    sprint: { id: 1, name: 'Sprint 12' },
  },
  {
    id: 2,
    title: 'Dashboard widgets',
    status: 'DONE',
    assignedTo: 2,
    sprint: { id: 1, name: 'Sprint 12' },
  },
  {
    id: 3,
    title: 'Push notifications',
    status: 'TODO',
    assignedTo: 4,
    sprint: { id: 2, name: 'Sprint 4' },
  },
  {
    id: 4,
    title: 'CI pipeline',
    status: 'IN_PROGRESS',
    assignedTo: 6,
    sprint: { id: 3, name: 'Sprint 8' },
  },
  {
    id: 5,
    title: 'v1.0 rollout',
    status: 'DONE',
    assignedTo: 10,
    sprint: { id: 4, name: 'Sprint 2' },
  },
  {
    id: 6,
    title: 'Security audit',
    status: 'DONE',
    assignedTo: 10,
    sprint: { id: 4, name: 'Sprint 2' },
  },
];

export const MOCK_SPRINTS = [
  {
    id: 1,
    name: 'Sprint 12',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  },
  {
    id: 2,
    name: 'Sprint 4',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 11 * 86400000).toISOString(),
  },
  {
    id: 3,
    name: 'Sprint 8',
    startDate: new Date(Date.now() - 14 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 1 * 86400000).toISOString(),
  },
];
