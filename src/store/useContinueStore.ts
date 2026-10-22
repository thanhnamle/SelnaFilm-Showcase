import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaItem, MediaType } from '@/lib/media';

export interface ContinueEntry {
  media: MediaItem;
  season?: number;
  episode?: number;
  position: number;
  duration: number;
  /** Position was estimated (embed player), not reported by our own player. */
  estimated?: boolean;
  updatedAt: number;
}

const keyOf = (type: MediaType, id: number) => `${type}:${id}`;
const MAX_ENTRIES = 30;

interface ContinueState {
  entries: Record<string, ContinueEntry>;
  get: (type: MediaType, id: number) => ContinueEntry | undefined;
  save: (entry: Omit<ContinueEntry, 'updatedAt'>) => void;
  remove: (type: MediaType, id: number) => void;
  clear: () => void;
}

export const useContinueStore = create<ContinueState>()(
  persist(
    (set, get) => ({
      entries: {},
      get: (type, id) => get().entries[keyOf(type, id)],
      save: (entry) => {
        const key = keyOf(entry.media.type, entry.media.id);
        const finished = !entry.estimated && entry.duration > 0 && entry.position / entry.duration > 0.95;
        const entries = { ...get().entries };
        // A finished movie leaves the row; a finished episode stays so the show can be resumed.
        if (finished && entry.media.type === 'movie') delete entries[key];
        else entries[key] = { ...entry, updatedAt: Date.now() };

        const sorted = Object.entries(entries).sort(([, a], [, b]) => b.updatedAt - a.updatedAt);
        set({ entries: Object.fromEntries(sorted.slice(0, MAX_ENTRIES)) });
      },
      remove: (type, id) => {
        const entries = { ...get().entries };
        delete entries[keyOf(type, id)];
        set({ entries });
      },
      clear: () => set({ entries: {} }),
    }),
    { name: 'selna-continue', partialize: (s) => ({ entries: s.entries }) },
  ),
);

export const sortedEntries = (entries: Record<string, ContinueEntry>) =>
  Object.values(entries).sort((a, b) => b.updatedAt - a.updatedAt);
