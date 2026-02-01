import { LeaderboardEntry, LeaderboardPeriod } from '@/shared/types/leaderboard';

interface DateRange {
    startDate: string;
    endDate: string;
    label: string;
}

export function getDateRange(period: LeaderboardPeriod, now: Date): DateRange {
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();

    if (period === 'daily') {
        const today = formatDate(year, month, date);
        return { startDate: today, endDate: today, label: 'Today' };
    }

    if (period === 'weekly') {
        const day = now.getDay(); // 0=Sun
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const monday = new Date(year, month, date + mondayOffset);
        const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

        const startDate = formatDate(monday.getFullYear(), monday.getMonth(), monday.getDate());
        const endDate = formatDate(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());

        const label = `${formatShortDate(monday)} – ${formatShortDate(sunday)}`;
        return { startDate, endDate, label };
    }

    // monthly
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = formatDate(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate());
    const endDate = formatDate(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());
    const label = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    return { startDate, endDate, label };
}

export function formatDate(year: number, month: number, date: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}

export function formatShortDate(d: Date): string {
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

interface DaoResult {
    userId: number;
    username: string;
    photoUrl: string | null;
    perfectDays: number;
}

export function buildLeaderboardEntries(results: DaoResult[], currentUserId: number): LeaderboardEntry[] {
    return results.map((r, index) => ({
        rank: index + 1,
        userId: r.userId,
        username: r.username,
        photoUrl: r.photoUrl,
        perfectDays: r.perfectDays,
        isCurrentUser: r.userId === currentUserId,
    }));
}
