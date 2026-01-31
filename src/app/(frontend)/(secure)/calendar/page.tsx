import { getPlannedDays } from '@/server/calendar/actions';
import { PageHeader } from '../_components/ui/PageHeader';
import { HabitCalendar } from './_components/HabitCalendar';

function getMonthRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Extend to cover full weeks (start on Sunday)
    const startOffset = firstDay.getDay();
    const start = new Date(firstDay);
    start.setDate(start.getDate() - startOffset);

    // End on Saturday
    const endOffset = 6 - lastDay.getDay();
    const end = new Date(lastDay);
    end.setDate(end.getDate() + endOffset);

    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
}

export default async function CalendarPage() {
    const { startDate, endDate } = getMonthRange();
    const result = await getPlannedDays(startDate, endDate);
    const plannedDays = result.plannedDays ?? [];

    return (
        <div>
            <PageHeader>Calendar</PageHeader>
            <HabitCalendar initialPlannedDays={plannedDays} />
        </div>
    );
}
