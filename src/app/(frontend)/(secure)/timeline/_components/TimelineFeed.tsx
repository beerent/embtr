'use client';

import { useState } from 'react';
import { TimelinePostData } from '@/shared/types/timeline';
import { getTimelineFeed } from '@/server/timeline/actions';
import { CreatePostForm } from './CreatePostForm';
import { TimelineCard } from './TimelineCard';
import styles from './TimelineFeed.module.css';

interface TimelineFeedProps {
    initialPosts: TimelinePostData[];
    initialCursor: string | null;
    initialHasMore: boolean;
}

export function TimelineFeed({ initialPosts, initialCursor, initialHasMore }: TimelineFeedProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [cursor, setCursor] = useState(initialCursor);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [loadingMore, setLoadingMore] = useState(false);

    const handleLoadMore = async () => {
        if (!cursor || loadingMore) return;

        setLoadingMore(true);
        const res = await getTimelineFeed(cursor);
        if (res.success && res.data) {
            setPosts((prev) => [...prev, ...res.data!.posts]);
            setCursor(res.data.nextCursor);
            setHasMore(res.data.hasMore);
        }
        setLoadingMore(false);
    };

    const handlePostEdited = (updated: TimelinePostData) => {
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    };

    const handlePostDeleted = (postId: number) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
    };

    return (
        <div className={styles.container}>
            <CreatePostForm />

            {posts.length === 0 ? (
                <div className={styles.empty}>
                    <p>No posts yet. Be the first to share something!</p>
                </div>
            ) : (
                posts.map((post) => (
                    <TimelineCard
                        key={post.id}
                        post={post}
                        onPostEdited={handlePostEdited}
                        onPostDeleted={handlePostDeleted}
                    />
                ))
            )}

            {hasMore && (
                <button
                    className={styles.loadMore}
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                >
                    {loadingMore ? 'Loading...' : 'Load more'}
                </button>
            )}
        </div>
    );
}
