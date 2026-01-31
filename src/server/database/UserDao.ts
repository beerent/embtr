import { BaseDao } from './BaseDao';

export class UserDao extends BaseDao {
    constructor(client?: any) {
        super('UserDao', client);
    }

    async getById(id: number) {
        return this.client.user.findUnique({
            where: { id },
        });
    }

    async getByUsername(username: string) {
        return this.client.user.findUnique({
            where: { username },
        });
    }

    async create(data: {
        username: string;
        password?: string;
        displayName?: string;
        email?: string;
        photoUrl?: string;
    }) {
        return this.client.user.create({
            data,
        });
    }

    async update(id: number, data: {
        displayName?: string;
        bio?: string;
        photoUrl?: string;
        bannerUrl?: string;
        timezone?: string;
        accountSetup?: boolean;
        hardMode?: boolean;
    }) {
        return this.client.user.update({
            where: { id },
            data,
        });
    }
}
