'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dumbbell, Book, Droplets, Brain, Heart, Apple,
    Bike, Moon, Sun, Music, Pencil, Coffee, LucideIcon, X,
} from 'lucide-react';
import { createHabit, updateHabit } from '@/server/habits/actions';
import { HabitWithSchedule } from '@/shared/types/habit';
import type { BucketWithWater } from '@/shared/types/bucket';
import { RESERVOIR_CAPACITY } from '@/shared/types/bucket';
import { EFFORT_LEVELS, computeWaterCost, explainWaterCost, type EffortLevel } from '@/shared/effort';
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
    const [effortLevel, setEffortLevel] = useState<EffortLevel>(
        (habit?.effortLevel ?? 3) as EffortLevel
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const waterCost = computeWaterCost(effortLevel, selectedDays.length);

    // When editing, exclude this habit's current water cost from allocated total
    const currentHabitWater = habit?.waterCost ?? 0;
    const adjustedAllocated = allocatedWater - currentHabitWater;
    const totalWithThis = adjustedAllocated + waterCost;
    const remaining = RESERVOIR_CAPACITY - totalWithThis;
    const isOvercommitted = totalWithThis > RESERVOIR_CAPACITY;

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
                effortLevel,
                scheduledDays: selectedDays,
            });
            if (!res.success) {
                setError(res.error || 'Failed to update habit.');
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
                effortLevel,
                selectedDays
            );
            if (!res.success) {
                setError(res.error || 'Failed to create habit.');
                setSaving(false);
                return;
            }
        }

        router.refresh();
        onClose();
    };

    const capacityPercent = Math.min(100, (totalWithThis / RESERVOIR_CAPACITY) * 100);

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
                        <span className={styles.fieldLabel}>How much does this take out of your day?</span>
                        <div className={styles.effortSelector}>
                            {EFFORT_LEVELS.map((e) => (
                                <button
                                    key={e.level}
                                    type="button"
                                    className={`${styles.effortOption} ${effortLevel === e.level ? styles.effortActive : ''}`}
                                    onClick={() => setEffortLevel(e.level)}
                                >
                                    <span className={styles.effortLabel}>{e.label}</span>
                                    <span className={styles.effortDesc}>{e.description}</span>
                                </button>
                            ))}
                        </div>

                        <div className={styles.effortResult}>
                            {explainWaterCost(effortLevel, selectedDays.length, waterCost)}
                        </div>

                        <div className={styles.capacitySection}>
                            <div className={styles.capacityHeader}>
                                <span className={styles.capacityText}>
                                    {totalWithThis} / {RESERVOIR_CAPACITY} daily capacity used
                                </span>
                            </div>
                            <div className={styles.capacityBar}>
                                <div
                                    className={`${styles.capacityFill} ${isOvercommitted ? styles.capacityOver : ''}`}
                                    style={{ width: `${capacityPercent}%` }}
                                />
                            </div>
                        </div>

                        {isOvercommitted && (
                            <div className={styles.overcommitWarning}>
                                <span className={styles.warningTitle}>You might be taking on too much</span>
                                <span className={styles.warningBody}>
                                    Your habits add up to {totalWithThis} water out of {RESERVOIR_CAPACITY}.
                                    That&apos;s {Math.abs(remaining)} over your daily capacity.
                                    You can still save, but consider whether this is sustainable.
                                </span>
                            </div>
                        )}
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
