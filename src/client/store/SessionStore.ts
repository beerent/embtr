import { create } from 'zustand';

import { SessionUser } from '@/shared/types/SessionUser';

export interface SessionStoreState {
    user: SessionUser | null;
    loading: boolean;
    setUser: (user: SessionUser | null) => void;
    clearUser: () => void;
    setLoading: (loading: boolean) => void;
}

const useSessionStoreBase = create<SessionStoreState>((set) => ({
    user: null,
    loading: true,
    setUser: (user) =>
        set(() => ({
            user,
            loading: false,
        })),
    clearUser: () =>
        set(() => ({
            user: null,
            loading: false,
        })),
    setLoading: (loading) =>
        set(() => ({
            loading,
        })),
}));

export namespace SessionStore {
    export const useStore = (): SessionStoreState => {
        return {
            user: useSessionStoreBase((s) => s.user),
            loading: useSessionStoreBase((s) => s.loading),
            setUser: useSessionStoreBase((s) => s.setUser),
            clearUser: useSessionStoreBase((s) => s.clearUser),
            setLoading: useSessionStoreBase((s) => s.setLoading),
        };
    };

    export const getState = () => useSessionStoreBase.getState();
}
