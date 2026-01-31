import { Logger } from '@/shared/Logger';

const logger = new Logger('TwitchService');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID!;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET!;
const TWITCH_REDIRECT_URI = process.env.TWITCH_REDIRECT_URI!;

const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_USERS_URL = 'https://api.twitch.tv/helix/users';
const TWITCH_SUBSCRIPTIONS_URL = 'https://api.twitch.tv/helix/subscriptions/user';
const TWITCH_REVOKE_URL = 'https://id.twitch.tv/oauth2/revoke';

export interface TwitchTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    scope: string[];
}

export interface TwitchUser {
    id: string;
    login: string;
    displayName: string;
    email?: string;
    profileImageUrl?: string;
}

export interface TwitchSubscription {
    isSubscribed: boolean;
    tier?: string;
    giftedBy?: string;
}

export namespace TwitchService {
    export function getAuthorizationUrl(state: string): string {
        const params = new URLSearchParams({
            client_id: TWITCH_CLIENT_ID,
            redirect_uri: TWITCH_REDIRECT_URI,
            response_type: 'code',
            scope: 'user:read:email user:read:subscriptions',
            state,
            force_verify: 'true',
        });
        return `${TWITCH_AUTH_URL}?${params.toString()}`;
    }

    export async function exchangeCode(code: string): Promise<TwitchTokens> {
        const response = await fetch(TWITCH_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: TWITCH_REDIRECT_URI,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            logger.error('Token exchange failed:', errorBody);
            throw new Error('Failed to exchange authorization code');
        }

        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            scope: data.scope || [],
        };
    }

    export async function refreshAccessToken(refreshToken: string): Promise<TwitchTokens> {
        const response = await fetch(TWITCH_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            logger.error('Token refresh failed:', errorBody);
            throw new Error('Failed to refresh access token');
        }

        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            scope: data.scope || [],
        };
    }

    export async function getUser(accessToken: string): Promise<TwitchUser> {
        const response = await fetch(TWITCH_USERS_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Client-Id': TWITCH_CLIENT_ID,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch Twitch user profile');
        }

        const data = await response.json();
        const user = data.data[0];
        return {
            id: user.id,
            login: user.login,
            displayName: user.display_name,
            email: user.email,
            profileImageUrl: user.profile_image_url,
        };
    }

    export async function checkSubscription(
        accessToken: string,
        broadcasterId: string,
        userId: string
    ): Promise<TwitchSubscription> {
        const params = new URLSearchParams({
            broadcaster_id: broadcasterId,
            user_id: userId,
        });

        const response = await fetch(`${TWITCH_SUBSCRIPTIONS_URL}?${params}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Client-Id': TWITCH_CLIENT_ID,
            },
        });

        if (response.status === 404) {
            return { isSubscribed: false };
        }

        if (!response.ok) {
            logger.warn('Subscription check failed, status:', response.status);
            return { isSubscribed: false };
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
            const sub = data.data[0];
            return {
                isSubscribed: true,
                tier: sub.tier,
                giftedBy: sub.gifter_login,
            };
        }

        return { isSubscribed: false };
    }

    export async function revokeToken(token: string): Promise<void> {
        await fetch(TWITCH_REVOKE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: TWITCH_CLIENT_ID,
                token,
            }),
        });
    }
}
