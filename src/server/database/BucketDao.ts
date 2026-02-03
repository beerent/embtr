import { BaseDao } from './BaseDao';

export class BucketDao extends BaseDao {
    constructor(client?: any) {
        super('BucketDao', client);
    }

    async getByUserId(userId: number) {
        return this.client.bucket.findMany({
            where: { userId, isArchived: false },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async getByUserIdWithHabits(userId: number) {
        return this.client.bucket.findMany({
            where: { userId, isArchived: false },
            include: {
                habits: {
                    where: { isArchived: false },
                    select: { id: true, dropCost: true },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async getById(id: number) {
        return this.client.bucket.findUnique({
            where: { id },
        });
    }

    async create(data: {
        userId: number;
        name: string;
        color?: string;
        iconName?: string;
        sortOrder?: number;
    }) {
        return this.client.bucket.create({ data });
    }

    async update(
        id: number,
        data: {
            name?: string;
            color?: string;
            iconName?: string;
        }
    ) {
        return this.client.bucket.update({
            where: { id },
            data,
        });
    }

    async archive(id: number) {
        return this.client.bucket.update({
            where: { id },
            data: { isArchived: true },
        });
    }

    async reorder(userId: number, orderedIds: number[]) {
        const updates = orderedIds.map((id, index) =>
            this.client.bucket.updateMany({
                where: { id, userId },
                data: { sortOrder: index },
            })
        );
        return Promise.all(updates);
    }

    async getNextSortOrder(userId: number): Promise<number> {
        const result = await this.client.bucket.aggregate({
            where: { userId, isArchived: false },
            _max: { sortOrder: true },
        });
        return (result._max.sortOrder ?? -1) + 1;
    }

    async getDistributionByDateRange(
        userId: number,
        startDate: string,
        endDate: string
    ) {
        const results = await this.client.$queryRaw`
            SELECT
                b.id as "bucketId",
                b.name as "bucketName",
                b.color as "bucketColor",
                b."iconName" as "bucketIconName",
                COALESCE(SUM(h."waterCost"), 0)::int as "totalDrops"
            FROM planned_tasks pt
            JOIN planned_days pd ON pd.id = pt."plannedDayId"
            JOIN habits h ON h.id = pt."habitId"
            JOIN buckets b ON b.id = h."bucketId"
            WHERE pd."userId" = ${userId}
              AND pd.date >= ${startDate}
              AND pd.date <= ${endDate}
              AND pt.status = 'complete'
            GROUP BY b.id, b.name, b.color, b."iconName"
            ORDER BY "totalDrops" DESC
        `;
        return results;
    }
}
