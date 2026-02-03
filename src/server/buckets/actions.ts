'use server';

import { z } from 'zod';
import { getSessionUserId } from '../auth/auth';
import { BucketDao } from '../database/BucketDao';
import { HabitDao } from '../database/HabitDao';
import type { BucketData, BucketWithDrops } from '@/shared/types/bucket';

const createBucketSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50),
    color: z.string().optional(),
    iconName: z.string().optional(),
});

const updateBucketSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    color: z.string().optional(),
    iconName: z.string().optional(),
});

const reorderSchema = z.object({
    orderedIds: z.array(z.number().int().positive()),
});

export async function getMyBuckets(): Promise<{
    success: boolean;
    error?: string;
    buckets?: BucketData[];
}> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const dao = new BucketDao();
    const buckets = await dao.getByUserId(userId);

    return {
        success: true,
        buckets: buckets.map((b: any) => ({
            id: b.id,
            name: b.name,
            color: b.color,
            iconName: b.iconName,
            sortOrder: b.sortOrder,
            isArchived: b.isArchived,
        })),
    };
}

export async function getMyBucketsWithDrops(): Promise<{
    success: boolean;
    error?: string;
    buckets?: BucketWithDrops[];
    allocatedDrops?: number;
    remainingDrops?: number;
}> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const dao = new BucketDao();
    const buckets = await dao.getByUserIdWithHabits(userId);

    const result: BucketWithDrops[] = buckets.map((b: any) => {
        const totalDropCost = b.habits.reduce(
            (sum: number, h: any) => sum + h.dropCost,
            0
        );
        return {
            id: b.id,
            name: b.name,
            color: b.color,
            iconName: b.iconName,
            sortOrder: b.sortOrder,
            isArchived: b.isArchived,
            totalDropCost,
            completedDrops: 0,
        };
    });

    const allocatedDrops = result.reduce((sum, b) => sum + b.totalDropCost, 0);

    return {
        success: true,
        buckets: result,
        allocatedDrops,
        remainingDrops: 100 - allocatedDrops,
    };
}

export async function createBucket(
    name: string,
    color?: string,
    iconName?: string
): Promise<{ success: boolean; error?: string; bucket?: BucketData }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = createBucketSchema.safeParse({ name, color, iconName });
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const dao = new BucketDao();
    const sortOrder = await dao.getNextSortOrder(userId);

    const bucket = await dao.create({
        userId,
        name: parsed.data.name,
        color: parsed.data.color,
        iconName: parsed.data.iconName,
        sortOrder,
    });

    return {
        success: true,
        bucket: {
            id: bucket.id,
            name: bucket.name,
            color: bucket.color,
            iconName: bucket.iconName,
            sortOrder: bucket.sortOrder,
            isArchived: bucket.isArchived,
        },
    };
}

export async function updateBucket(
    bucketId: number,
    data: { name?: string; color?: string; iconName?: string }
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = updateBucketSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const dao = new BucketDao();
    const bucket = await dao.getById(bucketId);
    if (!bucket || bucket.userId !== userId) {
        return { success: false, error: 'Bucket not found.' };
    }

    await dao.update(bucketId, parsed.data);
    return { success: true };
}

export async function archiveBucket(
    bucketId: number
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const dao = new BucketDao();
    const bucket = await dao.getById(bucketId);
    if (!bucket || bucket.userId !== userId) {
        return { success: false, error: 'Bucket not found.' };
    }

    await dao.archive(bucketId);

    // Nullify bucketId on all habits assigned to this bucket
    const habitDao = new HabitDao();
    await habitDao.clearBucket(bucketId);

    return { success: true };
}

export async function reorderBuckets(
    orderedIds: number[]
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = reorderSchema.safeParse({ orderedIds });
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const dao = new BucketDao();
    await dao.reorder(userId, parsed.data.orderedIds);
    return { success: true };
}
