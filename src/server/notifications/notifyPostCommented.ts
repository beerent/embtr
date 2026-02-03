import { TimelinePostDao } from '@/server/database/TimelinePostDao';
import { UserDao } from '@/server/database/UserDao';
import { NotificationDao } from '@/server/database/NotificationDao';
import { NotificationEmitter } from './NotificationEmitter';

export async function notifyPostCommented(actorUserId: number, postId: number): Promise<void> {
    const postDao = new TimelinePostDao();
    const post = await postDao.getById(postId);
    if (!post) return;

    // Don't notify on self-comments
    if (post.userId === actorUserId) return;

    const userDao = new UserDao();
    const actor = await userDao.getById(actorUserId);
    if (!actor) return;

    const actorName = actor.displayName || actor.username;
    const message = `${actorName} commented on your post`;

    // Persist to database
    const notificationDao = new NotificationDao();
    const row = await notificationDao.create({
        recipientUserId: post.userId,
        actorUserId,
        type: 'POST_COMMENTED',
        targetId: postId,
        message,
    });

    // Emit for real-time SSE
    NotificationEmitter.emit({
        id: row.id,
        type: 'POST_COMMENTED',
        recipientUserId: post.userId,
        actorUserId,
        actorName,
        actorPhotoUrl: row.actor.photoUrl,
        message,
        targetId: postId,
        readAt: null,
        createdAt: row.createdAt.toISOString(),
    });
}
