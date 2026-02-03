export const RESERVOIR_CAPACITY = 100;

export interface BucketData {
    id: number;
    name: string;
    color: string;
    iconName: string;
    sortOrder: number;
    isArchived: boolean;
}

export interface BucketWithWater extends BucketData {
    totalWaterCost: number;
    completedWater: number;
}

export interface BucketFillData {
    bucketName: string;
    bucketColor: string;
    bucketIconName: string;
    totalWater: number;
    completedWater: number;
    fillPercent: number;
}
