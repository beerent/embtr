'use client';

import { useEffect, useRef } from 'react';
import { NotificationEvent } from '@/shared/types/notification';
import { NotificationStore } from '@/client/store/NotificationStore';

const MAX_BACKOFF_MS = 30_000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const backoffRef = useRef(1_000);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        // Request notification permission
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().then((status) => {
                NotificationStore.getState().setPermissionStatus(status);
            });
        } else if (typeof Notification !== 'undefined') {
            NotificationStore.getState().setPermissionStatus(Notification.permission);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

        function connect() {
            if (cancelled) return;

            const es = new EventSource('/api/notifications/stream');
            eventSourceRef.current = es;

            es.onmessage = (e) => {
                try {
                    const event: NotificationEvent = JSON.parse(e.data);
                    NotificationStore.getState().addNotification(event);

                    // Show desktop notification
                    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                        new Notification(event.message, {
                            tag: event.id,
                        });
                    }

                    // Reset backoff on successful message
                    backoffRef.current = 1_000;
                } catch {
                    // Ignore malformed messages
                }
            };

            es.onopen = () => {
                backoffRef.current = 1_000;
            };

            es.onerror = () => {
                es.close();
                eventSourceRef.current = null;

                if (!cancelled) {
                    reconnectTimer = setTimeout(() => {
                        connect();
                    }, backoffRef.current);
                    backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
                }
            };
        }

        connect();

        return () => {
            cancelled = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, []);

    return <>{children}</>;
}
