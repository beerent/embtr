'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Session } from '@/client/context/SessionProvider';
import { PlannedDayWithTasks } from '@/shared/types/habit';
import { toggleTaskStatus } from '@/server/calendar/actions';
import { ShareDayButton } from '../../timeline/_components/ShareDayButton';
import styles from './DayView.module.css';

interface DayViewProps {
    currentDate: Date;
    plannedDays: PlannedDayWithTasks[];
}

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export function DayView({ currentDate, plannedDays }: DayViewProps) {
    const router = useRouter();
    const { user } = Session.useSession();

    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const planned = plannedDays.find((d) => d.date === dateStr);
    const tasks = planned?.plannedTasks ?? [];

    const completedCount = tasks.filter((t) => t.status === 'complete').length;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const disabled = !!(user?.hardMode && dateStr !== todayStr);

    const handleToggle = async (taskId: number) => {
        if (disabled) return;
        await toggleTaskStatus(taskId);
        router.refresh();
    };

    return (
        <div className={styles.container}>
            <div className={styles.dateHeader}>
                <span className={styles.dayName}>
                    {WEEKDAY_FULL[currentDate.getDay()]}
                </span>
                <span className={styles.fullDate}>
                    {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
                </span>
            </div>

            {tasks.length > 0 && (
                <div className={styles.progress}>
                    {completedCount}/{tasks.length} complete
                </div>
            )}

            {tasks.length === 0 ? (
                <div className={styles.empty}>
                    <p>No habits scheduled for this day.</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {tasks.map((task) => (
                        <button
                            key={task.id}
                            className={`${styles.habitRow} ${task.status === 'complete' ? styles.complete : ''} ${disabled ? styles.disabled : ''}`}
                            onClick={() => handleToggle(task.id)}
                            disabled={disabled}
                        >
                            <div className={styles.checkbox}>
                                {task.status === 'complete' ? (
                                    <Check size={16} />
                                ) : task.quantity > 1 && task.completedQuantity > 0 ? (
                                    <span className={styles.partialCount}>{task.completedQuantity}</span>
                                ) : null}
                            </div>
                            <div className={styles.habitInfo}>
                                <span className={styles.habitTitle}>{task.title}</span>
                                {task.description && (
                                    <span className={styles.habitDesc}>{task.description}</span>
                                )}
                                {task.quantity > 1 && (
                                    <span className={styles.quantityProgress}>
                                        {task.completedQuantity}/{task.quantity} {task.unit || 'times'}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {planned && completedCount > 0 && (
                <ShareDayButton
                    plannedDayId={planned.id}
                    date={planned.date}
                    tasks={tasks}
                />
            )}
        </div>
    );
}
