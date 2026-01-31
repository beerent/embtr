import { getMyHabits } from '@/server/habits/actions';
import { PageHeader } from '../_components/ui/PageHeader';
import { HabitList } from './_components/HabitList';

export default async function HabitsPage() {
    const result = await getMyHabits();
    const habits = result.habits ?? [];

    return (
        <div>
            <PageHeader>Habits</PageHeader>
            <HabitList habits={habits} />
        </div>
    );
}
