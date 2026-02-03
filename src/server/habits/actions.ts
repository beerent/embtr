'use server';

import { z } from 'zod';
import { getSessionUserId } from '../auth/auth';
import { HabitDao } from '../database/HabitDao';
import { ScheduledHabitDao } from '../database/ScheduledHabitDao';
import { HabitWithSchedule } from '@/shared/types/habit';
import { computeDropCost, type EffortLevel } from '@/shared/effort';

const createHabitSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().max(500).optional(),
    iconName: z.string().optional(),
    iconColor: z.string().optional(),
    quantity: z.number().min(1).max(1000).optional(),
    unit: z.string().max(50).optional(),
    bucketId: z.number().int().positive().nullable().optional(),
    effortLevel: z.number().int().min(1).max(5).optional(),
    scheduledDays: z.array(z.number().int().min(0).max(6)).optional(),
});

const updateHabitSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    iconName: z.string().optional(),
    iconColor: z.string().optional(),
    quantity: z.number().min(1).max(1000).optional(),
    unit: z.string().max(50).nullable().optional(),
    bucketId: z.number().int().positive().nullable().optional(),
    effortLevel: z.number().int().min(1).max(5).optional(),
    scheduledDays: z.array(z.number().int().min(0).max(6)).optional(),
});

export async function createHabit(
    title: string,
    description?: string,
    iconName?: string,
    iconColor?: string,
    quantity?: number,
    unit?: string,
    bucketId?: number | null,
    effortLevel?: number,
    scheduledDays?: number[]
): Promise<{ success: boolean; error?: string; habit?: HabitWithSchedule }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = createHabitSchema.safeParse({ title, description, iconName, iconColor, quantity, unit, bucketId, effortLevel, scheduledDays });
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const effort = (parsed.data.effortLevel ?? 3) as EffortLevel;
    const days = parsed.data.scheduledDays ?? [0, 1, 2, 3, 4, 5, 6];
    const dropCost = computeDropCost(effort, days.length);

    const habitDao = new HabitDao();
    const habit = await habitDao.create({
        userId,
        title: parsed.data.title,
        description: parsed.data.description,
        iconName: parsed.data.iconName,
        iconColor: parsed.data.iconColor,
        quantity: parsed.data.quantity,
        unit: parsed.data.unit,
        bucketId: parsed.data.bucketId ?? undefined,
        dropCost,
        effortLevel: effort,
    });

    const scheduledHabitDao = new ScheduledHabitDao();
    await scheduledHabitDao.setSchedule(userId, habit.id, days);

    return {
        success: true,
        habit: {
            id: habit.id,
            title: habit.title,
            description: habit.description,
            iconName: habit.iconName,
            iconColor: habit.iconColor,
            isArchived: habit.isArchived,
            scheduledDays: days,
            quantity: habit.quantity,
            unit: habit.unit,
            bucketId: habit.bucketId,
            dropCost: habit.dropCost,
            effortLevel: habit.effortLevel,
        },
    };
}

export async function updateHabit(
    habitId: number,
    data: {
        title?: string;
        description?: string;
        iconName?: string;
        iconColor?: string;
        quantity?: number;
        unit?: string | null;
        bucketId?: number | null;
        effortLevel?: number;
        scheduledDays?: number[];
    }
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const parsed = updateHabitSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const habitDao = new HabitDao();
    const habit = await habitDao.getById(habitId);
    if (!habit || habit.userId !== userId) {
        return { success: false, error: 'Habit not found.' };
    }

    const { scheduledDays, ...habitData } = parsed.data;

    // If schedule is changing, update it and recompute dropCost
    if (scheduledDays) {
        const scheduledHabitDao = new ScheduledHabitDao();
        await scheduledHabitDao.setSchedule(userId, habitId, scheduledDays);
    }

    // Compute dropCost from effortLevel + schedule
    const effort = (habitData.effortLevel ?? habit.effortLevel) as EffortLevel;
    const daysCount = scheduledDays
        ? scheduledDays.length
        : habit.scheduledHabits.filter((s: any) => s.isActive).length;
    const dropCost = computeDropCost(effort, daysCount);

    await habitDao.update(habitId, { ...habitData, dropCost, effortLevel: effort });
    return { success: true };
}

export async function archiveHabit(
    habitId: number
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const habitDao = new HabitDao();
    const habit = await habitDao.getById(habitId);
    if (!habit || habit.userId !== userId) {
        return { success: false, error: 'Habit not found.' };
    }

    await habitDao.archive(habitId);
    return { success: true };
}

export async function updateSchedule(
    habitId: number,
    enabledDays: number[]
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const habitDao = new HabitDao();
    const habit = await habitDao.getById(habitId);
    if (!habit || habit.userId !== userId) {
        return { success: false, error: 'Habit not found.' };
    }

    const scheduledHabitDao = new ScheduledHabitDao();
    await scheduledHabitDao.setSchedule(userId, habitId, enabledDays);

    // Recompute dropCost based on new schedule
    const effort = (habit.effortLevel ?? 3) as EffortLevel;
    const dropCost = computeDropCost(effort, enabledDays.length);
    await habitDao.update(habitId, { dropCost });

    return { success: true };
}

export async function getMyHabits(): Promise<{
    success: boolean;
    error?: string;
    habits?: HabitWithSchedule[];
}> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const habitDao = new HabitDao();
    const habits = await habitDao.getByUserId(userId);

    const habitsWithSchedule: HabitWithSchedule[] = habits.map(
        (h: any) => ({
            id: h.id,
            title: h.title,
            description: h.description,
            iconName: h.iconName,
            iconColor: h.iconColor,
            isArchived: h.isArchived,
            scheduledDays: h.scheduledHabits
                .filter((s: any) => s.isActive)
                .map((s: any) => s.dayOfWeek)
                .sort((a: number, b: number) => a - b),
            quantity: h.quantity ?? 1,
            unit: h.unit ?? null,
            bucketId: h.bucketId ?? null,
            dropCost: h.dropCost ?? 1,
            effortLevel: h.effortLevel ?? 3,
        })
    );

    return { success: true, habits: habitsWithSchedule };
}
