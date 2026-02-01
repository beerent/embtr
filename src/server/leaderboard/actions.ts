'use server';

import { getSessionUserId } from '../auth/auth';
import { DayResultDao } from '../database/DayResultDao';
import { LeaderboardData, LeaderboardPeriod } from '@/shared/types/leaderboard';
import { getDateRange, buildLeaderboardEntries } from './LeaderboardService';

export async function getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardData> {
    const userId = await getSessionUserId();
    if (!userId) {
        return { period, entries: [], periodLabel: '' };
    }

    const { startDate, endDate, label } = getDateRange(period, new Date());

    const dayResultDao = new DayResultDao();
    const results = await dayResultDao.getLeaderboardByDateRange(startDate, endDate);

    const entries = buildLeaderboardEntries(results, userId);

    return { period, entries, periodLabel: label };
}
