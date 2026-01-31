'use client';

import { useState } from 'react';
import { TimelinePostData, TimelinePostType } from '@/shared/types/timeline';
import { editPost, deletePost } from '@/server/timeline/actions';
import { CardHeader } from './CardHeader';
import { UserPostBody } from './UserPostBody';
import { DayResultBody } from './DayResultBody';
import { ActionBar } from './ActionBar';
import { PostMenu } from './PostMenu';
import styles from './TimelineCard.module.css';

interface TimelineCardProps {
    post: TimelinePostData;
    onPostEdited: (updated: TimelinePostData) => void;
    onPostDeleted: (postId: number) => void;
}

export function TimelineCard({ post, onPostEdited, onPostDeleted }: TimelineCardProps) {
    const [editing, setEditing] = useState(false);
    const [editBody, setEditBody] = useState(post.body ?? '');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSave = async () => {
        const trimmed = editBody.trim();
        if (!trimmed || saving) return;

        setSaving(true);
        const res = await editPost(post.id, trimmed);
        if (res.success && res.post) {
            onPostEdited(res.post);
            setEditing(false);
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (deleting) return;
        setDeleting(true);
        const res = await deletePost(post.id);
        if (res.success) {
            onPostDeleted(post.id);
        }
        setDeleting(false);
    };

    const handleCancel = () => {
        setEditBody(post.body ?? '');
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div className={styles.card}>
            <CardHeader
                author={post.author}
                createdAt={post.createdAt}
                type={post.type}
                menu={post.isOwnPost ? (
                    <PostMenu
                        onEdit={() => setEditing(true)}
                        onDelete={handleDelete}
                    />
                ) : undefined}
            />

            {editing ? (
                <div className={styles.editContainer}>
                    <textarea
                        className={styles.editTextarea}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={750}
                        autoFocus
                    />
                    <div className={styles.editActions}>
                        <button className={styles.cancelBtn} onClick={handleCancel}>
                            Cancel
                        </button>
                        <button
                            className={styles.saveBtn}
                            onClick={handleSave}
                            disabled={!editBody.trim() || saving}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            ) : post.type === TimelinePostType.USER_POST ? (
                <UserPostBody body={post.body} />
            ) : (
                <DayResultBody
                    body={post.body}
                    dayDate={post.dayDate}
                    dayScore={post.dayScore}
                    completedTasks={post.completedTasks}
                    totalTaskCount={post.totalTaskCount}
                />
            )}

            <ActionBar
                postId={post.id}
                likeCount={post.likeCount}
                commentCount={post.commentCount}
                isLikedByCurrentUser={post.isLikedByCurrentUser}
            />
        </div>
    );
}
