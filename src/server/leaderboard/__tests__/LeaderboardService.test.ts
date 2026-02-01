import { describe, it, expect } from 'vitest';
import { getDateRange, formatDate, buildLeaderboardEntries } from '../LeaderboardService';

// ── formatDate ──────────────────────────────────────────────────────

describe('formatDate', () => {
    it('formats single-digit month and day with zero padding', () => {
        expect(formatDate(2026, 0, 5)).toBe('2026-01-05');
    });

    it('formats double-digit month and day', () => {
        expect(formatDate(2026, 11, 25)).toBe('2026-12-25');
    });

    it('handles month index correctly (0-based)', () => {
        expect(formatDate(2026, 1, 14)).toBe('2026-02-14');
    });
});

// ── getDateRange: daily ─────────────────────────────────────────────

describe('getDateRange (daily)', () => {
    it('returns today as both start and end', () => {
        const now = new Date(2026, 0, 15); // Jan 15, 2026
        const result = getDateRange('daily', now);
        expect(result.startDate).toBe('2026-01-15');
        expect(result.endDate).toBe('2026-01-15');
    });

    it('label is always "Today"', () => {
        const now = new Date(2026, 5, 1);
        expect(getDateRange('daily', now).label).toBe('Today');
    });
});

// ── getDateRange: weekly ────────────────────────────────────────────

describe('getDateRange (weekly)', () => {
    it('returns Mon-Sun for a Wednesday', () => {
        // Jan 28, 2026 is a Wednesday
        const now = new Date(2026, 0, 28);
        const result = getDateRange('weekly', now);
        expect(result.startDate).toBe('2026-01-26'); // Monday
        expect(result.endDate).toBe('2026-02-01');   // Sunday
    });

    it('returns Mon-Sun when today is Monday', () => {
        // Jan 26, 2026 is a Monday
        const now = new Date(2026, 0, 26);
        const result = getDateRange('weekly', now);
        expect(result.startDate).toBe('2026-01-26');
        expect(result.endDate).toBe('2026-02-01');
    });

    it('returns Mon-Sun when today is Sunday', () => {
        // Feb 1, 2026 is a Sunday
        const now = new Date(2026, 1, 1);
        const result = getDateRange('weekly', now);
        expect(result.startDate).toBe('2026-01-26');
        expect(result.endDate).toBe('2026-02-01');
    });

    it('handles week spanning month boundary', () => {
        // Jan 31, 2026 is a Saturday
        const now = new Date(2026, 0, 31);
        const result = getDateRange('weekly', now);
        expect(result.startDate).toBe('2026-01-26');
        expect(result.endDate).toBe('2026-02-01');
    });

    it('handles week spanning year boundary', () => {
        // Dec 31, 2025 is a Wednesday
        const now = new Date(2025, 11, 31);
        const result = getDateRange('weekly', now);
        expect(result.startDate).toBe('2025-12-29'); // Monday
        expect(result.endDate).toBe('2026-01-04');   // Sunday
    });

    it('label contains short date range', () => {
        const now = new Date(2026, 0, 28);
        const result = getDateRange('weekly', now);
        expect(result.label).toContain('Jan');
        expect(result.label).toContain('–');
    });
});

// ── getDateRange: monthly ───────────────────────────────────────────

describe('getDateRange (monthly)', () => {
    it('returns first and last day of January', () => {
        const now = new Date(2026, 0, 15);
        const result = getDateRange('monthly', now);
        expect(result.startDate).toBe('2026-01-01');
        expect(result.endDate).toBe('2026-01-31');
    });

    it('returns first and last day of February (non-leap)', () => {
        const now = new Date(2026, 1, 10);
        const result = getDateRange('monthly', now);
        expect(result.startDate).toBe('2026-02-01');
        expect(result.endDate).toBe('2026-02-28');
    });

    it('returns first and last day of February (leap year)', () => {
        const now = new Date(2028, 1, 10); // 2028 is a leap year
        const result = getDateRange('monthly', now);
        expect(result.startDate).toBe('2028-02-01');
        expect(result.endDate).toBe('2028-02-29');
    });

    it('returns correct range for December', () => {
        const now = new Date(2026, 11, 25);
        const result = getDateRange('monthly', now);
        expect(result.startDate).toBe('2026-12-01');
        expect(result.endDate).toBe('2026-12-31');
    });

    it('label contains month and year', () => {
        const now = new Date(2026, 0, 15);
        const result = getDateRange('monthly', now);
        expect(result.label).toBe('January 2026');
    });

    it('handles 30-day months', () => {
        const now = new Date(2026, 3, 15); // April
        const result = getDateRange('monthly', now);
        expect(result.endDate).toBe('2026-04-30');
    });
});

// ── buildLeaderboardEntries ─────────────────────────────────────────

describe('buildLeaderboardEntries', () => {
    it('returns empty array for empty results', () => {
        expect(buildLeaderboardEntries([], 1)).toEqual([]);
    });

    it('assigns sequential ranks starting at 1', () => {
        const results = [
            { userId: 10, username: 'alice', photoUrl: null, perfectDays: 5 },
            { userId: 20, username: 'bob', photoUrl: null, perfectDays: 3 },
            { userId: 30, username: 'carol', photoUrl: null, perfectDays: 1 },
        ];
        const entries = buildLeaderboardEntries(results, 99);
        expect(entries[0].rank).toBe(1);
        expect(entries[1].rank).toBe(2);
        expect(entries[2].rank).toBe(3);
    });

    it('flags the current user correctly', () => {
        const results = [
            { userId: 10, username: 'alice', photoUrl: null, perfectDays: 5 },
            { userId: 20, username: 'bob', photoUrl: 'http://example.com/bob.jpg', perfectDays: 3 },
        ];
        const entries = buildLeaderboardEntries(results, 20);
        expect(entries[0].isCurrentUser).toBe(false);
        expect(entries[1].isCurrentUser).toBe(true);
    });

    it('sets isCurrentUser false when user not in results', () => {
        const results = [
            { userId: 10, username: 'alice', photoUrl: null, perfectDays: 5 },
        ];
        const entries = buildLeaderboardEntries(results, 99);
        expect(entries[0].isCurrentUser).toBe(false);
    });

    it('preserves all fields from DAO results', () => {
        const results = [
            { userId: 42, username: 'dave', photoUrl: 'http://example.com/dave.jpg', perfectDays: 7 },
        ];
        const entries = buildLeaderboardEntries(results, 42);
        expect(entries[0]).toEqual({
            rank: 1,
            userId: 42,
            username: 'dave',
            photoUrl: 'http://example.com/dave.jpg',
            perfectDays: 7,
            isCurrentUser: true,
        });
    });

    it('handles single entry', () => {
        const results = [
            { userId: 1, username: 'solo', photoUrl: null, perfectDays: 1 },
        ];
        const entries = buildLeaderboardEntries(results, 1);
        expect(entries).toHaveLength(1);
        expect(entries[0].rank).toBe(1);
        expect(entries[0].isCurrentUser).toBe(true);
    });

    it('handles many entries', () => {
        const results = Array.from({ length: 50 }, (_, i) => ({
            userId: i + 1,
            username: `user${i + 1}`,
            photoUrl: null,
            perfectDays: 50 - i,
        }));
        const entries = buildLeaderboardEntries(results, 25);
        expect(entries).toHaveLength(50);
        expect(entries[0].rank).toBe(1);
        expect(entries[49].rank).toBe(50);
        expect(entries[24].isCurrentUser).toBe(true);
    });

    it('passes through null photoUrl', () => {
        const results = [
            { userId: 1, username: 'test', photoUrl: null, perfectDays: 1 },
        ];
        const entries = buildLeaderboardEntries(results, 1);
        expect(entries[0].photoUrl).toBeNull();
    });
});
