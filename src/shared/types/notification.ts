export type NotificationType = 'POST_LIKED' | 'POST_COMMENTED';

export interface NotificationEvent {
    id: number;
    type: NotificationType;
    recipientUserId: number;
    actorUserId: number;
    actorName: string;
    actorPhotoUrl?: string | null;
    message: string;
    targetId: number;
    readAt: string | null;
    createdAt: string;
}

export interface NotificationListResult {
    notifications: NotificationEvent[];
    hasMore: boolean;
    nextCursor: number | null;
}
