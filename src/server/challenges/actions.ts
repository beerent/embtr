'use server';

import { z } from 'zod';
import { getSessionUserId } from '../auth/auth';
import { Session } from '../session/Session';
import { ChallengeDao } from '../database/ChallengeDao';
import { ChallengeParticipantDao } from '../database/ChallengeParticipantDao';
import { HabitDao } from '../database/HabitDao';
import { ScheduledHabitDao } from '../database/ScheduledHabitDao';
import { PlannedTaskDao } from '../database/PlannedTaskDao';
import { TimelinePostDao } from '../database/TimelinePostDao';
import { ChallengeData, ChallengeProgress } from '@/shared/types/challenge';
import { ChallengeService } from './ChallengeService';

// --- Schemas ---

const createChallengeSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().min(1, 'Description is required').max(1000),
    iconName: z.string().optional(),
    iconColor: z.string().optional(),
    quantity: z.number().min(1).max(1000).optional(),
    unit: z.string().max(50).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    requiredDaysPerWeek: z.number().int().min(1).max(7),
    award: z.string().max(10).optional(),
});

const updateChallengeSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().min(1).max(1000).optional(),
    iconName: z.string().optional(),
    iconColor: z.string().optional(),
    quantity: z.number().min(1).max(1000).optional(),
    unit: z.string().max(50).nullable().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    requiredDaysPerWeek: z.number().int().min(1).max(7).optional(),
    award: z.string().max(10).optional(),
});

// --- Helpers ---

function mapChallenge(row: any, participation: any | null): ChallengeData {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        iconName: row.iconName,
        iconColor: row.iconColor,
        quantity: row.quantity,
        unit: row.unit,
        startDate: row.startDate,
        endDate: row.endDate,
        requiredDaysPerWeek: row.requiredDaysPerWeek,
        award: row.award,
        active: row.active,
        participantCount: row._count?.participants ?? 0,
        createdAt: row.createdAt.toISOString(),
        participation: participation
            ? {
                  id: participation.id,
                  habitId: participation.habitId,
                  status: participation.status,
                  joinedAt: participation.joinedAt.toISOString(),
                  completedAt: participation.completedAt?.toISOString() ?? null,
              }
            : null,
    };
}

// --- Admin Actions ---

export async function createChallenge(
    data: z.infer<typeof createChallengeSchema>
): Promise<{ success: boolean; error?: string; challenge?: ChallengeData }> {
    const session = await Session.getSession();
    if (session.role !== 'admin') return { success: false, error: 'Unauthorized.' };

    const parsed = createChallengeSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    if (parsed.data.endDate <= parsed.data.startDate) {
        return { success: false, error: 'End date must be after start date.' };
    }

    const dao = new ChallengeDao();
    const row = await dao.create({
        ...parsed.data,
        createdById: session.id,
    });

    return { success: true, challenge: mapChallenge(row, null) };
}

export async function updateChallenge(
    id: number,
    data: z.infer<typeof updateChallengeSchema>
): Promise<{ success: boolean; error?: string }> {
    const session = await Session.getSession();
    if (session.role !== 'admin') return { success: false, error: 'Unauthorized.' };

    const parsed = updateChallengeSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' };
    }

    const dao = new ChallengeDao();
    const existing = await dao.getById(id);
    if (!existing) return { success: false, error: 'Challenge not found.' };

    if (parsed.data.startDate && parsed.data.endDate && parsed.data.endDate <= parsed.data.startDate) {
        return { success: false, error: 'End date must be after start date.' };
    }

    await dao.update(id, parsed.data);
    return { success: true };
}

export async function deactivateChallenge(
    id: number
): Promise<{ success: boolean; error?: string }> {
    const session = await Session.getSession();
    if (session.role !== 'admin') return { success: false, error: 'Unauthorized.' };

    const dao = new ChallengeDao();
    const existing = await dao.getById(id);
    if (!existing) return { success: false, error: 'Challenge not found.' };

    await dao.deactivate(id);
    return { success: true };
}

// --- User Actions ---

export async function getChallenges(): Promise<{
    success: boolean;
    error?: string;
    challenges?: ChallengeData[];
}> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const challengeDao = new ChallengeDao();
    const participantDao = new ChallengeParticipantDao();

    const [challenges, participations] = await Promise.all([
        challengeDao.getActive(),
        participantDao.getByUserId(userId),
    ]);

    const participationMap = new Map<number, any>();
    for (const p of participations) {
        participationMap.set(p.challengeId, p);
    }

    const mapped = challenges.map((c: any) => mapChallenge(c, participationMap.get(c.id) ?? null));

    return { success: true, challenges: mapped };
}

export async function getAllChallenges(): Promise<{
    success: boolean;
    error?: string;
    challenges?: ChallengeData[];
}> {
    const session = await Session.getSession();
    if (session.role !== 'admin') return { success: false, error: 'Unauthorized.' };

    const dao = new ChallengeDao();
    const challenges = await dao.getAll();

    const mapped = challenges.map((c: any) => mapChallenge(c, null));
    return { success: true, challenges: mapped };
}

export async function getChallengeDetails(id: number): Promise<{
    success: boolean;
    error?: string;
    challenge?: ChallengeData;
    progress?: ChallengeProgress;
}> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const challengeDao = new ChallengeDao();
    const participantDao = new ChallengeParticipantDao();

    const challenge = await challengeDao.getById(id);
    if (!challenge) return { success: false, error: 'Challenge not found.' };

    const participation = await participantDao.getByChallengeAndUser(id, userId);
    const mapped = mapChallenge(challenge, participation);

    let progress: ChallengeProgress | undefined;
    if (participation) {
        const taskDao = new PlannedTaskDao();
        const completions = await taskDao.countCompletedByHabitAndDateRange(
            participation.habitId,
            challenge.startDate,
            challenge.endDate
        );
        progress = ChallengeService.computeProgress(
            completions,
            challenge.requiredDaysPerWeek,
            challenge.startDate,
            challenge.endDate
        );
    }

    return { success: true, challenge: mapped, progress };
}

export async function joinChallenge(
    challengeId: number
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const challengeDao = new ChallengeDao();
    const participantDao = new ChallengeParticipantDao();

    const challenge = await challengeDao.getById(challengeId);
    if (!challenge || !challenge.active) {
        return { success: false, error: 'Challenge not found or inactive.' };
    }

    const today = new Date().toISOString().split('T')[0];
    if (today > challenge.endDate) {
        return { success: false, error: 'This challenge has already ended.' };
    }

    const existing = await participantDao.getByChallengeAndUser(challengeId, userId);
    if (existing) {
        return { success: false, error: 'Already joined this challenge.' };
    }

    // Create habit for the user
    const habitDao = new HabitDao();
    const habit = await habitDao.create({
        userId,
        title: challenge.title,
        description: challenge.description,
        iconName: challenge.iconName,
        iconColor: challenge.iconColor,
        quantity: challenge.quantity,
        unit: challenge.unit,
    });

    // Schedule habit for all 7 days
    const scheduledHabitDao = new ScheduledHabitDao();
    await scheduledHabitDao.setSchedule(userId, habit.id, [0, 1, 2, 3, 4, 5, 6]);

    // Create participation record
    await participantDao.create({
        challengeId,
        userId,
        habitId: habit.id,
    });

    // Post to timeline
    const timelineDao = new TimelinePostDao();
    await timelineDao.create({
        userId,
        type: 'CHALLENGE_JOIN',
        challengeId,
    });

    return { success: true };
}

export async function leaveChallenge(
    challengeId: number
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const participantDao = new ChallengeParticipantDao();
    const participation = await participantDao.getByChallengeAndUser(challengeId, userId);
    if (!participation) {
        return { success: false, error: 'Not participating in this challenge.' };
    }

    // Archive the linked habit
    const habitDao = new HabitDao();
    await habitDao.archive(participation.habitId);

    // Remove participation
    await participantDao.delete(participation.id);

    return { success: true };
}

export async function getMyActiveChallenges(): Promise<{
    success: boolean;
    error?: string;
    challenges?: (ChallengeData & { progress: ChallengeProgress })[];
}> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const participantDao = new ChallengeParticipantDao();
    const participations = await participantDao.getByUserId(userId);

    const taskDao = new PlannedTaskDao();

    const results = await Promise.all(
        participations
            .filter((p: any) => p.status === 'active')
            .map(async (p: any) => {
                const challenge = p.challenge;
                const completions = await taskDao.countCompletedByHabitAndDateRange(
                    p.habitId,
                    challenge.startDate,
                    challenge.endDate
                );
                const progress = ChallengeService.computeProgress(
                    completions,
                    challenge.requiredDaysPerWeek,
                    challenge.startDate,
                    challenge.endDate
                );
                return {
                    ...mapChallenge(challenge, p),
                    progress,
                };
            })
    );

    return { success: true, challenges: results };
}

export async function evaluateChallenge(
    challengeId: number
): Promise<{ success: boolean; error?: string; status?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const challengeDao = new ChallengeDao();
    const participantDao = new ChallengeParticipantDao();
    const taskDao = new PlannedTaskDao();

    const challenge = await challengeDao.getById(challengeId);
    if (!challenge) return { success: false, error: 'Challenge not found.' };

    const participation = await participantDao.getByChallengeAndUser(challengeId, userId);
    if (!participation) return { success: false, error: 'Not participating.' };
    if (participation.status !== 'active') {
        return { success: true, status: participation.status };
    }

    const completions = await taskDao.countCompletedByHabitAndDateRange(
        participation.habitId,
        challenge.startDate,
        challenge.endDate
    );

    const result = ChallengeService.evaluateCompletion(
        completions,
        challenge.requiredDaysPerWeek,
        challenge.startDate,
        challenge.endDate
    );

    if (result !== 'active') {
        await participantDao.updateStatus(
            participation.id,
            result,
            result === 'completed' ? new Date() : null
        );

        // Archive the habit
        const habitDao = new HabitDao();
        await habitDao.archive(participation.habitId);
    }

    return { success: true, status: result };
}

export async function shareChallengeResult(
    challengeId: number,
    body?: string
): Promise<{ success: boolean; error?: string }> {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: 'Not authenticated.' };

    const participantDao = new ChallengeParticipantDao();
    const participation = await participantDao.getByChallengeAndUser(challengeId, userId);
    if (!participation) return { success: false, error: 'Not participating.' };
    if (participation.status !== 'completed') {
        return { success: false, error: 'Challenge not yet completed.' };
    }

    const dao = new TimelinePostDao();
    await dao.create({
        userId,
        type: 'CHALLENGE_RESULT',
        body: body || null,
        challengeId,
    });

    return { success: true };
}
