'use client';

import type { BucketWithDrops } from '@/shared/types/bucket';
import { RESERVOIR_CAPACITY } from '@/shared/types/bucket';
import styles from './ReservoirMeter.module.css';

interface ReservoirMeterProps {
    buckets: BucketWithDrops[];
    allocatedDrops: number;
    remainingDrops: number;
}

export function ReservoirMeter({ buckets, allocatedDrops, remainingDrops }: ReservoirMeterProps) {
    const barWidth = 100;
    const barHeight = 24;

    let xOffset = 0;
    const segments = buckets
        .filter((b) => b.totalDropCost > 0)
        .map((b) => {
            const width = (b.totalDropCost / RESERVOIR_CAPACITY) * barWidth;
            const segment = {
                key: b.id,
                x: xOffset,
                width: Math.min(width, barWidth - xOffset),
                color: b.color,
                name: b.name,
            };
            xOffset += width;
            return segment;
        });

    const isOver = allocatedDrops > RESERVOIR_CAPACITY;

    return (
        <div className={styles.container}>
            <div className={styles.label}>
                <span className={isOver ? styles.allocatedOver : styles.allocated}>
                    {allocatedDrops}/{RESERVOIR_CAPACITY} allocated
                </span>
                <span className={isOver ? styles.remainingOver : styles.remaining}>
                    {isOver ? `${allocatedDrops - RESERVOIR_CAPACITY} over` : `${remainingDrops} remaining`}
                </span>
            </div>
            <svg
                className={styles.bar}
                viewBox={`0 0 ${barWidth} ${barHeight}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`Reservoir: ${allocatedDrops} of ${RESERVOIR_CAPACITY} drops allocated`}
            >
                <defs>
                    <clipPath id="reservoir-clip">
                        <rect x={0} y={0} width={barWidth} height={barHeight} rx={4} />
                    </clipPath>
                </defs>
                <rect
                    x={0}
                    y={0}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    fill="var(--glass-border)"
                />
                <g clipPath="url(#reservoir-clip)">
                    {segments.map((seg) => (
                        <rect
                            key={seg.key}
                            x={seg.x}
                            y={0}
                            width={seg.width}
                            height={barHeight}
                            fill={seg.color}
                        >
                            <title>{seg.name}: {seg.width.toFixed(0)}%</title>
                        </rect>
                    ))}
                </g>
            </svg>
            {segments.length > 0 && (
                <div className={styles.legend}>
                    {segments.map((seg) => (
                        <div key={seg.key} className={styles.legendItem}>
                            <span
                                className={styles.legendDot}
                                style={{ backgroundColor: seg.color }}
                            />
                            <span className={styles.legendText}>{seg.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
