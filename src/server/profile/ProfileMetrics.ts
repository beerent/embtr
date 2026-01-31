/**
 * Pure functions for computing profile-level metrics.
 * No database access — called by the getProfileStats server action.
 */

export interface DayScoreRecord {
    date: string;
    score: number;
}

export interface StreakRecord {
    currentStreak: number;
    longestStreak: number;
}

export interface HabitStreakRecord extends StreakRecord {
    habitId: number;
    habitTitle: string;
    iconColor: string;
}

/**
 * Compute the average daily score from a set of day results.
 * Returns 0 when there are no results.
 * Result is rounded to the nearest integer (0-100).
 */
export function computeAverageScore(results: { score: number }[]): number {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / results.length);
}

/**
 * Compute the completion rate: percentage of days in the period that have data.
 * Capped at 100 even if daysWithData exceeds the period length.
 */
export function computeCompletionRate(daysWithData: number, periodDays: number): number {
    if (periodDays <= 0) return 0;
    return Math.min(Math.round((daysWithData / periodDays) * 100), 100);
}

/**
 * Find the best current streak and best longest streak across all habits.
 * Returns zeros when the streaks array is empty.
 */
export function computeBestStreaks(streaks: StreakRecord[]): {
    bestCurrentStreak: number;
    bestLongestStreak: number;
} {
    let bestCurrentStreak = 0;
    let bestLongestStreak = 0;

    for (const s of streaks) {
        if (s.currentStreak > bestCurrentStreak) bestCurrentStreak = s.currentStreak;
        if (s.longestStreak > bestLongestStreak) bestLongestStreak = s.longestStreak;
    }

    return { bestCurrentStreak, bestLongestStreak };
}

/**
 * Filter day results to only include those on or after a cutoff date string.
 * Both dates are YYYY-MM-DD strings compared lexicographically.
 */
export function filterRecentResults<T extends { date: string }>(
    results: T[],
    cutoffDate: string
): T[] {
    return results.filter((r) => r.date >= cutoffDate);
}

/**
 * Sort habit streaks by currentStreak descending (highest first).
 * Returns a new array (does not mutate input).
 */
export function sortHabitStreaksByCurrentDesc<T extends StreakRecord>(streaks: T[]): T[] {
    return [...streaks].sort((a, b) => b.currentStreak - a.currentStreak);
}

/**
 * Build the complete profile summary from raw data.
 * Pure function — no DB access.
 */
export interface ProfileSummaryInput {
    dailyScores: DayScoreRecord[];
    habitStreaks: HabitStreakRecord[];
    loveReceived: number;
    thirtyDayCutoff: string;
}

export interface ProfileSummary {
    bestCurrentStreak: number;
    bestLongestStreak: number;
    averageScore: number;
    completionRate: number;
    loveReceived: number;
    habitStreaks: HabitStreakRecord[];
    dailyScores: DayScoreRecord[];
}

export function buildProfileSummary(input: ProfileSummaryInput): ProfileSummary {
    const recentResults = filterRecentResults(input.dailyScores, input.thirtyDayCutoff);
    const averageScore = computeAverageScore(recentResults);
    const completionRate = computeCompletionRate(recentResults.length, 30);
    const { bestCurrentStreak, bestLongestStreak } = computeBestStreaks(input.habitStreaks);

    return {
        bestCurrentStreak,
        bestLongestStreak,
        averageScore,
        completionRate,
        loveReceived: input.loveReceived,
        habitStreaks: sortHabitStreaksByCurrentDesc(input.habitStreaks),
        dailyScores: input.dailyScores,
    };
}
