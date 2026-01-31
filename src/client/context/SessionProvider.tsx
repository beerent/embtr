'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { SessionStore } from '@/client/store/SessionStore';
import { SessionUser } from '@/shared/types/SessionUser';

interface UserContextType {
    user: SessionUser | null;
    loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface Props {
    children: React.ReactNode;
    initialUser: SessionUser | null;
}

export function SessionProvider({ children, initialUser }: Props) {
    const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);
    const [loading, setLoading] = useState(!initialUser);

    useEffect(() => {
        if (initialUser) {
            setUser(initialUser);
            SessionStore.getState().setUser(initialUser);
            setLoading(false);
        }
    }, [initialUser]);

    const value: UserContextType = {
        user,
        loading,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export namespace Session {
    export function useSession(): UserContextType {
        const context = useContext(UserContext);
        if (context === undefined) {
            throw new Error('useSession must be used within a SessionProvider');
        }
        return context;
    }
}
