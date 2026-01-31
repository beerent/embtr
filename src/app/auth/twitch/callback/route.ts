import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TwitchService } from '@/server/twitch/TwitchService';
import { TwitchAccountDao } from '@/server/database/TwitchAccountDao';
import { UserDao } from '@/server/database/UserDao';
import { createSession, getSessionUserId } from '@/server/auth/auth';
import { encrypt } from '@/server/auth/encryption';
import { TimelinePostDao } from '@/server/database/TimelinePostDao';
import { refreshSubscriberStatus } from '@/server/twitch/TwitchSubscriberService';
import { Logger } from '@/shared/Logger';

const logger = new Logger('TwitchCallback');

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        logger.warn('Twitch OAuth denied:', error);
        return NextResponse.redirect(new URL('/signin?error=twitch_denied', request.url));
    }

    if (!code || !state) {
        logger.error('Missing code or state in callback');
        return NextResponse.redirect(new URL('/signin?error=twitch_invalid', request.url));
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get('twitch-oauth-state')?.value;
    cookieStore.delete('twitch-oauth-state');

    if (!storedState || storedState !== state) {
        logger.error('CSRF state mismatch');
        return NextResponse.redirect(new URL('/signin?error=twitch_csrf', request.url));
    }

    try {
        const tokens = await TwitchService.exchangeCode(code);
        const twitchUser = await TwitchService.getUser(tokens.accessToken);

        const twitchAccountDao = new TwitchAccountDao();
        const userDao = new UserDao();

        const encryptedAccessToken = encrypt(tokens.accessToken);
        const encryptedRefreshToken = encrypt(tokens.refreshToken);
        const tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
        const scopes = tokens.scope.join(',');

        // Check if this is an authenticated user linking their account
        const currentUserId = await getSessionUserId();

        if (currentUserId) {
            // Authenticated user linking Twitch
            const existingLink = await twitchAccountDao.getByUserId(currentUserId);
            if (existingLink) {
                await twitchAccountDao.update(currentUserId, {
                    accessToken: encryptedAccessToken,
                    refreshToken: encryptedRefreshToken,
                    tokenExpiresAt,
                    twitchLogin: twitchUser.login,
                    twitchDisplayName: twitchUser.displayName,
                    twitchEmail: twitchUser.email,
                    twitchProfileImage: twitchUser.profileImageUrl,
                    scopes,
                });
                await refreshSubscriberStatus(currentUserId, true);
                return NextResponse.redirect(new URL('/settings?twitch=linked', request.url));
            }

            const otherLink = await twitchAccountDao.getByTwitchId(twitchUser.id);
            if (otherLink) {
                return NextResponse.redirect(
                    new URL('/settings?error=twitch_already_linked', request.url)
                );
            }

            await twitchAccountDao.create({
                userId: currentUserId,
                twitchId: twitchUser.id,
                twitchLogin: twitchUser.login,
                twitchDisplayName: twitchUser.displayName,
                twitchEmail: twitchUser.email,
                twitchProfileImage: twitchUser.profileImageUrl,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiresAt,
                scopes,
            });

            await refreshSubscriberStatus(currentUserId, true);
            return NextResponse.redirect(new URL('/settings?twitch=linked', request.url));
        }

        // Unauthenticated — login or signup via Twitch

        // Check if Twitch account already exists (returning user)
        const existingTwitchAccount = await twitchAccountDao.getByTwitchId(twitchUser.id);

        if (existingTwitchAccount) {
            await twitchAccountDao.update(existingTwitchAccount.userId, {
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiresAt,
                twitchLogin: twitchUser.login,
                twitchDisplayName: twitchUser.displayName,
                twitchEmail: twitchUser.email,
                twitchProfileImage: twitchUser.profileImageUrl,
                scopes,
            });

            await createSession(existingTwitchAccount.userId);
            await refreshSubscriberStatus(existingTwitchAccount.userId, true);
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // New Twitch user — create account
        let username = twitchUser.login;
        let existingUser = await userDao.getByUsername(username);
        let suffix = 1;
        while (existingUser) {
            username = `${twitchUser.login}_${suffix}`;
            existingUser = await userDao.getByUsername(username);
            suffix++;
        }

        const newUser = await userDao.create({
            username,
            displayName: twitchUser.displayName,
            email: twitchUser.email,
            photoUrl: twitchUser.profileImageUrl,
        });

        await twitchAccountDao.create({
            userId: newUser.id,
            twitchId: twitchUser.id,
            twitchLogin: twitchUser.login,
            twitchDisplayName: twitchUser.displayName,
            twitchEmail: twitchUser.email,
            twitchProfileImage: twitchUser.profileImageUrl,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt,
            scopes,
        });

        await createSession(newUser.id);
        await refreshSubscriberStatus(newUser.id, true);

        const timelinePostDao = new TimelinePostDao();
        const name = twitchUser.displayName || username;
        await timelinePostDao.create({
            userId: newUser.id,
            type: 'USER_POST',
            body: `${name} just joined Embtr! Welcome to the community!`,
        });

        return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (err) {
        logger.error('Twitch OAuth callback error:', err);
        return NextResponse.redirect(new URL('/signin?error=twitch_error', request.url));
    }
}
