import type { WorkItemCommentDto } from '@/features/work-items/dtos/work-item-comment.dto';
import type { WorkItemComment } from '@/features/work-items/model/work-item-comment.model';
import { mapUserSummaryFromSource } from '@/shared/mappers/user-summary.mapper';

function sortCommentsByCreatedAtAsc(comments: WorkItemComment[]): WorkItemComment[] {
    return [...comments].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

export function mapWorkItemCommentDtoToModel(dto: WorkItemCommentDto): WorkItemComment {
    return {
        id: dto.commentId,
        workItemId: dto.workItemId,
        author: mapUserSummaryFromSource(dto),
        parentCommentId: dto.parentCommentId,
        content: dto.content,
        createdAt: dto.createdAt,
        editedAt: dto.editedAt,
        isEdited: dto.editedAt !== null,
        replies: [],
    };
}

export function mapWorkItemCommentDtosToTree(dtos: WorkItemCommentDto[]): WorkItemComment[] {
    const sortedDtos = [...dtos].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const commentMap = new Map(
        sortedDtos.map((dto) => {
            const comment = mapWorkItemCommentDtoToModel(dto);

            return [comment.id, comment];
        }),
    );

    const rootComments: WorkItemComment[] = [];

    for (const dto of sortedDtos) {
        const currentComment = commentMap.get(dto.commentId);

        if (!currentComment) {
            continue;
        }

        if (!dto.parentCommentId) {
            rootComments.push(currentComment);
            continue;
        }

        const parentComment = commentMap.get(dto.parentCommentId);

        if (!parentComment) {
            rootComments.push(currentComment);
            continue;
        }

        parentComment.replies.push(currentComment);
    }

    const sortRepliesRecursively = (comments: WorkItemComment[]): WorkItemComment[] => {
        return sortCommentsByCreatedAtAsc(comments).map((comment) => {
            return {
                ...comment,
                replies: sortRepliesRecursively(comment.replies),
            };
        });
    };

    return sortRepliesRecursively(rootComments);
}