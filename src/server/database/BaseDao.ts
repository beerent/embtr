import { PrismaTransaction } from './prisma/PrismaTransaction';
import { prisma } from './prisma/prisma';

import { Logger } from '@/shared/Logger';
import { PrismaClient } from '@prisma/client';

export abstract class BaseDao {
    protected client: PrismaClient;
    protected logger: Logger;

    public constructor(daoName: string, client?: PrismaClient) {
        this.logger = new Logger(daoName);
        this.client = client || prisma;
    }

    public static withTransaction<T extends BaseDao>(
        this: new (tx?: PrismaTransaction) => T,
        tx?: PrismaTransaction
    ): T {
        return new this(tx);
    }

    public static getInstance<T extends BaseDao>(this: new (tx?: PrismaTransaction) => T): T {
        return new this();
    }

    /**
     * Connect to a relation if ID exists, disconnect if undefined/null
     */
    protected connectOrDisconnect(id: number | undefined | null) {
        return id ? { connect: { id } } : { disconnect: true };
    }

    /**
     * Connect to a relation if ID exists, undefined otherwise (no change)
     */
    protected connectIfPresent(id: string | undefined | null) {
        return id ? { connect: { id } } : undefined;
    }

    /**
     * Simple connect (when ID is guaranteed to exist)
     */
    protected connect(id: number) {
        return { connect: { id } };
    }

    /**
     * Generate an array of date strings for the last N days INCLUDING TODAY in the user's timezone.
     */
    protected generateDailyDateStrings(days: number, timezone: string): string[] {
        const dateStrings: string[] = [];
        const today = new Date();

        const todayInTz = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(today);

        const [year, month, day] = todayInTz.split('-').map(Number);

        for (let i = days - 1; i >= 0; i--) {
            const targetDate = new Date(Date.UTC(year, month - 1, day - i, 12, 0, 0));
            const formatted = targetDate.toISOString().split('T')[0];
            dateStrings.push(formatted);
        }

        return dateStrings;
    }

    /**
     * Get timezone-aware UTC boundaries for a specific calendar day in the user's timezone.
     */
    protected getTimezoneAwareDayBoundaries(date: Date, timezone: string): { start: Date; end: Date } {
        const dateStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(date);

        const startLocal = new Date(`${dateStr}T00:00:00`);
        const endLocal = new Date(`${dateStr}T23:59:59.999`);

        // Convert to UTC by getting the timezone offset
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'shortOffset',
        });
        const parts = formatter.formatToParts(date);
        const offsetPart = parts.find((p) => p.type === 'timeZoneName');
        const offsetStr = offsetPart?.value || 'GMT';

        // Parse offset
        const match = offsetStr.match(/GMT([+-]?)(\d+)?:?(\d+)?/);
        let offsetMinutes = 0;
        if (match) {
            const sign = match[1] === '-' ? -1 : 1;
            const hours = parseInt(match[2] || '0', 10);
            const minutes = parseInt(match[3] || '0', 10);
            offsetMinutes = sign * (hours * 60 + minutes);
        }

        const start = new Date(startLocal.getTime() - offsetMinutes * 60000);
        const end = new Date(endLocal.getTime() - offsetMinutes * 60000);

        return { start, end };
    }
}
