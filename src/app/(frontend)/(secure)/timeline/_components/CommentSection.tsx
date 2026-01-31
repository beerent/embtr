'use client';

import { useState, useEffect } from 'react';
import { Send, Check, X } from 'lucide-react';
import { TimelineCommentData } from '@/shared/types/timeline';
import { getComments, addComment, editComment, deleteComment } from '@/server/timeline/actions';
import { CommentMenu } from './CommentMenu';
import styles from './CommentSection.module.css';

interface CommentSectionProps {
    postId: number;
    onCommentAdded?: () => void;
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

export function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
    const [comments, setComments] = useState<TimelineCommentData[]>([]);
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editBody, setEditBody] = useState('');

    useEffect(() => {
        let cancelled = false;
        getComments(postId).then((res) => {
            if (!cancelled && res.success && res.comments) {
                setComments(res.comments);
            }
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [postId]);

    const handleSubmit = async () => {
        const trimmed = body.trim();
        if (!trimmed || submitting) return;

        setSubmitting(true);
        const res = await addComment(postId, trimmed);
        if (res.success && res.comment) {
            setComments((prev) => [...prev, res.comment!]);
            setBody('');
            onCommentAdded?.();
        }
        setSubmitting(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleEditStart = (comment: TimelineCommentData) => {
        setEditingId(comment.id);
        setEditBody(comment.body);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditBody('');
    };

    const handleEditSave = async () => {
        if (editingId === null) return;
        const trimmed = editBody.trim();
        if (!trimmed) return;

        const res = await editComment(editingId, trimmed);
        if (res.success && res.comment) {
            setComments((prev) =>
                prev.map((c) => (c.id === editingId ? res.comment! : c))
            );
        }
        setEditingId(null);
        setEditBody('');
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleEditSave();
        }
        if (e.key === 'Escape') {
            handleEditCancel();
        }
    };

    const handleDelete = async (commentId: number) => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        const res = await deleteComment(commentId);
        if (res.success) {
            onCommentAdded?.();
        }
    };

    return (
        <div className={styles.container}>
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
                                    {c.author.hasTwitchLinked && (
                                        <svg className={styles.twitchIcon} viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                                        </svg>
                                    )}
                                    {c.author.isSubscriber && (
                                        <svg className={styles.subscriberIcon} viewBox="0 0 24 24" fill="none">
                                            <path d="M8.78479 1L12.011 5.65934M8.78479 1L7.88188 3.83516M8.78479 1L3.77477 3.6044M8.78479 1L3.77477 2.13187M12.011 5.65934L15.2372 1M12.011 5.65934L16.1512 3.83516M12.011 5.65934L7.88188 3.83516M12.011 5.65934L8.06907 6.1978M12.011 5.65934L15.9199 6.1978M15.2372 1L16.1512 3.83516M15.2372 1L20.2472 2.13187M15.2372 1L20.2252 3.6044M16.1512 3.83516L20.2252 7.18681M16.1512 3.83516L20.2252 3.6044M7.88188 3.83516L3.77477 3.6044M7.88188 3.83516L3.77477 7.18681M7.88188 3.83516L8.06907 6.1978M3.77477 2.13187L1 7.84615M3.77477 2.13187V3.6044M1 7.84615L2.15616 12.9121M1 7.84615L3.77477 3.6044M1 7.84615L3.77477 7.18681M2.15616 12.9121L12.033 23M2.15616 12.9121L3.77477 7.18681M2.15616 12.9121L4.6997 13.1099M2.15616 12.9121L8.37738 17.5385M12.033 23L21.8549 12.9121M12.033 23L9.26927 14.8352M12.033 23L14.7307 14.8352M12.033 23L15.6336 17.5385M12.033 23L8.37738 17.5385M21.8549 12.9121L23 7.84615M21.8549 12.9121L20.2252 7.18681M21.8549 12.9121L19.2893 13.1099M23 7.84615L20.2472 2.13187M23 7.84615L20.2252 7.18681M23 7.84615L20.2252 3.6044M20.2472 2.13187L20.2252 3.6044M3.77477 3.6044V7.18681M3.77477 7.18681L8.06907 6.1978M3.77477 7.18681L4.6997 13.1099M8.06907 6.1978L4.6997 13.1099M8.06907 6.1978L12.011 11.7143M8.06907 6.1978L9.26927 14.8352M4.6997 13.1099L9.26927 14.8352M4.6997 13.1099L8.37738 17.5385M12.011 11.7143L15.9199 6.1978M12.011 11.7143L9.26927 14.8352M12.011 11.7143L14.7307 14.8352M15.9199 6.1978L19.2893 13.1099M15.9199 6.1978L14.7307 14.8352M15.9199 6.1978L20.2252 7.18681M9.26927 14.8352L8.37738 17.5385M14.7307 14.8352L19.2893 13.1099M14.7307 14.8352L15.6336 17.5385M19.2893 13.1099L15.6336 17.5385M19.2893 13.1099L20.2252 7.18681M20.2252 7.18681V3.6044" stroke="currentColor" strokeWidth="0.408" />
                                        </svg>
                                    )}
                                    {c.isOwnComment && (
                                        <CommentMenu
                                            onEdit={() => handleEditStart(c)}
                                            onDelete={() => handleDelete(c.id)}
                                        />
                                    )}
                                </div>
                                {editingId === c.id ? (
                                    <div className={styles.editRow}>
                                        <input
                                            className={styles.editInput}
                                            value={editBody}
                                            onChange={(e) => setEditBody(e.target.value)}
                                            onKeyDown={handleEditKeyDown}
                                            maxLength={500}
                                            autoFocus
                                        />
                                        <button
                                            className={styles.editSaveBtn}
                                            onClick={handleEditSave}
                                            disabled={!editBody.trim()}
                                        >
                                            <Check size={12} />
                                        </button>
                                        <button
                                            className={styles.editCancelBtn}
                                            onClick={handleEditCancel}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <span className={styles.commentBody}>{c.body}</span>
                                )}
                                <span className={styles.commentTime}>{getRelativeTime(c.createdAt)}</span>
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
