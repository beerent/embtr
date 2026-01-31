import { BaseDao } from './BaseDao';

export class DayResultDao extends BaseDao {
    constructor(client?: any) {
        super('DayResultDao', client);
    }

    async upsertByPlannedDay(userId: number, plannedDayId: number, date: string, score: number) {
        return this.client.dayResult.upsert({
            where: { plannedDayId },
            create: {
                userId,
                plannedDayId,
                date,
                score,
            },
            update: {
                score,
            },
        });
    }

    async getByUserAndDate(userId: number, date: string) {
        return this.client.dayResult.findUnique({
            where: { userId_date: { userId, date } },
        });
    }

    async getByUserAndDateRange(userId: number, startDate: string, endDate: string) {
        return this.client.dayResult.findMany({
            where: {
                userId,
                date: { gte: startDate, lte: endDate },
            },
            orderBy: { date: 'asc' },
        });
    }
}
