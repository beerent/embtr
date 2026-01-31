'use server';

import { createSession, deleteSession, hashPassword, verifyPassword } from './auth';
import { UserDao } from '../database/UserDao';
import { TimelinePostDao } from '../database/TimelinePostDao';

interface AuthResult {
    success: boolean;
    error?: string;
}

export async function signIn(username: string, password: string): Promise<AuthResult> {
    if (!username || !password) {
        return { success: false, error: 'Username and password are required.' };
    }

    const userDao = new UserDao();
    const user = await userDao.getByUsername(username);

    if (!user) {
        return { success: false, error: 'Invalid username or password.' };
    }

    if (!user.password) {
        return { success: false, error: 'This account uses Twitch to sign in. Use the Twitch button below.' };
    }

    const valid = verifyPassword(password, user.password);
    if (!valid) {
        return { success: false, error: 'Invalid username or password.' };
    }

    await createSession(user.id);
    return { success: true };
}

export async function signUp(
    username: string,
    password: string,
    displayName?: string
): Promise<AuthResult> {
    if (!username || !password) {
        return { success: false, error: 'Username and password are required.' };
    }

    if (username.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters.' };
    }

    if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { success: false, error: 'Username can only contain letters, numbers, and underscores.' };
    }

    const userDao = new UserDao();
    const existing = await userDao.getByUsername(username);

    if (existing) {
        return { success: false, error: 'Username is already taken.' };
    }

    const hashed = hashPassword(password);
    const user = await userDao.create({
        username,
        password: hashed,
        displayName: displayName || undefined,
    });

    await createSession(user.id);

    const timelinePostDao = new TimelinePostDao();
    const name = displayName || username;
    await timelinePostDao.create({
        userId: user.id,
        type: 'USER_POST',
        body: `${name} just joined Embtr! Welcome to the community!`,
    });

    return { success: true };
}

export async function signOut(): Promise<void> {
    await deleteSession();
}
