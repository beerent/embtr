import { PageCard } from '../../_components/ui/PageCard';
import styles from './HabitStreaks.module.css';

interface HabitStreak {
    habitId: number;
    habitTitle: string;
    iconColor: string;
    currentStreak: number;
    longestStreak: number;
}

interface Props {
    streaks: HabitStreak[];
}

export function HabitStreaks({ streaks }: Props) {
    if (streaks.length === 0) {
        return (
            <PageCard>
                <h3 className={styles.title}>Habit Streaks</h3>
                <p className={styles.empty}>No habit streaks yet. Start completing habits!</p>
            </PageCard>
        );
    }

    return (
        <PageCard>
            <h3 className={styles.title}>Habit Streaks</h3>
            <div className={styles.list}>
                {streaks.map((streak) => {
                    const progress =
                        streak.longestStreak > 0
                            ? (streak.currentStreak / streak.longestStreak) * 100
                            : 0;
                    return (
                        <div key={streak.habitId} className={styles.item}>
                            <div className={styles.header}>
                                <div className={styles.name}>
                                    <span
                                        className={styles.dot}
                                        style={{ backgroundColor: streak.iconColor }}
                                    />
                                    {streak.habitTitle}
                                </div>
                                <div className={styles.numbers}>
                                    <span className={styles.current}>
                                        {streak.currentStreak}d
                                    </span>
                                    <span className={styles.separator}>/</span>
                                    <span className={styles.longest}>
                                        {streak.longestStreak}d best
                                    </span>
                                </div>
                            </div>
                            <div className={styles.barTrack}>
                                <div
                                    className={styles.barFill}
                                    style={{
                                        width: `${Math.min(progress, 100)}%`,
                                        backgroundColor: streak.iconColor,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </PageCard>
    );
}
