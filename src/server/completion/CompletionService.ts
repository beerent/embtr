/**
 * Pure functions for computing day status, scores, and streaks.
 * No database access — called by server actions.
 */

interface TaskForComputation {
    status: string;
    quantity?: number;
    completedQuantity?: number;
}

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastCompleted: string | null;
}

export function computeDayStatus(tasks: TaskForComputation[]): 'incomplete' | 'partial' | 'complete' {
    if (tasks.length === 0) return 'incomplete';

    const resolvedCount = tasks.filter(
        (t) => t.status === 'complete' || t.status === 'skipped'
    ).length;

    if (resolvedCount === 0) return 'incomplete';
    if (resolvedCount === tasks.length) return 'complete';
    return 'partial';
}

export function computeDayScore(tasks: TaskForComputation[]): number {
    if (tasks.length === 0) return 0;

    let totalWeight = 0;
    for (const task of tasks) {
        if (task.status === 'complete') {
            totalWeight += 1.0;
        } else {
            const qty = task.quantity ?? 1;
            const completed = task.completedQuantity ?? 0;
            totalWeight += Math.min(completed / qty, 1.0);
        }
    }

    return Math.round((totalWeight / tasks.length) * 100);
}

export function computeStreakOnComplete(
    existing: StreakData | null,
    completionDate: string
): StreakData {
    if (!existing) {
        return {
            currentStreak: 1,
            longestStreak: 1,
            lastCompleted: completionDate,
        };
    }

    // Already counted today — no-op
    if (existing.lastCompleted === completionDate) {
        return existing;
    }

    const yesterday = getYesterday(completionDate);

    let newCurrent: number;
    if (existing.lastCompleted === yesterday) {
        // Consecutive day — increment
        newCurrent = existing.currentStreak + 1;
    } else {
        // Gap — reset to 1
        newCurrent = 1;
    }

    const newLongest = Math.max(existing.longestStreak, newCurrent);

    return {
        currentStreak: newCurrent,
        longestStreak: newLongest,
        lastCompleted: completionDate,
    };
}

export function computeStreakOnUncomplete(
    existing: StreakData | null,
    date: string,
    stillCompletedToday: boolean
): StreakData {
    if (!existing) {
        return { currentStreak: 0, longestStreak: 0, lastCompleted: null };
    }

    // If there are still other completed tasks for this habit today, no change
    if (stillCompletedToday) {
        return existing;
    }

    // Only decrement if this was today's completion
    if (existing.lastCompleted !== date) {
        return existing;
    }

    const newCurrent = Math.max(0, existing.currentStreak - 1);

    return {
        currentStreak: newCurrent,
        longestStreak: existing.longestStreak, // never decrement high-water mark
        lastCompleted: newCurrent > 0 ? getYesterday(date) : null,
    };
}

export function computeToggleResult(task: {
    status: string;
    quantity?: number;
    completedQuantity?: number;
}): { status: string; completedQuantity: number; isCompleting: boolean } {
    if (task.status === 'complete') {
        return { status: 'incomplete', completedQuantity: 0, isCompleting: false };
    }

    const qty = task.quantity ?? 1;
    const newCompleted = (task.completedQuantity ?? 0) + 1;

    if (newCompleted >= qty) {
        return { status: 'complete', completedQuantity: newCompleted, isCompleting: true };
    }

    return { status: 'incomplete', completedQuantity: newCompleted, isCompleting: false };
}

export function computeSetQuantityResult(task: {
    status: string;
    quantity?: number;
    completedQuantity?: number;
}, newCompletedQuantity: number): { status: string; completedQuantity: number; isCompleting: boolean } {
    const qty = task.quantity ?? 1;
    const clamped = Math.max(0, Math.min(newCompletedQuantity, qty));

    if (clamped >= qty) {
        return { status: 'complete', completedQuantity: clamped, isCompleting: task.status !== 'complete' };
    }

    return { status: 'incomplete', completedQuantity: clamped, isCompleting: false };
}

export function isHardModeBlocked(
    hardModeEnabled: boolean,
    taskDate: string,
    todayDate: string
): boolean {
    if (!hardModeEnabled) return false;
    return taskDate !== todayDate;
}

function getYesterday(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
}
