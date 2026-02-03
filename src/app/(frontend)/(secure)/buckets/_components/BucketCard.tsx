'use client';

import { Pencil, Archive, LucideIcon } from 'lucide-react';
import {
    Dumbbell, Book, Droplets, Brain, Heart, Apple,
    Bike, Moon, Sun, Music, Coffee,
} from 'lucide-react';
import type { BucketWithWater } from '@/shared/types/bucket';
import { RESERVOIR_CAPACITY } from '@/shared/types/bucket';
import styles from './BucketCard.module.css';

const BUCKET_ICON_MAP: Record<string, LucideIcon> = {
    Dumbbell, Book, Droplets, Brain, Heart, Apple,
    Bike, Moon, Sun, Music, Pencil, Coffee,
};

interface BucketCardProps {
    bucket: BucketWithWater;
    habitCount: number;
    index: number;
    onEdit: () => void;
    onArchive: () => void;
}

export function BucketCard({ bucket, habitCount, index, onEdit, onArchive }: BucketCardProps) {
    const IconComp = BUCKET_ICON_MAP[bucket.iconName];
    const fillPercent = RESERVOIR_CAPACITY > 0
        ? Math.min(100, (bucket.totalWaterCost / RESERVOIR_CAPACITY) * 100)
        : 0;

    return (
        <div className={styles.card} style={{ '--delay': `${index * 60}ms` } as React.CSSProperties}>
            <div className={styles.cardHeader}>
                <div
                    className={styles.iconCircle}
                    style={{ backgroundColor: bucket.color }}
                >
                    {IconComp ? <IconComp size={20} color="#fff" /> : null}
                </div>
                <div className={styles.cardActions}>
                    <button
                        className={styles.actionBtn}
                        onClick={onEdit}
                        title="Edit"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        className={styles.actionBtn}
                        onClick={onArchive}
                        title="Archive"
                    >
                        <Archive size={16} />
                    </button>
                </div>
            </div>
            <h3 className={styles.cardTitle}>{bucket.name}</h3>
            <p className={styles.meta}>
                {habitCount} {habitCount === 1 ? 'habit' : 'habits'} &middot; {bucket.totalWaterCost} water
            </p>
            <div className={styles.fillBarContainer}>
                <div
                    className={styles.fillBar}
                    style={{
                        width: `${fillPercent}%`,
                        backgroundColor: bucket.color,
                    }}
                />
            </div>
            <p className={styles.fillLabel}>{fillPercent.toFixed(0)}% of reservoir</p>
        </div>
    );
}
