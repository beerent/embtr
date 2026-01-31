import { TwitchAccountDao } from '../database/TwitchAccountDao';
import { TwitchTokenManager } from './TwitchTokenManager';
import { TwitchService } from './TwitchService';
import { Logger } from '@/shared/Logger';

const logger = new Logger('TwitchSubscriberService');

const STALE_MS = 60 * 60 * 1000; // 1 hour

export async function refreshSubscriberStatus(
    userId: number,
    forceRefresh = false
): Promise<void> {
    try {
        const dao = new TwitchAccountDao();
        const account = await dao.getByUserId(userId);
        if (!account) return;

        if (
            !forceRefresh &&
            account.subscriberCheckedAt &&
            Date.now() - new Date(account.subscriberCheckedAt).getTime() < STALE_MS
        ) {
            return;
        }

        const accessToken = await TwitchTokenManager.getValidAccessToken(userId);
        if (!accessToken) return;

        const broadcasterId = process.env.TWITCH_BROADCASTER_ID;
        if (!broadcasterId) {
            logger.warn('TWITCH_BROADCASTER_ID not configured');
            return;
        }

        const result = await TwitchService.checkSubscription(
            accessToken,
            broadcasterId,
            account.twitchId
        );

        await dao.update(userId, {
            isSubscriber: result.isSubscribed,
            subscriberCheckedAt: new Date(),
        });
    } catch (err) {
        logger.error('Failed to refresh subscriber status for user:', userId, err);
    }
}
