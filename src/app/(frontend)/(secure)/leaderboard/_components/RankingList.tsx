'use client';

import { Trophy } from 'lucide-react';
import { LeaderboardEntry } from '@/shared/types/leaderboard';
import styles from './RankingList.module.css';

interface RankingListProps {
    entries: LeaderboardEntry[];
    loading?: boolean;
}

const RANK_COLORS: Record<number, string> = {
    1: '#FFD700',
    2: '#C0C0C0',
    3: '#CD7F32',
};

function getInitials(username: string): string {
    return username.slice(0, 2).toUpperCase();
}

export function RankingList({ entries, loading }: RankingListProps) {
    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className={styles.empty}>
                <Trophy size={48} className={styles.emptyIcon} />
                <p className={styles.emptyText}>No perfect days in this period yet.</p>
                <p className={styles.emptySubtext}>Complete all your planned tasks to score 100!</p>
            </div>
        );
    }

    return (
        <div className={styles.list}>
            {entries.map((entry) => (
                <div
                    key={entry.userId}
                    className={`${styles.row} ${entry.isCurrentUser ? styles.currentUser : ''}`}
                >
                    <span
                        className={styles.rank}
                        style={RANK_COLORS[entry.rank] ? { color: RANK_COLORS[entry.rank] } : undefined}
                    >
                        {entry.rank}
                    </span>

                    <div className={styles.avatar}>
                        {entry.photoUrl ? (
                            <img src={entry.photoUrl} alt={entry.username} className={styles.avatarImg} />
                        ) : (
                            <span className={styles.avatarInitials}>{getInitials(entry.username)}</span>
                        )}
                    </div>

                    <span className={styles.username}>{entry.username}</span>

                    <span className={styles.count}>
                        {entry.perfectDays} {entry.perfectDays === 1 ? 'day' : 'days'}
                    </span>
                </div>
            ))}
        </div>
    );
}
