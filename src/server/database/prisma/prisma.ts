import { PrismaClient } from '@prisma/client';

// Log database connection details on startup (redact password for security)
if (process.env.DATABASE_URL) {
    try {
        const dbUrl = new URL(process.env.DATABASE_URL);
        console.log(`\x1b[36m[Prisma] Initializing connection to: ${dbUrl.hostname}\x1b[0m`);
    } catch (error) {
        console.error('\x1b[31m[Prisma] Invalid DATABASE_URL format\x1b[0m');
    }
}

/**
 * Singleton PrismaClient factory
 * Creates a single PrismaClient instance with proper configuration for Supabase
 */
const prismaClientSingleton = () => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    let firstQueryLogged = false;

    const client = new PrismaClient({
        log: ['info', 'warn', 'error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    }).$extends({
        query: {
            $allOperations({ model, operation, args, query }: { model: string; operation: string; args: any; query: (args: any) => Promise<any> }) {
                const start = Date.now();

                if (!firstQueryLogged) {
                    console.log('\x1b[32m[Prisma] Database connection established successfully\x1b[0m');
                    firstQueryLogged = true;
                }

                return query(args)
                    .then((result) => {
                        const duration = Date.now() - start;
                        const color = duration > 500 ? '\x1b[31m' : duration > 100 ? '\x1b[33m' : '\x1b[32m';
                        const reset = '\x1b[0m';
                        console.log(
                            `${color}[DB Query]${reset} ${model}.${operation} - ${duration}ms`
                        );
                        return result;
                    })
                    .catch((error: any) => {
                        const duration = Date.now() - start;
                        const reset = '\x1b[0m';
                        console.error(
                            `\x1b[31m[DB Query ERROR]${reset} ${model}.${operation} - ${duration}ms`,
                            {
                                error: error.message,
                                code: error.code,
                                meta: error.meta,
                            }
                        );
                        throw error;
                    });
            },
        },
    });

    return client;
};

type PrismaClientExtended = ReturnType<typeof prismaClientSingleton>;

// Global type declaration for development singleton
declare const globalThis: {
    prismaGlobal: PrismaClientExtended;
} & typeof global;

// Lazy singleton - only instantiates when first accessed via getPrisma()
let _prisma: PrismaClientExtended | null = globalThis.prismaGlobal ?? null;

function getPrisma(): PrismaClientExtended {
    if (!_prisma) {
        _prisma = prismaClientSingleton();

        if (process.env.NODE_ENV !== 'production') {
            globalThis.prismaGlobal = _prisma;
        }
    }
    return _prisma;
}

// Export a proxy that lazily initializes the PrismaClient on first property access
export const prisma = new Proxy({} as PrismaClientExtended, {
    get(_target, prop) {
        return (getPrisma() as any)[prop];
    },
});
