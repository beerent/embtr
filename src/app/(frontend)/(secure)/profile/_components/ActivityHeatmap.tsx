import { PageCard } from '../../_components/ui/PageCard';
import styles from './ActivityHeatmap.module.css';

interface Props {
    dailyScores: { date: string; score: number }[];
}

function getColor(score: number): string {
    if (score <= 25) return '#c62828';
    if (score <= 50) return '#f9a825';
    if (score <= 75) return '#7cb342';
    return '#25b24a';
}

export function ActivityHeatmap({ dailyScores }: Props) {
    const scoreMap = new Map<string, number>();
    for (const { date, score } of dailyScores) {
        scoreMap.set(date, score);
    }

    const today = new Date();
    const dayOfWeek = today.getDay();
    // Adjust so Monday = 0, Sunday = 6
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Start on Monday, 14 full weeks before the current week's Monday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysFromMonday - 14 * 7);

    // Generate all days from start to today
    const days: { dateStr: string; score: number }[] = [];
    const current = new Date(startDate);

    while (current <= today) {
        const dateStr = current.toISOString().split('T')[0];
        days.push({
            dateStr,
            score: scoreMap.get(dateStr) ?? -1,
        });
        current.setDate(current.getDate() + 1);
    }

    const numWeeks = Math.ceil(days.length / 7);
    const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

    return (
        <PageCard>
            <h3 className={styles.title}>Activity</h3>
            <div className={styles.wrapper}>
                <div className={styles.dayLabels}>
                    {dayLabels.map((label, i) => (
                        <span key={i} className={styles.dayLabel}>
                            {label}
                        </span>
                    ))}
                </div>
                <div
                    className={styles.grid}
                    style={{
                        gridTemplateColumns: `repeat(${numWeeks}, 14px)`,
                    }}
                >
                    {days.map((day) => (
                        <div
                            key={day.dateStr}
                            className={`${styles.cell} ${day.score === -1 ? styles.empty : ''}`}
                            style={
                                day.score >= 0
                                    ? { backgroundColor: getColor(day.score) }
                                    : undefined
                            }
                            title={`${day.dateStr}: ${day.score === -1 ? 'No data' : `${day.score}%`}`}
                        />
                    ))}
                </div>
            </div>
            <div className={styles.legend}>
                <span className={styles.legendText}>Less</span>
                <div className={`${styles.legendCell} ${styles.empty}`} />
                <div className={styles.legendCell} style={{ backgroundColor: '#c62828' }} />
                <div className={styles.legendCell} style={{ backgroundColor: '#f9a825' }} />
                <div className={styles.legendCell} style={{ backgroundColor: '#7cb342' }} />
                <div className={styles.legendCell} style={{ backgroundColor: '#25b24a' }} />
                <span className={styles.legendText}>More</span>
            </div>
        </PageCard>
    );
}
