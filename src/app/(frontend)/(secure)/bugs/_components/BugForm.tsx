'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { BugReportData, BugPriority, BUG_PRIORITY_LABELS } from '@/shared/types/bugReport';
import { createBugReport } from '@/server/bugs/actions';
import styles from './BugForm.module.css';

interface BugFormProps {
    onClose: () => void;
    onCreated: (bug: BugReportData) => void;
}

const PRIORITIES: BugPriority[] = ['low', 'medium', 'high', 'critical'];

export function BugForm({ onClose, onCreated }: BugFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<BugPriority>('medium');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const trimmedTitle = title.trim();
        const trimmedDesc = description.trim();

        if (!trimmedTitle) {
            setError('Title is required.');
            return;
        }
        if (!trimmedDesc) {
            setError('Description is required.');
            return;
        }

        setSubmitting(true);
        setError('');

        const res = await createBugReport({
            title: trimmedTitle,
            description: trimmedDesc,
            priority,
        });

        if (res.success && res.bugReport) {
            onCreated(res.bugReport);
        } else {
            setError(res.error || 'Failed to create bug report.');
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Report a Bug</h2>
                    <button className={styles.closeBtn} onClick={onClose} type="button">
                        <X size={20} />
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {error && <p className={styles.error}>{error}</p>}

                    <label className={styles.label}>
                        Title
                        <input
                            className={styles.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Brief summary of the bug"
                            maxLength={200}
                            autoFocus
                        />
                    </label>

                    <label className={styles.label}>
                        Description
                        <textarea
                            className={styles.textarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Steps to reproduce, expected vs actual behavior..."
                            maxLength={5000}
                            rows={5}
                        />
                    </label>

                    <label className={styles.label}>
                        Priority
                        <select
                            className={styles.input}
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as BugPriority)}
                        >
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>{BUG_PRIORITY_LABELS[p]}</option>
                            ))}
                        </select>
                    </label>

                    <div className={styles.actions}>
                        <button
                            className={styles.cancelBtn}
                            type="button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            className={styles.saveBtn}
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
