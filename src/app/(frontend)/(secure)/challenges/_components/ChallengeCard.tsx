'use client';

import { useState, useEffect, useTransition } from 'react';
import { ChallengeData } from '@/shared/types/challenge';
import { joinChallenge, leaveChallenge, getChallengeDetails } from '@/server/challenges/actions';
import { ChallengeService } from '@/server/challenges/ChallengeService';
import styles from './ChallengeCard.module.css';

interface ChallengeCardProps {
    challenge: ChallengeData;
    onJoinLeave: (challengeId: number, joined: boolean) => void;
}

export function ChallengeCard({ challenge, onJoinLeave }: ChallengeCardProps) {
    const [isPending, startTransition] = useTransition();
    const [progress, setProgress] = useState<{ completions: number; required: number; percentage: number } | null>(null);

    const isParticipating = !!challenge.participation;
    const status = ChallengeService.getChallengeStatus(challenge.startDate, challenge.endDate);

    const totalDays = Math.ceil(
        (new Date(challenge.endDate + 'T00:00:00Z').getTime() - new Date(challenge.startDate + 'T00:00:00Z').getTime()) /
            (1000 * 60 * 60 * 24) + 1
    );
    const totalWeeks = Math.ceil(totalDays / 7);

    // Fetch progress on mount for participants
    useEffect(() => {
        if (!isParticipating) return;
        let cancelled = false;
        getChallengeDetails(challenge.id).then((result) => {
            if (!cancelled && result.success && result.progress) {
                setProgress(result.progress);
            }
        });
        return () => { cancelled = true; };
    }, [isParticipating, challenge.id]);

    const handleJoin = () => {
        startTransition(async () => {
            const result = await joinChallenge(challenge.id);
            if (result.success) {
                onJoinLeave(challenge.id, true);
            }
        });
    };

    const handleLeave = () => {
        startTransition(async () => {
            const result = await leaveChallenge(challenge.id);
            if (result.success) {
                onJoinLeave(challenge.id, false);
                setProgress(null);
            }
        });
    };

    const participationStatus = challenge.participation?.status;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.iconCircle} style={{ background: challenge.iconColor }}>
                    <span className={styles.awardEmoji}>{challenge.award}</span>
                </div>
                <div className={styles.headerInfo}>
                    <span className={styles.title}>{challenge.title}</span>
                    <span className={styles.cadence}>
                        {challenge.requiredDaysPerWeek}x/week for {totalWeeks} week{totalWeeks !== 1 ? 's' : ''}
                    </span>
                </div>
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

            <p className={styles.description}>{challenge.description}</p>

            <div className={styles.meta}>
                <span>{challenge.startDate} &ndash; {challenge.endDate}</span>
                <span>
                    {challenge.participantCount} participant{challenge.participantCount !== 1 ? 's' : ''}
                </span>
            </div>

            {isParticipating && progress && (
                <div className={styles.progressSection}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                    <span className={styles.progressLabel}>
                        {progress.completions}/{progress.required} completions ({progress.percentage}%)
                    </span>
                </div>
            )}

            {participationStatus === 'completed' && (
                <div className={styles.completedBadge}>
                    {challenge.award} Completed!
                </div>
            )}

            {participationStatus === 'failed' && (
                <div className={styles.failedBadge}>
                    Challenge ended
                </div>
            )}

            <div className={styles.footer}>
                {status !== 'ended' && !isParticipating && (
                    <button className={styles.joinBtn} onClick={handleJoin} disabled={isPending}>
                        {isPending ? 'Joining...' : 'Join Challenge'}
                    </button>
                )}
                {isParticipating && participationStatus === 'active' && (
                    <button className={styles.leaveBtn} onClick={handleLeave} disabled={isPending}>
                        {isPending ? '...' : 'Leave'}
                    </button>
                )}
            </div>
        </div>
    );
}
