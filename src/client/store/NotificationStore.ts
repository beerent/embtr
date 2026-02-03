import { create } from 'zustand';
import { NotificationEvent } from '@/shared/types/notification';
import {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
} from '@/server/notifications/actions';

const MAX_RECENT = 50;

export interface NotificationStoreState {
    permissionStatus: NotificationPermission;
    recentNotifications: NotificationEvent[];
    unreadCount: number;
    isLoading: boolean;
    setPermissionStatus: (status: NotificationPermission) => void;
    addNotification: (event: NotificationEvent) => void;
    clearNotifications: () => void;
    fetchInitial: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllRead: () => Promise<void>;
}

const useNotificationStoreBase = create<NotificationStoreState>((set) => ({
    permissionStatus: 'default',
    recentNotifications: [],
    unreadCount: 0,
    isLoading: false,
    setPermissionStatus: (status) => set({ permissionStatus: status }),
    addNotification: (event) =>
        set((state) => ({
            recentNotifications: [event, ...state.recentNotifications].slice(0, MAX_RECENT),
            unreadCount: state.unreadCount + 1,
        })),
    clearNotifications: () => set({ recentNotifications: [], unreadCount: 0 }),

    fetchInitial: async () => {
        set({ isLoading: true });
        const [notifResult, countResult] = await Promise.all([
            getNotifications(),
            getUnreadCount(),
        ]);
        set({
            recentNotifications: notifResult.data?.notifications ?? [],
            unreadCount: countResult.count ?? 0,
            isLoading: false,
        });
    },

    fetchUnreadCount: async () => {
        const result = await getUnreadCount();
        if (result.success && result.count !== undefined) {
            set({ unreadCount: result.count });
        }
    },

    markAsRead: async (id: number) => {
        // Optimistic update
        set((state) => ({
            recentNotifications: state.recentNotifications.map((n) =>
                n.id === id ? { ...n, readAt: new Date().toISOString() } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
        await markNotificationRead(id);
    },

    markAllRead: async () => {
        // Optimistic update
        set((state) => ({
            recentNotifications: state.recentNotifications.map((n) => ({
                ...n,
                readAt: n.readAt || new Date().toISOString(),
            })),
            unreadCount: 0,
        }));
        await markAllNotificationsRead();
    },
}));

export namespace NotificationStore {
    export const useStore = (): NotificationStoreState => {
        return {
            permissionStatus: useNotificationStoreBase((s) => s.permissionStatus),
            recentNotifications: useNotificationStoreBase((s) => s.recentNotifications),
            unreadCount: useNotificationStoreBase((s) => s.unreadCount),
            isLoading: useNotificationStoreBase((s) => s.isLoading),
            setPermissionStatus: useNotificationStoreBase((s) => s.setPermissionStatus),
            addNotification: useNotificationStoreBase((s) => s.addNotification),
            clearNotifications: useNotificationStoreBase((s) => s.clearNotifications),
            fetchInitial: useNotificationStoreBase((s) => s.fetchInitial),
            fetchUnreadCount: useNotificationStoreBase((s) => s.fetchUnreadCount),
            markAsRead: useNotificationStoreBase((s) => s.markAsRead),
            markAllRead: useNotificationStoreBase((s) => s.markAllRead),
        };
    };

    export const getState = () => useNotificationStoreBase.getState();
}
