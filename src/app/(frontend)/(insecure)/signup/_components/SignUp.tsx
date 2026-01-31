'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

import { signUp } from '@/server/auth/actions';
import { TwitchButton } from '@/app/_components/TwitchButton';
import styles from './SignUp.module.css';

function SignUpForm() {
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setSuccess(false);

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirm-password') as string;
        const displayName = (formData.get('display-name') as string) || undefined;

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            const result = await signUp(username, password, displayName);

            if (!result.success) {
                setError(result.error || 'Registration failed.');
                setLoading(false);
                return;
            }

            setLoading(false);
            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
                router.refresh();
            }, 500);
        } catch (err) {
            setError('Registration failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <>
            {error && (
                <div className={styles.alert}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <form className={styles.form} onSubmit={handleSignUp}>
                <div className={styles.field}>
                    <label htmlFor="signup-username" className={styles.label}>
                        Username
                    </label>
                    <input
                        type="text"
                        className={styles.input}
                        name="username"
                        id="signup-username"
                        placeholder="username"
                        required
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="signup-display-name" className={styles.label}>
                        Display Name <span className={styles.labelOptional}>(optional)</span>
                    </label>
                    <input
                        type="text"
                        className={styles.input}
                        name="display-name"
                        id="signup-display-name"
                        placeholder="Your name"
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="signup-password" className={styles.label}>
                        Password
                    </label>
                    <div className={styles.passwordGroup}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className={styles.input}
                            name="password"
                            id="signup-password"
                            placeholder="password"
                            required
                        />
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className={styles.field}>
                    <label htmlFor="signup-confirm-password" className={styles.label}>
                        Confirm Password
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        className={styles.input}
                        name="confirm-password"
                        id="signup-confirm-password"
                        placeholder="confirm password"
                        required
                    />
                </div>

                {loading ? (
                    <button type="submit" className={styles.button} disabled>
                        <span className={styles.spinner}></span>
                        Sign Up
                    </button>
                ) : success ? (
                    <button type="submit" className={`${styles.button} ${styles.buttonSuccess}`} disabled>
                        <Check size={18} />
                        Welcome!
                    </button>
                ) : (
                    <button type="submit" className={styles.button}>
                        Sign Up
                    </button>
                )}
            </form>
        </>
    );
}

export function SignUp() {
    return (
        <div className={styles.page}>
            <div className={styles.logoGroup}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" className={styles.logoStar} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/embtr-title.svg" alt="embtr" className={styles.logoWordmark} />
            </div>

            <div className={styles.card}>
                <p className={styles.title}>Sign Up</p>
                <p className={styles.subtitle}>
                    Create an account to start building better habits.
                </p>

                <Suspense fallback={<div>Loading...</div>}>
                    <SignUpForm />
                </Suspense>

                <div className={styles.divider}>
                    <span className={styles.dividerText}>or</span>
                </div>

                <TwitchButton label="Sign up with Twitch" />
            </div>

            <div className={styles.footer}>
                Already have an account?{' '}
                <Link href="/signin" className={styles.footerLink}>
                    Sign In
                </Link>
            </div>
        </div>
    );
}
