'use client';

import styles from './ChallengeResultBody.module.css';

interface ChallengeResultBodyProps {
    body: string | null;
    challengeTitle: string | null;
    challengeAward: string | null;
}

export function ChallengeResultBody({ body, challengeTitle, challengeAward }: ChallengeResultBodyProps) {
    return (
        <div className={styles.container}>
            {body && <p className={styles.description}>{body}</p>}

            <div className={styles.resultRow}>
                {challengeAward && <span className={styles.award}>{challengeAward}</span>}
                {challengeTitle && <span className={styles.challengeTitle}>{challengeTitle}</span>}
            </div>

            <span className={styles.completedLabel}>Challenge Completed</span>
        </div>
    );
}
