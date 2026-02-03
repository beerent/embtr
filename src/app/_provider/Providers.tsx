'use client';

import React from 'react';

import { SessionProvider } from '@/client/context/SessionProvider';
import { NotificationProvider } from '@/client/context/NotificationProvider';
import { SessionUser } from '@/shared/types/SessionUser';

interface Props {
    children: React.ReactNode;
    initialUser: SessionUser | null;
}

export default function Providers({ children, initialUser }: Props) {
    return (
        <SessionProvider initialUser={initialUser}>
            {initialUser ? (
                <NotificationProvider>{children}</NotificationProvider>
            ) : (
                children
            )}
        </SessionProvider>
    );
}
