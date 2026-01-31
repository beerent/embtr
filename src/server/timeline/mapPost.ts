import {
    TimelinePostData,
    TimelinePostType,
    TimelineCompletedTask,
} from '@/shared/types/timeline';

export function mapPost(
    p: any,
    likeCounts: Map<number, number>,
    commentCounts: Map<number, number>,
    likedSet: Set<number>,
    currentUserId?: number
): TimelinePostData {
    const isDayResult = p.type === 'DAY_RESULT';
    const plannedDay = p.plannedDay;

    let completedTasks: TimelineCompletedTask[] = [];
    let dayDate: string | null = null;
    let dayScore: number | null = null;
    let totalTaskCount: number | null = null;

    if (isDayResult && plannedDay) {
        dayDate = plannedDay.date;
        dayScore = plannedDay.dayResult?.score ?? null;
        totalTaskCount = plannedDay.plannedTasks?.length ?? 0;

        completedTasks = (plannedDay.plannedTasks ?? [])
            .filter((t: any) => t.status === 'complete')
            .map((t: any) => ({
                title: t.title,
                status: t.status,
                completedQuantity: t.completedQuantity ?? 0,
                quantity: t.quantity ?? 1,
                unit: t.unit ?? null,
            }));
    }

    return {
        id: p.id,
        type: p.type as TimelinePostType,
        body: p.body ?? null,
        author: {
            id: p.user.id,
            username: p.user.username,
            displayName: p.user.displayName ?? null,
            photoUrl: p.user.photoUrl ?? null,
            hasTwitchLinked: !!p.user.twitchAccount,
            isSubscriber: !!p.user.twitchAccount?.isSubscriber,
        },
        createdAt: p.createdAt.toISOString(),
        likeCount: likeCounts.get(p.id) ?? 0,
        commentCount: commentCounts.get(p.id) ?? 0,
        isLikedByCurrentUser: likedSet.has(p.id),
        isOwnPost: currentUserId != null && p.userId === currentUserId,
        dayDate,
        dayScore,
        completedTasks,
        totalTaskCount,
    };
}
