import { describe, it, expect } from 'vitest';
import { computeWaterCost, explainWaterCost, reverseEffortLevel, getEffortLabel, type EffortLevel } from '../effort';

describe('computeWaterCost', () => {
    it('returns minimum of 1', () => {
        expect(computeWaterCost(1, 0)).toBe(1);
        expect(computeWaterCost(1, 1)).toBeGreaterThanOrEqual(1);
    });

    it('scales with effort level', () => {
        const days = 7;
        const cost1 = computeWaterCost(1, days);
        const cost3 = computeWaterCost(3, days);
        const cost5 = computeWaterCost(5, days);
        expect(cost3).toBeGreaterThan(cost1);
        expect(cost5).toBeGreaterThan(cost3);
    });

    it('scales with frequency', () => {
        const effort: EffortLevel = 3;
        const cost1 = computeWaterCost(effort, 1);
        const cost4 = computeWaterCost(effort, 4);
        const cost7 = computeWaterCost(effort, 7);
        expect(cost4).toBeGreaterThan(cost1);
        expect(cost7).toBeGreaterThan(cost4);
    });

    it('clamps days to 0-7', () => {
        expect(computeWaterCost(3, -1)).toBe(computeWaterCost(3, 0));
        expect(computeWaterCost(3, 10)).toBe(computeWaterCost(3, 7));
    });

    it('produces expected values for common cases', () => {
        // Minimal, 7 days -> 2
        expect(computeWaterCost(1, 7)).toBe(2);
        // Light, 5 days -> 4
        expect(computeWaterCost(2, 5)).toBe(4);
        // Moderate, 7 days -> 10
        expect(computeWaterCost(3, 7)).toBe(10);
        // Hard, 5 days -> 13
        expect(computeWaterCost(4, 5)).toBe(13);
        // All-In, 7 days -> 24
        expect(computeWaterCost(5, 7)).toBe(24);
        // Hard, 1 day -> 8
        expect(computeWaterCost(4, 1)).toBe(8);
    });

    it('matches the formula output table', () => {
        // Computed from: max(1, round(effortBase * (0.4 + 0.6 * days/7)))
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
                expect(computeWaterCost(effort, days)).toBe(values[days - 1]);
            }
        }
    });
});

describe('explainWaterCost', () => {
    it('contains effort label', () => {
        const result = explainWaterCost(3, 5, 8);
        expect(result).toContain('Moderate');
    });

    it('says "every day" for 7 days', () => {
        const result = explainWaterCost(2, 7, 5);
        expect(result).toContain('every day');
    });

    it('says "X days a week" for fewer days', () => {
        const result = explainWaterCost(4, 3, 10);
        expect(result).toContain('3 days a week');
    });

    it('uses singular for 1 day', () => {
        const result = explainWaterCost(1, 1, 1);
        expect(result).toContain('1 day a week');
    });

    it('includes the water cost number', () => {
        const result = explainWaterCost(5, 7, 24);
        expect(result).toContain('24 water');
    });
});

describe('reverseEffortLevel', () => {
    it('returns correct effort for known water costs', () => {
        expect(reverseEffortLevel(2, 7)).toBe(1);
        expect(reverseEffortLevel(10, 7)).toBe(3);
        expect(reverseEffortLevel(24, 7)).toBe(5);
    });

    it('finds closest match for intermediate values', () => {
        // waterCost=6 at 7 days: base would be 6, closest to 5 (Light)
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
