export type BugStatus = 'open' | 'in_progress' | 'under_review' | 'resolved' | 'closed' | 'wont_fix';

export type BugPriority = 'low' | 'medium' | 'high' | 'critical';

export interface BugReportData {
    id: number;
    title: string;
    description: string;
    status: BugStatus;
    priority: BugPriority;
    author: {
        id: number;
        username: string;
        displayName: string | null;
    };
    commentCount: number;
    createdAt: string;
    updatedAt: string;
    isOwnReport: boolean;
}

export const BUG_STATUS_LABELS: Record<BugStatus, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    under_review: 'Under Review',
    resolved: 'Resolved',
    closed: 'Closed',
    wont_fix: "Won't Fix",
};

export const BUG_PRIORITY_LABELS: Record<BugPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
};

export const ALL_BUG_STATUSES: BugStatus[] = [
    'open',
    'in_progress',
    'under_review',
    'resolved',
    'closed',
    'wont_fix',
];
