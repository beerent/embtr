'use client';

import { CalendarDays, CalendarRange, Calendar } from 'lucide-react';
import styles from './ViewSwitcher.module.css';

export type CalendarView = 'month' | 'week' | 'day';

interface ViewSwitcherProps {
    currentView: CalendarView;
    onViewChange: (view: CalendarView) => void;
}

const VIEWS: { key: CalendarView; label: string; Icon: typeof Calendar }[] = [
    { key: 'month', label: 'Month', Icon: CalendarDays },
    { key: 'week', label: 'Week', Icon: CalendarRange },
    { key: 'day', label: 'Day', Icon: Calendar },
];

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
    return (
        <div className={styles.switcher}>
            {VIEWS.map(({ key, label, Icon }) => (
                <button
                    key={key}
                    className={`${styles.btn} ${currentView === key ? styles.active : ''}`}
                    onClick={() => onViewChange(key)}
                >
                    <Icon size={16} />
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}
