export type NotificationType = 'POST_LIKED';

export interface NotificationEvent {
    id: string;
    type: NotificationType;
    recipientUserId: number;
    actorName: string;
    message: string;
    postId: number;
    createdAt: string;
}
