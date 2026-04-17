export type Priority = 'high' | 'medium' | 'low';
export type Status = 'todo' | 'in-progress' | 'done';

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface DeveloperSummary {
  id: string;
  name: string;
  initials: string;
}

export interface DeveloperMetrics extends DeveloperSummary {
  assignedTasksCount: number;
  completedTasksCount: number;
  hoursWorked: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignedTo: string;
  assignedDeveloper?: DeveloperSummary;
  dueDate: string;
  tags: string[];
  acceptanceCriteria: string[];
  comments: Comment[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  estimatedHours: number;
  realHours: number | null;
}

export interface BackendTask {
  taskID: number;
  name: string;
  description: string;
  status: string;
  taskType: string;
  startDate: string;
  deadline: string;
  developerID: number;
  estimatedTime: number;
  timeSpent?: number;
  priority: string;
  projectID: number;
  createdAt: string;
  updatedAt: string;
  sprint?: number;
}

interface BackendDeveloperSummary {
  developerId: number;
  fullName: string;
}

function toFrontendStatus(status: string): Status {
  if (status === 'closed') return 'done';
  if (status === 'in_progress') return 'in-progress';
  return 'todo';
}

function toBackendStatus(status: Status): string {
  if (status === 'done') return 'closed';
  if (status === 'in-progress') return 'in_progress';
  return 'open';
}

function toFrontendPriority(priority: string): Priority {
  const normalized = (priority || '').toUpperCase();
  if (normalized === 'HIGH') return 'high';
  if (normalized === 'LOW') return 'low';
  return 'medium';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function toFrontendTask(task: BackendTask, developersById: Map<string, DeveloperSummary>): Task {
  const assignedTo = String(task.developerID);
  const assignedDeveloper = developersById.get(assignedTo);

  return {
    id: String(task.taskID),
    title: task.name,
    description: task.description,
    status: toFrontendStatus(task.status),
    priority: toFrontendPriority(task.priority),
    assignedTo,
    assignedDeveloper,
    dueDate: task.deadline,
    tags: task.taskType ? [task.taskType] : [],
    acceptanceCriteria: [],
    comments: [],
    attachments: [],
    createdAt: task.createdAt ?? task.startDate,
    updatedAt: task.updatedAt ?? task.startDate,
    estimatedHours: task.estimatedTime,
    realHours: task.timeSpent ?? null,
  };
}

export async function fetchDeveloperSummaries(): Promise<DeveloperSummary[]> {
  const response = await fetch('/api/developers');
  if (!response.ok) {
    throw new Error('Could not load developers');
  }
  const data = (await response.json()) as BackendDeveloperSummary[];
  return data.map((item) => ({
    id: String(item.developerId),
    name: item.fullName,
    initials: getInitials(item.fullName),
  }));
}

export async function fetchTasks(): Promise<BackendTask[]> {
  const response = await fetch('/api/tasks');
  if (!response.ok) {
    throw new Error('Could not load tasks');
  }
  return (await response.json()) as BackendTask[];
}

export async function fetchTaskById(taskId: string): Promise<BackendTask> {
  const response = await fetch(`/api/tasks/${taskId}`);
  if (!response.ok) {
    throw new Error('Could not load task');
  }
  return (await response.json()) as BackendTask;
}

export async function updateTaskStatus(taskId: string, status: Status): Promise<void> {
  const response = await fetch(`/api/tasks/${taskId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: toBackendStatus(status) }),
  });
  if (!response.ok) {
    throw new Error('Could not update task status');
  }
}

export function buildFrontendTasks(tasks: BackendTask[], developers: DeveloperSummary[]): Task[] {
  const developerMap = new Map<string, DeveloperSummary>(developers.map((d) => [d.id, d]));
  return tasks.map((task) => toFrontendTask(task, developerMap));
}

export function buildFrontendTask(task: BackendTask, developers: DeveloperSummary[]): Task {
  const developerMap = new Map<string, DeveloperSummary>(developers.map((d) => [d.id, d]));
  return toFrontendTask(task, developerMap);
}

export function getStats(tasks: Task[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const highPriority = tasks.filter((t) => t.priority === 'high').length;
  return { total, done, inProgress, todo, highPriority };
}

export function getTasksByDeveloper(tasks: Task[], developerId: string) {
  return tasks.filter((task) => task.assignedTo === developerId);
}

export function buildDeveloperMetricsFromBackend(
  backendTasks: BackendTask[],
  developers: DeveloperSummary[],
): DeveloperMetrics[] {
  return developers.map((dev) => {
    const assignedTasks = backendTasks.filter((task) => String(task.developerID) === dev.id);
    const completedTasks = assignedTasks.filter((task) => task.status === 'closed');
    const hoursWorked = assignedTasks.reduce((sum, task) => sum + (task.timeSpent ?? 0), 0);

    return {
      ...dev,
      assignedTasksCount: assignedTasks.length,
      completedTasksCount: completedTasks.length,
      hoursWorked,
    };
  });
}
