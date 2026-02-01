'use client';

import { useState, useTransition } from 'react';
import { UserListEntry, setUserRole } from '@/server/users/actions';
import styles from './UsersView.module.css';

interface UsersViewProps {
    users: UserListEntry[];
}

function getInitials(username: string): string {
    return username.slice(0, 2).toUpperCase();
}

export function UsersView({ users: initialUsers }: UsersViewProps) {
    const [users, setUsers] = useState(initialUsers);
    const [isPending, startTransition] = useTransition();
    const [pendingUserId, setPendingUserId] = useState<number | null>(null);

    const handleToggleRole = (userId: number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        setPendingUserId(userId);
        startTransition(async () => {
            const result = await setUserRole(userId, newRole);
            if (!result.error) {
                setUsers((prev) =>
                    prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
                );
            }
            setPendingUserId(null);
        });
    };

    return (
        <div className={styles.list}>
            {users.map((user) => (
                <div
                    key={user.id}
                    className={`${styles.row} ${user.isCurrentUser ? styles.currentUser : ''}`}
                >
                    <div className={styles.avatar}>
                        {user.photoUrl ? (
                            <img src={user.photoUrl} alt={user.username} className={styles.avatarImg} />
                        ) : (
                            <span className={styles.avatarInitials}>{getInitials(user.username)}</span>
                        )}
                    </div>

                    <div className={styles.info}>
                        <span className={styles.username}>{user.displayName ?? user.username}</span>
                        <span className={styles.handle}>@{user.username}</span>
                    </div>

                    {user.role === 'admin' && (
                        <span className={styles.badge}>Admin</span>
                    )}

                    {!user.isCurrentUser && (
                        <button
                            className={`${styles.roleBtn} ${user.role === 'admin' ? styles.roleBtnRemove : ''}`}
                            onClick={() => handleToggleRole(user.id, user.role)}
                            disabled={isPending && pendingUserId === user.id}
                        >
                            {isPending && pendingUserId === user.id
                                ? '...'
                                : user.role === 'admin'
                                  ? 'Remove Admin'
                                  : 'Make Admin'}
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
