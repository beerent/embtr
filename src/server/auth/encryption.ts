import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.SESSION_SECRET || 'embtr-dev-secret-change-in-production';

function getKey(): Buffer {
    return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

export function encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const key = getKey();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encryptedStr: string): string {
    const [ivHex, authTagHex, ciphertextHex] = encryptedStr.split(':');
    const key = getKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(ciphertextHex, 'hex')),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}
