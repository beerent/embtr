import type { Metadata } from 'next';

import { ModernLayout } from './_components/layout/modern/ModernLayout';
import { getMenuSections } from './_components/layout/SideMenu';

import Providers from '@/app/_provider/Providers';
import '@/app/globals.css';
import { Session } from '@/server/session/Session';

export const metadata: Metadata = {
    title: 'embtr',
    description: 'Build better habits, one day at a time',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await Session.getSession();

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.png" type="image/png" />
                {/* Blocking script to prevent theme flash */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var stored = localStorage.getItem('theme-storage');
                                    if (stored) {
                                        var parsed = JSON.parse(stored);
                                        var state = parsed.state || parsed;
                                        if (state.dataThemeMode) {
                                            document.documentElement.setAttribute('data-theme-mode', state.dataThemeMode);
                                        }
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body>
                <Providers initialUser={session}>
                    <ModernLayout menuSections={getMenuSections(session.role)}>
                        {children}
                    </ModernLayout>
                </Providers>
            </body>
        </html>
    );
}
