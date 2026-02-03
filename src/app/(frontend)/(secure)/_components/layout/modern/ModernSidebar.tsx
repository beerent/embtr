'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Sun, Home, ListChecks, Calendar, Globe, Trophy, Target, Users, User, Settings, Bug, Droplets, LucideIcon } from 'lucide-react';

import { IconName, MenuSection } from '../SideMenu';
import styles from './ModernSidebar.module.css';

const ICON_MAP: Record<IconName, LucideIcon> = {
    sun: Sun,
    home: Home,
    'list-checks': ListChecks,
    calendar: Calendar,
    globe: Globe,
    trophy: Trophy,
    target: Target,
    users: Users,
    user: User,
    settings: Settings,
    bug: Bug,
    droplets: Droplets,
};

interface ModernSidebarProps {
    menuSections: MenuSection[];
    isCollapsed: boolean;
    isMobileOpen: boolean;
    onClose?: () => void;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({
    menuSections,
    isCollapsed,
    isMobileOpen,
    onClose,
}) => {
    const currentPath = usePathname();

    useEffect(() => {
        if (onClose) {
            onClose();
        }
    }, [currentPath, onClose]);

    const sections = menuSections.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
            ...item,
            active: currentPath === item.path || currentPath.startsWith(item.path + '/'),
        })),
    }));

    const settingsActive = currentPath === '/settings' || currentPath.startsWith('/settings/');

    const sidebarClass = [
        styles.sidebar,
        isCollapsed ? styles.collapsed : '',
        isMobileOpen ? styles.mobileOpen : '',
    ].filter(Boolean).join(' ');

    const settingsLinkClass = [
        styles.link,
        settingsActive ? styles.linkActive : '',
    ].filter(Boolean).join(' ');

    return (
        <aside className={sidebarClass}>
            <nav className={styles.nav}>
                {sections.map((section) => (
                    <div key={section.title} className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <span>{section.title}</span>
                        </div>
                        <ul className={styles.menu}>
                            {section.items.map((item) => {
                                const Icon = ICON_MAP[item.icon];
                                const linkClass = [
                                    styles.link,
                                    item.active ? styles.linkActive : '',
                                ].filter(Boolean).join(' ');

                                return (
                                    <li key={item.title}>
                                        <Link href={item.path} className={linkClass}>
                                            <Icon className={styles.icon} size={20} />
                                            <span className={styles.label}>{item.title}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className={styles.bottom}>
                <div className={styles.bottomDivider} />
                <Link href="/settings" className={settingsLinkClass}>
                    <Settings className={styles.icon} size={20} />
                    <span className={styles.label}>Settings</span>
                </Link>
            </div>
        </aside>
    );
};

export default ModernSidebar;
