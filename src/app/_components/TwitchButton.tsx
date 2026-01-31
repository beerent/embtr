'use client';

import { useState } from 'react';
import styles from './TwitchButton.module.css';

interface TwitchButtonProps {
    label?: string;
    href?: string;
}

export function TwitchButton({ label = 'Continue with Twitch', href = '/auth/twitch' }: TwitchButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = () => {
        setLoading(true);
        window.location.href = href;
    };

    return (
        <button
            className={styles.twitchButton}
            onClick={handleClick}
            disabled={loading}
            type="button"
        >
            {loading ? (
                <span className={styles.spinner} />
            ) : (
                <svg className={styles.twitchIcon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </svg>
            )}
            {label}
        </button>
    );
}
