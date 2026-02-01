'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
    BugReportData,
    BugStatus,
    BUG_STATUS_LABELS,
    BUG_PRIORITY_LABELS,
    ALL_BUG_STATUSES,
} from '@/shared/types/bugReport';
import { updateBugStatus } from '@/server/bugs/actions';
import { BugCommentSection } from './BugCommentSection';
import styles from './BugDetail.module.css';

interface BugDetailProps {
    bug: BugReportData;
    isAdmin: boolean;
    onBack: () => void;
    onStatusChanged: (bugId: number, newStatus: BugStatus) => void;
}

function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function BugDetail({ bug, isAdmin, onBack, onStatusChanged }: BugDetailProps) {
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const statusClass = styles[`status_${bug.status}`] || '';
    const priorityClass = styles[`priority_${bug.priority}`] || '';

    const handleStatusChange = async (newStatus: string) => {
        if (updatingStatus) return;
        setUpdatingStatus(true);

        const res = await updateBugStatus(bug.id, newStatus);
        if (res.success) {
            onStatusChanged(bug.id, newStatus as BugStatus);
        }
        setUpdatingStatus(false);
    };

    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={onBack} type="button">
                <ArrowLeft size={16} />
                Back to list
            </button>

            <div className={styles.card}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{bug.title}</h2>
                    <div className={styles.badges}>
                        <span className={`${styles.badge} ${statusClass}`}>
                            {BUG_STATUS_LABELS[bug.status]}
                        </span>
                        <span className={`${styles.badge} ${priorityClass}`}>
                            {BUG_PRIORITY_LABELS[bug.priority]}
                        </span>
                    </div>
                </div>

                <div className={styles.meta}>
                    <span>
                        Reported by {bug.author.displayName || bug.author.username}
                    </span>
                    <span>{formatDate(bug.createdAt)}</span>
                    {bug.updatedAt !== bug.createdAt && (
                        <span>Updated {formatDate(bug.updatedAt)}</span>
                    )}
                </div>

                <p className={styles.description}>{bug.description}</p>

                {isAdmin && (
                    <div className={styles.adminSection}>
                        <label className={styles.statusLabel}>
                            Status
                            <select
                                className={styles.statusSelect}
                                value={bug.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={updatingStatus}
                            >
                                {ALL_BUG_STATUSES.map((s) => (
                                    <option key={s} value={s}>{BUG_STATUS_LABELS[s]}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                )}

                <BugCommentSection bugReportId={bug.id} />
            </div>
        </div>
    );
}
