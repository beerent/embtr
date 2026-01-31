'use client';

import { useEffect } from 'react';
import styles from './HeartBurst.module.css';

interface HeartBurstProps {
    onComplete: () => void;
}

const PARTICLE_COUNT = 12;
const ANGLE_STEP = (2 * Math.PI) / PARTICLE_COUNT;

function buildParticles() {
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = i * ANGLE_STEP;
        const distance = 18 + Math.random() * 18; // 18–36px
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const delay = Math.random() * 80; // 0–80ms stagger
        particles.push({ tx, ty, delay });
    }
    return particles;
}

const particles = buildParticles();

export function HeartBurst({ onComplete }: HeartBurstProps) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 600);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className={styles.container}>
            {particles.map((p, i) => (
                <span
                    key={i}
                    className={styles.particle}
                    style={{
                        '--tx': `${p.tx}px`,
                        '--ty': `${p.ty}px`,
                        '--delay': `${p.delay}ms`,
                    } as React.CSSProperties}
                >
                    ♥
                </span>
            ))}
        </div>
    );
}
