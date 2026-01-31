'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PlannedDayWithTasks } from '@/shared/types/habit';
import { toggleTaskStatus } from '@/server/calendar/actions';
import { ShareDayButton } from '../../timeline/_components/ShareDayButton';
import { useConfetti } from './useConfetti';
import styles from './TodayView.module.css';

interface TodayViewProps {
    plannedDay: PlannedDayWithTasks | null;
}

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export function TodayView({ plannedDay }: TodayViewProps) {
    const router = useRouter();
    const { fire: fireConfetti } = useConfetti();

    const now = new Date();
    const dayName = WEEKDAY_FULL[now.getDay()];
    const monthName = MONTH_NAMES[now.getMonth()];
    const dateDisplay = `${dayName}, ${monthName} ${now.getDate()}, ${now.getFullYear()}`;

    const tasks = plannedDay?.plannedTasks ?? [];
    const completedCount = tasks.filter((t) => t.status === 'complete').length;

    const handleToggle = async (taskId: number) => {
        const result = await toggleTaskStatus(taskId);
        if (result.success && result.dayStatus === 'complete') {
            fireConfetti();
        }
        router.refresh();
    };

    return (
        <div className={styles.container}>
            <div className={styles.dateHeader}>
                <span className={styles.dayName}>{dayName}</span>
                <span className={styles.fullDate}>{dateDisplay}</span>
            </div>

            <div className={styles.quote}>
                <p className={styles.quoteText}>
                    &ldquo;We are what we repeatedly do. Excellence, then, is not an act, but a habit.&rdquo;
                </p>
                <p className={styles.quoteAuthor}>— Will Durant</p>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>My Tasks</div>

                <div className={styles.taskCard}>
                    {tasks.length > 0 && (
                        <div className={styles.progress}>
                            {completedCount}/{tasks.length} complete
                        </div>
                    )}

                    {tasks.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No habits scheduled for today.</p>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {tasks.map((task) => (
                                <button
                                    key={task.id}
                                    className={`${styles.taskRow} ${task.status === 'complete' ? styles.complete : ''}`}
                                    onClick={() => handleToggle(task.id)}
                                >
                                    <div className={styles.checkbox}>
                                        {task.status === 'complete' ? (
                                            <Check size={16} />
                                        ) : task.quantity > 1 && task.completedQuantity > 0 ? (
                                            <span className={styles.partialCount}>{task.completedQuantity}</span>
                                        ) : null}
                                    </div>
                                    <div className={styles.taskInfo}>
                                        <span className={styles.taskTitle}>{task.title}</span>
                                        {task.description && (
                                            <span className={styles.taskDesc}>{task.description}</span>
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
                </div>

                {plannedDay && completedCount > 0 && (
                    <ShareDayButton
                        plannedDayId={plannedDay.id}
                        date={plannedDay.date}
                        tasks={tasks}
                    />
                )}
            </div>
        </div>
    );
}
