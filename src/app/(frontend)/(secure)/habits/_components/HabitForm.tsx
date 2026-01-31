'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dumbbell, Book, Droplets, Brain, Heart, Apple,
    Bike, Moon, Sun, Music, Pencil, Coffee, LucideIcon, X,
} from 'lucide-react';
import { createHabit, updateHabit, updateSchedule } from '@/server/habits/actions';
import { HabitWithSchedule } from '@/shared/types/habit';
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
    onClose: () => void;
}

export function HabitForm({ habit, onClose }: HabitFormProps) {
    const router = useRouter();
    const [title, setTitle] = useState(habit?.title ?? '');
    const [description, setDescription] = useState(habit?.description ?? '');
    const [iconName, setIconName] = useState(habit?.iconName ?? 'Dumbbell');
    const [iconColor, setIconColor] = useState(habit?.iconColor ?? '#F14E6B');
    const [selectedDays, setSelectedDays] = useState<number[]>(
        habit?.scheduledDays ?? [0, 1, 2, 3, 4, 5, 6]
    );
    const [quantity, setQuantity] = useState<number>(habit?.quantity ?? 1);
    const [unit, setUnit] = useState<string>(habit?.unit ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isEdit = !!habit;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }

        setSaving(true);
        setError('');

        if (isEdit) {
            const res = await updateHabit(habit.id, {
                title: title.trim(),
                description: description.trim() || undefined,
                iconName,
                iconColor,
                quantity,
                unit: unit.trim() || null,
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
                quantity > 1 ? quantity : undefined,
                unit.trim() || undefined
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
                        <span className={styles.fieldLabel}>Quantity Goal</span>
                        <div className={styles.quantityRow}>
                            <input
                                className={styles.quantityInput}
                                type="number"
                                min={1}
                                max={1000}
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                placeholder="1"
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
