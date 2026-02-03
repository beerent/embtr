import { create } from 'zustand';
import { NotificationEvent } from '@/shared/types/notification';

const MAX_RECENT = 50;

export interface NotificationStoreState {
    permissionStatus: NotificationPermission;
    recentNotifications: NotificationEvent[];
    setPermissionStatus: (status: NotificationPermission) => void;
    addNotification: (event: NotificationEvent) => void;
    clearNotifications: () => void;
}

const useNotificationStoreBase = create<NotificationStoreState>((set) => ({
    permissionStatus: 'default',
    recentNotifications: [],
    setPermissionStatus: (status) => set({ permissionStatus: status }),
    addNotification: (event) =>
        set((state) => ({
            recentNotifications: [event, ...state.recentNotifications].slice(0, MAX_RECENT),
        })),
    clearNotifications: () => set({ recentNotifications: [] }),
}));

export namespace NotificationStore {
    export const useStore = (): NotificationStoreState => {
        return {
            permissionStatus: useNotificationStoreBase((s) => s.permissionStatus),
            recentNotifications: useNotificationStoreBase((s) => s.recentNotifications),
            setPermissionStatus: useNotificationStoreBase((s) => s.setPermissionStatus),
            addNotification: useNotificationStoreBase((s) => s.addNotification),
            clearNotifications: useNotificationStoreBase((s) => s.clearNotifications),
        };
    };

    export const getState = () => useNotificationStoreBase.getState();
}
