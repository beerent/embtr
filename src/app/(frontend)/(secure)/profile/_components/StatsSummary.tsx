import { type ProfileStats } from '@/server/profile/actions';
import styles from './StatsSummary.module.css';

interface Props {
    stats: ProfileStats;
}

export function StatsSummary({ stats }: Props) {
    const cards = [
        {
            value: stats.bestCurrentStreak,
            label: 'Current Streak',
            suffix: 'days',
            color: 'var(--color-primary)',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
            ),
        },
        {
            value: stats.bestLongestStreak,
            label: 'Longest Streak',
            suffix: 'days',
            color: 'var(--color-warning)',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
            ),
        },
        {
            value: stats.averageScore,
            label: 'Avg Score',
            suffix: '%',
            color: 'var(--color-secondary)',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                </svg>
            ),
        },
        {
            value: stats.completionRate,
            label: 'Completion',
            suffix: '%',
            color: 'var(--color-success)',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
        },
        {
            value: stats.loveReceived,
            label: 'Love Received',
            suffix: '',
            color: 'var(--color-error)',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            ),
        },
    ];

    return (
        <div className={styles.grid}>
            {cards.map((card) => (
                <div key={card.label} className={styles.card}>
                    <div className={styles.iconWrap} style={{ color: card.color }}>
                        {card.icon}
                    </div>
                    <div className={styles.value}>
                        {card.value}
                        <span className={styles.suffix}>{card.suffix}</span>
                    </div>
                    <div className={styles.label}>{card.label}</div>
                </div>
            ))}
        </div>
    );
}
