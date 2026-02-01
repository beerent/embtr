import { BaseDao } from './BaseDao';

export class ChallengeDao extends BaseDao {
    constructor(client?: any) {
        super('ChallengeDao', client);
    }

    async create(data: {
        title: string;
        description: string;
        iconName?: string;
        iconColor?: string;
        quantity?: number;
        unit?: string;
        startDate: string;
        endDate: string;
        requiredDaysPerWeek: number;
        award?: string;
        createdById: number;
    }) {
        return this.client.challenge.create({
            data,
            include: { _count: { select: { participants: true } } },
        });
    }

    async getById(id: number) {
        return this.client.challenge.findUnique({
            where: { id },
            include: {
                _count: { select: { participants: true } },
                createdBy: { select: { id: true, username: true, displayName: true } },
            },
        });
    }

    async getAll() {
        return this.client.challenge.findMany({
            include: { _count: { select: { participants: true } } },
            orderBy: { startDate: 'desc' },
        });
    }

    async getActive() {
        const today = new Date().toISOString().split('T')[0];
        return this.client.challenge.findMany({
            where: {
                active: true,
                endDate: { gte: today },
            },
            include: { _count: { select: { participants: true } } },
            orderBy: { startDate: 'asc' },
        });
    }

    async update(
        id: number,
        data: {
            title?: string;
            description?: string;
            iconName?: string;
            iconColor?: string;
            quantity?: number;
            unit?: string | null;
            startDate?: string;
            endDate?: string;
            requiredDaysPerWeek?: number;
            award?: string;
            active?: boolean;
        }
    ) {
        return this.client.challenge.update({
            where: { id },
            data,
            include: { _count: { select: { participants: true } } },
        });
    }

    async deactivate(id: number) {
        return this.client.challenge.update({
            where: { id },
            data: { active: false },
        });
    }
}
