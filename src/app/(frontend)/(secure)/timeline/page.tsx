import { PageHeader } from '../_components/ui/PageHeader';
import { getTimelineFeed } from '@/server/timeline/actions';
import { TimelineFeed } from './_components/TimelineFeed';

export default async function TimelinePage() {
    const res = await getTimelineFeed();
    const posts = res.data?.posts ?? [];
    const nextCursor = res.data?.nextCursor ?? null;
    const hasMore = res.data?.hasMore ?? false;

    return (
        <div>
            <PageHeader>Timeline</PageHeader>
            <TimelineFeed
                initialPosts={posts}
                initialCursor={nextCursor}
                initialHasMore={hasMore}
            />
        </div>
    );
}
