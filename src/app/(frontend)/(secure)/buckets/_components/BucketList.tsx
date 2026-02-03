'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { archiveBucket } from '@/server/buckets/actions';
import type { BucketWithWater } from '@/shared/types/bucket';
import type { HabitWithSchedule } from '@/shared/types/habit';
import { BucketCard } from './BucketCard';
import { BucketForm } from './BucketForm';
import { ReservoirMeter } from './ReservoirMeter';
import styles from './BucketList.module.css';

interface BucketListProps {
    buckets: BucketWithWater[];
    habits: HabitWithSchedule[];
    allocatedWater: number;
    remainingWater: number;
}

export function BucketList({ buckets, habits, allocatedWater, remainingWater }: BucketListProps) {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [editingBucket, setEditingBucket] = useState<BucketWithWater | undefined>();

    const openCreate = () => {
        setEditingBucket(undefined);
        setShowForm(true);
    };

    const openEdit = (bucket: BucketWithWater) => {
        setEditingBucket(bucket);
        setShowForm(true);
    };

    const handleArchive = async (bucketId: number) => {
        await archiveBucket(bucketId);
        router.refresh();
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingBucket(undefined);
    };

    const habitCountByBucket = new Map<number, number>();
    for (const h of habits) {
        if (h.bucketId) {
            habitCountByBucket.set(h.bucketId, (habitCountByBucket.get(h.bucketId) ?? 0) + 1);
        }
    }

    return (
        <>
            <ReservoirMeter
                buckets={buckets}
                allocatedWater={allocatedWater}
                remainingWater={remainingWater}
            />

            <div className={styles.toolbar}>
                <button className={styles.addBtn} onClick={openCreate}>
                    <Plus size={18} />
                    Add Bucket
                </button>
            </div>

            {buckets.length === 0 ? (
                <div className={styles.empty}>
                    <p>No buckets yet. Create your first bucket to organize your habits.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {buckets.map((bucket, index) => (
                        <BucketCard
                            key={bucket.id}
                            bucket={bucket}
                            habitCount={habitCountByBucket.get(bucket.id) ?? 0}
                            index={index}
                            onEdit={() => openEdit(bucket)}
                            onArchive={() => handleArchive(bucket.id)}
                        />
                    ))}
                </div>
            )}

            {showForm && <BucketForm bucket={editingBucket} onClose={closeForm} />}
        </>
    );
}
