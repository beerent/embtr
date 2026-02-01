import { BaseDao } from './BaseDao';

export class ChallengeParticipantDao extends BaseDao {
    constructor(client?: any) {
        super('ChallengeParticipantDao', client);
    }

    async create(data: { challengeId: number; userId: number; habitId: number }) {
        return this.client.challengeParticipant.create({
            data,
            include: { challenge: true, habit: true },
        });
    }

    async getByChallengeAndUser(challengeId: number, userId: number) {
        return this.client.challengeParticipant.findUnique({
            where: { challengeId_userId: { challengeId, userId } },
            include: { challenge: true, habit: true },
        });
    }

    async getByUserId(userId: number) {
        return this.client.challengeParticipant.findMany({
            where: { userId },
            include: { challenge: { include: { _count: { select: { participants: true } } } } },
            orderBy: { joinedAt: 'desc' },
        });
    }

    async getByChallengeId(challengeId: number) {
        return this.client.challengeParticipant.findMany({
            where: { challengeId },
            include: {
                user: { select: { id: true, username: true, displayName: true, photoUrl: true } },
            },
            orderBy: { joinedAt: 'asc' },
        });
    }

    async updateStatus(id: number, status: string, completedAt?: Date | null) {
        return this.client.challengeParticipant.update({
            where: { id },
            data: { status, completedAt },
        });
    }

    async delete(id: number) {
        return this.client.challengeParticipant.delete({ where: { id } });
    }
}
