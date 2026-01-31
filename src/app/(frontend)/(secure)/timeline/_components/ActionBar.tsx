'use client';

import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { toggleLike } from '@/server/timeline/actions';
import { CommentSection } from './CommentSection';
import { HeartBurst } from './HeartBurst';
import styles from './ActionBar.module.css';

interface ActionBarProps {
    postId: number;
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
}

export function ActionBar({ postId, likeCount, commentCount, isLikedByCurrentUser }: ActionBarProps) {
    const [liked, setLiked] = useState(isLikedByCurrentUser);
    const [likes, setLikes] = useState(likeCount);
    const [comments, setComments] = useState(commentCount);
    const [showComments, setShowComments] = useState(false);
    const [showBurst, setShowBurst] = useState(false);

    const handleLike = async () => {
        const wasLiked = liked;

        // Optimistic update
        setLiked(!liked);
        setLikes(liked ? likes - 1 : likes + 1);

        if (!wasLiked) {
            setShowBurst(true);
        }

        const res = await toggleLike(postId);
        if (res.success && res.liked !== undefined) {
            setLiked(res.liked);
            setLikes((prev) => res.liked ? Math.max(prev, 0) : Math.max(prev, 0));
        }
    };

    const handleToggleComments = () => {
        setShowComments(!showComments);
    };

    return (
        <>
            <div className={styles.bar}>
                <div className={styles.likeWrapper}>
                    <button
                        className={`${styles.action} ${liked ? styles.liked : ''}`}
                        onClick={handleLike}
                    >
                        <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                        {likes > 0 && <span>{likes}</span>}
                    </button>
                    {showBurst && <HeartBurst onComplete={() => setShowBurst(false)} />}
                </div>

                <button className={styles.action} onClick={handleToggleComments}>
                    <MessageCircle size={16} />
                    {comments > 0 && <span>{comments}</span>}
                </button>
            </div>

            {showComments && (
                <CommentSection
                    postId={postId}
                    onCommentAdded={() => setComments((c) => c + 1)}
                />
            )}
        </>
    );
}
