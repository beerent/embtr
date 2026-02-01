'use client';

import { useState, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { addBugComment, getBugComments, deleteBugComment } from '@/server/bugs/actions';
import styles from './BugCommentSection.module.css';

interface CommentData {
    id: number;
    body: string;
    createdAt: string;
    author: {
        id: number;
        username: string;
        displayName: string | null;
    };
    isOwnComment: boolean;
}

interface BugCommentSectionProps {
    bugReportId: number;
}

function getInitials(displayName: string | null, username: string): string {
    const name = displayName || username;
    return name.slice(0, 2).toUpperCase();
}

function getRelativeTime(isoDate: string): string {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d`;
}

export function BugCommentSection({ bugReportId }: BugCommentSectionProps) {
    const [comments, setComments] = useState<CommentData[]>([]);
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getBugComments(bugReportId).then((res) => {
            if (!cancelled && res.success && res.comments) {
                setComments(res.comments);
            }
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [bugReportId]);

    const handleSubmit = async () => {
        const trimmed = body.trim();
        if (!trimmed || submitting) return;

        setSubmitting(true);
        const res = await addBugComment(bugReportId, trimmed);
        if (res.success && res.comment) {
            setComments((prev) => [...prev, res.comment!]);
            setBody('');
        }
        setSubmitting(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleDelete = async (commentId: number) => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        await deleteBugComment(commentId);
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.heading}>Comments</h3>

            {loading ? (
                <span className={styles.empty}>Loading comments...</span>
            ) : comments.length === 0 ? (
                <span className={styles.empty}>No comments yet</span>
            ) : (
                <div className={styles.commentList}>
                    {comments.map((c) => (
                        <div key={c.id} className={styles.comment}>
                            <div className={styles.commentAvatar}>
                                {getInitials(c.author.displayName, c.author.username)}
                            </div>
                            <div className={styles.commentContent}>
                                <div className={styles.commentHeader}>
                                    <span className={styles.commentAuthor}>
                                        {c.author.displayName || c.author.username}
                                    </span>
                                    <span className={styles.commentTime}>{getRelativeTime(c.createdAt)}</span>
                                    {c.isOwnComment && (
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleDelete(c.id)}
                                            title="Delete comment"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                                <span className={styles.commentBody}>{c.body}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.inputRow}>
                <input
                    className={styles.input}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a comment..."
                    maxLength={500}
                />
                <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={!body.trim() || submitting}
                >
                    <Send size={14} />
                </button>
            </div>
        </div>
    );
}
