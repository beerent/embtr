'use server';

import { getSessionUserId } from '../auth/auth';
import { UserDao } from '../database/UserDao';

export interface UserListEntry {
    id: number;
    username: string;
    displayName: string | null;
    photoUrl: string | null;
    role: string;
    isCurrentUser: boolean;
}

export async function getUsers(): Promise<UserListEntry[]> {
    const userId = await getSessionUserId();
    if (!userId) {
        return [];
    }

    const userDao = new UserDao();
    const users = await userDao.getAll();

    return users.map((u) => ({
        ...u,
        isCurrentUser: u.id === userId,
    }));
}

export async function setUserRole(targetUserId: number, role: string): Promise<{ error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) {
        return { error: 'Not authenticated' };
    }

    if (role !== 'user' && role !== 'admin') {
        return { error: 'Invalid role' };
    }

    const userDao = new UserDao();
    const currentUser = await userDao.getById(userId);
    if (!currentUser || currentUser.role !== 'admin') {
        return { error: 'Not authorized' };
    }

    if (targetUserId === userId) {
        return { error: 'Cannot change your own role' };
    }

    await userDao.updateRole(targetUserId, role);
    return {};
}
