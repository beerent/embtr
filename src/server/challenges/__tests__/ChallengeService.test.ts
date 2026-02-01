import { describe, it, expect, vi, afterEach } from 'vitest';
import { ChallengeService } from '../ChallengeService';

// Helper to mock "today" for evaluateCompletion and getChallengeStatus
function mockToday(dateStr: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(dateStr + 'T12:00:00Z'));
}

afterEach(() => {
    vi.useRealTimers();
});

// ── computeRequiredCompletions ──────────────────────────────────────

describe('computeRequiredCompletions', () => {
    it('calculates for a 7-day challenge at 5x/week', () => {
        const result = ChallengeService.computeRequiredCompletions(5, '2026-01-01', '2026-01-07');
        expect(result).toBe(5); // 7 days = 1 week
    });

    it('calculates for a 14-day challenge at 3x/week', () => {
        const result = ChallengeService.computeRequiredCompletions(3, '2026-01-01', '2026-01-14');
        expect(result).toBe(6); // 14 days = 2 weeks
    });

    it('rounds up partial weeks', () => {
        // 10 days = ceil(10/7) = 2 weeks
        const result = ChallengeService.computeRequiredCompletions(4, '2026-01-01', '2026-01-10');
        expect(result).toBe(8); // 4 * 2
    });

    it('handles single day challenge', () => {
        const result = ChallengeService.computeRequiredCompletions(1, '2026-01-01', '2026-01-01');
        expect(result).toBe(1); // 1 day = ceil(1/7) = 1 week, 1 * 1 = 1
    });

    it('handles 7x/week for 30 days', () => {
        // 30 days = ceil(30/7) = 5 weeks
        const result = ChallengeService.computeRequiredCompletions(7, '2026-01-01', '2026-01-30');
        expect(result).toBe(35); // 7 * 5
    });
});

// ── computeProgress ──────────────────────────────────────────────────

describe('computeProgress', () => {
    it('returns 0% when no completions', () => {
        const result = ChallengeService.computeProgress(0, 5, '2026-01-01', '2026-01-07');
        expect(result.completions).toBe(0);
        expect(result.required).toBe(5);
        expect(result.percentage).toBe(0);
    });

    it('returns 100% when all required completions met', () => {
        const result = ChallengeService.computeProgress(5, 5, '2026-01-01', '2026-01-07');
        expect(result.percentage).toBe(100);
    });

    it('caps at 100% when over-completed', () => {
        const result = ChallengeService.computeProgress(10, 5, '2026-01-01', '2026-01-07');
        expect(result.percentage).toBe(100);
    });

    it('calculates partial progress correctly', () => {
        const result = ChallengeService.computeProgress(3, 5, '2026-01-01', '2026-01-07');
        expect(result.percentage).toBe(60);
    });

    it('rounds percentage', () => {
        // 1/3 = 33.333...
        const result = ChallengeService.computeProgress(1, 3, '2026-01-01', '2026-01-07');
        expect(result.percentage).toBe(33);
    });
});

// ── evaluateCompletion ───────────────────────────────────────────────

describe('evaluateCompletion', () => {
    it('returns active when challenge has not ended', () => {
        mockToday('2026-01-05');
        const result = ChallengeService.evaluateCompletion(3, 5, '2026-01-01', '2026-01-07');
        expect(result).toBe('active');
    });

    it('returns active on exact end date', () => {
        mockToday('2026-01-07');
        const result = ChallengeService.evaluateCompletion(5, 5, '2026-01-01', '2026-01-07');
        expect(result).toBe('active');
    });

    it('returns completed when requirement met after end', () => {
        mockToday('2026-01-08');
        const result = ChallengeService.evaluateCompletion(5, 5, '2026-01-01', '2026-01-07');
        expect(result).toBe('completed');
    });

    it('returns completed when over-completed after end', () => {
        mockToday('2026-01-08');
        const result = ChallengeService.evaluateCompletion(7, 5, '2026-01-01', '2026-01-07');
        expect(result).toBe('completed');
    });

    it('returns failed when requirement not met after end', () => {
        mockToday('2026-01-08');
        const result = ChallengeService.evaluateCompletion(4, 5, '2026-01-01', '2026-01-07');
        expect(result).toBe('failed');
    });

    it('returns failed with zero completions after end', () => {
        mockToday('2026-02-01');
        const result = ChallengeService.evaluateCompletion(0, 5, '2026-01-01', '2026-01-07');
        expect(result).toBe('failed');
    });
});

// ── getChallengeStatus ───────────────────────────────────────────────

describe('getChallengeStatus', () => {
    it('returns upcoming when before start date', () => {
        mockToday('2025-12-31');
        expect(ChallengeService.getChallengeStatus('2026-01-01', '2026-01-31')).toBe('upcoming');
    });

    it('returns active on start date', () => {
        mockToday('2026-01-01');
        expect(ChallengeService.getChallengeStatus('2026-01-01', '2026-01-31')).toBe('active');
    });

    it('returns active during challenge', () => {
        mockToday('2026-01-15');
        expect(ChallengeService.getChallengeStatus('2026-01-01', '2026-01-31')).toBe('active');
    });

    it('returns active on end date', () => {
        mockToday('2026-01-31');
        expect(ChallengeService.getChallengeStatus('2026-01-01', '2026-01-31')).toBe('active');
    });

    it('returns ended after end date', () => {
        mockToday('2026-02-01');
        expect(ChallengeService.getChallengeStatus('2026-01-01', '2026-01-31')).toBe('ended');
    });
});
