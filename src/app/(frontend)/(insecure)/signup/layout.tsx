import type { Metadata } from 'next';
import React from 'react';

import '@/app/globals.css';

export const metadata: Metadata = {
    title: 'embtr',
    description: 'Build better habits, one day at a time',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-theme-mode="dark">
            <head>
                <link rel="icon" href="/favicon.png" type="image/png" />
            </head>
            <body>{children}</body>
        </html>
    );
}
