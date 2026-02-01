'use server';

import { z } from 'zod';
import { Session } from '../session/Session';
import { getSessionUserId } from '../auth/auth';
import { BugReportDao } from '../database/BugReportDao';
import { CommentDao } from '../database/CommentDao';
import { BugReportData, BugStatus, BugPriority } from '@/shared/types/bugReport';

// --- Schemas ---

const createBugReportSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(5000),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

const updateBugStatusSchema = z.object({
    id: z.number().int().positive(),
    status: z.enum(['open', 'in_progress', 'under_review', 'resolved', 'closed', 'wont_fix']),
});

// --- Helpers ---

function mapBugReport(row: any, userId: number, commentCount: number): BugReportData {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status as BugStatus,
        priority: row.priority as BugPriority,
        author: {
            id: row.user.id,
            username: row.user.username,
            displayName: row.user.displayName,
        },
        commentCount,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        isOwnReport: row.userId === userId,
    };
}

// --- Actions ---

export async function createBugReport(
    data: z.infer<typeof createBugReportSchema>
): Promise<{ success: boolean; error?: string; bugReport?: BugReportData }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = createBugReportSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const dao = new BugReportDao();
    const row = await dao.create({
        userId,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
    });

    return { success: true, bugReport: mapBugReport(row, userId, 0) };
}

export async function getBugReports(
    status?: string
): Promise<{ success: boolean; error?: string; bugReports?: BugReportData[] }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const dao = new BugReportDao();
    const rows = await dao.getAll(status);

    const ids = rows.map((r: any) => r.id);
    let commentCounts: Map<number, number> = new Map();

    if (ids.length > 0) {
        const commentDao = new CommentDao();
        const counts = await commentDao.countByTargets('bug_report', ids);
        for (const c of counts) {
            commentCounts.set(c.targetId, c._count.id);
        }
    }

    const bugReports = rows.map((r: any) =>
        mapBugReport(r, userId, commentCounts.get(r.id) ?? 0)
    );

    return { success: true, bugReports };
}

export async function getBugReport(
    id: number
): Promise<{ success: boolean; error?: string; bugReport?: BugReportData }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const dao = new BugReportDao();
    const row = await dao.getById(id);
    if (!row) return { success: false, error: 'Bug report not found.' };

    const commentDao = new CommentDao();
    const counts = await commentDao.countByTargets('bug_report', [id]);
    const commentCount = counts[0]?._count.id ?? 0;

    return { success: true, bugReport: mapBugReport(row, userId, commentCount) };
}

export async function updateBugStatus(
    id: number,
    status: string
): Promise<{ success: boolean; error?: string }> {
    const session = await Session.getSession();
    if (session.role !== 'admin') return { success: false, error: 'Unauthorized.' };

    const parsed = updateBugStatusSchema.safeParse({ id, status });
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const dao = new BugReportDao();
    const existing = await dao.getById(id);
    if (!existing) return { success: false, error: 'Bug report not found.' };

    await dao.updateStatus(id, parsed.data.status);
    return { success: true };
}

export async function addBugComment(
    bugReportId: number,
    body: string
): Promise<{ success: boolean; error?: string; comment?: any }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const trimmed = body.trim();
    if (!trimmed || trimmed.length > 500) {
        return { success: false, error: 'Comment must be 1-500 characters.' };
    }

    const bugDao = new BugReportDao();
    const bug = await bugDao.getById(bugReportId);
    if (!bug) return { success: false, error: 'Bug report not found.' };

    const commentDao = new CommentDao();
    const comment = await commentDao.create({
        userId,
        targetType: 'bug_report',
        targetId: bugReportId,
        body: trimmed,
    });

    return {
        success: true,
        comment: {
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt.toISOString(),
            author: {
                id: comment.user.id,
                username: comment.user.username,
                displayName: comment.user.displayName,
            },
            isOwnComment: true,
        },
    };
}

export async function getBugComments(
    bugReportId: number
): Promise<{ success: boolean; error?: string; comments?: any[] }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const commentDao = new CommentDao();
    const rows = await commentDao.getByTarget('bug_report', bugReportId);

    const comments = rows.map((c: any) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: {
            id: c.user.id,
            username: c.user.username,
            displayName: c.user.displayName,
        },
        isOwnComment: c.userId === userId,
    }));

    return { success: true, comments };
}

export async function deleteBugComment(
    commentId: number
): Promise<{ success: boolean; error?: string }> {
    const session = await Session.getSession();

    const commentDao = new CommentDao();
    const comment = await commentDao.getById(commentId);
    if (!comment) return { success: false, error: 'Comment not found.' };

    if (comment.userId !== session.id && session.role !== 'admin') {
        return { success: false, error: 'Unauthorized.' };
    }

    await commentDao.delete(commentId);
    return { success: true };
}
