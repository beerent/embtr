'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Archive, LucideIcon } from 'lucide-react';
import {
    Dumbbell, Book, Droplets, Brain, Heart, Apple,
    Bike, Moon, Sun, Music, Coffee,
} from 'lucide-react';
import { archiveHabit } from '@/server/habits/actions';
import { HabitWithSchedule } from '@/shared/types/habit';
import type { BucketWithWater } from '@/shared/types/bucket';
import { HabitForm } from './HabitForm';
import styles from './HabitList.module.css';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HABIT_ICON_MAP: Record<string, LucideIcon> = {
    Dumbbell, Book, Droplets, Brain, Heart, Apple,
    Bike, Moon, Sun, Music, Pencil, Coffee,
};

interface HabitListProps {
    habits: HabitWithSchedule[];
    buckets: BucketWithWater[];
    allocatedWater: number;
}

export function HabitList({ habits, buckets, allocatedWater }: HabitListProps) {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [editingHabit, setEditingHabit] = useState<HabitWithSchedule | undefined>();

    const openCreate = () => {
        setEditingHabit(undefined);
        setShowForm(true);
    };

    const openEdit = (habit: HabitWithSchedule) => {
        setEditingHabit(habit);
        setShowForm(true);
    };

    const handleArchive = async (habitId: number) => {
        await archiveHabit(habitId);
        router.refresh();
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingHabit(undefined);
    };

    const getScheduleSummary = (days: number[]) => {
        if (days.length === 7) return 'Every day';
        if (days.length === 0) return 'No days';
        return days.map((d) => DAY_NAMES[d]).join(', ');
    };

    const bucketMap = new Map(buckets.map((b) => [b.id, b]));

    return (
        <>
            <div className={styles.toolbar}>
                <button className={styles.addBtn} onClick={openCreate}>
                    <Plus size={18} />
                    Add Habit
                </button>
            </div>

            {habits.length === 0 ? (
                <div className={styles.empty}>
                    <p>No habits yet. Create your first habit to get started.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {habits.map((habit, index) => {
                        const IconComp = HABIT_ICON_MAP[habit.iconName];
                        const bucket = habit.bucketId ? bucketMap.get(habit.bucketId) : null;
                        return (
                            <div key={habit.id} className={styles.card} style={{ '--delay': `${index * 60}ms` } as React.CSSProperties}>
                                <div className={styles.cardHeader}>
                                    <div
                                        className={styles.iconCircle}
                                        style={{ backgroundColor: habit.iconColor }}
                                    >
                                        {IconComp ? <IconComp size={20} color="#fff" /> : null}
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => openEdit(habit)}
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => handleArchive(habit.id)}
                                            title="Archive"
                                        >
                                            <Archive size={16} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className={styles.cardTitle}>{habit.title}</h3>
                                {habit.description && (
                                    <p className={styles.cardDesc}>{habit.description}</p>
                                )}
                                {bucket && (
                                    <div className={styles.bucketBadge}>
                                        <span
                                            className={styles.bucketDot}
                                            style={{ backgroundColor: bucket.color }}
                                        />
                                        <span className={styles.bucketName}>{bucket.name}</span>
                                        <span className={styles.waterLabel}>{habit.waterCost} water</span>
                                    </div>
                                )}
                                <p className={styles.schedule}>
                                    {getScheduleSummary(habit.scheduledDays)}
                                </p>
                                {habit.quantity > 1 && (
                                    <p className={styles.quantity}>
                                        {habit.quantity} {habit.unit || 'times'}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showForm && (
                <HabitForm
                    habit={editingHabit}
                    buckets={buckets}
                    allocatedWater={allocatedWater}
                    onClose={closeForm}
                />
            )}
        </>
    );
}
