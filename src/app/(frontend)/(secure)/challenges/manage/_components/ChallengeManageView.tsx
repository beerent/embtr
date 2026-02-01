'use client';

import { useState, useTransition } from 'react';
import { ChallengeData } from '@/shared/types/challenge';
import { deactivateChallenge } from '@/server/challenges/actions';
import { ChallengeService } from '@/server/challenges/ChallengeService';
import { ChallengeForm } from './ChallengeForm';
import styles from './ChallengeManageView.module.css';

interface ChallengeManageViewProps {
    challenges: ChallengeData[];
}

export function ChallengeManageView({ challenges: initialChallenges }: ChallengeManageViewProps) {
    const [challenges, setChallenges] = useState(initialChallenges);
    const [showForm, setShowForm] = useState(false);
    const [editingChallenge, setEditingChallenge] = useState<ChallengeData | null>(null);
    const [isPending, startTransition] = useTransition();
    const [pendingId, setPendingId] = useState<number | null>(null);

    const handleDeactivate = (id: number) => {
        setPendingId(id);
        startTransition(async () => {
            const result = await deactivateChallenge(id);
            if (result.success) {
                setChallenges((prev) =>
                    prev.map((c) => (c.id === id ? { ...c, active: false } : c))
                );
            }
            setPendingId(null);
        });
    };

    const handleCreated = (challenge: ChallengeData) => {
        setChallenges((prev) => [challenge, ...prev]);
        setShowForm(false);
    };

    const handleUpdated = () => {
        setEditingChallenge(null);
        // Reload would be ideal; for now just close the form
        window.location.reload();
    };

    const handleEdit = (challenge: ChallengeData) => {
        setEditingChallenge(challenge);
        setShowForm(false);
    };

    if (showForm || editingChallenge) {
        return (
            <ChallengeForm
                challenge={editingChallenge ?? undefined}
                onCreated={handleCreated}
                onUpdated={handleUpdated}
                onCancel={() => {
                    setShowForm(false);
                    setEditingChallenge(null);
                }}
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <button className={styles.createBtn} onClick={() => setShowForm(true)}>
                    + Create Challenge
                </button>
            </div>

            {challenges.length === 0 ? (
                <div className={styles.empty}>No challenges yet. Create one to get started.</div>
            ) : (
                <div className={styles.list}>
                    {challenges.map((challenge) => {
                        const status = ChallengeService.getChallengeStatus(
                            challenge.startDate,
                            challenge.endDate
                        );

                        return (
                            <div key={challenge.id} className={styles.row}>
                                <div className={styles.info}>
                                    <div className={styles.titleRow}>
                                        <span className={styles.title}>{challenge.title}</span>
                                        <span className={styles.award}>{challenge.award}</span>
                                        {!challenge.active && (
                                            <span className={styles.inactiveBadge}>Inactive</span>
                                        )}
                                        <span
                                            className={`${styles.statusBadge} ${
                                                status === 'active'
                                                    ? styles.statusActive
                                                    : status === 'upcoming'
                                                      ? styles.statusUpcoming
                                                      : styles.statusEnded
                                            }`}
                                        >
                                            {status}
                                        </span>
                                    </div>
                                    <span className={styles.meta}>
                                        {challenge.startDate} to {challenge.endDate} &middot;{' '}
                                        {challenge.requiredDaysPerWeek}x/week &middot;{' '}
                                        {challenge.participantCount} participant
                                        {challenge.participantCount !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className={styles.actions}>
                                    <button
                                        className={styles.editBtn}
                                        onClick={() => handleEdit(challenge)}
                                    >
                                        Edit
                                    </button>
                                    {challenge.active && (
                                        <button
                                            className={styles.deactivateBtn}
                                            onClick={() => handleDeactivate(challenge.id)}
                                            disabled={isPending && pendingId === challenge.id}
                                        >
                                            {isPending && pendingId === challenge.id
                                                ? '...'
                                                : 'Deactivate'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
