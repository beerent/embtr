'use client';

import { useState, useTransition } from 'react';
import { ChallengeData } from '@/shared/types/challenge';
import { createChallenge, updateChallenge } from '@/server/challenges/actions';
import styles from './ChallengeForm.module.css';

interface ChallengeFormProps {
    challenge?: ChallengeData;
    onCreated: (challenge: ChallengeData) => void;
    onUpdated: () => void;
    onCancel: () => void;
}

export function ChallengeForm({ challenge, onCreated, onUpdated, onCancel }: ChallengeFormProps) {
    const isEditing = !!challenge;

    const [title, setTitle] = useState(challenge?.title ?? '');
    const [description, setDescription] = useState(challenge?.description ?? '');
    const [iconName, setIconName] = useState(challenge?.iconName ?? 'bx-check-circle');
    const [iconColor, setIconColor] = useState(challenge?.iconColor ?? '#4e73df');
    const [quantity, setQuantity] = useState(challenge?.quantity ?? 1);
    const [unit, setUnit] = useState(challenge?.unit ?? '');
    const [startDate, setStartDate] = useState(challenge?.startDate ?? '');
    const [endDate, setEndDate] = useState(challenge?.endDate ?? '');
    const [requiredDaysPerWeek, setRequiredDaysPerWeek] = useState(challenge?.requiredDaysPerWeek ?? 5);
    const [award, setAward] = useState(challenge?.award ?? '🏆');
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Title is required.');
            return;
        }
        if (!description.trim()) {
            setError('Description is required.');
            return;
        }
        if (!startDate || !endDate) {
            setError('Start and end dates are required.');
            return;
        }
        if (endDate <= startDate) {
            setError('End date must be after start date.');
            return;
        }

        startTransition(async () => {
            const data = {
                title: title.trim(),
                description: description.trim(),
                iconName,
                iconColor,
                quantity,
                unit: unit.trim() || undefined,
                startDate,
                endDate,
                requiredDaysPerWeek,
                award: award.trim() || undefined,
            };

            if (isEditing && challenge) {
                const result = await updateChallenge(challenge.id, data);
                if (result.success) {
                    onUpdated();
                } else {
                    setError(result.error || 'Failed to update.');
                }
            } else {
                const result = await createChallenge(data);
                if (result.success && result.challenge) {
                    onCreated(result.challenge);
                } else {
                    setError(result.error || 'Failed to create.');
                }
            }
        });
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.heading}>{isEditing ? 'Edit Challenge' : 'Create Challenge'}</h2>

            {error && <div className={styles.error}>{error}</div>}

            <label className={styles.label}>
                Title
                <input
                    className={styles.input}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. 30-Day Meditation Challenge"
                />
            </label>

            <label className={styles.label}>
                Description
                <textarea
                    className={styles.textarea}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Describe the challenge..."
                />
            </label>

            <div className={styles.row}>
                <label className={styles.label}>
                    Start Date
                    <input
                        className={styles.input}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </label>

                <label className={styles.label}>
                    End Date
                    <input
                        className={styles.input}
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </label>
            </div>

            <div className={styles.row}>
                <label className={styles.label}>
                    Required Days / Week
                    <input
                        className={styles.input}
                        type="number"
                        min={1}
                        max={7}
                        value={requiredDaysPerWeek}
                        onChange={(e) => setRequiredDaysPerWeek(Number(e.target.value))}
                    />
                </label>

                <label className={styles.label}>
                    Quantity
                    <input
                        className={styles.input}
                        type="number"
                        min={1}
                        max={1000}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                </label>

                <label className={styles.label}>
                    Unit (optional)
                    <input
                        className={styles.input}
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        maxLength={50}
                        placeholder="e.g. minutes"
                    />
                </label>
            </div>

            <div className={styles.row}>
                <label className={styles.label}>
                    Icon Color
                    <input
                        className={styles.colorInput}
                        type="color"
                        value={iconColor}
                        onChange={(e) => setIconColor(e.target.value)}
                    />
                </label>

                <label className={styles.label}>
                    Award Emoji
                    <input
                        className={styles.input}
                        type="text"
                        value={award}
                        onChange={(e) => setAward(e.target.value)}
                        maxLength={10}
                        placeholder="🏆"
                    />
                </label>

                <label className={styles.label}>
                    Icon Name
                    <input
                        className={styles.input}
                        type="text"
                        value={iconName}
                        onChange={(e) => setIconName(e.target.value)}
                        placeholder="bx-check-circle"
                    />
                </label>
            </div>

            <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={isPending}>
                    {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Challenge'}
                </button>
            </div>
        </form>
    );
}
