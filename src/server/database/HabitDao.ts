import { BaseDao } from './BaseDao';

export class HabitDao extends BaseDao {
    constructor(client?: any) {
        super('HabitDao', client);
    }

    async getByUserId(userId: number) {
        return this.client.habit.findMany({
            where: { userId, isArchived: false },
            include: { scheduledHabits: true },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getById(id: number) {
        return this.client.habit.findUnique({
            where: { id },
            include: { scheduledHabits: true },
        });
    }

    async create(data: {
        userId: number;
        title: string;
        description?: string;
        iconName?: string;
        iconColor?: string;
        quantity?: number;
        unit?: string;
    }) {
        return this.client.habit.create({ data });
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
        }
    ) {
        return this.client.habit.update({
            where: { id },
            data,
        });
    }

    async archive(id: number) {
        return this.client.habit.update({
            where: { id },
            data: { isArchived: true },
        });
    }
}
