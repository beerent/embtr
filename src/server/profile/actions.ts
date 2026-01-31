'use server';

import { getSessionUserId } from '../auth/auth';
import { DayResultDao } from '../database/DayResultDao';
import { HabitStreakDao } from '../database/HabitStreakDao';
import { LikeDao } from '../database/LikeDao';
import {
    computeAverageScore,
    computeCompletionRate,
    computeBestStreaks,
    filterRecentResults,
    sortHabitStreaksByCurrentDesc,
} from './ProfileMetrics';

export interface ProfileStats {
    bestCurrentStreak: number;
    bestLongestStreak: number;
    averageScore: number;
    completionRate: number;
    loveReceived: number;
    dailyScores: { date: string; score: number }[];
    habitStreaks: {
        habitId: number;
        habitTitle: string;
        iconColor: string;
        currentStreak: number;
        longestStreak: number;
    }[];
}

export async function getProfileStats(): Promise<ProfileStats | null> {
    const userId = await getSessionUserId();
    if (!userId) return null;

    const habitStreakDao = new HabitStreakDao();
    const dayResultDao = new DayResultDao();
    const likeDao = new LikeDao();

    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Last 105 days (15 weeks) for heatmap
    const heatmapStart = new Date(today);
    heatmapStart.setDate(heatmapStart.getDate() - 104);

    // Last 30 days for summary stats
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const thirtyDayStr = formatDate(thirtyDaysAgo);

    const [streaks, allResults, loveReceived] = await Promise.all([
        habitStreakDao.getByUserId(userId),
        dayResultDao.getByUserAndDateRange(userId, formatDate(heatmapStart), formatDate(today)),
        likeDao.countByUserPosts(userId, 'timeline_post'),
    ]);

    // Build daily scores
    const dailyScores = allResults.map((r: any) => ({
        date: r.date,
        score: r.score,
    }));

    // Summary stats from last 30 days
    const recentResults = filterRecentResults(dailyScores, thirtyDayStr);
    const averageScore = computeAverageScore(recentResults);
    const completionRate = computeCompletionRate(recentResults.length, 30);

    // Best streaks across all habits
    const habitStreaks = streaks.map((s: any) => ({
        habitId: s.habitId,
        habitTitle: s.habit.title,
        iconColor: s.habit.iconColor || '#4e73df',
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
    }));

    const { bestCurrentStreak, bestLongestStreak } = computeBestStreaks(habitStreaks);

    return {
        bestCurrentStreak,
        bestLongestStreak,
        averageScore,
        completionRate,
        loveReceived,
        dailyScores,
        habitStreaks: sortHabitStreaksByCurrentDesc(habitStreaks),
    };
}
