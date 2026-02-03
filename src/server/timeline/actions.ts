'use server';

import { z } from 'zod';
import { getSessionUserId } from '../auth/auth';
import { TimelinePostDao } from '../database/TimelinePostDao';
import { CommentDao } from '../database/CommentDao';
import { LikeDao } from '../database/LikeDao';
import {
    TimelinePostData,
    TimelineFeedResult,
    TimelineCommentData,
} from '@/shared/types/timeline';
import { mapPost } from './mapPost';
import { refreshSubscriberStatus } from '../twitch/TwitchSubscriberService';
import { notifyPostLiked } from '../notifications/notifyPostLiked';
import { notifyPostCommented } from '../notifications/notifyPostCommented';
import { prisma } from '../database/prisma/prisma';

const TARGET_TYPE = 'timeline_post';

const userPostSchema = z.object({
    body: z.string().min(1, 'Post cannot be empty.').max(750, 'Post cannot exceed 750 characters.'),
});

const dayResultPostSchema = z.object({
    plannedDayId: z.number().int().positive(),
    body: z.string().max(750).optional(),
});

const commentSchema = z.object({
    postId: z.number().int().positive(),
    body: z.string().min(1, 'Comment cannot be empty.').max(500, 'Comment cannot exceed 500 characters.'),
});

// --- Public actions ---

export async function getTimelineFeed(
    cursor?: string
): Promise<{ success: boolean; error?: string; data?: TimelineFeedResult }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    // Non-blocking: refresh subscriber status if stale
    refreshSubscriberStatus(userId).catch(() => {});

    const limit = 10;
    const dao = new TimelinePostDao();
    const rows = await dao.getFeed(cursor, limit);

    const hasMore = rows.length > limit;
    const posts = hasMore ? rows.slice(0, limit) : rows;

    const postIds = posts.map((p: any) => p.id);

    const likeDao = new LikeDao();
    const commentDao = new CommentDao();

    const [likeCounts, commentCounts, likedSet] = await Promise.all([
        likeDao.batchCountByTarget(TARGET_TYPE, postIds),
        commentDao.countByTargets(TARGET_TYPE, postIds),
        likeDao.batchGetLikedStatus(userId, TARGET_TYPE, postIds),
    ]);

    const commentCountMap = new Map<number, number>();
    for (const row of commentCounts) {
        commentCountMap.set(row.targetId, row._count.id);
    }

    // Batch query habit→bucket data for DAY_RESULT posts
    const habitIds = new Set<number>();
    for (const p of posts) {
        if (p.type === 'DAY_RESULT' && p.plannedDay?.plannedTasks) {
            for (const t of p.plannedDay.plannedTasks) {
                if (t.habitId) habitIds.add(t.habitId);
            }
        }
    }

    let habitBucketMap = new Map<number, { bucketId: number | null; bucketName: string | null; bucketColor: string | null; bucketIconName: string | null; waterCost: number }>();
    if (habitIds.size > 0) {
        const habits = await prisma.habit.findMany({
            where: { id: { in: Array.from(habitIds) } },
            include: { bucket: true },
        });
        for (const h of habits) {
            habitBucketMap.set(h.id, {
                bucketId: h.bucketId,
                bucketName: (h as any).bucket?.name ?? null,
                bucketColor: (h as any).bucket?.color ?? null,
                bucketIconName: (h as any).bucket?.iconName ?? null,
                waterCost: h.waterCost,
            });
        }
    }

    const mapped: TimelinePostData[] = posts.map((p: any) =>
        mapPost(p, likeCounts, commentCountMap, likedSet, userId, habitBucketMap)
    );

    const nextCursor = hasMore ? posts[posts.length - 1].createdAt.toISOString() : null;

    return {
        success: true,
        data: { posts: mapped, nextCursor, hasMore },
    };
}

export async function createUserPost(
    body: string
): Promise<{ success: boolean; error?: string; post?: TimelinePostData }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = userPostSchema.safeParse({ body });
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const dao = new TimelinePostDao();
    const row = await dao.create({ userId, type: 'USER_POST', body: parsed.data.body });

    const post = mapPost(row, new Map(), new Map(), new Set(), userId);
    return { success: true, post };
}

export async function createDayResultPost(
    plannedDayId: number,
    body?: string
): Promise<{ success: boolean; error?: string; post?: TimelinePostData }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = dayResultPostSchema.safeParse({ plannedDayId, body });
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const dao = new TimelinePostDao();

    // Dedup: check if already shared
    const existing = await dao.getByUserAndPlannedDay(userId, parsed.data.plannedDayId);
    if (existing) {
        return { success: false, error: 'You have already shared this day.' };
    }

    const row = await dao.create({
        userId,
        type: 'DAY_RESULT',
        body: parsed.data.body || null,
        plannedDayId: parsed.data.plannedDayId,
    });

    const post = mapPost(row, new Map(), new Map(), new Set(), userId);
    return { success: true, post };
}

export async function toggleLike(
    postId: number
): Promise<{ success: boolean; error?: string; liked?: boolean }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const likeDao = new LikeDao();
    const result = await likeDao.toggle(userId, TARGET_TYPE, postId);

    if (result.liked) {
        notifyPostLiked(userId, postId).catch(() => {});
    }

    return { success: true, liked: result.liked };
}

export async function addComment(
    postId: number,
    body: string
): Promise<{ success: boolean; error?: string; comment?: TimelineCommentData }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = commentSchema.safeParse({ postId, body });
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const commentDao = new CommentDao();
    const row = await commentDao.create({
        userId,
        targetType: TARGET_TYPE,
        targetId: parsed.data.postId,
        body: parsed.data.body,
    });

    // Fire-and-forget comment notification
    notifyPostCommented(userId, parsed.data.postId).catch(() => {});

    return {
        success: true,
        comment: {
            id: row.id,
            body: row.body,
            author: {
                id: row.user.id,
                username: row.user.username,
                displayName: row.user.displayName,
                photoUrl: row.user.photoUrl,
                hasTwitchLinked: !!row.user.twitchAccount,
                isSubscriber: !!row.user.twitchAccount?.isSubscriber,
            },
            createdAt: row.createdAt.toISOString(),
            isOwnComment: row.userId === userId,
        },
    };
}

export async function getComments(
    postId: number
): Promise<{ success: boolean; error?: string; comments?: TimelineCommentData[] }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const commentDao = new CommentDao();
    const rows = await commentDao.getByTarget(TARGET_TYPE, postId);

    const comments: TimelineCommentData[] = rows.map((r: any) => ({
        id: r.id,
        body: r.body,
        author: {
            id: r.user.id,
            username: r.user.username,
            displayName: r.user.displayName,
            photoUrl: r.user.photoUrl,
            hasTwitchLinked: !!r.user.twitchAccount,
            isSubscriber: !!r.user.twitchAccount?.isSubscriber,
        },
        createdAt: r.createdAt.toISOString(),
        isOwnComment: r.userId === userId,
    }));

    return { success: true, comments };
}

const editPostSchema = z.object({
    postId: z.number().int().positive(),
    body: z.string().min(1, 'Post cannot be empty.').max(750, 'Post cannot exceed 750 characters.'),
});

export async function editPost(
    postId: number,
    body: string
): Promise<{ success: boolean; error?: string; post?: TimelinePostData }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = editPostSchema.safeParse({ postId, body });
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const dao = new TimelinePostDao();
    const existing = await dao.getById(parsed.data.postId);
    if (!existing || existing.userId !== userId) {
        return { success: false, error: 'Post not found.' };
    }

    const row = await dao.update(parsed.data.postId, { body: parsed.data.body });
    const post = mapPost(row, new Map(), new Map(), new Set(), userId);
    return { success: true, post };
}

export async function deletePost(
    postId: number
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const dao = new TimelinePostDao();
    const post = await dao.getById(postId);
    if (!post || post.userId !== userId) {
        return { success: false, error: 'Post not found.' };
    }

    await dao.delete(postId);
    return { success: true };
}

const editCommentSchema = z.object({
    commentId: z.number().int().positive(),
    body: z.string().min(1, 'Comment cannot be empty.').max(500, 'Comment cannot exceed 500 characters.'),
});

export async function editComment(
    commentId: number,
    body: string
): Promise<{ success: boolean; error?: string; comment?: TimelineCommentData }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = editCommentSchema.safeParse({ commentId, body });
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const commentDao = new CommentDao();
    const existing = await commentDao.getById(parsed.data.commentId);
    if (!existing || existing.userId !== userId) {
        return { success: false, error: 'Comment not found.' };
    }

    const row = await commentDao.update(parsed.data.commentId, { body: parsed.data.body });

    return {
        success: true,
        comment: {
            id: row.id,
            body: row.body,
            author: {
                id: row.user.id,
                username: row.user.username,
                displayName: row.user.displayName,
                photoUrl: row.user.photoUrl,
                hasTwitchLinked: !!row.user.twitchAccount,
                isSubscriber: !!row.user.twitchAccount?.isSubscriber,
            },
            createdAt: row.createdAt.toISOString(),
            isOwnComment: true,
        },
    };
}

export async function deleteComment(
    commentId: number
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const commentDao = new CommentDao();
    const existing = await commentDao.getById(commentId);
    if (!existing || existing.userId !== userId) {
        return { success: false, error: 'Comment not found.' };
    }

    await commentDao.delete(commentId);
    return { success: true };
}

