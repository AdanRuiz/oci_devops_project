export type WorkItemType = 'feature' | 'issue' | 'bug' | 'task';

export type WorkItemStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Person {
  id: string;
  name: string;
  role: string;
}

export interface WorkItemDetail {
  id: string;
  title: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  sprintName: string;
  estimatedHours: number;
  loggedHours: number;
  dueDate: string;
  description: string;
  acceptanceCriteria?: string[];
  tags: string[];
  assignees: Person[];
  reporter: Person;
  externalLink?: string;
  commentsCount: number;
  linkedItemsCount: number;
}