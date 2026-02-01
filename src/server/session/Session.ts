import { redirect } from 'next/navigation';

import { getSessionUserId } from '../auth/auth';
import { UserDao } from '../database/UserDao';
import { TwitchAccountDao } from '../database/TwitchAccountDao';

import { SessionUser } from '@/shared/types/SessionUser';

export namespace Session {
    export const getSession = async (): Promise<SessionUser> => {
        const userId = await getSessionUserId();

        if (!userId) {
            redirect('/signin');
        }

        const userDao = new UserDao();
        const dbUser = await userDao.getById(userId);

        if (!dbUser) {
            redirect('/signin');
        }

        const twitchAccountDao = new TwitchAccountDao();
        const twitchAccount = await twitchAccountDao.getByUserId(userId);

        return {
            id: dbUser.id,
            username: dbUser.username,
            displayName: dbUser.displayName ?? undefined,
            photoUrl: dbUser.photoUrl ?? undefined,
            hardMode: dbUser.hardMode,
            role: dbUser.role,
            hasTwitchLinked: !!twitchAccount,
        };
    };
}
