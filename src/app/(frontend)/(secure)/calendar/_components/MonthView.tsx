'use client';

import { PlannedDayWithTasks } from '@/shared/types/habit';
import styles from './MonthView.module.css';

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_DOT_COLOR = '#4E73DF';

interface MonthViewProps {
    currentDate: Date;
    plannedDays: PlannedDayWithTasks[];
    onDayClick: (date: Date) => void;
}

export function MonthView({ currentDate, plannedDays, onDayClick }: MonthViewProps) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Build grid starting from Sunday of the first week
    const startOffset = firstDay.getDay();
    const gridStart = new Date(firstDay);
    gridStart.setDate(gridStart.getDate() - startOffset);

    const endOffset = 6 - lastDay.getDay();
    const gridEnd = new Date(lastDay);
    gridEnd.setDate(gridEnd.getDate() + endOffset);

    const days: Date[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
        days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const dayMap = new Map(plannedDays.map((d) => [d.date, d]));

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                {WEEKDAY_HEADERS.map((h) => (
                    <div key={h} className={styles.headerCell}>{h}</div>
                ))}
            </div>
            <div className={styles.grid}>
                {days.map((day) => {
                    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                    const isCurrentMonth = day.getMonth() === month;
                    const isToday = dateStr === todayStr;
                    const planned = dayMap.get(dateStr);
                    const tasks = planned?.plannedTasks ?? [];

                    const completedCount = tasks.filter((t) => t.status === 'complete').length;
                    const allDone = tasks.length > 0 && completedCount === tasks.length;

                    return (
                        <div
                            key={dateStr}
                            className={`${styles.cell} ${!isCurrentMonth ? styles.outside : ''} ${allDone ? styles.allComplete : ''}`}
                            onClick={() => onDayClick(day)}
                        >
                            <div className={styles.dayNumber}>
                                <span className={isToday ? styles.today : ''}>{day.getDate()}</span>
                            </div>
                            {tasks.length > 0 && (
                                <div className={styles.dotCluster}>
                                    {tasks.map((task) => {
                                        const color = task.iconColor || DEFAULT_DOT_COLOR;
                                        const isComplete = task.status === 'complete';
                                        return (
                                            <span
                                                key={task.id}
                                                className={`${styles.dot} ${isComplete ? styles.dotComplete : styles.dotIncomplete}`}
                                                style={{
                                                    '--dot-color': color,
                                                } as React.CSSProperties}
                                                title={task.title}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
