import { PrismaClient } from '@prisma/client/extension';
import { prisma } from './prisma';

export class PrismaTransaction {
    public static async execute<T>(callback: (tx: PrismaClient) => Promise<T>): Promise<T> {
        return await prisma.$transaction(callback, {
            maxWait: 5000,
            timeout: 10000,
        });
    }
}
