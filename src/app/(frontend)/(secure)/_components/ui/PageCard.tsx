import React from 'react';
import styles from './PageCard.module.css';

interface PageCardProps {
    children: React.ReactNode;
}

export function PageCard({ children }: PageCardProps) {
    return <div className={styles.card}>{children}</div>;
}
