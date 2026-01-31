'use client';

interface UserPostBodyProps {
    body: string | null;
}

export function UserPostBody({ body }: UserPostBodyProps) {
    if (!body) return null;

    return (
        <p style={{
            padding: '0 var(--space-lg)',
            fontSize: '0.9375rem',
            color: 'var(--text-primary)',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
        }}>
            {body}
        </p>
    );
}
