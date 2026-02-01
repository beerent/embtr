import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUsers, setUserRole } from '../actions';

const mockGetSessionUserId = vi.fn();
const mockGetAll = vi.fn();
const mockGetById = vi.fn();
const mockUpdateRole = vi.fn();

vi.mock('@server/auth/auth', () => ({
    getSessionUserId: (...args: any[]) => mockGetSessionUserId(...args),
}));

vi.mock('@server/database/UserDao', () => ({
    UserDao: class {
        getAll = mockGetAll;
        getById = mockGetById;
        updateRole = mockUpdateRole;
    },
}));

function makeUser(overrides: Record<string, any> = {}) {
    return {
        id: 1,
        username: 'alice',
        displayName: 'Alice',
        photoUrl: null,
        role: 'user',
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getUsers', () => {
    it('returns empty array when not authenticated', async () => {
        mockGetSessionUserId.mockResolvedValue(null);
        const result = await getUsers();
        expect(result).toEqual([]);
    });

    it('returns users with isCurrentUser flag', async () => {
        mockGetSessionUserId.mockResolvedValue(1);
        mockGetAll.mockResolvedValue([
            makeUser({ id: 1, username: 'alice' }),
            makeUser({ id: 2, username: 'bob' }),
        ]);

        const result = await getUsers();

        expect(result).toHaveLength(2);
        expect(result[0].isCurrentUser).toBe(true);
        expect(result[1].isCurrentUser).toBe(false);
    });

    it('marks no user as current when ids dont match', async () => {
        mockGetSessionUserId.mockResolvedValue(99);
        mockGetAll.mockResolvedValue([
            makeUser({ id: 1 }),
            makeUser({ id: 2 }),
        ]);

        const result = await getUsers();

        expect(result.every((u) => !u.isCurrentUser)).toBe(true);
    });

    it('spreads all user fields through', async () => {
        mockGetSessionUserId.mockResolvedValue(1);
        const user = makeUser({ id: 1, displayName: 'Alice A', role: 'admin', photoUrl: 'http://img.png' });
        mockGetAll.mockResolvedValue([user]);

        const result = await getUsers();

        expect(result[0]).toEqual({
            id: 1,
            username: 'alice',
            displayName: 'Alice A',
            photoUrl: 'http://img.png',
            role: 'admin',
            isCurrentUser: true,
        });
    });
});

describe('setUserRole', () => {
    it('rejects unauthenticated requests', async () => {
        mockGetSessionUserId.mockResolvedValue(null);
        const result = await setUserRole(2, 'admin');
        expect(result).toEqual({ error: 'Not authenticated' });
        expect(mockUpdateRole).not.toHaveBeenCalled();
    });

    it('rejects invalid role values', async () => {
        mockGetSessionUserId.mockResolvedValue(1);

        expect(await setUserRole(2, 'superadmin')).toEqual({ error: 'Invalid role' });
        expect(await setUserRole(2, '')).toEqual({ error: 'Invalid role' });
        expect(await setUserRole(2, 'Admin')).toEqual({ error: 'Invalid role' });
        expect(mockGetById).not.toHaveBeenCalled();
    });

    it('rejects non-admin users', async () => {
        mockGetSessionUserId.mockResolvedValue(1);
        mockGetById.mockResolvedValue(makeUser({ id: 1, role: 'user' }));

        const result = await setUserRole(2, 'admin');

        expect(result).toEqual({ error: 'Not authorized' });
        expect(mockUpdateRole).not.toHaveBeenCalled();
    });

    it('rejects when current user not found', async () => {
        mockGetSessionUserId.mockResolvedValue(1);
        mockGetById.mockResolvedValue(null);

        const result = await setUserRole(2, 'admin');

        expect(result).toEqual({ error: 'Not authorized' });
        expect(mockUpdateRole).not.toHaveBeenCalled();
    });

    it('prevents admin from changing own role', async () => {
        mockGetSessionUserId.mockResolvedValue(1);
        mockGetById.mockResolvedValue(makeUser({ id: 1, role: 'admin' }));

        const result = await setUserRole(1, 'user');

        expect(result).toEqual({ error: 'Cannot change your own role' });
        expect(mockUpdateRole).not.toHaveBeenCalled();
    });

    it('allows admin to grant admin to another user', async () => {
        mockGetSessionUserId.mockResolvedValue(1);
        mockGetById.mockResolvedValue(makeUser({ id: 1, role: 'admin' }));

        const result = await setUserRole(2, 'admin');

        expect(result).toEqual({});
        expect(mockUpdateRole).toHaveBeenCalledWith(2, 'admin');
    });

    it('allows admin to revoke admin from another user', async () => {
        mockGetSessionUserId.mockResolvedValue(1);
        mockGetById.mockResolvedValue(makeUser({ id: 1, role: 'admin' }));

        const result = await setUserRole(2, 'user');

        expect(result).toEqual({});
        expect(mockUpdateRole).toHaveBeenCalledWith(2, 'user');
    });

    it('checks authorization before role validation order is correct', async () => {
        mockGetSessionUserId.mockResolvedValue(null);

        // Even with an invalid role, auth check should come first
        const result = await setUserRole(2, 'bogus');
        expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('validates role before checking admin status', async () => {
        mockGetSessionUserId.mockResolvedValue(1);

        const result = await setUserRole(2, 'bogus');

        expect(result).toEqual({ error: 'Invalid role' });
        // Should not even query the database for current user
        expect(mockGetById).not.toHaveBeenCalled();
    });
});
