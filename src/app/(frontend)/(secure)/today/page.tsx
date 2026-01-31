import { getPlannedDays } from '@/server/calendar/actions';
import { PageHeader } from '../_components/ui/PageHeader';
import { TodayView } from './_components/TodayView';

function getTodayString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default async function TodayPage() {
    const today = getTodayString();
    const result = await getPlannedDays(today, today);
    const plannedDay = result.plannedDays?.[0] ?? null;

    return (
        <div>
            <PageHeader>Today</PageHeader>
            <TodayView plannedDay={plannedDay} />
        </div>
    );
}
