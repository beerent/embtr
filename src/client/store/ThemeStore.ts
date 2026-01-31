import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
    dataThemeMode: string;
    setOption: (key: keyof ThemeStore, value: string) => void;
}

const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            dataThemeMode: 'dark',
            setOption: (key, value) =>
                set(() => ({
                    [key]: value,
                })),
        }),
        {
            name: 'theme-storage',
            partialize: (state) => ({
                dataThemeMode: state.dataThemeMode,
            }),
        }
    )
);

export default useThemeStore;
