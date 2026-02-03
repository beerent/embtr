import {
    TimelinePostData,
    TimelinePostType,
    TimelineCompletedTask,
} from '@/shared/types/timeline';
import type { BucketFillData } from '@/shared/types/bucket';

interface HabitBucketInfo {
    bucketId: number | null;
    bucketName: string | null;
    bucketColor: string | null;
    bucketIconName: string | null;
    waterCost: number;
}

export function mapPost(
    p: any,
    likeCounts: Map<number, number>,
    commentCounts: Map<number, number>,
    likedSet: Set<number>,
    currentUserId?: number,
    habitBucketMap?: Map<number, HabitBucketInfo>
): TimelinePostData {
    const isDayResult = p.type === 'DAY_RESULT';
    const plannedDay = p.plannedDay;

    let completedTasks: TimelineCompletedTask[] = [];
    let dayDate: string | null = null;
    let dayScore: number | null = null;
    let totalTaskCount: number | null = null;
    let bucketFillLevels: BucketFillData[] | null = null;

    if (isDayResult && plannedDay) {
        dayDate = plannedDay.date;
        dayScore = plannedDay.dayResult?.score ?? null;
        totalTaskCount = plannedDay.plannedTasks?.length ?? 0;

        const allTasks = plannedDay.plannedTasks ?? [];

        completedTasks = allTasks
            .filter((t: any) => t.status === 'complete')
            .map((t: any) => {
                const bucketInfo = t.habitId && habitBucketMap ? habitBucketMap.get(t.habitId) : null;
                return {
                    title: t.title,
                    status: t.status,
                    completedQuantity: t.completedQuantity ?? 0,
                    quantity: t.quantity ?? 1,
                    unit: t.unit ?? null,
                    bucketId: bucketInfo?.bucketId ?? null,
                    bucketName: bucketInfo?.bucketName ?? null,
                    bucketColor: bucketInfo?.bucketColor ?? null,
                    waterCost: bucketInfo?.waterCost ?? 1,
                };
            });

        // Compute bucket fill levels from ALL tasks (not just completed)
        if (habitBucketMap && habitBucketMap.size > 0) {
            const fillMap = new Map<string, { name: string; color: string; iconName: string; total: number; completed: number }>();

            for (const t of allTasks) {
                const bucketInfo = t.habitId ? habitBucketMap.get(t.habitId) : null;
                if (!bucketInfo || bucketInfo.bucketId === null) continue;

                const key = String(bucketInfo.bucketId);
                const existing = fillMap.get(key);
                const water = bucketInfo.waterCost;

                if (existing) {
                    existing.total += water;
                    if (t.status === 'complete') existing.completed += water;
                } else {
                    fillMap.set(key, {
                        name: bucketInfo.bucketName ?? 'Unknown',
                        color: bucketInfo.bucketColor ?? '#888',
                        iconName: bucketInfo.bucketIconName ?? 'Droplets',
                        total: water,
                        completed: t.status === 'complete' ? water : 0,
                    });
                }
            }

            if (fillMap.size > 0) {
                bucketFillLevels = Array.from(fillMap.values()).map((f) => ({
                    bucketName: f.name,
                    bucketColor: f.color,
                    bucketIconName: f.iconName,
                    totalWater: f.total,
                    completedWater: f.completed,
                    fillPercent: f.total > 0 ? Math.round((f.completed / f.total) * 100) : 0,
                }));
            }
        }
    }

    const isChallengePost = p.type === 'CHALLENGE_RESULT' || p.type === 'CHALLENGE_JOIN';
    const challenge = isChallengePost && p.challenge ? p.challenge : null;

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
        challengeTitle: challenge?.title ?? null,
        challengeAward: challenge?.award ?? null,
        challengeId: challenge?.id ?? null,
        challengeDescription: challenge?.description ?? null,
        challengeIconColor: challenge?.iconColor ?? null,
        challengeStartDate: challenge?.startDate ?? null,
        challengeEndDate: challenge?.endDate ?? null,
        challengeRequiredDaysPerWeek: challenge?.requiredDaysPerWeek ?? null,
        challengeParticipantCount: challenge?._count?.participants ?? null,
        bucketFillLevels,
    };
}
