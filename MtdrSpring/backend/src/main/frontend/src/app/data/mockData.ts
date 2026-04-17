export type Priority = 'high' | 'medium' | 'low';
export type Status = 'todo' | 'in-progress' | 'done';

export interface Developer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  assignedTasksCount: number;
  completedTasksCount: number;
  workloadPercentage: number;
  hoursWorked: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignedTo: string;
  assignedDeveloper?: Developer;
  dueDate: string;
  tags: string[];
  acceptanceCriteria: string[];
  comments: Comment[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export const developers: Developer[] = [
  { id: 'dev1', name: 'Sarah Chen', email: 'sarah.chen@company.com', avatar: 'SC', assignedTasksCount: 8, completedTasksCount: 5, workloadPercentage: 75, hoursWorked: 42 },
  { id: 'dev2', name: 'Marcus Johnson', email: 'marcus.j@company.com', avatar: 'MJ', assignedTasksCount: 6, completedTasksCount: 4, workloadPercentage: 60, hoursWorked: 35 },
  { id: 'dev3', name: 'Emily Rodriguez', email: 'emily.r@company.com', avatar: 'ER', assignedTasksCount: 7, completedTasksCount: 6, workloadPercentage: 85, hoursWorked: 48 },
  { id: 'dev4', name: 'David Kim', email: 'david.kim@company.com', avatar: 'DK', assignedTasksCount: 5, completedTasksCount: 3, workloadPercentage: 50, hoursWorked: 28 },
];

export interface Sprint {
  id: string;
  name: string;
}

export interface SprintDeveloperStats {
  sprintId: string;
  devId: string;
  assignedTasksCount: number;
  completedTasksCount: number;
  hoursWorked: number;
}

export const sprints: Sprint[] = [
  { id: 'sprint-1', name: 'Sprint 1' },
  { id: 'sprint-2', name: 'Sprint 2' },
  { id: 'sprint-3', name: 'Sprint 3' },
  { id: 'sprint-4', name: 'Sprint 4' },
  { id: 'sprint-5', name: 'Sprint 5' },
];

export const sprintDevStats: SprintDeveloperStats[] = [
  { sprintId: 'sprint-1', devId: 'dev1', assignedTasksCount: 3, completedTasksCount: 2, hoursWorked: 14 },
  { sprintId: 'sprint-1', devId: 'dev2', assignedTasksCount: 2, completedTasksCount: 2, hoursWorked: 12 },
  { sprintId: 'sprint-1', devId: 'dev3', assignedTasksCount: 3, completedTasksCount: 3, hoursWorked: 18 },
  { sprintId: 'sprint-1', devId: 'dev4', assignedTasksCount: 2, completedTasksCount: 1, hoursWorked: 10 },
  { sprintId: 'sprint-2', devId: 'dev1', assignedTasksCount: 3, completedTasksCount: 2, hoursWorked: 16 },
  { sprintId: 'sprint-2', devId: 'dev2', assignedTasksCount: 2, completedTasksCount: 1, hoursWorked: 13 },
  { sprintId: 'sprint-2', devId: 'dev3', assignedTasksCount: 2, completedTasksCount: 2, hoursWorked: 15 },
  { sprintId: 'sprint-2', devId: 'dev4', assignedTasksCount: 2, completedTasksCount: 1, hoursWorked: 9 },
  { sprintId: 'sprint-3', devId: 'dev1', assignedTasksCount: 2, completedTasksCount: 1, hoursWorked: 12 },
  { sprintId: 'sprint-3', devId: 'dev2', assignedTasksCount: 2, completedTasksCount: 1, hoursWorked: 10 },
  { sprintId: 'sprint-3', devId: 'dev3', assignedTasksCount: 2, completedTasksCount: 1, hoursWorked: 15 },
  { sprintId: 'sprint-3', devId: 'dev4', assignedTasksCount: 1, completedTasksCount: 1, hoursWorked: 9 },
  { sprintId: 'sprint-4', devId: 'dev1', assignedTasksCount: 2, completedTasksCount: 2, hoursWorked: 15 },
  { sprintId: 'sprint-4', devId: 'dev2', assignedTasksCount: 3, completedTasksCount: 2, hoursWorked: 14 },
  { sprintId: 'sprint-4', devId: 'dev3', assignedTasksCount: 2, completedTasksCount: 1, hoursWorked: 12 },
  { sprintId: 'sprint-4', devId: 'dev4', assignedTasksCount: 2, completedTasksCount: 2, hoursWorked: 11 },
  { sprintId: 'sprint-5', devId: 'dev1', assignedTasksCount: 3, completedTasksCount: 1, hoursWorked: 10 },
  { sprintId: 'sprint-5', devId: 'dev2', assignedTasksCount: 2, completedTasksCount: 1, hoursWorked: 8 },
  { sprintId: 'sprint-5', devId: 'dev3', assignedTasksCount: 3, completedTasksCount: 2, hoursWorked: 16 },
  { sprintId: 'sprint-5', devId: 'dev4', assignedTasksCount: 1, completedTasksCount: 0, hoursWorked: 6 },
];

export const tasks: Task[] = [
  { id: 'task-1', title: 'Implement user authentication system', description: 'Create a secure authentication system with JWT tokens, including login, registration, and password reset functionality.', status: 'in-progress', priority: 'high', assignedTo: 'dev1', dueDate: '2026-03-15', tags: ['Backend', 'Security', 'Authentication'], acceptanceCriteria: ['User can register with email and password','User can login with credentials','JWT tokens are generated and validated','Password reset flow works correctly','All endpoints are secured'], comments: [{ id: 'c1', author: 'Sarah Chen', content: 'Started working on the JWT implementation. Should have the basic structure ready by EOD.', timestamp: '2026-03-07T10:30:00Z' }, { id: 'c2', author: 'Project Manager', content: 'Great! Please make sure to include rate limiting for the login endpoint.', timestamp: '2026-03-07T11:15:00Z' }], attachments: ['auth-design.pdf'], createdAt: '2026-03-01T09:00:00Z', updatedAt: '2026-03-07T10:30:00Z' },
  { id: 'task-2', title: 'Design and implement database schema', description: 'Create comprehensive database schema for all application entities including users, projects, tasks, and relationships.', status: 'done', priority: 'high', assignedTo: 'dev2', dueDate: '2026-03-10', tags: ['Database','Backend','Architecture'], acceptanceCriteria: ['All tables are created with proper relationships','Indexes are added for performance','Migration scripts are documented','Schema is reviewed by team lead'], comments: [{ id: 'c3', author: 'Marcus Johnson', content: 'Database schema completed and reviewed. All migrations are in place.', timestamp: '2026-03-06T16:45:00Z' }], attachments: ['schema-diagram.png','migration-scripts.sql'], createdAt: '2026-02-28T09:00:00Z', updatedAt: '2026-03-06T16:45:00Z' },
  { id: 'task-3', title: 'Build responsive dashboard UI', description: 'Create a modern, responsive dashboard interface with charts, widgets, and data visualization components.', status: 'in-progress', priority: 'medium', assignedTo: 'dev3', dueDate: '2026-03-20', tags: ['Frontend','UI/UX','React'], acceptanceCriteria: ['Dashboard is responsive on all screen sizes','Charts display data correctly','Loading states are implemented','Dashboard is accessible'], comments: [], attachments: ['dashboard-mockup.fig'], createdAt: '2026-03-02T09:00:00Z', updatedAt: '2026-03-07T14:20:00Z' },
  { id: 'task-4', title: 'Set up CI/CD pipeline', description: 'Configure continuous integration and deployment pipeline using GitHub Actions or similar tool.', status: 'todo', priority: 'high', assignedTo: 'dev4', dueDate: '2026-03-12', tags: ['DevOps', 'CI/CD', 'Infrastructure'], acceptanceCriteria: ['Pipeline runs on every PR','Automated tests are executed','Code coverage reports are generated','Deployment to staging is automated'], comments: [], attachments: [], createdAt: '2026-03-03T09:00:00Z', updatedAt: '2026-03-03T09:00:00Z' },
  { id: 'task-5', title: 'Implement API rate limiting', description: 'Add rate limiting middleware to protect API endpoints from abuse and ensure fair usage.', status: 'todo', priority: 'medium', assignedTo: 'dev1', dueDate: '2026-03-18', tags: ['Backend', 'Security', 'API'], acceptanceCriteria: ['Rate limits are configured per endpoint','Proper error messages are returned','Rate limit headers are included in responses','Admin endpoints have stricter limits'], comments: [], attachments: ['rate-limiting-spec.md'], createdAt: '2026-03-04T09:00:00Z', updatedAt: '2026-03-04T09:00:00Z' },
  { id: 'task-6', title: 'Create user profile management', description: 'Build user profile page with ability to update personal information, avatar, and preferences.', status: 'todo', priority: 'low', assignedTo: 'dev3', dueDate: '2026-03-25', tags: ['Frontend', 'User Management'], acceptanceCriteria: ['Users can update their profile information','Avatar upload works correctly','Changes are saved and persisted','Form validation is implemented'], comments: [], attachments: [], createdAt: '2026-03-05T09:00:00Z', updatedAt: '2026-03-05T09:00:00Z' },
];

export function getTasksByDeveloper(devId: string) {
  return tasks.filter(t => t.assignedTo === devId).map(t => ({ ...t, assignedDeveloper: developers.find(d => d.id === t.assignedTo) }));
}

export function getTaskById(id: string) {
  const t = tasks.find(x => x.id === id);
  return t ? { ...t, assignedDeveloper: developers.find(d => d.id === t.assignedTo) } : undefined;
}

export function getStats(devId?: string) {
  const relevant = devId ? tasks.filter(t => t.assignedTo === devId) : tasks;
  const total = relevant.length;
  const done = relevant.filter(t => t.status === 'done').length;
  const inProgress = relevant.filter(t => t.status === 'in-progress').length;
  const todo = relevant.filter(t => t.status === 'todo').length;
  const highPriority = relevant.filter(t => t.priority === 'high').length;
  return { total, done, inProgress, todo, highPriority };
}
