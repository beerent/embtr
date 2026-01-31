'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserPost } from '@/server/timeline/actions';
import styles from './CreatePostForm.module.css';

const MAX_CHARS = 750;

export function CreatePostForm() {
    const router = useRouter();
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const charCount = body.length;
    const isOverLimit = charCount > MAX_CHARS;

    const handleSubmit = async () => {
        const trimmed = body.trim();
        if (!trimmed || isOverLimit || submitting) return;

        setSubmitting(true);
        const res = await createUserPost(trimmed);
        if (res.success) {
            setBody('');
            router.refresh();
        }
        setSubmitting(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const charCountClass = isOverLimit
        ? styles.charCountError
        : charCount > MAX_CHARS * 0.9
          ? styles.charCountWarn
          : styles.charCount;

    return (
        <div className={styles.form}>
            <textarea
                className={styles.textarea}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind?"
                maxLength={MAX_CHARS + 50}
            />

            <div className={styles.footer}>
                <span className={charCountClass}>
                    {charCount}/{MAX_CHARS}
                </span>

                <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={!body.trim() || isOverLimit || submitting}
                >
                    {submitting ? 'Posting...' : 'Post'}
                </button>
            </div>
        </div>
    );
}
