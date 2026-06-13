import type { ActivityLogItemDto } from '@/features/work-items/dtos/activity-log-item.dto';
import type { CreateWorkItemCommentDto } from '@/features/work-items/dtos/create-work-item-comment.dto';
import type { CreateWorkItemLinkDto } from '@/features/work-items/dtos/create-work-item-link.dto';
import type { UpdateWorkItemCommentDto } from '@/features/work-items/dtos/update-work-item-comment.dto';
import type { WorkItemCommentDto } from '@/features/work-items/dtos/work-item-comment.dto';
import type { WorkItemLinkDto } from '@/features/work-items/dtos/work-item-link.dto';

export interface WorkItemCollaborationService {
    getCommentsByWorkItemId(workItemId: string): Promise<WorkItemCommentDto[]>;
    createComment(input: CreateWorkItemCommentDto): Promise<WorkItemCommentDto>;
    updateComment(input: UpdateWorkItemCommentDto): Promise<WorkItemCommentDto>;

    getLinksByWorkItemId(workItemId: string): Promise<WorkItemLinkDto[]>;
    createLink(input: CreateWorkItemLinkDto): Promise<WorkItemLinkDto>;

    getActivityByWorkItemId(workItemId: string): Promise<ActivityLogItemDto[]>;
}