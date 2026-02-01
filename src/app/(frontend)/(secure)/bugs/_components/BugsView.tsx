'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { BugReportData, BugStatus, BUG_STATUS_LABELS, ALL_BUG_STATUSES } from '@/shared/types/bugReport';
import { BugCard } from './BugCard';
import { BugForm } from './BugForm';
import { BugDetail } from './BugDetail';
import styles from './BugsView.module.css';

interface BugsViewProps {
    bugReports: BugReportData[];
    isAdmin: boolean;
}

export function BugsView({ bugReports: initialBugs, isAdmin }: BugsViewProps) {
    const [bugs, setBugs] = useState<BugReportData[]>(initialBugs);
    const [statusFilter, setStatusFilter] = useState<BugStatus | 'all'>('all');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedBug, setSelectedBug] = useState<BugReportData | null>(null);

    const filteredBugs = statusFilter === 'all'
        ? bugs
        : bugs.filter((b) => b.status === statusFilter);

    const handleBugCreated = (newBug: BugReportData) => {
        setBugs((prev) => [newBug, ...prev]);
        setShowCreateForm(false);
    };

    const handleStatusChanged = (bugId: number, newStatus: BugStatus) => {
        setBugs((prev) =>
            prev.map((b) => (b.id === bugId ? { ...b, status: newStatus } : b))
        );
        if (selectedBug?.id === bugId) {
            setSelectedBug((prev) => prev ? { ...prev, status: newStatus } : null);
        }
    };

    if (selectedBug) {
        return (
            <BugDetail
                bug={selectedBug}
                isAdmin={isAdmin}
                onBack={() => setSelectedBug(null)}
                onStatusChanged={handleStatusChanged}
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <select
                    className={styles.filter}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as BugStatus | 'all')}
                >
                    <option value="all">All Statuses</option>
                    {ALL_BUG_STATUSES.map((s) => (
                        <option key={s} value={s}>{BUG_STATUS_LABELS[s]}</option>
                    ))}
                </select>

                <button className={styles.createBtn} onClick={() => setShowCreateForm(true)}>
                    <Plus size={16} />
                    Report Bug
                </button>
            </div>

            {filteredBugs.length === 0 ? (
                <div className={styles.empty}>
                    {statusFilter === 'all'
                        ? 'No bug reports yet. Be the first to report one!'
                        : `No bug reports with status "${BUG_STATUS_LABELS[statusFilter]}".`}
                </div>
            ) : (
                <div className={styles.list}>
                    {filteredBugs.map((bug) => (
                        <BugCard
                            key={bug.id}
                            bug={bug}
                            onClick={() => setSelectedBug(bug)}
                        />
                    ))}
                </div>
            )}

            {showCreateForm && (
                <BugForm
                    onClose={() => setShowCreateForm(false)}
                    onCreated={handleBugCreated}
                />
            )}
        </div>
    );
}
