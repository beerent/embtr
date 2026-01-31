'use server';

import { getSessionUserId } from '../auth/auth';
import { decrypt } from '../auth/encryption';
import { TwitchAccountDao } from '../database/TwitchAccountDao';
import { UserDao } from '../database/UserDao';
import { TwitchService } from './TwitchService';
import { TwitchTokenManager } from './TwitchTokenManager';

export async function unlinkTwitch(): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const userDao = new UserDao();
    const user = await userDao.getById(userId);

    if (!user?.password) {
        return {
            success: false,
            error: 'Cannot unlink Twitch. Please set a password first.',
        };
    }

    const twitchAccountDao = new TwitchAccountDao();
    const twitchAccount = await twitchAccountDao.getByUserId(userId);
    if (!twitchAccount) {
        return { success: false, error: 'No Twitch account linked.' };
    }

    try {
        await TwitchService.revokeToken(decrypt(twitchAccount.accessToken));
    } catch {
        // Non-fatal — still unlink locally
    }

    await twitchAccountDao.deleteByUserId(userId);
    return { success: true };
}

export async function getTwitchStatus(): Promise<{
    linked: boolean;
    twitchDisplayName?: string;
    twitchLogin?: string;
}> {
    const userId = await getSessionUserId();
    if (!userId) return { linked: false };

    const twitchAccountDao = new TwitchAccountDao();
    const account = await twitchAccountDao.getByUserId(userId);

    if (!account) return { linked: false };

    return {
        linked: true,
        twitchDisplayName: account.twitchDisplayName,
        twitchLogin: account.twitchLogin,
    };
}

export async function checkTwitchSubscription(): Promise<{
    isSubscribed: boolean;
    tier?: string;
    error?: string;
}> {
    const userId = await getSessionUserId();
    if (!userId) return { isSubscribed: false, error: 'Not authenticated.' };

    const broadcasterId = process.env.TWITCH_BROADCASTER_ID;
    if (!broadcasterId) return { isSubscribed: false, error: 'Broadcaster not configured.' };

    const accessToken = await TwitchTokenManager.getValidAccessToken(userId);
    if (!accessToken) return { isSubscribed: false, error: 'Twitch not linked.' };

    const twitchAccountDao = new TwitchAccountDao();
    const account = await twitchAccountDao.getByUserId(userId);
    if (!account) return { isSubscribed: false };

    const result = await TwitchService.checkSubscription(
        accessToken,
        broadcasterId,
        account.twitchId
    );

    return {
        isSubscribed: result.isSubscribed,
        tier: result.tier,
    };
}
