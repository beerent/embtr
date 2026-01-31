import { TwitchAccountDao } from '../database/TwitchAccountDao';
import { TwitchService } from './TwitchService';
import { encrypt, decrypt } from '../auth/encryption';
import { Logger } from '@/shared/Logger';

const logger = new Logger('TwitchTokenManager');

export namespace TwitchTokenManager {
    export async function getValidAccessToken(userId: number): Promise<string | null> {
        const twitchAccountDao = new TwitchAccountDao();
        const account = await twitchAccountDao.getByUserId(userId);
        if (!account) return null;

        const now = new Date();
        const expiresAt = new Date(account.tokenExpiresAt);
        const bufferMs = 5 * 60 * 1000;

        if (expiresAt.getTime() - bufferMs > now.getTime()) {
            return decrypt(account.accessToken);
        }

        logger.info('Refreshing Twitch token for user:', userId);
        try {
            const newTokens = await TwitchService.refreshAccessToken(decrypt(account.refreshToken));

            await twitchAccountDao.update(userId, {
                accessToken: encrypt(newTokens.accessToken),
                refreshToken: encrypt(newTokens.refreshToken),
                tokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
            });

            return newTokens.accessToken;
        } catch (err) {
            logger.error('Token refresh failed for user:', userId, err);
            return null;
        }
    }
}
