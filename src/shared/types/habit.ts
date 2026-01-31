export interface HabitWithSchedule {
    id: number;
    title: string;
    description: string | null;
    iconName: string;
    iconColor: string;
    isArchived: boolean;
    scheduledDays: number[]; // [0,1,2,3,4,5,6] derived from ScheduledHabit rows
    quantity: number;
    unit: string | null;
}

export interface DayResultData {
    score: number;
}

export interface PlannedDayWithTasks {
    id: number;
    date: string;
    status: string;
    plannedTasks: PlannedTaskData[];
    dayResult?: DayResultData | null;
}

export interface PlannedTaskData {
    id: number;
    title: string;
    description: string | null;
    status: string; // 'incomplete' | 'complete'
    habitId: number | null;
    completedAt: string | null;
    iconColor?: string;
    quantity: number;
    completedQuantity: number;
    unit: string | null;
}
