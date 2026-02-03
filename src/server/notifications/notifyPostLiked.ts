import { TimelinePostDao } from '@/server/database/TimelinePostDao';
import { UserDao } from '@/server/database/UserDao';
import { NotificationEmitter } from './NotificationEmitter';

export async function notifyPostLiked(actorUserId: number, postId: number): Promise<void> {
    const postDao = new TimelinePostDao();
    const post = await postDao.getById(postId);
    if (!post) return;

    // Don't notify on self-likes
    if (post.userId === actorUserId) return;

    const userDao = new UserDao();
    const actor = await userDao.getById(actorUserId);
    if (!actor) return;

    const actorName = actor.displayName || actor.username;

    NotificationEmitter.emit({
        id: `post_liked_${postId}_${actorUserId}_${Date.now()}`,
        type: 'POST_LIKED',
        recipientUserId: post.userId,
        actorName,
        message: `${actorName} liked your post`,
        postId,
        createdAt: new Date().toISOString(),
    });
}
