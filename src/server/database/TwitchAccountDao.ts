import { BaseDao } from './BaseDao';

export class TwitchAccountDao extends BaseDao {
    constructor(client?: any) {
        super('TwitchAccountDao', client);
    }

    async getByTwitchId(twitchId: string) {
        return this.client.twitchAccount.findUnique({
            where: { twitchId },
            include: { user: true },
        });
    }

    async getByUserId(userId: number) {
        return this.client.twitchAccount.findUnique({
            where: { userId },
        });
    }

    async create(data: {
        userId: number;
        twitchId: string;
        twitchLogin: string;
        twitchDisplayName: string;
        twitchEmail?: string;
        twitchProfileImage?: string;
        accessToken: string;
        refreshToken: string;
        tokenExpiresAt: Date;
        scopes: string;
    }) {
        return this.client.twitchAccount.create({ data });
    }

    async update(
        userId: number,
        data: {
            twitchLogin?: string;
            twitchDisplayName?: string;
            twitchEmail?: string;
            twitchProfileImage?: string;
            accessToken?: string;
            refreshToken?: string;
            tokenExpiresAt?: Date;
            scopes?: string;
            isSubscriber?: boolean;
            subscriberCheckedAt?: Date;
        }
    ) {
        return this.client.twitchAccount.update({
            where: { userId },
            data,
        });
    }

    async deleteByUserId(userId: number) {
        return this.client.twitchAccount.delete({
            where: { userId },
        });
    }
}
