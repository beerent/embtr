'use client';

import { useState } from 'react';
import { ChallengeData } from '@/shared/types/challenge';
import { ChallengeCard } from './ChallengeCard';
import styles from './ChallengesView.module.css';

interface ChallengesViewProps {
    challenges: ChallengeData[];
}

export function ChallengesView({ challenges: initialChallenges }: ChallengesViewProps) {
    const [challenges, setChallenges] = useState(initialChallenges);

    const handleJoinLeave = (challengeId: number, joined: boolean) => {
        setChallenges((prev) =>
            prev.map((c) => {
                if (c.id !== challengeId) return c;
                return {
                    ...c,
                    participantCount: c.participantCount + (joined ? 1 : -1),
                    participation: joined
                        ? {
                              id: 0,
                              habitId: 0,
                              status: 'active',
                              joinedAt: new Date().toISOString(),
                              completedAt: null,
                          }
                        : null,
                };
            })
        );
    };

    if (challenges.length === 0) {
        return (
            <div className={styles.empty}>
                No active challenges right now. Check back later!
            </div>
        );
    }

    return (
        <div className={styles.grid}>
            {challenges.map((challenge) => (
                <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onJoinLeave={handleJoinLeave}
                />
            ))}
        </div>
    );
}
