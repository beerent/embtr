export type IconName = 'sun' | 'home' | 'list-checks' | 'calendar' | 'globe' | 'user' | 'settings';

export interface MenuItem {
    path: string;
    title: string;
    icon: IconName;
    active: boolean;
}

export interface MenuSection {
    title: string;
    items: MenuItem[];
}

export const MENU_SECTIONS: MenuSection[] = [
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
                path: '/profile',
                title: 'Profile',
                icon: 'user',
                active: false,
            },
        ],
    },
];
