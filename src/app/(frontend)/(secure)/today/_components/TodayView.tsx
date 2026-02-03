'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PlannedDayWithTasks } from '@/shared/types/habit';
import { toggleTaskStatus, setTaskCompletedQuantity } from '@/server/calendar/actions';
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
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');

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

    const handleCompleteAll = async (taskId: number, task: typeof tasks[number]) => {
        if (task.status === 'complete') {
            const result = await setTaskCompletedQuantity(taskId, 0);
            if (result.success) router.refresh();
        } else {
            const result = await setTaskCompletedQuantity(taskId, task.quantity);
            if (result.success && result.dayStatus === 'complete') {
                fireConfetti();
            }
            router.refresh();
        }
    };

    const startEditing = (taskId: number, currentValue: number) => {
        setEditingTaskId(taskId);
        setEditValue(String(currentValue));
    };

    const commitEdit = async (taskId: number) => {
        setEditingTaskId(null);
        const parsed = parseInt(editValue, 10);
        if (isNaN(parsed)) return;
        const result = await setTaskCompletedQuantity(taskId, parsed);
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
                            {tasks.map((task) => {
                                const isQuantityTask = task.quantity > 1;

                                if (!isQuantityTask) {
                                    return (
                                        <button
                                            key={task.id}
                                            className={`${styles.taskRow} ${task.status === 'complete' ? styles.complete : ''}`}
                                            onClick={() => handleToggle(task.id)}
                                        >
                                            <div className={styles.checkbox}>
                                                {task.status === 'complete' && <Check size={16} />}
                                            </div>
                                            <div className={styles.taskInfo}>
                                                <span className={styles.taskTitle}>{task.title}</span>
                                                {task.description && (
                                                    <span className={styles.taskDesc}>{task.description}</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                }

                                return (
                                    <div
                                        key={task.id}
                                        className={`${styles.taskRow} ${styles.quantityTaskRow} ${task.status === 'complete' ? styles.complete : ''}`}
                                    >
                                        <button
                                            className={styles.checkbox}
                                            onClick={() => handleCompleteAll(task.id, task)}
                                            title={task.status === 'complete' ? 'Reset' : 'Complete all'}
                                        >
                                            {task.status === 'complete' ? (
                                                <Check size={16} />
                                            ) : task.completedQuantity > 0 ? (
                                                <span className={styles.partialCount}>{task.completedQuantity}</span>
                                            ) : null}
                                        </button>
                                        <div className={styles.taskInfo}>
                                            <span className={styles.taskTitle}>{task.title}</span>
                                            {task.description && (
                                                <span className={styles.taskDesc}>{task.description}</span>
                                            )}
                                            <span className={styles.quantityProgress}>
                                                {editingTaskId === task.id ? (
                                                    <input
                                                        className={styles.quantityInlineInput}
                                                        type="number"
                                                        min={0}
                                                        max={task.quantity}
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => commitEdit(task.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') commitEdit(task.id);
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <button
                                                        className={styles.quantityEditBtn}
                                                        onClick={() => startEditing(task.id, task.completedQuantity)}
                                                    >
                                                        {task.completedQuantity}
                                                    </button>
                                                )}
                                                /{task.quantity} {task.unit || 'times'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
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
