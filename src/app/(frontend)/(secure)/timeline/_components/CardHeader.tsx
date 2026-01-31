'use client';

import { TimelinePostAuthor, TimelinePostType } from '@/shared/types/timeline';
import styles from './CardHeader.module.css';

interface CardHeaderProps {
    author: TimelinePostAuthor;
    createdAt: string;
    type: TimelinePostType;
    menu?: React.ReactNode;
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
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(isoDate).toLocaleDateString();
}

function getInitials(displayName: string | null, username: string): string {
    const name = displayName || username;
    return name.slice(0, 2).toUpperCase();
}

export function CardHeader({ author, createdAt, type, menu }: CardHeaderProps) {
    const displayName = author.displayName || author.username;

    return (
        <div className={styles.header}>
            {author.photoUrl ? (
                <img src={author.photoUrl} alt={displayName} className={styles.avatar} />
            ) : (
                <div className={styles.avatarFallback}>
                    {getInitials(author.displayName, author.username)}
                </div>
            )}

            <div className={styles.meta}>
                <div className={styles.nameRow}>
                    <span className={styles.displayName}>{displayName}</span>
                    {author.hasTwitchLinked && (
                        <svg className={styles.twitchIcon} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                        </svg>
                    )}
                    {author.isSubscriber && (
                        <svg className={styles.subscriberIcon} viewBox="0 0 24 24" fill="none">
                            <path d="M8.78479 1L12.011 5.65934M8.78479 1L7.88188 3.83516M8.78479 1L3.77477 3.6044M8.78479 1L3.77477 2.13187M12.011 5.65934L15.2372 1M12.011 5.65934L16.1512 3.83516M12.011 5.65934L7.88188 3.83516M12.011 5.65934L8.06907 6.1978M12.011 5.65934L15.9199 6.1978M15.2372 1L16.1512 3.83516M15.2372 1L20.2472 2.13187M15.2372 1L20.2252 3.6044M16.1512 3.83516L20.2252 7.18681M16.1512 3.83516L20.2252 3.6044M7.88188 3.83516L3.77477 3.6044M7.88188 3.83516L3.77477 7.18681M7.88188 3.83516L8.06907 6.1978M3.77477 2.13187L1 7.84615M3.77477 2.13187V3.6044M1 7.84615L2.15616 12.9121M1 7.84615L3.77477 3.6044M1 7.84615L3.77477 7.18681M2.15616 12.9121L12.033 23M2.15616 12.9121L3.77477 7.18681M2.15616 12.9121L4.6997 13.1099M2.15616 12.9121L8.37738 17.5385M12.033 23L21.8549 12.9121M12.033 23L9.26927 14.8352M12.033 23L14.7307 14.8352M12.033 23L15.6336 17.5385M12.033 23L8.37738 17.5385M21.8549 12.9121L23 7.84615M21.8549 12.9121L20.2252 7.18681M21.8549 12.9121L19.2893 13.1099M23 7.84615L20.2472 2.13187M23 7.84615L20.2252 7.18681M23 7.84615L20.2252 3.6044M20.2472 2.13187L20.2252 3.6044M3.77477 3.6044V7.18681M3.77477 7.18681L8.06907 6.1978M3.77477 7.18681L4.6997 13.1099M8.06907 6.1978L4.6997 13.1099M8.06907 6.1978L12.011 11.7143M8.06907 6.1978L9.26927 14.8352M4.6997 13.1099L9.26927 14.8352M4.6997 13.1099L8.37738 17.5385M12.011 11.7143L15.9199 6.1978M12.011 11.7143L9.26927 14.8352M12.011 11.7143L14.7307 14.8352M15.9199 6.1978L19.2893 13.1099M15.9199 6.1978L14.7307 14.8352M15.9199 6.1978L20.2252 7.18681M9.26927 14.8352L8.37738 17.5385M14.7307 14.8352L19.2893 13.1099M14.7307 14.8352L15.6336 17.5385M19.2893 13.1099L15.6336 17.5385M19.2893 13.1099L20.2252 7.18681M20.2252 7.18681V3.6044" stroke="currentColor" strokeWidth="0.408" />
                        </svg>
                    )}
                    {author.displayName && (
                        <span className={styles.username}>@{author.username}</span>
                    )}
                </div>
                <span className={styles.timestamp}>{getRelativeTime(createdAt)}</span>
            </div>

            {type === TimelinePostType.DAY_RESULT && (
                <span className={`${styles.badge} ${styles.badgeDayResult}`}>
                    Day Result
                </span>
            )}

            {menu}
        </div>
    );
}
