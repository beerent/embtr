'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

import { signIn } from '@/server/auth/actions';
import styles from './SignInForm.module.css';

function getOAuthError(code: string | null): string | null {
    switch (code) {
        case 'twitch_denied':
            return 'Twitch authorization was denied.';
        case 'twitch_csrf':
            return 'Security check failed. Please try again.';
        case 'twitch_error':
            return 'Twitch login failed. Please try again.';
        case 'twitch_invalid':
            return 'Invalid Twitch response. Please try again.';
        default:
            return null;
    }
}

const FormContent = () => {
    const searchParams = useSearchParams();
    const oauthError = getOAuthError(searchParams.get('error'));
    const [error, setError] = useState(oauthError || '');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const login = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setSuccess(false);

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        try {
            const result = await signIn(username, password);

            if (!result.success) {
                setError(result.error || 'Unable to sign in.');
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
            setError('Unable to sign in. Please try again.');
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

            <form className={styles.form} onSubmit={login}>
                <div className={styles.field}>
                    <label htmlFor="signin-username" className={styles.label}>
                        Username
                    </label>
                    <input
                        type="text"
                        className={styles.input}
                        name="username"
                        id="signin-username"
                        placeholder="username"
                        required
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="signin-password" className={styles.label}>
                        Password
                    </label>
                    <div className={styles.passwordGroup}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className={styles.input}
                            name="password"
                            id="signin-password"
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

                {loading ? (
                    <button type="submit" className={styles.button} disabled>
                        <span className={styles.spinner}></span>
                        Sign In
                    </button>
                ) : success ? (
                    <button type="submit" className={`${styles.button} ${styles.buttonSuccess}`} disabled>
                        <Check size={18} />
                        Welcome!
                    </button>
                ) : (
                    <button type="submit" className={styles.button}>
                        Sign In
                    </button>
                )}
            </form>
        </>
    );
};

export const SignInForm = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FormContent />
        </Suspense>
    );
};
