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

    async getLeaderboardByDateRange(startDate: string, endDate: string) {
        const grouped = await this.client.dayResult.groupBy({
            by: ['userId'],
            where: {
                score: 100,
                date: { gte: startDate, lte: endDate },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });

        if (grouped.length === 0) return [];

        const userIds = grouped.map((g: { userId: number }) => g.userId);
        const users = await this.client.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, photoUrl: true },
        });

        const userMap = new Map(users.map((u: { id: number; username: string; photoUrl: string | null }) => [u.id, u]));

        return grouped.map((g: { userId: number; _count: { id: number } }) => {
            const user = userMap.get(g.userId);
            return {
                userId: g.userId,
                username: user?.username ?? 'Unknown',
                photoUrl: user?.photoUrl ?? null,
                perfectDays: g._count.id,
            };
        });
    }
}
