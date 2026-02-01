export type IconName = 'sun' | 'home' | 'list-checks' | 'calendar' | 'globe' | 'trophy' | 'target' | 'users' | 'user' | 'settings' | 'bug';

export interface MenuItem {
    path: string;
    title: string;
    icon: IconName;
    active: boolean;
}

export interface MenuSection {
    title: string;
    adminOnly?: boolean;
    items: MenuItem[];
}

const ALL_SECTIONS: MenuSection[] = [
    {
        title: 'Main',
        items: [
            {
                path: '/today',
                title: 'Today',
                icon: 'sun',
                active: false,
            },
            {
                path: '/habits',
                title: 'Habits',
                icon: 'list-checks',
                active: false,
            },
            {
                path: '/calendar',
                title: 'Calendar',
                icon: 'calendar',
                active: false,
            },
            {
                path: '/timeline',
                title: 'Timeline',
                icon: 'globe',
                active: false,
            },
            {
                path: '/leaderboard',
                title: 'Leaderboard',
                icon: 'trophy',
                active: false,
            },
            {
                path: '/challenges',
                title: 'Challenges',
                icon: 'target',
                active: false,
            },
            {
                path: '/bugs',
                title: 'Bug Reports',
                icon: 'bug',
                active: false,
            },
            {
                path: '/profile',
                title: 'Profile',
                icon: 'user',
                active: false,
            },
        ],
    },
    {
        title: 'Admin',
        adminOnly: true,
        items: [
            {
                path: '/users',
                title: 'Users',
                icon: 'users',
                active: false,
            },
            {
                path: '/challenges/manage',
                title: 'Challenges',
                icon: 'target',
                active: false,
            },
        ],
    },
];

export function getMenuSections(role: string): MenuSection[] {
    return ALL_SECTIONS.filter((section) => !section.adminOnly || role === 'admin');
}
