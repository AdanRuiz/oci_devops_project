import type { UserSummary } from '@/shared/models/user-summary.model';

interface UserSummarySource {
    authorUserId?: string;
    authorName?: string;
    authorEmail?: string | null;
    authorTelegramUserId?: string | null;
    actorUserId?: string;
    actorName?: string;
    actorEmail?: string | null;
    actorTelegramUserId?: string | null;
    userId?: string;
    userName?: string;
    userEmail?: string | null;
    userTelegramUserId?: string | null;
}

export function mapUserSummaryFromSource(source: UserSummarySource): UserSummary {
    const id =
        source.authorUserId ??
        source.actorUserId ??
        source.userId ??
        '';

    const name =
        source.authorName ??
        source.actorName ??
        source.userName ??
        '';

    const email =
        source.authorEmail ??
        source.actorEmail ??
        source.userEmail ??
        null;

    const telegramUserId =
        source.authorTelegramUserId ??
        source.actorTelegramUserId ??
        source.userTelegramUserId ??
        null;

    return {
        id,
        name,
        email,
        telegramUserId,
    };
}