'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { MenuSection } from '../SideMenu';
import ModernHeader from './ModernHeader';
import ModernSidebar from './ModernSidebar';
import styles from './ModernLayout.module.css';

interface ModernLayoutProps {
    children: React.ReactNode;
    menuSections: MenuSection[];
}

const MOBILE_BREAKPOINT = 768;

export const ModernLayout: React.FC<ModernLayoutProps> = ({ children, menuSections }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isMobile && isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    }, [isMobile, isMobileMenuOpen]);

    const toggleSidebar = useCallback(() => {
        if (isMobile) {
            setIsMobileMenuOpen((prev) => !prev);
        } else {
            setIsCollapsed((prev) => !prev);
        }
    }, [isMobile]);

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    const layoutClass = [
        styles.layout,
        isCollapsed ? styles.collapsed : '',
    ].filter(Boolean).join(' ');

    const overlayClass = [
        styles.overlay,
        isMobileMenuOpen ? styles.overlayVisible : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={layoutClass}>
            <ModernHeader onToggleSidebar={toggleSidebar} isSidebarCollapsed={isCollapsed} />

            <div className={overlayClass} onClick={closeMobileMenu} />

            <div className={styles.wrapper}>
                <ModernSidebar
                    menuSections={menuSections}
                    isCollapsed={isCollapsed}
                    isMobileOpen={isMobileMenuOpen}
                    onClose={closeMobileMenu}
                />

                <main className={styles.main}>
                    <div className={styles.content}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ModernLayout;
