import { BaseDao } from './BaseDao';

export class BugReportDao extends BaseDao {
    constructor(client?: any) {
        super('BugReportDao', client);
    }

    async create(data: { userId: number; title: string; description: string; priority?: string }) {
        return this.client.bugReport.create({
            data,
            include: { user: { select: { id: true, username: true, displayName: true } } },
        });
    }

    async getById(id: number) {
        return this.client.bugReport.findUnique({
            where: { id },
            include: { user: { select: { id: true, username: true, displayName: true } } },
        });
    }

    async getAll(status?: string) {
        return this.client.bugReport.findMany({
            where: status ? { status } : undefined,
            include: { user: { select: { id: true, username: true, displayName: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateStatus(id: number, status: string) {
        return this.client.bugReport.update({
            where: { id },
            data: { status },
            include: { user: { select: { id: true, username: true, displayName: true } } },
        });
    }

    async update(id: number, data: { title?: string; description?: string }) {
        return this.client.bugReport.update({
            where: { id },
            data,
            include: { user: { select: { id: true, username: true, displayName: true } } },
        });
    }

    async delete(id: number) {
        return this.client.bugReport.delete({ where: { id } });
    }
}
