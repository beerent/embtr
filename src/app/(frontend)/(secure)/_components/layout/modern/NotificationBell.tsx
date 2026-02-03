'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { NotificationStore } from '@/client/store/NotificationStore';
import { NotificationEvent } from '@/shared/types/notification';
import styles from './NotificationBell.module.css';

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function NotificationRow({
    notification,
    onRead,
}: {
    notification: NotificationEvent;
    onRead: (id: number) => void;
}) {
    const isUnread = !notification.readAt;
    const initial = notification.actorName.charAt(0).toUpperCase();

    const handleClick = () => {
        if (isUnread) onRead(notification.id);
    };

    const rowClass = [styles.row, isUnread ? styles.rowUnread : ''].filter(Boolean).join(' ');

    return (
        <div className={rowClass} onClick={handleClick}>
            <div className={styles.rowAvatar}>
                {notification.actorPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        alt=""
                        src={notification.actorPhotoUrl}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    initial
                )}
            </div>
            <div className={styles.rowContent}>
                <div className={styles.rowMessage}>{notification.message}</div>
                <div className={styles.rowTime}>{timeAgo(notification.createdAt)}</div>
            </div>
            {isUnread && <div className={styles.unreadDot} />}
        </div>
    );
}

export default function NotificationBell() {
    const { recentNotifications, unreadCount, markAsRead, markAllRead } =
        NotificationStore.useStore();

    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleRead = (id: number) => {
        markAsRead(id);
    };

    const handleMarkAllRead = () => {
        markAllRead();
    };

    const panelClass = [styles.panel, isOpen ? styles.panelOpen : ''].filter(Boolean).join(' ');

    return (
        <div className={styles.wrapper} ref={ref}>
            <button className={styles.bellButton} onClick={toggle} aria-label="Notifications">
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            <div className={panelClass}>
                <div className={styles.panelHeader}>
                    <span className={styles.panelTitle}>Notifications</span>
                    {unreadCount > 0 && (
                        <button className={styles.markAllButton} onClick={handleMarkAllRead}>
                            Mark all read
                        </button>
                    )}
                </div>
                <div className={styles.panelBody}>
                    {recentNotifications.length === 0 ? (
                        <div className={styles.emptyState}>No notifications yet</div>
                    ) : (
                        recentNotifications.map((n) => (
                            <NotificationRow key={n.id} notification={n} onRead={handleRead} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
