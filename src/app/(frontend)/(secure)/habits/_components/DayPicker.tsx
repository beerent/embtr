'use client';

import styles from './DayPicker.module.css';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface DayPickerProps {
    selectedDays: number[];
    onChange: (days: number[]) => void;
}

export function DayPicker({ selectedDays, onChange }: DayPickerProps) {
    const toggle = (day: number) => {
        if (selectedDays.includes(day)) {
            onChange(selectedDays.filter((d) => d !== day));
        } else {
            onChange([...selectedDays, day].sort((a, b) => a - b));
        }
    };

    return (
        <div className={styles.row}>
            {DAY_LABELS.map((label, i) => (
                <button
                    key={i}
                    type="button"
                    className={`${styles.dayBtn} ${selectedDays.includes(i) ? styles.active : ''}`}
                    onClick={() => toggle(i)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
