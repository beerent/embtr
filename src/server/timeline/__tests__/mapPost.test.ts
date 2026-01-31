import { mapPost } from '../mapPost';
import { TimelinePostType } from '@/shared/types/timeline';

describe('mapPost', () => {
    const baseUser = {
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        photoUrl: null,
    };

    const baseDate = new Date('2025-01-15T12:00:00Z');

    function makePost(overrides: Record<string, any> = {}) {
        return {
            id: 1,
            type: 'USER_POST',
            body: 'Hello world',
            userId: 1,
            plannedDayId: null,
            createdAt: baseDate,
            updatedAt: baseDate,
            user: baseUser,
            plannedDay: null,
            ...overrides,
        };
    }

    describe('USER_POST mapping', () => {
        it('maps basic user post fields', () => {
            const result = mapPost(makePost(), new Map(), new Map(), new Set());

            expect(result.id).toBe(1);
            expect(result.type).toBe(TimelinePostType.USER_POST);
            expect(result.body).toBe('Hello world');
            expect(result.author.id).toBe(1);
            expect(result.author.username).toBe('testuser');
            expect(result.author.displayName).toBe('Test User');
            expect(result.createdAt).toBe(baseDate.toISOString());
        });

        it('sets DAY_RESULT fields to null/empty for USER_POST', () => {
            const result = mapPost(makePost(), new Map(), new Map(), new Set());

            expect(result.dayDate).toBeNull();
            expect(result.dayScore).toBeNull();
            expect(result.completedTasks).toEqual([]);
            expect(result.totalTaskCount).toBeNull();
        });

        it('uses like and comment counts from maps', () => {
            const likeCounts = new Map([[1, 5]]);
            const commentCounts = new Map([[1, 3]]);
            const likedSet = new Set([1]);

            const result = mapPost(makePost(), likeCounts, commentCounts, likedSet);

            expect(result.likeCount).toBe(5);
            expect(result.commentCount).toBe(3);
            expect(result.isLikedByCurrentUser).toBe(true);
        });

        it('defaults counts to zero when post not in maps', () => {
            const result = mapPost(makePost(), new Map(), new Map(), new Set());

            expect(result.likeCount).toBe(0);
            expect(result.commentCount).toBe(0);
            expect(result.isLikedByCurrentUser).toBe(false);
        });

        it('handles null body', () => {
            const result = mapPost(makePost({ body: null }), new Map(), new Map(), new Set());
            expect(result.body).toBeNull();
        });

        it('handles missing displayName', () => {
            const result = mapPost(
                makePost({ user: { ...baseUser, displayName: null } }),
                new Map(),
                new Map(),
                new Set()
            );
            expect(result.author.displayName).toBeNull();
        });
    });

    describe('DAY_RESULT mapping', () => {
        const plannedDay = {
            id: 10,
            date: '2025-01-15',
            status: 'complete',
            dayResult: { score: 85 },
            plannedTasks: [
                { id: 100, title: 'Meditate', status: 'complete', sortOrder: 0, quantity: 1, completedQuantity: 1, unit: null },
                { id: 101, title: 'Exercise', status: 'complete', sortOrder: 1, quantity: 3, completedQuantity: 3, unit: 'sets' },
                { id: 102, title: 'Read', status: 'incomplete', sortOrder: 2, quantity: 1, completedQuantity: 0, unit: null },
            ],
        };

        it('populates DAY_RESULT fields from plannedDay', () => {
            const post = makePost({
                type: 'DAY_RESULT',
                body: 'Great day!',
                plannedDayId: 10,
                plannedDay,
            });

            const result = mapPost(post, new Map(), new Map(), new Set());

            expect(result.type).toBe(TimelinePostType.DAY_RESULT);
            expect(result.dayDate).toBe('2025-01-15');
            expect(result.dayScore).toBe(85);
            expect(result.totalTaskCount).toBe(3);
        });

        it('only includes completed tasks', () => {
            const post = makePost({
                type: 'DAY_RESULT',
                plannedDayId: 10,
                plannedDay,
            });

            const result = mapPost(post, new Map(), new Map(), new Set());

            expect(result.completedTasks).toHaveLength(2);
            expect(result.completedTasks[0].title).toBe('Meditate');
            expect(result.completedTasks[1].title).toBe('Exercise');
        });

        it('maps task quantity fields', () => {
            const post = makePost({
                type: 'DAY_RESULT',
                plannedDayId: 10,
                plannedDay,
            });

            const result = mapPost(post, new Map(), new Map(), new Set());

            expect(result.completedTasks[1].quantity).toBe(3);
            expect(result.completedTasks[1].completedQuantity).toBe(3);
            expect(result.completedTasks[1].unit).toBe('sets');
        });

        it('handles DAY_RESULT with null plannedDay', () => {
            const post = makePost({
                type: 'DAY_RESULT',
                plannedDayId: null,
                plannedDay: null,
            });

            const result = mapPost(post, new Map(), new Map(), new Set());

            expect(result.dayDate).toBeNull();
            expect(result.dayScore).toBeNull();
            expect(result.completedTasks).toEqual([]);
            expect(result.totalTaskCount).toBeNull();
        });

        it('handles DAY_RESULT with no dayResult (score null)', () => {
            const post = makePost({
                type: 'DAY_RESULT',
                plannedDayId: 10,
                plannedDay: { ...plannedDay, dayResult: null },
            });

            const result = mapPost(post, new Map(), new Map(), new Set());

            expect(result.dayScore).toBeNull();
            expect(result.dayDate).toBe('2025-01-15');
        });

        it('handles empty planned tasks', () => {
            const post = makePost({
                type: 'DAY_RESULT',
                plannedDayId: 10,
                plannedDay: { ...plannedDay, plannedTasks: [] },
            });

            const result = mapPost(post, new Map(), new Map(), new Set());

            expect(result.completedTasks).toEqual([]);
            expect(result.totalTaskCount).toBe(0);
        });
    });

    describe('hasTwitchLinked', () => {
        it('is true when user has a twitchAccount', () => {
            const result = mapPost(
                makePost({ user: { ...baseUser, twitchAccount: { id: 1 } } }),
                new Map(),
                new Map(),
                new Set()
            );
            expect(result.author.hasTwitchLinked).toBe(true);
        });

        it('is false when user has no twitchAccount', () => {
            const result = mapPost(
                makePost({ user: { ...baseUser, twitchAccount: null } }),
                new Map(),
                new Map(),
                new Set()
            );
            expect(result.author.hasTwitchLinked).toBe(false);
        });

        it('is false when twitchAccount is undefined', () => {
            const result = mapPost(makePost(), new Map(), new Map(), new Set());
            expect(result.author.hasTwitchLinked).toBe(false);
        });
    });

    describe('isOwnPost', () => {
        it('is true when currentUserId matches post userId', () => {
            const result = mapPost(makePost({ userId: 5 }), new Map(), new Map(), new Set(), 5);
            expect(result.isOwnPost).toBe(true);
        });

        it('is false when currentUserId does not match post userId', () => {
            const result = mapPost(makePost({ userId: 5 }), new Map(), new Map(), new Set(), 99);
            expect(result.isOwnPost).toBe(false);
        });

        it('is false when currentUserId is undefined', () => {
            const result = mapPost(makePost({ userId: 5 }), new Map(), new Map(), new Set());
            expect(result.isOwnPost).toBe(false);
        });

        it('is false when currentUserId is explicitly undefined', () => {
            const result = mapPost(makePost({ userId: 5 }), new Map(), new Map(), new Set(), undefined);
            expect(result.isOwnPost).toBe(false);
        });
    });
});
