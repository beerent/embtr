import { BaseDao } from './BaseDao';
import { NotificationType } from '@prisma/client';

export class NotificationDao extends BaseDao {
    constructor(client?: any) {
        super('NotificationDao', client);
    }

    async create(data: {
        recipientUserId: number;
        actorUserId: number;
        type: NotificationType;
        targetId: number;
        message: string;
    }) {
        return this.client.notification.create({
            data,
            include: {
                actor: {
                    select: { id: true, username: true, displayName: true, photoUrl: true },
                },
            },
        });
    }

    async getByUserId(userId: number, cursor?: number, limit = 20) {
        return this.client.notification.findMany({
            where: { recipientUserId: userId },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                actor: {
                    select: { id: true, username: true, displayName: true, photoUrl: true },
                },
            },
        });
    }

    async getUnreadCountByUserId(userId: number): Promise<number> {
        return this.client.notification.count({
            where: { recipientUserId: userId, readAt: null },
        });
    }

    async markAsRead(id: number, recipientUserId: number) {
        return this.client.notification.updateMany({
            where: { id, recipientUserId },
            data: { readAt: new Date() },
        });
    }

    async markAllAsRead(recipientUserId: number) {
        return this.client.notification.updateMany({
            where: { recipientUserId, readAt: null },
            data: { readAt: new Date() },
        });
    }
}
