import { ChallengeProgress, ChallengeStatus } from '@/shared/types/challenge';

export namespace ChallengeService {
    export function computeProgress(
        completions: number,
        requiredDaysPerWeek: number,
        startDate: string,
        endDate: string
    ): ChallengeProgress {
        const required = computeRequiredCompletions(requiredDaysPerWeek, startDate, endDate);
        const percentage = required > 0 ? Math.min(100, Math.round((completions / required) * 100)) : 0;
        return { completions, required, percentage };
    }

    export function computeRequiredCompletions(
        requiredDaysPerWeek: number,
        startDate: string,
        endDate: string
    ): number {
        const totalDays = daysBetween(startDate, endDate) + 1;
        const totalWeeks = Math.ceil(totalDays / 7);
        return requiredDaysPerWeek * totalWeeks;
    }

    export function evaluateCompletion(
        completions: number,
        requiredDaysPerWeek: number,
        startDate: string,
        endDate: string
    ): 'completed' | 'failed' | 'active' {
        const today = new Date().toISOString().split('T')[0];
        if (today <= endDate) return 'active';

        const required = computeRequiredCompletions(requiredDaysPerWeek, startDate, endDate);
        return completions >= required ? 'completed' : 'failed';
    }

    export function getChallengeStatus(startDate: string, endDate: string): ChallengeStatus {
        const today = new Date().toISOString().split('T')[0];
        if (today < startDate) return 'upcoming';
        if (today > endDate) return 'ended';
        return 'active';
    }

    function daysBetween(startDate: string, endDate: string): number {
        const start = new Date(startDate + 'T00:00:00Z');
        const end = new Date(endDate + 'T00:00:00Z');
        return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
}
