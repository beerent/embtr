import { BaseDao } from './BaseDao';

export class HabitStreakDao extends BaseDao {
    constructor(client?: any) {
        super('HabitStreakDao', client);
    }

    async getByUserAndHabit(userId: number, habitId: number) {
        return this.client.habitStreak.findUnique({
            where: { userId_habitId: { userId, habitId } },
        });
    }

    async upsert(
        userId: number,
        habitId: number,
        data: { currentStreak: number; longestStreak: number; lastCompleted: string | null }
    ) {
        return this.client.habitStreak.upsert({
            where: { userId_habitId: { userId, habitId } },
            create: {
                userId,
                habitId,
                currentStreak: data.currentStreak,
                longestStreak: data.longestStreak,
                lastCompleted: data.lastCompleted,
            },
            update: {
                currentStreak: data.currentStreak,
                longestStreak: data.longestStreak,
                lastCompleted: data.lastCompleted,
            },
        });
    }

    async getByUserId(userId: number) {
        return this.client.habitStreak.findMany({
            where: { userId },
            include: { habit: true },
        });
    }
}
