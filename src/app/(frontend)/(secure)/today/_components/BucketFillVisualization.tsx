'use client';

import type { PlannedTaskData } from '@/shared/types/habit';
import { RESERVOIR_CAPACITY } from '@/shared/types/bucket';
import styles from './BucketFillVisualization.module.css';

interface BucketFillVisualizationProps {
    tasks: PlannedTaskData[];
}

interface BucketFill {
    bucketId: number | null;
    bucketName: string;
    bucketColor: string;
    totalDrops: number;
    completedDrops: number;
}

export function BucketFillVisualization({ tasks }: BucketFillVisualizationProps) {
    // Group tasks by bucket
    const bucketMap = new Map<number | null, BucketFill>();

    for (const task of tasks) {
        const key = task.bucketId;
        const existing = bucketMap.get(key);

        if (existing) {
            existing.totalDrops += task.dropCost;
            if (task.status === 'complete') {
                existing.completedDrops += task.dropCost;
            }
        } else {
            bucketMap.set(key, {
                bucketId: key,
                bucketName: task.bucketName ?? 'Other',
                bucketColor: task.bucketColor ?? 'var(--text-muted)',
                totalDrops: task.dropCost,
                completedDrops: task.status === 'complete' ? task.dropCost : 0,
            });
        }
    }

    const fills = Array.from(bucketMap.values()).filter((f) => f.totalDrops > 0);

    if (fills.length === 0) return null;

    const totalUsed = fills.reduce((sum, f) => sum + f.completedDrops, 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.title}>Drop Flow</span>
                <span className={styles.usage}>{totalUsed}/{RESERVOIR_CAPACITY} drops used today</span>
            </div>

            <div className={styles.bars}>
                {fills.map((fill) => {
                    const maxHeight = 80;
                    const fillPercent = fill.totalDrops > 0
                        ? (fill.completedDrops / fill.totalDrops) * 100
                        : 0;
                    const fillHeight = (fillPercent / 100) * maxHeight;

                    return (
                        <div key={fill.bucketId ?? 'other'} className={styles.barColumn}>
                            <div
                                className={styles.barContainer}
                                style={{
                                    height: maxHeight,
                                    borderColor: `color-mix(in srgb, ${fill.bucketColor} 30%, transparent)`,
                                }}
                            >
                                <div
                                    className={styles.barFill}
                                    style={{
                                        height: fillHeight,
                                        backgroundColor: fill.bucketColor,
                                    }}
                                />
                            </div>
                            <span className={styles.barLabel}>{fill.bucketName}</span>
                            <span className={styles.barValue}>
                                {fill.completedDrops}/{fill.totalDrops}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
