'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, PanelLeftClose, Sun, Moon, User, Settings, LogOut, Bug } from 'lucide-react';

import { SessionStore } from '@/client/store/SessionStore';
import useThemeStore from '@/client/store/ThemeStore';
import { signOut } from '@/server/auth/actions';
import styles from './ModernHeader.module.css';

interface ModernHeaderProps {
    onToggleSidebar: () => void;
    isSidebarCollapsed: boolean;
}

function useDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
    const close = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    return { isOpen, toggle, close, ref };
}

const ModernHeader: React.FC<ModernHeaderProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
    const { dataThemeMode, setOption } = useThemeStore();
    const router = useRouter();

    const [isSigningOut, setIsSigningOut] = useState(false);

    const profileDropdown = useDropdown();

    const { user } = SessionStore.useStore();

    const photoUrl = user?.photoUrl;

    const logout = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isSigningOut) return;

        try {
            setIsSigningOut(true);
            await signOut();
            router.push('/signin');
            router.refresh();
        } catch (error) {
            console.error('Sign-out failed:', error);
            setIsSigningOut(false);
        }
    };

    const toggleDark = () => {
        const newThemeMode = dataThemeMode === 'dark' ? 'light' : 'dark';
        setOption('dataThemeMode', newThemeMode);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme-mode', dataThemeMode);
    }, [dataThemeMode]);

    const dropdownClass = [
        styles.dropdown,
        profileDropdown.isOpen ? styles.dropdownOpen : '',
    ].filter(Boolean).join(' ');

    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <div className={styles.left}>
                    <Link href="/today" className={styles.logo}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/embtr-title.svg" alt="embtr" className={styles.logoImage} />
                    </Link>

                    <button className={styles.toggle} onClick={onToggleSidebar} aria-label="Toggle sidebar">
                        {isSidebarCollapsed ? <Menu size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </div>

                <div className={styles.right}>
                    <button
                        className={styles.action}
                        onClick={toggleDark}
                        title={dataThemeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {dataThemeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <Link href="/bugs" className={styles.action} title="Bug Reports">
                        <Bug size={20} />
                    </Link>

                    <div className={dropdownClass} ref={profileDropdown.ref}>
                        <button className={styles.profileButton} onClick={profileDropdown.toggle}>
                            <div className={styles.avatar}>
                                <span className={styles.avatarInner}>
                                    {photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            alt="avatar"
                                            src={photoUrl}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        user?.displayName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'
                                    )}
                                </span>
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>
                                    {user?.displayName || user?.username || ''}
                                </span>
                                <span className={styles.userRole}>
                                    @{user?.username || ''}
                                </span>
                            </div>
                        </button>
                        <div className={styles.dropdownMenu}>
                            <Link
                                href="/profile"
                                className={styles.dropdownItem}
                                onClick={profileDropdown.close}
                            >
                                <User size={16} />
                                Profile
                            </Link>
                            <Link
                                href="/settings"
                                className={styles.dropdownItem}
                                onClick={profileDropdown.close}
                            >
                                <Settings size={16} />
                                Settings
                            </Link>

                            <div className={styles.dropdownDivider} />
                            <button className={styles.dropdownItem} onClick={logout} disabled={isSigningOut}>
                                {isSigningOut ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        Signing Out...
                                    </>
                                ) : (
                                    <>
                                        <LogOut size={16} />
                                        Sign Out
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default ModernHeader;
