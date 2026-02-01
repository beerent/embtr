import { getLeaderboard } from '@/server/leaderboard/actions';
import { PageHeader } from '../_components/ui/PageHeader';
import { LeaderboardView } from './_components/LeaderboardView';

export default async function LeaderboardPage() {
    const data = await getLeaderboard('weekly');

    return (
        <div>
            <PageHeader>Leaderboard</PageHeader>
            <LeaderboardView initialData={data} />
        </div>
    );
}
