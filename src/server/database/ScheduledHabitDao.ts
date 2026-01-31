import { BaseDao } from './BaseDao';

export class ScheduledHabitDao extends BaseDao {
    constructor(client?: any) {
        super('ScheduledHabitDao', client);
    }

    async getByHabitId(habitId: number) {
        return this.client.scheduledHabit.findMany({
            where: { habitId },
        });
    }

    async setSchedule(userId: number, habitId: number, dayOfWeekArray: number[]) {
        // Upsert active days
        for (const dayOfWeek of dayOfWeekArray) {
            await this.client.scheduledHabit.upsert({
                where: {
                    userId_habitId_dayOfWeek: { userId, habitId, dayOfWeek },
                },
                create: { userId, habitId, dayOfWeek, isActive: true },
                update: { isActive: true },
            });
        }

        // Deactivate days not in the array
        const allDays = [0, 1, 2, 3, 4, 5, 6];
        const removedDays = allDays.filter((d) => !dayOfWeekArray.includes(d));

        if (removedDays.length > 0) {
            await this.client.scheduledHabit.updateMany({
                where: {
                    userId,
                    habitId,
                    dayOfWeek: { in: removedDays },
                },
                data: { isActive: false },
            });
        }
    }
}
