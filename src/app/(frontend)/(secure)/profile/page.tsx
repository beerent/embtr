import { Session } from '@/server/session/Session';
import { getProfileStats } from '@/server/profile/actions';
import { PageHeader } from '../_components/ui/PageHeader';
import { PageCard } from '../_components/ui/PageCard';
import { StatsSummary } from './_components/StatsSummary';
import { ActivityHeatmap } from './_components/ActivityHeatmap';
import { ScoreTrend } from './_components/ScoreTrend';
import { HabitStreaks } from './_components/HabitStreaks';

export default async function ProfilePage() {
    await Session.getSession();
    const stats = await getProfileStats();

    if (!stats) {
        return (
            <div>
                <PageHeader>Profile</PageHeader>
                <PageCard>
                    <p style={{ color: 'var(--text-secondary)' }}>Unable to load profile data.</p>
                </PageCard>
            </div>
        );
    }

    return (
        <div>
            <PageHeader>Profile</PageHeader>
            <StatsSummary stats={stats} />
            <ActivityHeatmap dailyScores={stats.dailyScores} />
            <ScoreTrend dailyScores={stats.dailyScores} />
            <HabitStreaks streaks={stats.habitStreaks} />
        </div>
    );
}
