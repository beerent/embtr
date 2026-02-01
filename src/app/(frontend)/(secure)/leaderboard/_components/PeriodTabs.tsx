'use client';

import { LeaderboardPeriod } from '@/shared/types/leaderboard';
import styles from './PeriodTabs.module.css';

const TABS: { key: LeaderboardPeriod; label: string }[] = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'Week' },
    { key: 'monthly', label: 'Month' },
];

interface PeriodTabsProps {
    currentPeriod: LeaderboardPeriod;
    onPeriodChange: (period: LeaderboardPeriod) => void;
    disabled?: boolean;
}

export function PeriodTabs({ currentPeriod, onPeriodChange, disabled }: PeriodTabsProps) {
    return (
        <div className={styles.switcher}>
            {TABS.map(({ key, label }) => (
                <button
                    key={key}
                    className={`${styles.btn} ${currentPeriod === key ? styles.active : ''}`}
                    onClick={() => onPeriodChange(key)}
                    disabled={disabled}
                >
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}
