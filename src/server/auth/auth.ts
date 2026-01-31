import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'embtr-session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'embtr-dev-secret-change-in-production';

// --- Password hashing ---

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === computedHash;
}

// --- Session cookie ---

function sign(value: string): string {
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
    return `${value}.${signature}`;
}

function verify(signed: string): string | null {
    const lastDot = signed.lastIndexOf('.');
    if (lastDot === -1) return null;
    const value = signed.substring(0, lastDot);
    const signature = signed.substring(lastDot + 1);
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
    if (signature !== expected) return null;
    return value;
}

export async function createSession(userId: number): Promise<void> {
    const cookieStore = await cookies();
    const payload = JSON.stringify({ id: userId });
    const encoded = Buffer.from(payload).toString('base64url');
    const signed = sign(encoded);

    cookieStore.set(SESSION_COOKIE, signed, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
}

export async function getSessionUserId(): Promise<number | null> {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE);
    if (!cookie?.value) return null;

    const encoded = verify(cookie.value);
    if (!encoded) return null;

    try {
        const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
        return payload.id ?? null;
    } catch {
        return null;
    }
}

export async function deleteSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
}
