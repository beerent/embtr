import { describe, it, expect } from 'vitest';
import {
    computeDayStatus,
    computeDayScore,
    computeStreakOnComplete,
    computeStreakOnUncomplete,
    computeToggleResult,
    computeSetQuantityResult,
    isHardModeBlocked,
} from '../CompletionService';

// ── computeDayStatus ────────────────────────────────────────────────

describe('computeDayStatus', () => {
    it('returns incomplete for empty tasks', () => {
        expect(computeDayStatus([])).toBe('incomplete');
    });

    it('returns incomplete when all tasks are incomplete', () => {
        const tasks = [
            { status: 'incomplete' },
            { status: 'incomplete' },
        ];
        expect(computeDayStatus(tasks)).toBe('incomplete');
    });

    it('returns complete when all tasks are complete', () => {
        const tasks = [
            { status: 'complete' },
            { status: 'complete' },
        ];
        expect(computeDayStatus(tasks)).toBe('complete');
    });

    it('returns complete when mix of complete and skipped', () => {
        const tasks = [
            { status: 'complete' },
            { status: 'skipped' },
        ];
        expect(computeDayStatus(tasks)).toBe('complete');
    });

    it('returns partial when some but not all are resolved', () => {
        const tasks = [
            { status: 'complete' },
            { status: 'incomplete' },
        ];
        expect(computeDayStatus(tasks)).toBe('partial');
    });

    it('returns partial with skipped and incomplete mix', () => {
        const tasks = [
            { status: 'skipped' },
            { status: 'incomplete' },
            { status: 'incomplete' },
        ];
        expect(computeDayStatus(tasks)).toBe('partial');
    });
});

// ── computeDayScore ─────────────────────────────────────────────────

describe('computeDayScore', () => {
    it('returns 0 for empty tasks', () => {
        expect(computeDayScore([])).toBe(0);
    });

    it('returns 100 when all tasks are complete', () => {
        const tasks = [
            { status: 'complete' },
            { status: 'complete' },
        ];
        expect(computeDayScore(tasks)).toBe(100);
    });

    it('returns 50 when half the tasks are complete', () => {
        const tasks = [
            { status: 'complete' },
            { status: 'incomplete' },
        ];
        expect(computeDayScore(tasks)).toBe(50);
    });

    it('gives partial credit for quantity tasks', () => {
        // 1 task: quantity 8, completed 4 → weight = 0.5 → score = 50
        const tasks = [
            { status: 'incomplete', quantity: 8, completedQuantity: 4 },
        ];
        expect(computeDayScore(tasks)).toBe(50);
    });

    it('caps partial credit at 1.0', () => {
        // completedQuantity > quantity should not exceed 1.0 weight
        const tasks = [
            { status: 'incomplete', quantity: 3, completedQuantity: 5 },
        ];
        expect(computeDayScore(tasks)).toBe(100);
    });

    it('handles backwards compat (no quantity fields)', () => {
        // Tasks without quantity/completedQuantity → incomplete = 0 weight
        const tasks = [
            { status: 'complete' },
            { status: 'incomplete' },
        ];
        expect(computeDayScore(tasks)).toBe(50);
    });

    it('returns 0 for zero progress on quantity task', () => {
        const tasks = [
            { status: 'incomplete', quantity: 5, completedQuantity: 0 },
        ];
        expect(computeDayScore(tasks)).toBe(0);
    });

    it('mixes complete and partial quantity tasks', () => {
        // Task 1: complete → 1.0
        // Task 2: quantity 4, completed 2 → 0.5
        // Total weight = 1.5, count = 2 → 75
        const tasks = [
            { status: 'complete' },
            { status: 'incomplete', quantity: 4, completedQuantity: 2 },
        ];
        expect(computeDayScore(tasks)).toBe(75);
    });
});

// ── computeStreakOnComplete ─────────────────────────────────────────

describe('computeStreakOnComplete', () => {
    it('creates a new streak from null', () => {
        const result = computeStreakOnComplete(null, '2026-01-15');
        expect(result).toEqual({
            currentStreak: 1,
            longestStreak: 1,
            lastCompleted: '2026-01-15',
        });
    });

    it('is idempotent for same day', () => {
        const existing = {
            currentStreak: 3,
            longestStreak: 5,
            lastCompleted: '2026-01-15',
        };
        const result = computeStreakOnComplete(existing, '2026-01-15');
        expect(result).toEqual(existing);
    });

    it('increments for consecutive day', () => {
        const existing = {
            currentStreak: 3,
            longestStreak: 5,
            lastCompleted: '2026-01-14',
        };
        const result = computeStreakOnComplete(existing, '2026-01-15');
        expect(result).toEqual({
            currentStreak: 4,
            longestStreak: 5,
            lastCompleted: '2026-01-15',
        });
    });

    it('resets after a gap', () => {
        const existing = {
            currentStreak: 3,
            longestStreak: 5,
            lastCompleted: '2026-01-10',
        };
        const result = computeStreakOnComplete(existing, '2026-01-15');
        expect(result).toEqual({
            currentStreak: 1,
            longestStreak: 5,
            lastCompleted: '2026-01-15',
        });
    });

    it('updates longest streak when current exceeds it', () => {
        const existing = {
            currentStreak: 5,
            longestStreak: 5,
            lastCompleted: '2026-01-14',
        };
        const result = computeStreakOnComplete(existing, '2026-01-15');
        expect(result).toEqual({
            currentStreak: 6,
            longestStreak: 6,
            lastCompleted: '2026-01-15',
        });
    });

    it('handles month boundaries', () => {
        const existing = {
            currentStreak: 2,
            longestStreak: 2,
            lastCompleted: '2026-01-31',
        };
        const result = computeStreakOnComplete(existing, '2026-02-01');
        expect(result).toEqual({
            currentStreak: 3,
            longestStreak: 3,
            lastCompleted: '2026-02-01',
        });
    });
});

// ── computeStreakOnUncomplete ───────────────────────────────────────

describe('computeStreakOnUncomplete', () => {
    it('returns zeros for null existing', () => {
        const result = computeStreakOnUncomplete(null, '2026-01-15', false);
        expect(result).toEqual({
            currentStreak: 0,
            longestStreak: 0,
            lastCompleted: null,
        });
    });

    it('preserves streak when still completed today', () => {
        const existing = {
            currentStreak: 3,
            longestStreak: 5,
            lastCompleted: '2026-01-15',
        };
        const result = computeStreakOnUncomplete(existing, '2026-01-15', true);
        expect(result).toEqual(existing);
    });

    it('decrements streak when no longer completed today', () => {
        const existing = {
            currentStreak: 3,
            longestStreak: 5,
            lastCompleted: '2026-01-15',
        };
        const result = computeStreakOnUncomplete(existing, '2026-01-15', false);
        expect(result).toEqual({
            currentStreak: 2,
            longestStreak: 5,
            lastCompleted: '2026-01-14',
        });
    });

    it('does not change for non-today date', () => {
        const existing = {
            currentStreak: 3,
            longestStreak: 5,
            lastCompleted: '2026-01-14',
        };
        const result = computeStreakOnUncomplete(existing, '2026-01-15', false);
        expect(result).toEqual(existing);
    });

    it('preserves longest streak even when current zeroes out', () => {
        const existing = {
            currentStreak: 1,
            longestStreak: 10,
            lastCompleted: '2026-01-15',
        };
        const result = computeStreakOnUncomplete(existing, '2026-01-15', false);
        expect(result).toEqual({
            currentStreak: 0,
            longestStreak: 10,
            lastCompleted: null,
        });
    });

    it('does not go below zero', () => {
        const existing = {
            currentStreak: 0,
            longestStreak: 3,
            lastCompleted: '2026-01-15',
        };
        const result = computeStreakOnUncomplete(existing, '2026-01-15', false);
        expect(result).toEqual({
            currentStreak: 0,
            longestStreak: 3,
            lastCompleted: null,
        });
    });
});

// ── computeToggleResult ───────────────────────────────────────────────

describe('computeToggleResult', () => {
    it('single-qty incomplete → complete', () => {
        expect(computeToggleResult({ status: 'incomplete', quantity: 1, completedQuantity: 0 }))
            .toEqual({ status: 'complete', completedQuantity: 1, isCompleting: true });
    });

    it('single-qty complete → reset', () => {
        expect(computeToggleResult({ status: 'complete', quantity: 1, completedQuantity: 1 }))
            .toEqual({ status: 'incomplete', completedQuantity: 0, isCompleting: false });
    });

    it('multi-qty from zero', () => {
        expect(computeToggleResult({ status: 'incomplete', quantity: 3, completedQuantity: 0 }))
            .toEqual({ status: 'incomplete', completedQuantity: 1, isCompleting: false });
    });

    it('multi-qty partial increment', () => {
        expect(computeToggleResult({ status: 'incomplete', quantity: 3, completedQuantity: 1 }))
            .toEqual({ status: 'incomplete', completedQuantity: 2, isCompleting: false });
    });

    it('multi-qty final increment → complete', () => {
        expect(computeToggleResult({ status: 'incomplete', quantity: 3, completedQuantity: 2 }))
            .toEqual({ status: 'complete', completedQuantity: 3, isCompleting: true });
    });

    it('multi-qty complete → reset', () => {
        expect(computeToggleResult({ status: 'complete', quantity: 3, completedQuantity: 3 }))
            .toEqual({ status: 'incomplete', completedQuantity: 0, isCompleting: false });
    });

    it('defaults when fields undefined', () => {
        expect(computeToggleResult({ status: 'incomplete' }))
            .toEqual({ status: 'complete', completedQuantity: 1, isCompleting: true });
    });
});

// ── computeSetQuantityResult ─────────────────────────────────────────

describe('computeSetQuantityResult', () => {
    it('sets to full quantity → complete', () => {
        expect(computeSetQuantityResult({ status: 'incomplete', quantity: 5, completedQuantity: 0 }, 5))
            .toEqual({ status: 'complete', completedQuantity: 5, isCompleting: true });
    });

    it('sets to partial quantity → incomplete', () => {
        expect(computeSetQuantityResult({ status: 'incomplete', quantity: 10, completedQuantity: 0 }, 4))
            .toEqual({ status: 'incomplete', completedQuantity: 4, isCompleting: false });
    });

    it('sets to zero → incomplete', () => {
        expect(computeSetQuantityResult({ status: 'complete', quantity: 5, completedQuantity: 5 }, 0))
            .toEqual({ status: 'incomplete', completedQuantity: 0, isCompleting: false });
    });

    it('clamps negative to zero', () => {
        expect(computeSetQuantityResult({ status: 'incomplete', quantity: 5, completedQuantity: 3 }, -2))
            .toEqual({ status: 'incomplete', completedQuantity: 0, isCompleting: false });
    });

    it('clamps above max to quantity', () => {
        expect(computeSetQuantityResult({ status: 'incomplete', quantity: 5, completedQuantity: 0 }, 999))
            .toEqual({ status: 'complete', completedQuantity: 5, isCompleting: true });
    });

    it('already complete, set to same quantity → isCompleting false', () => {
        expect(computeSetQuantityResult({ status: 'complete', quantity: 3, completedQuantity: 3 }, 3))
            .toEqual({ status: 'complete', completedQuantity: 3, isCompleting: false });
    });

    it('complete → lower partial quantity', () => {
        expect(computeSetQuantityResult({ status: 'complete', quantity: 10, completedQuantity: 10 }, 7))
            .toEqual({ status: 'incomplete', completedQuantity: 7, isCompleting: false });
    });

    it('defaults when quantity fields undefined', () => {
        expect(computeSetQuantityResult({ status: 'incomplete' }, 1))
            .toEqual({ status: 'complete', completedQuantity: 1, isCompleting: true });
    });
});

// ── isHardModeBlocked ───────────────────────────────────────────────

describe('isHardModeBlocked', () => {
    it('returns false when hard mode is disabled', () => {
        expect(isHardModeBlocked(false, '2026-01-10', '2026-01-15')).toBe(false);
    });

    it('returns false when task date is today', () => {
        expect(isHardModeBlocked(true, '2026-01-15', '2026-01-15')).toBe(false);
    });

    it('returns true for past date when hard mode enabled', () => {
        expect(isHardModeBlocked(true, '2026-01-10', '2026-01-15')).toBe(true);
    });

    it('returns true for future date when hard mode enabled', () => {
        expect(isHardModeBlocked(true, '2026-01-20', '2026-01-15')).toBe(true);
    });
});
