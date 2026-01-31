'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Session } from '@/client/context/SessionProvider';
import { setHardMode } from '@/server/settings/actions';
import { unlinkTwitch } from '@/server/twitch/actions';
import { TwitchButton } from '@/app/_components/TwitchButton';
import { PageCard } from '../_components/ui/PageCard';
import { PageHeader } from '../_components/ui/PageHeader';
import styles from './Settings.module.css';

function SettingsContent() {
    const { user } = Session.useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const hardMode = user?.hardMode ?? false;
    const twitchStatus = searchParams.get('twitch');
    const twitchError = searchParams.get('error');

    const [unlinking, setUnlinking] = useState(false);
    const [unlinkError, setUnlinkError] = useState('');

    const handleToggle = async () => {
        await setHardMode(!hardMode);
        router.refresh();
    };

    const handleUnlinkTwitch = async () => {
        setUnlinking(true);
        setUnlinkError('');
        const result = await unlinkTwitch();
        setUnlinking(false);
        if (result.success) {
            router.refresh();
        } else {
            setUnlinkError(result.error || 'Failed to unlink.');
        }
    };

    return (
        <div>
            <PageHeader>Settings</PageHeader>
            <PageCard>
                <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                        <span className={styles.settingLabel}>Hard Mode</span>
                        <span className={styles.settingDesc}>
                            Only allow completing tasks for today. Past and future days become read-only.
                        </span>
                    </div>
                    <label className={styles.toggle}>
                        <input
                            type="checkbox"
                            checked={hardMode}
                            onChange={handleToggle}
                        />
                        <span className={styles.slider} />
                    </label>
                </div>
            </PageCard>

            <PageCard>
                <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                        <span className={styles.settingLabel}>Twitch Account</span>
                        <span className={styles.settingDesc}>
                            {user?.hasTwitchLinked
                                ? 'Your Twitch account is linked. You can sign in with Twitch.'
                                : 'Link your Twitch account to sign in with Twitch.'}
                        </span>
                    </div>

                    {user?.hasTwitchLinked ? (
                        <div className={styles.twitchActions}>
                            <span className={styles.linkedBadge}>Linked</span>
                            <button
                                className={styles.unlinkButton}
                                onClick={handleUnlinkTwitch}
                                disabled={unlinking}
                            >
                                {unlinking ? 'Unlinking...' : 'Unlink'}
                            </button>
                        </div>
                    ) : (
                        <TwitchButton label="Link Twitch" href="/auth/twitch/link" />
                    )}
                </div>

                {twitchStatus === 'linked' && (
                    <div className={styles.successMessage}>
                        Twitch account linked successfully!
                    </div>
                )}
                {twitchError === 'twitch_already_linked' && (
                    <div className={styles.errorMessage}>
                        This Twitch account is already linked to another user.
                    </div>
                )}
                {unlinkError && (
                    <div className={styles.errorMessage}>
                        {unlinkError}
                    </div>
                )}
            </PageCard>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SettingsContent />
        </Suspense>
    );
}
