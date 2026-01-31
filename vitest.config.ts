import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        exclude: ['e2e/**', 'node_modules/**'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@client': path.resolve(__dirname, 'src/client'),
            '@server': path.resolve(__dirname, 'src/server'),
            '@shared': path.resolve(__dirname, 'src/shared'),
            '@prisma': path.resolve(__dirname, 'prisma'),
        },
    },
});
