'use client';

import { Check } from 'lucide-react';
import { PlannedDayWithTasks } from '@/shared/types/habit';
import { toggleTaskStatus } from '@/server/calendar/actions';
import { useRouter } from 'next/navigation';
import { Session } from '@/client/context/SessionProvider';
import styles from './WeekView.module.css';

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeekViewProps {
    currentDate: Date;
    plannedDays: PlannedDayWithTasks[];
}

export function WeekView({ currentDate, plannedDays }: WeekViewProps) {
    const router = useRouter();
    const { user } = Session.useSession();

    // Get the Sunday of the current week
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        weekDays.push(d);
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const dayMap = new Map(plannedDays.map((d) => [d.date, d]));

    const hardMode = user?.hardMode ?? false;

    const handleToggle = async (taskId: number) => {
        await toggleTaskStatus(taskId);
        router.refresh();
    };

    return (
        <div className={styles.container}>
            <div className={styles.columns}>
                {weekDays.map((day) => {
                    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                    const isToday = dateStr === todayStr;
                    const planned = dayMap.get(dateStr);
                    const tasks = planned?.plannedTasks ?? [];

                    return (
                        <div key={dateStr} className={`${styles.column} ${isToday ? styles.todayColumn : ''}`}>
                            <div className={styles.colHeader}>
                                <span className={styles.dayName}>{WEEKDAY_NAMES[day.getDay()]}</span>
                                <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>
                                    {day.getDate()}
                                </span>
                            </div>
                            <div className={styles.taskList}>
                                {tasks.map((task) => {
                                    const taskDisabled = hardMode && !isToday;
                                    return (
                                        <button
                                            key={task.id}
                                            className={`${styles.taskCard} ${task.status === 'complete' ? styles.complete : ''} ${taskDisabled ? styles.disabled : ''}`}
                                            onClick={() => !taskDisabled && handleToggle(task.id)}
                                            disabled={taskDisabled}
                                        >
                                            <div className={styles.checkCircle}>
                                                {task.status === 'complete' ? (
                                                    <Check size={12} />
                                                ) : task.quantity > 1 && task.completedQuantity > 0 ? (
                                                    <span className={styles.partialCount}>{task.completedQuantity}</span>
                                                ) : null}
                                            </div>
                                            <span className={styles.taskTitle}>{task.title}</span>
                                            {task.quantity > 1 && (
                                                <span className={styles.quantityBadge}>
                                                    {task.completedQuantity}/{task.quantity}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                                {tasks.length === 0 && (
                                    <span className={styles.emptyDay}>—</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
