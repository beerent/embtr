'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dumbbell, Book, Droplets, Brain, Heart, Apple,
    Bike, Moon, Sun, Music, Pencil, Coffee, LucideIcon, X,
} from 'lucide-react';
import { createHabit, updateHabit, updateSchedule } from '@/server/habits/actions';
import { HabitWithSchedule } from '@/shared/types/habit';
import type { BucketWithWater } from '@/shared/types/bucket';
import { RESERVOIR_CAPACITY } from '@/shared/types/bucket';
import { DayPicker } from './DayPicker';
import styles from './HabitForm.module.css';

const ICON_OPTIONS: { name: string; Icon: LucideIcon }[] = [
    { name: 'Dumbbell', Icon: Dumbbell },
    { name: 'Book', Icon: Book },
    { name: 'Droplets', Icon: Droplets },
    { name: 'Brain', Icon: Brain },
    { name: 'Heart', Icon: Heart },
    { name: 'Apple', Icon: Apple },
    { name: 'Bike', Icon: Bike },
    { name: 'Moon', Icon: Moon },
    { name: 'Sun', Icon: Sun },
    { name: 'Music', Icon: Music },
    { name: 'Pencil', Icon: Pencil },
    { name: 'Coffee', Icon: Coffee },
];

const COLOR_OPTIONS = [
    '#F14E6B', '#9154FF', '#4E73DF', '#25B24A',
    '#FFC100', '#FF8C42', '#00B4D8', '#FF69B4',
];

interface HabitFormProps {
    habit?: HabitWithSchedule;
    buckets: BucketWithWater[];
    allocatedWater: number;
    onClose: () => void;
}

export function HabitForm({ habit, buckets, allocatedWater, onClose }: HabitFormProps) {
    const router = useRouter();
    const [title, setTitle] = useState(habit?.title ?? '');
    const [description, setDescription] = useState(habit?.description ?? '');
    const [iconName, setIconName] = useState(habit?.iconName ?? 'Dumbbell');
    const [iconColor, setIconColor] = useState(habit?.iconColor ?? '#F14E6B');
    const [selectedDays, setSelectedDays] = useState<number[]>(
        habit?.scheduledDays ?? [0, 1, 2, 3, 4, 5, 6]
    );
    const [trackQuantity, setTrackQuantity] = useState<boolean>(
        (habit?.quantity ?? 1) > 1
    );
    const [quantity, setQuantity] = useState<number>(habit?.quantity ?? 1);
    const [unit, setUnit] = useState<string>(habit?.unit ?? '');
    const [bucketId, setBucketId] = useState<number | null>(habit?.bucketId ?? null);
    const [waterCost, setWaterCost] = useState<number>(habit?.waterCost ?? 1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // When editing, exclude this habit's current water cost from allocated total
    const currentHabitWater = habit?.waterCost ?? 0;
    const adjustedAllocated = allocatedWater - currentHabitWater;
    const remaining = RESERVOIR_CAPACITY - adjustedAllocated - waterCost;

    const isEdit = !!habit;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }

        setSaving(true);
        setError('');

        const effectiveQuantity = trackQuantity ? quantity : 1;
        const effectiveUnit = trackQuantity ? (unit.trim() || null) : null;

        if (isEdit) {
            const res = await updateHabit(habit.id, {
                title: title.trim(),
                description: description.trim() || undefined,
                iconName,
                iconColor,
                quantity: effectiveQuantity,
                unit: effectiveUnit,
                bucketId,
                waterCost,
            });
            if (!res.success) {
                setError(res.error || 'Failed to update habit.');
                setSaving(false);
                return;
            }
            const schedRes = await updateSchedule(habit.id, selectedDays);
            if (!schedRes.success) {
                setError(schedRes.error || 'Failed to update schedule.');
                setSaving(false);
                return;
            }
        } else {
            const res = await createHabit(
                title.trim(),
                description.trim() || undefined,
                iconName,
                iconColor,
                effectiveQuantity > 1 ? effectiveQuantity : undefined,
                effectiveUnit || undefined,
                bucketId,
                waterCost
            );
            if (!res.success) {
                setError(res.error || 'Failed to create habit.');
                setSaving(false);
                return;
            }
            if (res.habit) {
                await updateSchedule(res.habit.id, selectedDays);
            }
        }

        router.refresh();
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{isEdit ? 'Edit Habit' : 'New Habit'}</h2>
                    <button className={styles.closeBtn} onClick={onClose} type="button">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <p className={styles.error}>{error}</p>}

                    <label className={styles.label}>
                        Title
                        <input
                            className={styles.input}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Morning run"
                            autoFocus
                        />
                    </label>

                    <label className={styles.label}>
                        Description
                        <textarea
                            className={styles.textarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={2}
                        />
                    </label>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Icon</span>
                        <div className={styles.iconGrid}>
                            {ICON_OPTIONS.map(({ name, Icon }) => (
                                <button
                                    key={name}
                                    type="button"
                                    className={`${styles.iconBtn} ${iconName === name ? styles.iconActive : ''}`}
                                    onClick={() => setIconName(name)}
                                >
                                    <Icon size={20} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Color</span>
                        <div className={styles.colorGrid}>
                            {COLOR_OPTIONS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`${styles.colorBtn} ${iconColor === color ? styles.colorActive : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setIconColor(color)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Schedule</span>
                        <DayPicker selectedDays={selectedDays} onChange={setSelectedDays} />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.toggleRow}>
                            <span className={styles.fieldLabel}>Track quantity</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={trackQuantity}
                                className={`${styles.toggle} ${trackQuantity ? styles.toggleOn : ''}`}
                                onClick={() => {
                                    setTrackQuantity((v) => !v);
                                    if (!trackQuantity && quantity <= 1) setQuantity(2);
                                }}
                            >
                                <span className={styles.toggleThumb} />
                            </button>
                        </label>
                        {trackQuantity && (
                            <div className={styles.quantityRow}>
                                <input
                                    className={styles.quantityInput}
                                    type="number"
                                    min={2}
                                    max={1000}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(2, parseInt(e.target.value) || 2))}
                                    placeholder="2"
                                />
                                <input
                                    className={styles.unitInput}
                                    type="text"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    placeholder="e.g. glasses, pages, minutes"
                                    maxLength={50}
                                />
                            </div>
                        )}
                    </div>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Bucket</span>
                        <div className={styles.bucketSelector}>
                            <button
                                type="button"
                                className={`${styles.bucketOption} ${bucketId === null ? styles.bucketActive : ''}`}
                                onClick={() => setBucketId(null)}
                            >
                                No bucket
                            </button>
                            {buckets.map((b) => (
                                <button
                                    key={b.id}
                                    type="button"
                                    className={`${styles.bucketOption} ${bucketId === b.id ? styles.bucketActive : ''}`}
                                    onClick={() => setBucketId(b.id)}
                                >
                                    <span
                                        className={styles.bucketOptionDot}
                                        style={{ backgroundColor: b.color }}
                                    />
                                    {b.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {bucketId !== null && (
                        <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Water cost</span>
                            <div className={styles.waterCostRow}>
                                <input
                                    className={styles.quantityInput}
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={waterCost}
                                    onChange={(e) => setWaterCost(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                />
                                <span className={styles.waterHelper}>
                                    {remaining >= 0
                                        ? `${remaining} of ${RESERVOIR_CAPACITY} remaining`
                                        : `Over by ${Math.abs(remaining)}`}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.saveBtn} disabled={saving}>
                            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Habit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
