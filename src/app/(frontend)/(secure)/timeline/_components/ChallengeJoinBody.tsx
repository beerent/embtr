'use client';

import { useState, useTransition } from 'react';
import { joinChallenge } from '@/server/challenges/actions';
import styles from './ChallengeJoinBody.module.css';

interface ChallengeJoinBodyProps {
    body: string | null;
    challengeId: number | null;
    challengeTitle: string | null;
    challengeAward: string | null;
    challengeDescription: string | null;
    challengeIconColor: string | null;
    challengeStartDate: string | null;
    challengeEndDate: string | null;
    challengeRequiredDaysPerWeek: number | null;
    challengeParticipantCount: number | null;
    isOwnPost: boolean;
}

function formatDateRange(start: string | null, end: string | null): string {
    if (!start || !end) return '';
    const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
}

function computeWeeks(start: string | null, end: string | null): number {
    if (!start || !end) return 0;
    const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime();
    return Math.max(1, Math.round(ms / (7 * 24 * 60 * 60 * 1000)));
}

export function ChallengeJoinBody({
    body,
    challengeId,
    challengeTitle,
    challengeAward,
    challengeDescription,
    challengeIconColor,
    challengeStartDate,
    challengeEndDate,
    challengeRequiredDaysPerWeek,
    challengeParticipantCount,
    isOwnPost,
}: ChallengeJoinBodyProps) {
    const [joined, setJoined] = useState(isOwnPost);
    const [pending, startTransition] = useTransition();

    const weeks = computeWeeks(challengeStartDate, challengeEndDate);
    const cadence = challengeRequiredDaysPerWeek
        ? `${challengeRequiredDaysPerWeek}x/week for ${weeks} week${weeks !== 1 ? 's' : ''}`
        : null;

    const handleJoin = () => {
        if (!challengeId || joined || pending) return;
        startTransition(async () => {
            const res = await joinChallenge(challengeId);
            if (res.success) {
                setJoined(true);
            }
        });
    };

    return (
        <div className={styles.container}>
            {body && <p className={styles.description}>{body}</p>}

            <div className={styles.card}>
                <div className={styles.cardTop}>
                    <div
                        className={styles.iconCircle}
                        style={{ backgroundColor: challengeIconColor ?? '#4e73df' }}
                    >
                        {challengeAward ?? '🏆'}
                    </div>
                    <div className={styles.cardInfo}>
                        <span className={styles.cardTitle}>{challengeTitle}</span>
                        {cadence && <span className={styles.cadence}>{cadence}</span>}
                    </div>
                </div>

                {challengeDescription && (
                    <p className={styles.cardDescription}>{challengeDescription}</p>
                )}

                <div className={styles.cardMeta}>
                    {challengeStartDate && challengeEndDate && (
                        <span>{formatDateRange(challengeStartDate, challengeEndDate)}</span>
                    )}
                    {challengeParticipantCount != null && (
                        <span>
                            {challengeParticipantCount} participant{challengeParticipantCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {joined ? (
                    <button className={styles.joinedBtn} disabled>
                        Joined
                    </button>
                ) : (
                    <button
                        className={styles.joinBtn}
                        onClick={handleJoin}
                        disabled={pending}
                    >
                        {pending ? 'Joining...' : 'Join Challenge'}
                    </button>
                )}
            </div>
        </div>
    );
}
