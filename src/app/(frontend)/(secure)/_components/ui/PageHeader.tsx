import React from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
    children: React.ReactNode;
}

export function PageHeader({ children }: PageHeaderProps) {
    return <h1 className={styles.header}>{children}</h1>;
}
