export enum TimelinePostType {
    USER_POST = 'USER_POST',
    DAY_RESULT = 'DAY_RESULT',
    CHALLENGE_RESULT = 'CHALLENGE_RESULT',
    CHALLENGE_JOIN = 'CHALLENGE_JOIN',
}

export interface TimelinePostAuthor {
    id: number;
    username: string;
    displayName: string | null;
    photoUrl: string | null;
    hasTwitchLinked: boolean;
    isSubscriber: boolean;
}

export interface TimelineCompletedTask {
    title: string;
    status: string;
    completedQuantity: number;
    quantity: number;
    unit: string | null;
}

export interface TimelinePostData {
    id: number;
    type: TimelinePostType;
    body: string | null;
    author: TimelinePostAuthor;
    createdAt: string;
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
    isOwnPost: boolean;
    // DAY_RESULT only (null for USER_POST)
    dayDate: string | null;
    dayScore: number | null;
    completedTasks: TimelineCompletedTask[];
    totalTaskCount: number | null;
    // CHALLENGE_RESULT / CHALLENGE_JOIN (null for other types)
    challengeTitle: string | null;
    challengeAward: string | null;
    challengeId: number | null;
    challengeDescription: string | null;
    challengeIconColor: string | null;
    challengeStartDate: string | null;
    challengeEndDate: string | null;
    challengeRequiredDaysPerWeek: number | null;
    challengeParticipantCount: number | null;
}

export interface TimelineCommentData {
    id: number;
    body: string;
    author: TimelinePostAuthor;
    createdAt: string;
    isOwnComment: boolean;
}

export interface TimelineFeedResult {
    posts: TimelinePostData[];
    nextCursor: string | null;
    hasMore: boolean;
}
