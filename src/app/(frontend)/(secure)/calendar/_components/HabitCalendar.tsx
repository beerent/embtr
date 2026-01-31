'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPlannedDays } from '@/server/calendar/actions';
import { PlannedDayWithTasks } from '@/shared/types/habit';
import { ViewSwitcher, CalendarView } from './ViewSwitcher';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import styles from './HabitCalendar.module.css';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

interface HabitCalendarProps {
    initialPlannedDays: PlannedDayWithTasks[];
}

function getDateRange(date: Date, view: CalendarView) {
    const year = date.getFullYear();
    const month = date.getMonth();

    if (view === 'month') {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = firstDay.getDay();
        const start = new Date(firstDay);
        start.setDate(start.getDate() - startOffset);
        const endOffset = 6 - lastDay.getDay();
        const end = new Date(lastDay);
        end.setDate(end.getDate() + endOffset);
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    }

    if (view === 'week') {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    }

    // day
    const dateStr = date.toISOString().split('T')[0];
    return { startDate: dateStr, endDate: dateStr };
}

function getViewTitle(date: Date, view: CalendarView): string {
    if (view === 'month') {
        return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
    }
    if (view === 'week') {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const startMonth = MONTH_NAMES[start.getMonth()].substring(0, 3);
        const endMonth = MONTH_NAMES[end.getMonth()].substring(0, 3);
        if (start.getMonth() === end.getMonth()) {
            return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
        }
        return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function HabitCalendar({ initialPlannedDays }: HabitCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<CalendarView>('month');
    const [plannedDays, setPlannedDays] = useState<PlannedDayWithTasks[]>(initialPlannedDays);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (date: Date, view: CalendarView) => {
        setLoading(true);
        const { startDate, endDate } = getDateRange(date, view);
        const result = await getPlannedDays(startDate, endDate);
        if (result.success && result.plannedDays) {
            setPlannedDays(result.plannedDays);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData(currentDate, currentView);
    }, [currentDate, currentView, fetchData]);

    const navigate = (direction: number) => {
        const next = new Date(currentDate);
        if (currentView === 'month') {
            next.setMonth(next.getMonth() + direction);
        } else if (currentView === 'week') {
            next.setDate(next.getDate() + direction * 7);
        } else {
            next.setDate(next.getDate() + direction);
        }
        setCurrentDate(next);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleDayClick = (date: Date) => {
        setCurrentDate(date);
        setCurrentView('day');
    };

    return (
        <div className={styles.calendar}>
            <div className={styles.toolbar}>
                <div className={styles.navGroup}>
                    <button className={styles.navBtn} onClick={() => navigate(-1)}>
                        <ChevronLeft size={20} />
                    </button>
                    <button className={styles.navBtn} onClick={() => navigate(1)}>
                        <ChevronRight size={20} />
                    </button>
                    <h2 className={styles.viewTitle}>{getViewTitle(currentDate, currentView)}</h2>
                </div>
                <div className={styles.rightGroup}>
                    <button className={styles.todayBtn} onClick={goToToday}>Today</button>
                    <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
                </div>
            </div>

            <div className={`${styles.content} ${loading ? styles.loading : ''}`}>
                {currentView === 'month' && (
                    <MonthView
                        currentDate={currentDate}
                        plannedDays={plannedDays}
                        onDayClick={handleDayClick}
                    />
                )}
                {currentView === 'week' && (
                    <WeekView
                        currentDate={currentDate}
                        plannedDays={plannedDays}
                    />
                )}
                {currentView === 'day' && (
                    <DayView
                        currentDate={currentDate}
                        plannedDays={plannedDays}
                    />
                )}
            </div>
        </div>
    );
}
