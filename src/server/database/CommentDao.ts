import { BaseDao } from './BaseDao';

export class CommentDao extends BaseDao {
    constructor(client?: any) {
        super('CommentDao', client);
    }

    async create(data: { userId: number; targetType: string; targetId: number; body: string }) {
        return this.client.comment.create({
            data,
            include: { user: { include: { twitchAccount: { select: { id: true, isSubscriber: true } } } } },
        });
    }

    async getByTarget(targetType: string, targetId: number) {
        return this.client.comment.findMany({
            where: { targetType, targetId },
            include: { user: { include: { twitchAccount: { select: { id: true, isSubscriber: true } } } } },
            orderBy: { createdAt: 'asc' },
        });
    }

    async countByTargets(targetType: string, targetIds: number[]) {
        return this.client.comment.groupBy({
            by: ['targetId'],
            where: { targetType, targetId: { in: targetIds } },
            _count: { id: true },
        });
    }

    async getById(id: number) {
        return this.client.comment.findUnique({ where: { id } });
    }

    async update(id: number, data: { body: string }) {
        return this.client.comment.update({
            where: { id },
            data,
            include: { user: { include: { twitchAccount: { select: { id: true, isSubscriber: true } } } } },
        });
    }

    async delete(id: number) {
        return this.client.comment.delete({ where: { id } });
    }
}
