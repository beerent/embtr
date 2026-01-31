import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/server/auth/auth';

export async function GET(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) {
        return NextResponse.redirect(new URL('/signin', request.url));
    }

    return NextResponse.redirect(new URL('/auth/twitch', request.url));
}
