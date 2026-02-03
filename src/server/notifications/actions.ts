'use server';

import { z } from 'zod';
import { getSessionUserId } from '../auth/auth';
import { NotificationDao } from '../database/NotificationDao';
import { NotificationListResult, NotificationEvent } from '@/shared/types/notification';

const markReadSchema = z.object({
    id: z.number().int().positive(),
});

function mapRow(row: any): NotificationEvent {
    const actorName = row.actor.displayName || row.actor.username;
    return {
        id: row.id,
        type: row.type,
        recipientUserId: row.recipientUserId,
        actorUserId: row.actorUserId,
        actorName,
        actorPhotoUrl: row.actor.photoUrl,
        message: row.message,
        targetId: row.targetId,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
    };
}

export async function getNotifications(
    cursor?: number
): Promise<{ success: boolean; error?: string; data?: NotificationListResult }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const limit = 20;
    const dao = new NotificationDao();
    const rows = await dao.getByUserId(userId, cursor, limit);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const notifications = items.map(mapRow);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { success: true, data: { notifications, hasMore, nextCursor } };
}

export async function getUnreadCount(): Promise<{ success: boolean; error?: string; count?: number }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const dao = new NotificationDao();
    const count = await dao.getUnreadCountByUserId(userId);
    return { success: true, count };
}

export async function markNotificationRead(
    id: number
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = markReadSchema.safeParse({ id });
    if (!parsed.success) return { success: false, error: 'Invalid notification id.' };

    const dao = new NotificationDao();
    await dao.markAsRead(parsed.data.id, userId);
    return { success: true };
}

export async function markAllNotificationsRead(): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const dao = new NotificationDao();
    await dao.markAllAsRead(userId);
    return { success: true };
}
