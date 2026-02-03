'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dumbbell, Book, Droplets, Brain, Heart, Apple,
    Bike, Moon, Sun, Music, Pencil, Coffee, LucideIcon, X,
} from 'lucide-react';
import { createBucket, updateBucket } from '@/server/buckets/actions';
import type { BucketData } from '@/shared/types/bucket';
import styles from './BucketForm.module.css';

const ICON_OPTIONS: { name: string; Icon: LucideIcon }[] = [
    { name: 'Droplets', Icon: Droplets },
    { name: 'Dumbbell', Icon: Dumbbell },
    { name: 'Book', Icon: Book },
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
    '#4E73DF', '#F14E6B', '#9154FF', '#25B24A',
    '#FFC100', '#FF8C42', '#00B4D8', '#FF69B4',
];

interface BucketFormProps {
    bucket?: BucketData;
    onClose: () => void;
}

export function BucketForm({ bucket, onClose }: BucketFormProps) {
    const router = useRouter();
    const [name, setName] = useState(bucket?.name ?? '');
    const [iconName, setIconName] = useState(bucket?.iconName ?? 'Droplets');
    const [color, setColor] = useState(bucket?.color ?? '#4E73DF');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isEdit = !!bucket;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Name is required.');
            return;
        }

        setSaving(true);
        setError('');

        if (isEdit) {
            const res = await updateBucket(bucket.id, {
                name: name.trim(),
                iconName,
                color,
            });
            if (!res.success) {
                setError(res.error || 'Failed to update bucket.');
                setSaving(false);
                return;
            }
        } else {
            const res = await createBucket(name.trim(), color, iconName);
            if (!res.success) {
                setError(res.error || 'Failed to create bucket.');
                setSaving(false);
                return;
            }
        }

        router.refresh();
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{isEdit ? 'Edit Bucket' : 'New Bucket'}</h2>
                    <button className={styles.closeBtn} onClick={onClose} type="button">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <p className={styles.error}>{error}</p>}

                    <label className={styles.label}>
                        Name
                        <input
                            className={styles.input}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Health, Career, Family"
                            autoFocus
                            maxLength={50}
                        />
                    </label>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Icon</span>
                        <div className={styles.iconGrid}>
                            {ICON_OPTIONS.map(({ name: iName, Icon }) => (
                                <button
                                    key={iName}
                                    type="button"
                                    className={`${styles.iconBtn} ${iconName === iName ? styles.iconActive : ''}`}
                                    onClick={() => setIconName(iName)}
                                >
                                    <Icon size={20} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Color</span>
                        <div className={styles.colorGrid}>
                            {COLOR_OPTIONS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`${styles.colorBtn} ${color === c ? styles.colorActive : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.saveBtn} disabled={saving}>
                            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Bucket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
