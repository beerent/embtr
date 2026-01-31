'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import styles from './CommentMenu.module.css';

interface CommentMenuProps {
    onEdit: () => void;
    onDelete: () => void;
}

export function CommentMenu({ onEdit, onDelete }: CommentMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    return (
        <div className={styles.wrapper} ref={ref}>
            <button
                className={styles.menuBtn}
                onClick={() => setOpen(!open)}
                aria-label="Comment options"
            >
                <MoreHorizontal size={14} />
            </button>

            {open && (
                <div className={styles.dropdown}>
                    <button
                        className={styles.dropdownItem}
                        onClick={() => { setOpen(false); onEdit(); }}
                    >
                        <Pencil size={12} />
                        Edit
                    </button>
                    <button
                        className={`${styles.dropdownItem} ${styles.danger}`}
                        onClick={() => { setOpen(false); onDelete(); }}
                    >
                        <Trash2 size={12} />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
