import Link from 'next/link';

import { SignInForm } from './SignInForm';
import { TwitchButton } from '@/app/_components/TwitchButton';
import styles from './SignIn.module.css';

function SignIn() {
    return (
        <div className={styles.page}>
            <div className={styles.logoGroup}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" className={styles.logoStar} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/embtr-title.svg" alt="embtr" className={styles.logoWordmark} />
            </div>

            <div className={styles.card}>
                <p className={styles.title}>Sign In</p>
                <p className={styles.subtitle}>
                    Welcome back! Sign in to continue your journey.
                </p>

                <SignInForm />

                <div className={styles.divider}>
                    <span className={styles.dividerText}>or</span>
                </div>

                <TwitchButton label="Sign in with Twitch" />
            </div>

            <div className={styles.footer}>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className={styles.footerLink}>
                    Sign Up
                </Link>
            </div>
        </div>
    );
}

export default SignIn;
