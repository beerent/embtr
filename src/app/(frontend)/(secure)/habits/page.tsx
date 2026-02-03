import { getMyHabits } from '@/server/habits/actions';
import { getMyBucketsWithDrops } from '@/server/buckets/actions';
import { PageHeader } from '../_components/ui/PageHeader';
import { HabitList } from './_components/HabitList';

export default async function HabitsPage() {
    const [habitResult, bucketResult] = await Promise.all([
        getMyHabits(),
        getMyBucketsWithDrops(),
    ]);

    const habits = habitResult.habits ?? [];
    const buckets = bucketResult.buckets ?? [];
    const allocatedDrops = habits.reduce((sum, h) => sum + h.dropCost, 0);

    return (
        <div>
            <PageHeader>Habits</PageHeader>
            <HabitList habits={habits} buckets={buckets} allocatedDrops={allocatedDrops} />
        </div>
    );
}
