'use client';

import { useCallback, useRef } from 'react';

const COLORS = ['#6C63FF', '#FF6584', '#43B581', '#FAA61A', '#F57C00', '#26A69A'];
const PARTICLE_COUNT = 120;
const DURATION = 3000;
const FADE_START = DURATION - 800;

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    color: string;
    gravity: number;
    drag: number;
    rotation: number;
    rotationSpeed: number;
}

function createParticle(originX: number, originY: number): Particle {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        w: 4 + Math.random() * 4,
        h: 6 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        gravity: 0.12 + Math.random() * 0.06,
        drag: 0.98 + Math.random() * 0.015,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
    };
}

export function useConfetti() {
    const activeRef = useRef(false);

    const fire = useCallback(() => {
        if (activeRef.current) return;
        activeRef.current = true;

        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d')!;
        const w = canvas.width;
        const h = canvas.height;

        const particles: Particle[] = [];
        const originY = h * 0.5;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const originX = i < PARTICLE_COUNT / 2 ? w * 0.25 : w * 0.75;
            particles.push(createParticle(originX, originY));
        }

        const start = performance.now();

        function frame(now: number) {
            const elapsed = now - start;
            if (elapsed > DURATION) {
                canvas.remove();
                activeRef.current = false;
                return;
            }

            ctx.clearRect(0, 0, w, h);

            const globalAlpha = elapsed > FADE_START
                ? 1 - (elapsed - FADE_START) / 800
                : 1;

            for (const p of particles) {
                p.vy += p.gravity;
                p.vx *= p.drag;
                p.vy *= p.drag;
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;

                ctx.save();
                ctx.globalAlpha = globalAlpha;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }

            requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }, []);

    return { fire };
}
