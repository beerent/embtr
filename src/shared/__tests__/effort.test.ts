import { describe, it, expect } from 'vitest';
import { computeDropCost, explainDropCost, reverseEffortLevel, getEffortLabel, type EffortLevel } from '../effort';

describe('computeDropCost', () => {
    it('returns minimum of 1', () => {
        expect(computeDropCost(1, 0)).toBe(1);
        expect(computeDropCost(1, 1)).toBeGreaterThanOrEqual(1);
    });

    it('scales with effort level', () => {
        const days = 7;
        const cost1 = computeDropCost(1, days);
        const cost3 = computeDropCost(3, days);
        const cost5 = computeDropCost(5, days);
        expect(cost3).toBeGreaterThan(cost1);
        expect(cost5).toBeGreaterThan(cost3);
    });

    it('scales with frequency', () => {
        const effort: EffortLevel = 3;
        const cost1 = computeDropCost(effort, 1);
        const cost4 = computeDropCost(effort, 4);
        const cost7 = computeDropCost(effort, 7);
        expect(cost4).toBeGreaterThan(cost1);
        expect(cost7).toBeGreaterThan(cost4);
    });

    it('clamps days to 0-7', () => {
        expect(computeDropCost(3, -1)).toBe(computeDropCost(3, 0));
        expect(computeDropCost(3, 10)).toBe(computeDropCost(3, 7));
    });

    it('produces expected values for common cases', () => {
        expect(computeDropCost(1, 7)).toBe(2);
        expect(computeDropCost(2, 5)).toBe(4);
        expect(computeDropCost(3, 7)).toBe(10);
        expect(computeDropCost(4, 5)).toBe(13);
        expect(computeDropCost(5, 7)).toBe(24);
        expect(computeDropCost(4, 1)).toBe(8);
    });

    it('matches the formula output table', () => {
        const expected: Record<EffortLevel, number[]> = {
            1: [1, 1, 1, 1, 2, 2, 2],
            2: [2, 3, 3, 4, 4, 5, 5],
            3: [5, 6, 7, 7, 8, 9, 10],
            4: [8, 9, 11, 12, 13, 15, 16],
            5: [12, 14, 16, 18, 20, 22, 24],
        };

        for (const [level, values] of Object.entries(expected)) {
            const effort = Number(level) as EffortLevel;
            for (let days = 1; days <= 7; days++) {
                expect(computeDropCost(effort, days)).toBe(values[days - 1]);
            }
        }
    });
});

describe('explainDropCost', () => {
    it('contains effort label', () => {
        const result = explainDropCost(3, 5, 8);
        expect(result).toContain('Moderate');
    });

    it('says "every day" for 7 days', () => {
        const result = explainDropCost(2, 7, 5);
        expect(result).toContain('every day');
    });

    it('says "X days a week" for fewer days', () => {
        const result = explainDropCost(4, 3, 10);
        expect(result).toContain('3 days a week');
    });

    it('uses singular for 1 day', () => {
        const result = explainDropCost(1, 1, 1);
        expect(result).toContain('1 day a week');
    });

    it('includes the drop cost number', () => {
        const result = explainDropCost(5, 7, 24);
        expect(result).toContain('24 drops');
    });

    it('uses singular "drop" for cost of 1', () => {
        const result = explainDropCost(1, 1, 1);
        expect(result).toContain('1 drop');
        expect(result).not.toContain('1 drops');
    });
});

describe('reverseEffortLevel', () => {
    it('returns correct effort for known drop costs', () => {
        expect(reverseEffortLevel(2, 7)).toBe(1);
        expect(reverseEffortLevel(10, 7)).toBe(3);
        expect(reverseEffortLevel(24, 7)).toBe(5);
    });

    it('finds closest match for intermediate values', () => {
        const result = reverseEffortLevel(6, 7);
        expect(result).toBe(2);
    });
});

describe('getEffortLabel', () => {
    it('returns correct labels', () => {
        expect(getEffortLabel(1)).toBe('Minimal');
        expect(getEffortLabel(3)).toBe('Moderate');
        expect(getEffortLabel(5)).toBe('All-In');
    });

    it('defaults to Moderate for unknown values', () => {
        expect(getEffortLabel(99)).toBe('Moderate');
    });
});
