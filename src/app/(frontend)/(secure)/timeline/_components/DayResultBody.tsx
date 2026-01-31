'use client';

import { Check } from 'lucide-react';
import { TimelineCompletedTask } from '@/shared/types/timeline';
import styles from './DayResultBody.module.css';

interface DayResultBodyProps {
    body: string | null;
    dayDate: string | null;
    dayScore: number | null;
    completedTasks: TimelineCompletedTask[];
    totalTaskCount: number | null;
}

const MAX_VISIBLE_TASKS = 4;

export function DayResultBody({ body, dayDate, dayScore, completedTasks, totalTaskCount }: DayResultBodyProps) {
    const visibleTasks = completedTasks.slice(0, MAX_VISIBLE_TASKS);
    const overflowCount = completedTasks.length - MAX_VISIBLE_TASKS;

    return (
        <div className={styles.container}>
            {body && <p className={styles.description}>{body}</p>}

            <div className={styles.scoreRow}>
                {dayDate && <span className={styles.dateLabel}>{dayDate}</span>}
                {dayScore !== null && (
                    <>
                        <span className={styles.scoreLabel}>&middot;</span>
                        <span className={styles.scoreValue}>{dayScore}%</span>
                        <span className={styles.scoreLabel}>
                            ({completedTasks.length}/{totalTaskCount ?? 0} tasks)
                        </span>
                    </>
                )}
            </div>

            {visibleTasks.length > 0 && (
                <div className={styles.taskList}>
                    {visibleTasks.map((task, i) => (
                        <div key={i} className={styles.taskItem}>
                            <div className={styles.taskCheck}>
                                <Check size={10} />
                            </div>
                            <span className={styles.taskTitle}>{task.title}</span>
                            {task.quantity > 1 && (
                                <span className={styles.taskQuantity}>
                                    {task.completedQuantity}/{task.quantity} {task.unit || 'times'}
                                </span>
                            )}
                        </div>
                    ))}
                    {overflowCount > 0 && (
                        <span className={styles.overflow}>
                            and {overflowCount} more
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
