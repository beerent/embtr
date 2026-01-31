'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { PlannedTaskData } from '@/shared/types/habit';
import { ShareDayModal } from './ShareDayModal';
import styles from './ShareDayButton.module.css';

interface ShareDayButtonProps {
    plannedDayId: number;
    date: string;
    tasks: PlannedTaskData[];
}

export function ShareDayButton({ plannedDayId, date, tasks }: ShareDayButtonProps) {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button className={styles.button} onClick={() => setShowModal(true)}>
                <Share2 size={16} />
                Share Day
            </button>

            {showModal && (
                <ShareDayModal
                    plannedDayId={plannedDayId}
                    date={date}
                    tasks={tasks}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
