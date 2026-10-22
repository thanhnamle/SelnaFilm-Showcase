import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemePreset {
  id: string;
  accent: string;
  accent2: string;
}

/** Accent pairs; every gradient, focus ring and progress bar follows them. */
export const THEMES: ThemePreset[] = [
  { id: 'twilight', accent: '#8b6cff', accent2: '#ff7ab6' },
  { id: 'rose', accent: '#ff5c8a', accent2: '#ffa3c4' },
  { id: 'sakura', accent: '#f49ac1', accent2: '#ffd1dc' },
  { id: 'ocean', accent: '#3b9dff', accent2: '#5ee7df' },
  { id: 'mint', accent: '#2fd39a', accent2: '#b5f5a0' },
  { id: 'sunset', accent: '#ff7a45', accent2: '#ffc86b' },
  { id: 'gold', accent: '#e8b24c', accent2: '#ffe08a' },
  { id: 'lavender', accent: '#a78bfa', accent2: '#c4b5fd' },
];

const DEFAULT = THEMES[0];

export function applyTheme(id: string) {
  const theme = THEMES.find((t) => t.id === id) ?? DEFAULT;
  const root = document.documentElement.style;
  root.setProperty('--color-accent', theme.accent);
  root.setProperty('--color-accent-2', theme.accent2);
}

interface ThemeState {
  theme: string;
  setTheme: (id: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT.id,
      setTheme: (id) => {
        applyTheme(id);
        set({ theme: id });
      },
    }),
    {
      name: 'selna-theme',
      partialize: (s) => ({ theme: s.theme }),
      // Apply the saved accent as soon as storage is read, before the first paint.
      onRehydrateStorage: () => (state) => applyTheme(state?.theme ?? DEFAULT.id),
    },
  ),
);
