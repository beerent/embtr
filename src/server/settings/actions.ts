'use server';

import { getSessionUserId } from '../auth/auth';
import { UserDao } from '../database/UserDao';

export async function setHardMode(enabled: boolean): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    if (typeof enabled !== 'boolean') {
        return { success: false, error: 'Invalid value.' };
    }

    const userDao = new UserDao();
    await userDao.update(userId, { hardMode: enabled });

    return { success: true };
}
