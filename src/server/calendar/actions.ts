'use server';

import { getSessionUserId } from '../auth/auth';
import { HabitDao } from '../database/HabitDao';
import { PlannedDayDao } from '../database/PlannedDayDao';
import { PlannedTaskDao } from '../database/PlannedTaskDao';
import { DayResultDao } from '../database/DayResultDao';
import { HabitStreakDao } from '../database/HabitStreakDao';
import { UserDao } from '../database/UserDao';
import { PrismaTransaction } from '../database/prisma/PrismaTransaction';
import { PlannedDayWithTasks } from '@/shared/types/habit';
import {
    computeDayStatus,
    computeDayScore,
    computeStreakOnComplete,
    computeStreakOnUncomplete,
    computeToggleResult,
    computeSetQuantityResult,
    isHardModeBlocked,
} from '../completion/CompletionService';

export async function getPlannedDays(
    startDate: string,
    endDate: string
): Promise<{ success: boolean; error?: string; plannedDays?: PlannedDayWithTasks[] }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const plannedDayDao = new PlannedDayDao();
    const existingDays = await plannedDayDao.getByUserAndDateRange(userId, startDate, endDate);

    const existingDatesSet = new Set(existingDays.map((d: any) => d.date));

    // Generate missing days from active schedules
    const habitDao = new HabitDao();
    const habits = await habitDao.getByUserId(userId);
    const plannedTaskDao = new PlannedTaskDao();

    const allDates = generateDateRange(startDate, endDate);
    const newDays: any[] = [];

    // Backfill missing tasks into existing PlannedDays (e.g. a new habit was
    // added after the PlannedDay was already materialised for an older habit).
    const updatedExistingDays: any[] = [];
    for (const day of existingDays) {
        const dayOfWeek = new Date(day.date + 'T12:00:00Z').getUTCDay();
        const scheduledHabits = habits.filter((h: any) =>
            h.scheduledHabits.some(
                (s: any) => s.dayOfWeek === dayOfWeek && s.isActive
            )
        );

        const existingHabitIds = new Set(
            day.plannedTasks.map((t: any) => t.habitId).filter(Boolean)
        );
        const missingHabits = scheduledHabits.filter(
            (h: any) => !existingHabitIds.has(h.id)
        );

        if (missingHabits.length > 0) {
            const nextSortOrder = day.plannedTasks.length;
            for (let i = 0; i < missingHabits.length; i++) {
                await plannedTaskDao.createFromSchedule(
                    day.id,
                    missingHabits[i],
                    nextSortOrder + i,
                );
            }
            // Re-fetch the day with all tasks
            const refreshed = await plannedDayDao.getOrCreate(userId, day.date);
            updatedExistingDays.push(refreshed);
        } else {
            updatedExistingDays.push(day);
        }
    }

    for (const dateStr of allDates) {
        if (existingDatesSet.has(dateStr)) continue;

        const dayOfWeek = new Date(dateStr + 'T12:00:00Z').getUTCDay();
        const scheduledHabits = habits.filter((h: any) =>
            h.scheduledHabits.some(
                (s: any) => s.dayOfWeek === dayOfWeek && s.isActive
            )
        );

        if (scheduledHabits.length === 0) continue;

        const plannedDay = await plannedDayDao.getOrCreate(userId, dateStr);

        // Only create tasks if the day was just created (no tasks yet)
        if (plannedDay.plannedTasks.length === 0) {
            for (let i = 0; i < scheduledHabits.length; i++) {
                const habit = scheduledHabits[i];
                await plannedTaskDao.createFromSchedule(plannedDay.id, habit, i);
            }
            // Re-fetch with tasks
            const refreshed = await plannedDayDao.getOrCreate(userId, dateStr);
            newDays.push(refreshed);
        } else {
            newDays.push(plannedDay);
        }
    }

    const allPlannedDays = [...updatedExistingDays, ...newDays].sort((a: any, b: any) =>
        a.date.localeCompare(b.date)
    );

    const result: PlannedDayWithTasks[] = allPlannedDays.map((d: any) => ({
        id: d.id,
        date: d.date,
        status: d.status,
        plannedTasks: d.plannedTasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            habitId: t.habitId,
            completedAt: t.completedAt ? t.completedAt.toISOString() : null,
            quantity: t.quantity ?? 1,
            completedQuantity: t.completedQuantity ?? 0,
            unit: t.unit ?? null,
        })),
        dayResult: d.dayResult ? { score: d.dayResult.score } : null,
    }));

    return { success: true, plannedDays: result };
}

export async function toggleTaskStatus(
    plannedTaskId: number
): Promise<{ success: boolean; error?: string; status?: string; dayStatus?: string; completedQuantity?: number }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    // Verify ownership before entering transaction
    const plannedTaskDao = new PlannedTaskDao();
    const task = await plannedTaskDao.getByIdWithDay(plannedTaskId);

    if (!task || task.plannedDay.userId !== userId) {
        return { success: false, error: 'Task not found.' };
    }

    // Hard mode: only allow toggling tasks for today's date
    const userDao = new UserDao();
    const user = await userDao.getById(userId);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (isHardModeBlocked(user?.hardMode ?? false, task.plannedDay.date, todayStr)) {
        return { success: false, error: 'Hard mode: can only update today.' };
    }

    // Compute new quantity and status
    const toggleResult = computeToggleResult(task);
    const newStatus = toggleResult.status;
    const newCompletedQuantity = toggleResult.completedQuantity;
    const isCompleting = toggleResult.isCompleting;
    const completedAt: Date | null = isCompleting ? new Date() : null;

    const plannedDayId = task.plannedDayId;
    const dayDate = task.plannedDay.date;

    const dayStatus = await PrismaTransaction.execute(async (tx) => {
        const txTaskDao = new PlannedTaskDao(tx);
        const txDayDao = new PlannedDayDao(tx);
        const txDayResultDao = new DayResultDao(tx);
        const txStreakDao = new HabitStreakDao(tx);

        // 1. Update task with new quantity and status
        await txTaskDao.update(plannedTaskId, {
            completedQuantity: newCompletedQuantity,
            status: newStatus,
            completedAt,
        });

        // 2. Fetch all sibling tasks and apply in-flight change
        const siblingTasks = await txTaskDao.getByPlannedDayId(plannedDayId);
        const tasksWithUpdate = siblingTasks.map((t: any) =>
            t.id === plannedTaskId
                ? { ...t, status: newStatus, completedQuantity: newCompletedQuantity }
                : t
        );

        // 3. Compute and update day status
        const computedDayStatus = computeDayStatus(tasksWithUpdate);
        await txDayDao.updateStatus(plannedDayId, computedDayStatus);

        // 4. Compute and upsert day score
        const score = computeDayScore(tasksWithUpdate);
        await txDayResultDao.upsertByPlannedDay(userId, plannedDayId, dayDate, score);

        // 5. Update habit streak if task is linked to a habit
        if (task.habitId) {
            const existingStreak = await txStreakDao.getByUserAndHabit(userId, task.habitId);

            if (isCompleting) {
                const newStreak = computeStreakOnComplete(existingStreak, dayDate);
                await txStreakDao.upsert(userId, task.habitId, newStreak);
            } else if (task.status === 'complete') {
                // Was complete, now resetting — handle uncomplete
                const habitTasks = await txTaskDao.getByPlannedDayIdAndHabitId(
                    plannedDayId,
                    task.habitId
                );
                const stillCompletedToday = habitTasks.some(
                    (ht: any) => ht.id !== plannedTaskId && ht.status === 'complete'
                );
                const newStreak = computeStreakOnUncomplete(
                    existingStreak,
                    dayDate,
                    stillCompletedToday
                );
                await txStreakDao.upsert(userId, task.habitId, newStreak);
            }
        }

        return computedDayStatus;
    });

    return { success: true, status: newStatus, dayStatus, completedQuantity: newCompletedQuantity };
}

export async function setTaskCompletedQuantity(
    plannedTaskId: number,
    newCompletedQuantity: number
): Promise<{ success: boolean; error?: string; status?: string; dayStatus?: string; completedQuantity?: number }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const plannedTaskDao = new PlannedTaskDao();
    const task = await plannedTaskDao.getByIdWithDay(plannedTaskId);

    if (!task || task.plannedDay.userId !== userId) {
        return { success: false, error: 'Task not found.' };
    }

    const userDao = new UserDao();
    const user = await userDao.getById(userId);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (isHardModeBlocked(user?.hardMode ?? false, task.plannedDay.date, todayStr)) {
        return { success: false, error: 'Hard mode: can only update today.' };
    }

    const result = computeSetQuantityResult(task, newCompletedQuantity);
    const newStatus = result.status;
    const newCompleted = result.completedQuantity;
    const isCompleting = result.isCompleting;
    const completedAt: Date | null = isCompleting ? new Date() : (newStatus === 'complete' ? task.completedAt : null);

    const plannedDayId = task.plannedDayId;
    const dayDate = task.plannedDay.date;

    const dayStatus = await PrismaTransaction.execute(async (tx) => {
        const txTaskDao = new PlannedTaskDao(tx);
        const txDayDao = new PlannedDayDao(tx);
        const txDayResultDao = new DayResultDao(tx);
        const txStreakDao = new HabitStreakDao(tx);

        await txTaskDao.update(plannedTaskId, {
            completedQuantity: newCompleted,
            status: newStatus,
            completedAt,
        });

        const siblingTasks = await txTaskDao.getByPlannedDayId(plannedDayId);
        const tasksWithUpdate = siblingTasks.map((t: any) =>
            t.id === plannedTaskId
                ? { ...t, status: newStatus, completedQuantity: newCompleted }
                : t
        );

        const computedDayStatus = computeDayStatus(tasksWithUpdate);
        await txDayDao.updateStatus(plannedDayId, computedDayStatus);

        const score = computeDayScore(tasksWithUpdate);
        await txDayResultDao.upsertByPlannedDay(userId, plannedDayId, dayDate, score);

        if (task.habitId) {
            const existingStreak = await txStreakDao.getByUserAndHabit(userId, task.habitId);

            if (isCompleting) {
                const newStreak = computeStreakOnComplete(existingStreak, dayDate);
                await txStreakDao.upsert(userId, task.habitId, newStreak);
            } else if (task.status === 'complete' && newStatus !== 'complete') {
                const habitTasks = await txTaskDao.getByPlannedDayIdAndHabitId(
                    plannedDayId,
                    task.habitId
                );
                const stillCompletedToday = habitTasks.some(
                    (ht: any) => ht.id !== plannedTaskId && ht.status === 'complete'
                );
                const newStreak = computeStreakOnUncomplete(
                    existingStreak,
                    dayDate,
                    stillCompletedToday
                );
                await txStreakDao.upsert(userId, task.habitId, newStreak);
            }
        }

        return computedDayStatus;
    });

    return { success: true, status: newStatus, dayStatus, completedQuantity: newCompleted };
}

function generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate + 'T12:00:00Z');
    const end = new Date(endDate + 'T12:00:00Z');

    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setUTCDate(current.getUTCDate() + 1);
    }

    return dates;
}
