import { BaseDao } from './BaseDao';

export class PlannedDayDao extends BaseDao {
    constructor(client?: any) {
        super('PlannedDayDao', client);
    }

    async getOrCreate(userId: number, date: string) {
        const existing = await this.client.plannedDay.findUnique({
            where: { userId_date: { userId, date } },
            include: {
                plannedTasks: { orderBy: { sortOrder: 'asc' } },
                dayResult: true,
            },
        });

        if (existing) return existing;

        return this.client.plannedDay.create({
            data: { userId, date },
            include: {
                plannedTasks: { orderBy: { sortOrder: 'asc' } },
                dayResult: true,
            },
        });
    }

    async getByUserAndDateRange(userId: number, startDate: string, endDate: string) {
        return this.client.plannedDay.findMany({
            where: {
                userId,
                date: { gte: startDate, lte: endDate },
            },
            include: {
                plannedTasks: { orderBy: { sortOrder: 'asc' } },
                dayResult: true,
            },
            orderBy: { date: 'asc' },
        });
    }

    async updateStatus(id: number, status: string) {
        return this.client.plannedDay.update({
            where: { id },
            data: { status },
        });
    }
}
