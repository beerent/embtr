export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';

export interface LeaderboardEntry {
    rank: number;
    userId: number;
    username: string;
    photoUrl: string | null;
    perfectDays: number;
    isCurrentUser: boolean;
}

export interface LeaderboardData {
    period: LeaderboardPeriod;
    entries: LeaderboardEntry[];
    periodLabel: string;
}
