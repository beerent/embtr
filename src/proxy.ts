import { type NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'embtr-session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'embtr-dev-secret-change-in-production';

async function verifySession(cookieValue: string): Promise<boolean> {
    const lastDot = cookieValue.lastIndexOf('.');
    if (lastDot === -1) return false;
    const value = cookieValue.substring(0, lastDot);
    const signature = cookieValue.substring(lastDot + 1);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(SESSION_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
    const expected = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return signature === expected;
}

export async function proxy(request: NextRequest) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.url;
    const { pathname } = request.nextUrl;

    // Public routes that don't require auth
    const isPublicRoute =
        pathname.startsWith('/signin') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/auth/twitch');

    const sessionCookie = request.cookies.get(SESSION_COOKIE);
    const hasValidSession = sessionCookie?.value ? await verifySession(sessionCookie.value) : false;

    // Redirect unauthenticated users to sign in
    if (!hasValidSession && !isPublicRoute) {
        return NextResponse.redirect(new URL('/signin', baseUrl));
    }

    // Redirect authenticated users away from auth pages
    if (hasValidSession && isPublicRoute) {
        return NextResponse.redirect(new URL('/dashboard', baseUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
