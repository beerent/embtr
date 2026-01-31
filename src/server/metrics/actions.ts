'use server';

import { getSessionUserId } from '../auth/auth';
import { DayResultDao } from '../database/DayResultDao';
import { HabitStreakDao } from '../database/HabitStreakDao';
import { PlannedDayDao } from '../database/PlannedDayDao';
import { computeDayStatus, computeDayScore } from '../completion/CompletionService';

export async function getDayMetrics(date: string): Promise<{
    success: boolean;
    error?: string;
    dayStatus?: string;
    score?: number;
    totalTasks?: number;
    completedTasks?: number;
}> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const plannedDayDao = new PlannedDayDao();

    const days = await plannedDayDao.getByUserAndDateRange(userId, date, date);
    const day = days[0];

    if (!day) {
        return { success: true, dayStatus: 'incomplete', score: 0, totalTasks: 0, completedTasks: 0 };
    }

    const tasks = (day as any).plannedTasks || [];
    const dayStatus = computeDayStatus(tasks);
    const score = computeDayScore(tasks);
    const completedTasks = tasks.filter((t: any) => t.status === 'complete').length;

    return {
        success: true,
        dayStatus,
        score,
        totalTasks: tasks.length,
        completedTasks,
    };
}

export async function getRangeMetrics(
    startDate: string,
    endDate: string
): Promise<{
    success: boolean;
    error?: string;
    totalDays?: number;
    completedDays?: number;
    averageScore?: number;
    totalTasks?: number;
    completedTasks?: number;
    taskCompletionRate?: number;
}> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const dayResultDao = new DayResultDao();
    const results = await dayResultDao.getByUserAndDateRange(userId, startDate, endDate);

    const plannedDayDao = new PlannedDayDao();
    const days = await plannedDayDao.getByUserAndDateRange(userId, startDate, endDate);

    let totalTasks = 0;
    let completedTasks = 0;
    let completedDays = 0;

    for (const day of days) {
        const tasks = (day as any).plannedTasks || [];
        totalTasks += tasks.length;
        completedTasks += tasks.filter((t: any) => t.status === 'complete').length;

        const status = computeDayStatus(tasks);
        if (status === 'complete') completedDays++;
    }

    const totalDays = days.length;
    const averageScore =
        results.length > 0
            ? Math.round(results.reduce((sum: number, r: any) => sum + r.score, 0) / results.length)
            : 0;
    const taskCompletionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
        success: true,
        totalDays,
        completedDays,
        averageScore,
        totalTasks,
        completedTasks,
        taskCompletionRate,
    };
}

export async function getHabitStreaks(): Promise<{
    success: boolean;
    error?: string;
    streaks?: {
        habitId: number;
        habitTitle: string;
        currentStreak: number;
        longestStreak: number;
        lastCompleted: string | null;
    }[];
}> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const habitStreakDao = new HabitStreakDao();
    const streaks = await habitStreakDao.getByUserId(userId);

    return {
        success: true,
        streaks: streaks.map((s: any) => ({
            habitId: s.habitId,
            habitTitle: s.habit.title,
            currentStreak: s.currentStreak,
            longestStreak: s.longestStreak,
            lastCompleted: s.lastCompleted,
        })),
    };
}
