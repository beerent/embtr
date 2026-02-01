'use client';

import { MessageSquare } from 'lucide-react';
import { BugReportData, BUG_STATUS_LABELS, BUG_PRIORITY_LABELS } from '@/shared/types/bugReport';
import styles from './BugCard.module.css';

interface BugCardProps {
    bug: BugReportData;
    onClick: () => void;
}

function getRelativeTime(isoDate: string): string {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
}

export function BugCard({ bug, onClick }: BugCardProps) {
    const statusClass = styles[`status_${bug.status}`] || '';
    const priorityClass = styles[`priority_${bug.priority}`] || '';

    return (
        <button className={styles.card} onClick={onClick} type="button">
            <div className={styles.header}>
                <span className={styles.title}>{bug.title}</span>
                <div className={styles.badges}>
                    <span className={`${styles.badge} ${statusClass}`}>
                        {BUG_STATUS_LABELS[bug.status]}
                    </span>
                    <span className={`${styles.badge} ${priorityClass}`}>
                        {BUG_PRIORITY_LABELS[bug.priority]}
                    </span>
                </div>
            </div>

            <p className={styles.description}>{bug.description}</p>

            <div className={styles.meta}>
                <span>
                    {bug.author.displayName || bug.author.username} &middot; {getRelativeTime(bug.createdAt)}
                </span>
                <span className={styles.comments}>
                    <MessageSquare size={14} />
                    {bug.commentCount}
                </span>
            </div>
        </button>
    );
}
