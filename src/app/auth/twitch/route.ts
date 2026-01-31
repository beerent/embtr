import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { TwitchService } from '@/server/twitch/TwitchService';

export async function GET() {
    const state = crypto.randomBytes(32).toString('hex');

    const cookieStore = await cookies();
    cookieStore.set('twitch-oauth-state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 10,
    });

    const authUrl = TwitchService.getAuthorizationUrl(state);
    return NextResponse.redirect(authUrl);
}
