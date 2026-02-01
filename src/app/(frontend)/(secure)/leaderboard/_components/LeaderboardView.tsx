'use client';

import { useState, useTransition } from 'react';
import { LeaderboardData, LeaderboardPeriod } from '@/shared/types/leaderboard';
import { getLeaderboard } from '@/server/leaderboard/actions';
import { PeriodTabs } from './PeriodTabs';
import { RankingList } from './RankingList';
import styles from './LeaderboardView.module.css';

interface LeaderboardViewProps {
    initialData: LeaderboardData;
}

export function LeaderboardView({ initialData }: LeaderboardViewProps) {
    const [data, setData] = useState(initialData);
    const [isPending, startTransition] = useTransition();

    const handlePeriodChange = (period: LeaderboardPeriod) => {
        startTransition(async () => {
            const result = await getLeaderboard(period);
            setData(result);
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <PeriodTabs
                    currentPeriod={data.period}
                    onPeriodChange={handlePeriodChange}
                    disabled={isPending}
                />
                <span className={styles.periodLabel}>{data.periodLabel}</span>
            </div>
            <RankingList entries={data.entries} loading={isPending} />
        </div>
    );
}
