'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import { PlannedTaskData } from '@/shared/types/habit';
import { createDayResultPost } from '@/server/timeline/actions';
import styles from './ShareDayModal.module.css';

interface ShareDayModalProps {
    plannedDayId: number;
    date: string;
    tasks: PlannedTaskData[];
    onClose: () => void;
}

export function ShareDayModal({ plannedDayId, date, tasks, onClose }: ShareDayModalProps) {
    const router = useRouter();
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const completedTasks = tasks.filter((t) => t.status === 'complete');

    const handleShare = async () => {
        if (submitting) return;

        setSubmitting(true);
        setError('');

        const res = await createDayResultPost(plannedDayId, body.trim() || undefined);
        if (res.success) {
            onClose();
            router.refresh();
        } else {
            setError(res.error || 'Failed to share.');
        }
        setSubmitting(false);
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <span className={styles.title}>Share Your Day</span>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.body}>
                    <span className={styles.dateLabel}>{date}</span>

                    <div className={styles.taskPreview}>
                        {tasks.map((task) => (
                            <div key={task.id} className={styles.taskItem}>
                                {task.status === 'complete' ? (
                                    <div className={styles.taskCheck}>
                                        <Check size={10} />
                                    </div>
                                ) : (
                                    <div className={styles.taskPending} />
                                )}
                                <span>{task.title}</span>
                            </div>
                        ))}
                    </div>

                    <textarea
                        className={styles.textarea}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Add a description (optional)"
                        maxLength={750}
                    />

                    {error && <span className={styles.error}>{error}</span>}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className={styles.shareBtn}
                        onClick={handleShare}
                        disabled={submitting}
                    >
                        {submitting ? 'Sharing...' : `Share (${completedTasks.length} completed)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
