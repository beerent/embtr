import { BaseDao } from './BaseDao';

export class PlannedTaskDao extends BaseDao {
    constructor(client?: any) {
        super('PlannedTaskDao', client);
    }

    async getByPlannedDayId(plannedDayId: number) {
        return this.client.plannedTask.findMany({
            where: { plannedDayId },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async createFromSchedule(
        plannedDayId: number,
        habit: { id: number; title: string; description: string | null; quantity: number; unit: string | null },
        sortOrder: number
    ) {
        return this.client.plannedTask.create({
            data: {
                plannedDayId,
                habitId: habit.id,
                title: habit.title,
                description: habit.description,
                sortOrder,
                quantity: habit.quantity,
                unit: habit.unit,
            },
        });
    }

    async getByIdWithDay(id: number) {
        return this.client.plannedTask.findUnique({
            where: { id },
            include: { plannedDay: true },
        });
    }

    async updateStatus(id: number, status: string, completedAt?: Date | null) {
        return this.client.plannedTask.update({
            where: { id },
            data: { status, completedAt },
        });
    }

    async update(id: number, data: {
        completedQuantity?: number;
        status?: string;
        completedAt?: Date | null;
    }) {
        return this.client.plannedTask.update({
            where: { id },
            data,
        });
    }

    async getByPlannedDayIdAndHabitId(plannedDayId: number, habitId: number) {
        return this.client.plannedTask.findMany({
            where: { plannedDayId, habitId },
        });
    }
}
