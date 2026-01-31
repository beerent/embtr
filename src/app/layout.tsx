import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'embtr',
    description: 'Build better habits, one day at a time',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
