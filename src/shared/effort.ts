export type EffortLevel = 1 | 2 | 3 | 4 | 5;

export interface EffortLevelInfo {
    level: EffortLevel;
    label: string;
    description: string;
    example: string;
}

export const EFFORT_LEVELS: EffortLevelInfo[] = [
    { level: 1, label: 'Minimal', description: 'Almost no time or thought', example: 'Taking a vitamin, drinking water' },
    { level: 2, label: 'Light', description: 'A small but intentional part of your routine', example: 'A short walk, 5 minutes of journaling' },
    { level: 3, label: 'Moderate', description: 'Takes focus and dedicated time', example: 'A workout, 30 minutes of reading' },
    { level: 4, label: 'Hard', description: 'A serious chunk of your day and energy', example: 'An hour of intense training, deep study' },
    { level: 5, label: 'All-In', description: 'One of the most demanding things you do', example: 'Marathon training, hours of focused practice' },
];

const EFFORT_BASE: Record<EffortLevel, number> = { 1: 2, 2: 5, 3: 10, 4: 16, 5: 24 };

export function computeDropCost(effortLevel: EffortLevel, daysPerWeek: number): number {
    const clampedDays = Math.max(0, Math.min(7, daysPerWeek));
    const frequencyMultiplier = 0.4 + 0.6 * (clampedDays / 7);
    return Math.max(1, Math.round(EFFORT_BASE[effortLevel] * frequencyMultiplier));
}

export function explainDropCost(effortLevel: EffortLevel, daysPerWeek: number, dropCost: number): string {
    const info = EFFORT_LEVELS.find((e) => e.level === effortLevel);
    const label = info?.label ?? 'Unknown';
    const dayText = daysPerWeek === 7 ? 'every day' : `${daysPerWeek} day${daysPerWeek === 1 ? '' : 's'} a week`;
    return `${dropCost} drop${dropCost === 1 ? '' : 's'} \u2014 ${label} effort, ${dayText}`;
}

export function getEffortLabel(effortLevel: number): string {
    const info = EFFORT_LEVELS.find((e) => e.level === effortLevel);
    return info?.label ?? 'Moderate';
}

export function reverseEffortLevel(dropCost: number, daysPerWeek: number): EffortLevel {
    const freq = 0.4 + 0.6 * (Math.max(1, daysPerWeek) / 7);
    const impliedBase = dropCost / freq;
    const bases = [2, 5, 10, 16, 24];
    let closest = 0;
    for (let i = 0; i < bases.length; i++) {
        if (Math.abs(bases[i] - impliedBase) < Math.abs(bases[closest] - impliedBase)) closest = i;
    }
    return (closest + 1) as EffortLevel;
}
