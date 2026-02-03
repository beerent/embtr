import { getMyHabits } from '@/server/habits/actions';
import { getMyBucketsWithWater } from '@/server/buckets/actions';
import { PageHeader } from '../_components/ui/PageHeader';
import { HabitList } from './_components/HabitList';

export default async function HabitsPage() {
    const [habitResult, bucketResult] = await Promise.all([
        getMyHabits(),
        getMyBucketsWithWater(),
    ]);

    const habits = habitResult.habits ?? [];
    const buckets = bucketResult.buckets ?? [];
    const allocatedWater = habits.reduce((sum, h) => sum + h.waterCost, 0);

    return (
        <div>
            <PageHeader>Habits</PageHeader>
            <HabitList habits={habits} buckets={buckets} allocatedWater={allocatedWater} />
        </div>
    );
}
