import { describe, it, expect } from 'vitest';
import {
    computeAverageScore,
    computeCompletionRate,
    computeBestStreaks,
    filterRecentResults,
    sortHabitStreaksByCurrentDesc,
    buildProfileSummary,
} from '../ProfileMetrics';

// ── computeAverageScore ──────────────────────────────────────────────

describe('computeAverageScore', () => {
    it('returns 0 for empty results', () => {
        expect(computeAverageScore([])).toBe(0);
    });

    it('returns the score when there is a single result', () => {
        expect(computeAverageScore([{ score: 75 }])).toBe(75);
    });

    it('averages multiple results', () => {
        const results = [{ score: 80 }, { score: 60 }];
        expect(computeAverageScore(results)).toBe(70);
    });

    it('rounds to the nearest integer', () => {
        // (80 + 70 + 65) / 3 = 71.666... → 72
        const results = [{ score: 80 }, { score: 70 }, { score: 65 }];
        expect(computeAverageScore(results)).toBe(72);
    });

    it('rounds 0.5 up', () => {
        // (1 + 0) / 2 = 0.5 → 1
        const results = [{ score: 1 }, { score: 0 }];
        expect(computeAverageScore(results)).toBe(1);
    });

    it('handles all-zero scores', () => {
        const results = [{ score: 0 }, { score: 0 }, { score: 0 }];
        expect(computeAverageScore(results)).toBe(0);
    });

    it('handles all-100 scores', () => {
        const results = [{ score: 100 }, { score: 100 }, { score: 100 }];
        expect(computeAverageScore(results)).toBe(100);
    });

    it('handles a large number of results', () => {
        // 30 days, alternating 100 and 0 → average 50
        const results = Array.from({ length: 30 }, (_, i) => ({
            score: i % 2 === 0 ? 100 : 0,
        }));
        expect(computeAverageScore(results)).toBe(50);
    });

    it('handles non-round averages correctly', () => {
        // (33 + 33 + 34) / 3 = 33.333... → 33
        const results = [{ score: 33 }, { score: 33 }, { score: 34 }];
        expect(computeAverageScore(results)).toBe(33);
    });
});

// ── computeCompletionRate ────────────────────────────────────────────

describe('computeCompletionRate', () => {
    it('returns 0 when no days have data', () => {
        expect(computeCompletionRate(0, 30)).toBe(0);
    });

    it('returns 100 when all days have data', () => {
        expect(computeCompletionRate(30, 30)).toBe(100);
    });

    it('caps at 100 even if daysWithData exceeds period', () => {
        expect(computeCompletionRate(35, 30)).toBe(100);
    });

    it('computes the correct percentage', () => {
        // 15/30 = 50%
        expect(computeCompletionRate(15, 30)).toBe(50);
    });

    it('rounds to the nearest integer', () => {
        // 7/30 = 23.333... → 23%
        expect(computeCompletionRate(7, 30)).toBe(23);
    });

    it('rounds up at .5', () => {
        // 1/30 = 3.333... → 3%
        expect(computeCompletionRate(1, 30)).toBe(3);
    });

    it('handles period of 0 without dividing by zero', () => {
        expect(computeCompletionRate(5, 0)).toBe(0);
    });

    it('handles single day period', () => {
        expect(computeCompletionRate(1, 1)).toBe(100);
    });

    it('handles large period with small data count', () => {
        // 1/365 = 0.27... → 0%
        expect(computeCompletionRate(1, 365)).toBe(0);
    });

    it('handles 29 out of 30 days', () => {
        // 29/30 = 96.666... → 97%
        expect(computeCompletionRate(29, 30)).toBe(97);
    });
});

// ── computeBestStreaks ───────────────────────────────────────────────

describe('computeBestStreaks', () => {
    it('returns zeros for empty streaks', () => {
        expect(computeBestStreaks([])).toEqual({
            bestCurrentStreak: 0,
            bestLongestStreak: 0,
        });
    });

    it('returns values from a single streak', () => {
        const streaks = [{ currentStreak: 5, longestStreak: 10 }];
        expect(computeBestStreaks(streaks)).toEqual({
            bestCurrentStreak: 5,
            bestLongestStreak: 10,
        });
    });

    it('picks the max current and max longest from multiple habits', () => {
        const streaks = [
            { currentStreak: 3, longestStreak: 15 },
            { currentStreak: 7, longestStreak: 7 },
            { currentStreak: 1, longestStreak: 20 },
        ];
        expect(computeBestStreaks(streaks)).toEqual({
            bestCurrentStreak: 7,
            bestLongestStreak: 20,
        });
    });

    it('best current and best longest can come from different habits', () => {
        const streaks = [
            { currentStreak: 10, longestStreak: 10 },
            { currentStreak: 2, longestStreak: 50 },
        ];
        expect(computeBestStreaks(streaks)).toEqual({
            bestCurrentStreak: 10,
            bestLongestStreak: 50,
        });
    });

    it('handles all-zero streaks', () => {
        const streaks = [
            { currentStreak: 0, longestStreak: 0 },
            { currentStreak: 0, longestStreak: 0 },
        ];
        expect(computeBestStreaks(streaks)).toEqual({
            bestCurrentStreak: 0,
            bestLongestStreak: 0,
        });
    });

    it('handles ties correctly (returns the tied value)', () => {
        const streaks = [
            { currentStreak: 5, longestStreak: 5 },
            { currentStreak: 5, longestStreak: 5 },
        ];
        expect(computeBestStreaks(streaks)).toEqual({
            bestCurrentStreak: 5,
            bestLongestStreak: 5,
        });
    });
});

// ── filterRecentResults ──────────────────────────────────────────────

describe('filterRecentResults', () => {
    const results = [
        { date: '2026-01-01', score: 80 },
        { date: '2026-01-10', score: 60 },
        { date: '2026-01-20', score: 90 },
        { date: '2026-01-25', score: 100 },
        { date: '2026-01-30', score: 50 },
    ];

    it('returns all results when cutoff is before all dates', () => {
        expect(filterRecentResults(results, '2025-12-01')).toHaveLength(5);
    });

    it('returns no results when cutoff is after all dates', () => {
        expect(filterRecentResults(results, '2026-02-01')).toHaveLength(0);
    });

    it('filters to only results on or after cutoff', () => {
        const filtered = filterRecentResults(results, '2026-01-20');
        expect(filtered).toHaveLength(3);
        expect(filtered.map((r) => r.date)).toEqual([
            '2026-01-20',
            '2026-01-25',
            '2026-01-30',
        ]);
    });

    it('includes result exactly on the cutoff date', () => {
        const filtered = filterRecentResults(results, '2026-01-25');
        expect(filtered).toHaveLength(2);
        expect(filtered[0].date).toBe('2026-01-25');
    });

    it('handles empty input', () => {
        expect(filterRecentResults([], '2026-01-01')).toEqual([]);
    });

    it('preserves all fields in filtered results', () => {
        const filtered = filterRecentResults(results, '2026-01-30');
        expect(filtered).toEqual([{ date: '2026-01-30', score: 50 }]);
    });
});

// ── sortHabitStreaksByCurrentDesc ─────────────────────────────────────

describe('sortHabitStreaksByCurrentDesc', () => {
    it('returns empty array for empty input', () => {
        expect(sortHabitStreaksByCurrentDesc([])).toEqual([]);
    });

    it('sorts by currentStreak descending', () => {
        const streaks = [
            { currentStreak: 1, longestStreak: 5 },
            { currentStreak: 10, longestStreak: 10 },
            { currentStreak: 3, longestStreak: 20 },
        ];
        const sorted = sortHabitStreaksByCurrentDesc(streaks);
        expect(sorted.map((s) => s.currentStreak)).toEqual([10, 3, 1]);
    });

    it('does not mutate the original array', () => {
        const streaks = [
            { currentStreak: 1, longestStreak: 5 },
            { currentStreak: 10, longestStreak: 10 },
        ];
        const original = [...streaks];
        sortHabitStreaksByCurrentDesc(streaks);
        expect(streaks).toEqual(original);
    });

    it('handles tied current streaks (preserves relative order)', () => {
        const streaks = [
            { currentStreak: 5, longestStreak: 10 },
            { currentStreak: 5, longestStreak: 20 },
            { currentStreak: 5, longestStreak: 5 },
        ];
        const sorted = sortHabitStreaksByCurrentDesc(streaks);
        expect(sorted.every((s) => s.currentStreak === 5)).toBe(true);
        expect(sorted).toHaveLength(3);
    });

    it('sorts a single element array', () => {
        const streaks = [{ currentStreak: 7, longestStreak: 7 }];
        expect(sortHabitStreaksByCurrentDesc(streaks)).toEqual([
            { currentStreak: 7, longestStreak: 7 },
        ]);
    });

    it('preserves extra fields on records', () => {
        const streaks = [
            { habitId: 1, habitTitle: 'Run', iconColor: '#ff0000', currentStreak: 2, longestStreak: 5 },
            { habitId: 2, habitTitle: 'Read', iconColor: '#00ff00', currentStreak: 8, longestStreak: 8 },
        ];
        const sorted = sortHabitStreaksByCurrentDesc(streaks);
        expect(sorted[0].habitTitle).toBe('Read');
        expect(sorted[1].habitTitle).toBe('Run');
    });
});

// ── Integration: metrics from realistic data ─────────────────────────

describe('profile metrics integration', () => {
    it('computes correct summary from 30 days of varied activity', () => {
        // Simulate 20 active days out of 30 with various scores
        const scores = [
            100, 80, 60, 40, 100, 90, 70, 50, 30, 100,
            85, 75, 65, 55, 45, 95, 35, 25, 100, 80,
        ];
        const results = scores.map((score) => ({ score }));

        const avg = computeAverageScore(results);
        const rate = computeCompletionRate(results.length, 30);

        // Sum = 100+80+60+40+100+90+70+50+30+100+85+75+65+55+45+95+35+25+100+80 = 1380
        // Avg = 1380/20 = 69
        expect(avg).toBe(69);
        // Rate = 20/30 = 66.666... → 67%
        expect(rate).toBe(67);
    });

    it('computes correct summary for a perfect 30-day streak', () => {
        const results = Array.from({ length: 30 }, () => ({ score: 100 }));

        expect(computeAverageScore(results)).toBe(100);
        expect(computeCompletionRate(30, 30)).toBe(100);
    });

    it('computes correct summary for a brand new user with no data', () => {
        expect(computeAverageScore([])).toBe(0);
        expect(computeCompletionRate(0, 30)).toBe(0);
        expect(computeBestStreaks([])).toEqual({
            bestCurrentStreak: 0,
            bestLongestStreak: 0,
        });
    });

    it('picks best streaks from a realistic habit set', () => {
        const streaks = [
            { currentStreak: 12, longestStreak: 30 },  // Meditate
            { currentStreak: 5, longestStreak: 45 },   // Exercise
            { currentStreak: 0, longestStreak: 10 },   // Read (broken)
            { currentStreak: 20, longestStreak: 20 },  // Journal (new best)
        ];

        const { bestCurrentStreak, bestLongestStreak } = computeBestStreaks(streaks);
        expect(bestCurrentStreak).toBe(20);
        expect(bestLongestStreak).toBe(45);
    });

    it('filters and scores a 105-day dataset down to 30-day window', () => {
        // Build 105 days of data
        const allResults = Array.from({ length: 105 }, (_, i) => ({
            date: `2026-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
            score: i < 75 ? 50 : 100, // first 75 days = 50%, last 30 = 100%
        }));

        // Cutoff at day 75 (last 30 days)
        const cutoff = allResults[75].date;
        const recent = filterRecentResults(allResults, cutoff);

        expect(recent).toHaveLength(30);
        expect(computeAverageScore(recent)).toBe(100);
        expect(computeCompletionRate(recent.length, 30)).toBe(100);
    });
});

// ── buildProfileSummary ──────────────────────────────────────────────

describe('buildProfileSummary', () => {
    const baseStreaks = [
        { habitId: 1, habitTitle: 'Meditate', iconColor: '#ff0000', currentStreak: 12, longestStreak: 30 },
        { habitId: 2, habitTitle: 'Exercise', iconColor: '#00ff00', currentStreak: 5, longestStreak: 45 },
    ];

    it('includes loveReceived in the summary', () => {
        const summary = buildProfileSummary({
            dailyScores: [],
            habitStreaks: [],
            loveReceived: 42,
            thirtyDayCutoff: '2026-01-01',
        });
        expect(summary.loveReceived).toBe(42);
    });

    it('returns zero loveReceived for a new user', () => {
        const summary = buildProfileSummary({
            dailyScores: [],
            habitStreaks: [],
            loveReceived: 0,
            thirtyDayCutoff: '2026-01-01',
        });
        expect(summary.loveReceived).toBe(0);
        expect(summary.averageScore).toBe(0);
        expect(summary.completionRate).toBe(0);
        expect(summary.bestCurrentStreak).toBe(0);
        expect(summary.bestLongestStreak).toBe(0);
    });

    it('computes all stats together from realistic data', () => {
        const dailyScores = Array.from({ length: 20 }, (_, i) => ({
            date: `2026-01-${String(i + 5).padStart(2, '0')}`,
            score: 80,
        }));

        const summary = buildProfileSummary({
            dailyScores,
            habitStreaks: baseStreaks,
            loveReceived: 157,
            thirtyDayCutoff: '2026-01-01',
        });

        expect(summary.averageScore).toBe(80);
        expect(summary.completionRate).toBe(67); // 20/30
        expect(summary.bestCurrentStreak).toBe(12);
        expect(summary.bestLongestStreak).toBe(45);
        expect(summary.loveReceived).toBe(157);
    });

    it('sorts habit streaks by current streak descending', () => {
        const summary = buildProfileSummary({
            dailyScores: [],
            habitStreaks: baseStreaks,
            loveReceived: 0,
            thirtyDayCutoff: '2026-01-01',
        });

        expect(summary.habitStreaks[0].habitTitle).toBe('Meditate');
        expect(summary.habitStreaks[1].habitTitle).toBe('Exercise');
    });

    it('filters daily scores to the 30-day window for summary stats', () => {
        const dailyScores = [
            { date: '2025-12-01', score: 10 }, // before cutoff
            { date: '2026-01-15', score: 90 }, // after cutoff
            { date: '2026-01-20', score: 70 }, // after cutoff
        ];

        const summary = buildProfileSummary({
            dailyScores,
            habitStreaks: [],
            loveReceived: 5,
            thirtyDayCutoff: '2026-01-01',
        });

        // Only 2 days in range: avg = (90+70)/2 = 80, rate = 2/30 = 7%
        expect(summary.averageScore).toBe(80);
        expect(summary.completionRate).toBe(7);
        // Full dailyScores array is preserved for heatmap
        expect(summary.dailyScores).toHaveLength(3);
    });

    it('handles large loveReceived values', () => {
        const summary = buildProfileSummary({
            dailyScores: [],
            habitStreaks: [],
            loveReceived: 999999,
            thirtyDayCutoff: '2026-01-01',
        });
        expect(summary.loveReceived).toBe(999999);
    });
});
