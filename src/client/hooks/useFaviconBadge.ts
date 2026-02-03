let cachedImage: HTMLImageElement | null = null;
const CANVAS_SIZE = 64;
const BADGE_COLOR = '#F14E6B';

function getOrCreateLinkElement(): HTMLLinkElement {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    return link;
}

function loadFaviconImage(): Promise<HTMLImageElement> {
    if (cachedImage) return Promise.resolve(cachedImage);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            cachedImage = img;
            resolve(img);
        };
        img.onerror = reject;
        img.src = '/favicon.png';
    });
}

export async function updateFaviconBadge(count: number): Promise<void> {
    const link = getOrCreateLinkElement();

    if (count <= 0) {
        link.href = '/favicon.png';
        return;
    }

    try {
        const img = await loadFaviconImage();
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw original favicon
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Badge circle
        const badgeRadius = 14;
        const cx = CANVAS_SIZE - badgeRadius;
        const cy = badgeRadius;

        ctx.beginPath();
        ctx.arc(cx, cy, badgeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = BADGE_COLOR;
        ctx.fill();

        // Badge text
        const label = count > 99 ? '99+' : String(count);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${label.length > 2 ? 9 : 12}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy + 1);

        link.href = canvas.toDataURL('image/png');
    } catch {
        // Fallback: leave favicon unchanged
    }
}
