/**
 * Post-migration script: backfill effortLevel from existing waterCost + scheduledDays.
 *
 * Run with: npx tsx scripts/migrate-effort-levels.ts
 */

import { PrismaClient } from '@prisma/client';

type EffortLevel = 1 | 2 | 3 | 4 | 5;

const EFFORT_BASE: Record<EffortLevel, number> = { 1: 2, 2: 5, 3: 10, 4: 16, 5: 24 };

function reverseEffortLevel(waterCost: number, daysPerWeek: number): EffortLevel {
    const freq = 0.4 + 0.6 * (Math.max(1, daysPerWeek) / 7);
    const impliedBase = waterCost / freq;
    const bases = [2, 5, 10, 16, 24];
    let closest = 0;
    for (let i = 0; i < bases.length; i++) {
        if (Math.abs(bases[i] - impliedBase) < Math.abs(bases[closest] - impliedBase)) closest = i;
    }
    return (closest + 1) as EffortLevel;
}

function computeWaterCost(effortLevel: EffortLevel, daysPerWeek: number): number {
    const clampedDays = Math.max(0, Math.min(7, daysPerWeek));
    const frequencyMultiplier = 0.4 + 0.6 * (clampedDays / 7);
    return Math.max(1, Math.round(EFFORT_BASE[effortLevel] * frequencyMultiplier));
}

async function main() {
    const prisma = new PrismaClient();

    try {
        const habits = await prisma.habit.findMany({
            where: { isArchived: false },
            include: { scheduledHabits: { where: { isActive: true } } },
        });

        console.log(`Found ${habits.length} active habits to migrate.`);

        let updated = 0;
        for (const habit of habits) {
            const daysPerWeek = habit.scheduledHabits.length;
            const effortLevel = reverseEffortLevel(habit.waterCost, daysPerWeek);
            const newWaterCost = computeWaterCost(effortLevel, daysPerWeek);

            await prisma.habit.update({
                where: { id: habit.id },
                data: { effortLevel, waterCost: newWaterCost },
            });

            console.log(
                `  Habit #${habit.id} "${habit.title}": waterCost ${habit.waterCost} -> effortLevel ${effortLevel} (${['', 'Minimal', 'Light', 'Moderate', 'Hard', 'All-In'][effortLevel]}), waterCost recalculated to ${newWaterCost}`
            );
            updated++;
        }

        console.log(`\nDone. Updated ${updated} habits.`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
