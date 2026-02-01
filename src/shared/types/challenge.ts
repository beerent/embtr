export interface ChallengeData {
    id: number;
    title: string;
    description: string;
    iconName: string;
    iconColor: string;
    quantity: number;
    unit: string | null;
    startDate: string;
    endDate: string;
    requiredDaysPerWeek: number;
    award: string;
    active: boolean;
    participantCount: number;
    createdAt: string;
    // User-specific (null when not logged in or not participating)
    participation: ChallengeParticipationData | null;
}

export interface ChallengeParticipationData {
    id: number;
    habitId: number;
    status: string; // active, completed, failed
    joinedAt: string;
    completedAt: string | null;
}

export interface ChallengeProgress {
    completions: number;
    required: number;
    percentage: number;
}

export type ChallengeStatus = 'upcoming' | 'active' | 'ended';
