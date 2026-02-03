export const RESERVOIR_CAPACITY = 100;

export interface BucketData {
    id: number;
    name: string;
    color: string;
    iconName: string;
    sortOrder: number;
    isArchived: boolean;
}

export interface BucketWithDrops extends BucketData {
    totalDropCost: number;
    completedDrops: number;
}

export interface BucketFillData {
    bucketName: string;
    bucketColor: string;
    bucketIconName: string;
    totalDrops: number;
    completedDrops: number;
    fillPercent: number;
}
