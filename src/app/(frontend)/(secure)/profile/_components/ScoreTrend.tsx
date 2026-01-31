import { PageCard } from '../../_components/ui/PageCard';
import styles from './ScoreTrend.module.css';

interface Props {
    dailyScores: { date: string; score: number }[];
}

export function ScoreTrend({ dailyScores }: Props) {
    const last30 = dailyScores.slice(-30);

    if (last30.length < 2) {
        return (
            <PageCard>
                <h3 className={styles.title}>Score Trend</h3>
                <p className={styles.empty}>Not enough data to show a trend yet.</p>
            </PageCard>
        );
    }

    const width = 600;
    const height = 200;
    const pad = { top: 20, right: 20, bottom: 30, left: 40 };

    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    const xStep = chartW / (last30.length - 1);

    const points = last30
        .map((d, i) => {
            const x = pad.left + i * xStep;
            const y = pad.top + chartH - (d.score / 100) * chartH;
            return `${x},${y}`;
        })
        .join(' ');

    // Closed path for area fill
    const firstX = pad.left;
    const lastX = pad.left + (last30.length - 1) * xStep;
    const baseline = pad.top + chartH;
    const areaPath = `M${firstX},${baseline} L${points.split(' ').map((p) => `${p}`).join(' L')} L${lastX},${baseline} Z`;

    const yLines = [25, 50, 75];

    return (
        <PageCard>
            <h3 className={styles.title}>Score Trend</h3>
            <div className={styles.chartContainer}>
                <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart}>
                    <defs>
                        <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {/* Y-axis reference lines */}
                    {yLines.map((v) => {
                        const y = pad.top + chartH - (v / 100) * chartH;
                        return (
                            <g key={v}>
                                <line
                                    x1={pad.left}
                                    y1={y}
                                    x2={width - pad.right}
                                    y2={y}
                                    stroke="var(--glass-border)"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={pad.left - 8}
                                    y={y + 4}
                                    textAnchor="end"
                                    fill="var(--text-secondary)"
                                    fontSize="11"
                                >
                                    {v}
                                </text>
                            </g>
                        );
                    })}

                    {/* Area fill */}
                    <path d={areaPath} fill="url(#scoreFill)" />

                    {/* Line */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {last30.map((d, i) => {
                        const x = pad.left + i * xStep;
                        const y = pad.top + chartH - (d.score / 100) * chartH;
                        return (
                            <circle key={d.date} cx={x} cy={y} r="3" fill="var(--color-primary)" opacity="0.7">
                                <title>{`${d.date}: ${d.score}%`}</title>
                            </circle>
                        );
                    })}

                    {/* X-axis date labels */}
                    {last30.map((d, i) => {
                        if (i % 7 !== 0 && i !== last30.length - 1) return null;
                        const x = pad.left + i * xStep;
                        return (
                            <text
                                key={d.date}
                                x={x}
                                y={height - 5}
                                textAnchor="middle"
                                fill="var(--text-secondary)"
                                fontSize="10"
                            >
                                {d.date.substring(5)}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </PageCard>
    );
}
