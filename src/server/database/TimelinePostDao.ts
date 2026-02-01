import { BaseDao } from './BaseDao';

const POST_INCLUDE = {
    user: { include: { twitchAccount: { select: { id: true, isSubscriber: true } } } },
    plannedDay: {
        include: {
            plannedTasks: { orderBy: { sortOrder: 'asc' as const } },
            dayResult: true,
        },
    },
    challenge: {
        select: {
            id: true,
            title: true,
            description: true,
            award: true,
            iconName: true,
            iconColor: true,
            startDate: true,
            endDate: true,
            requiredDaysPerWeek: true,
            _count: { select: { participants: true } },
        },
    },
};

export class TimelinePostDao extends BaseDao {
    constructor(client?: any) {
        super('TimelinePostDao', client);
    }

    async create(data: { userId: number; type: string; body?: string | null; plannedDayId?: number | null; challengeId?: number | null }) {
        return this.client.timelinePost.create({
            data,
            include: POST_INCLUDE,
        });
    }

    async getById(id: number) {
        return this.client.timelinePost.findUnique({
            where: { id },
            include: POST_INCLUDE,
        });
    }

    async getFeed(cursor?: string, limit = 10) {
        const where = cursor ? { createdAt: { lt: new Date(cursor) } } : {};

        return this.client.timelinePost.findMany({
            where,
            include: POST_INCLUDE,
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
        });
    }

    async getByUserAndPlannedDay(userId: number, plannedDayId: number) {
        return this.client.timelinePost.findFirst({
            where: { userId, plannedDayId },
        });
    }

    async update(id: number, data: { body?: string | null }) {
        return this.client.timelinePost.update({
            where: { id },
            data,
            include: POST_INCLUDE,
        });
    }

    async delete(id: number) {
        return this.client.timelinePost.delete({ where: { id } });
    }
}
