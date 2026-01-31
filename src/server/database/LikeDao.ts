import { BaseDao } from './BaseDao';

export class LikeDao extends BaseDao {
    constructor(client?: any) {
        super('LikeDao', client);
    }

    async toggle(userId: number, targetType: string, targetId: number): Promise<{ liked: boolean }> {
        const existing = await this.client.like.findUnique({
            where: { userId_targetType_targetId: { userId, targetType, targetId } },
        });

        if (existing) {
            await this.client.like.delete({ where: { id: existing.id } });
            return { liked: false };
        }

        await this.client.like.create({ data: { userId, targetType, targetId } });
        return { liked: true };
    }

    async batchCountByTarget(targetType: string, targetIds: number[]): Promise<Map<number, number>> {
        const results = await this.client.like.groupBy({
            by: ['targetId'],
            where: { targetType, targetId: { in: targetIds } },
            _count: { id: true },
        });

        const map = new Map<number, number>();
        for (const row of results) {
            map.set(row.targetId, row._count.id);
        }
        return map;
    }

    async countByUserPosts(userId: number, targetType: string): Promise<number> {
        const posts = await this.client.timelinePost.findMany({
            where: { userId },
            select: { id: true },
        });
        if (posts.length === 0) return 0;
        return this.client.like.count({
            where: {
                targetType,
                targetId: { in: posts.map((p: { id: number }) => p.id) },
            },
        });
    }

    async batchGetLikedStatus(userId: number, targetType: string, targetIds: number[]): Promise<Set<number>> {
        const likes = await this.client.like.findMany({
            where: { userId, targetType, targetId: { in: targetIds } },
            select: { targetId: true },
        });

        return new Set(likes.map((l: { targetId: number }) => l.targetId));
    }
}
