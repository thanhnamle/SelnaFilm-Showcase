import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaItem, MediaType } from '@/lib/media';

const MAX_QUERIES = 8;
const MAX_TITLES = 10;

interface SearchHistoryState {
  /** Searches the viewer committed to (Enter, "see all", or opening a result), newest first. */
  queries: string[];
  /** Titles opened from search results, newest first. */
  titles: MediaItem[];
  addQuery: (query: string) => void;
  removeQuery: (query: string) => void;
  addTitle: (item: MediaItem) => void;
  removeTitle: (type: MediaType, id: number) => void;
  clear: () => void;
}

const sameQuery = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      queries: [],
      titles: [],
      addQuery: (query) => {
        const q = query.trim().replace(/\s+/g, ' ');
        if (!q) return;
        set({ queries: [q, ...get().queries.filter((old) => !sameQuery(old, q))].slice(0, MAX_QUERIES) });
      },
      removeQuery: (query) => set({ queries: get().queries.filter((old) => old !== query) }),
      addTitle: (item) =>
        set({ titles: [item, ...get().titles.filter((m) => !(m.type === item.type && m.id === item.id))].slice(0, MAX_TITLES) }),
      removeTitle: (type, id) => set({ titles: get().titles.filter((m) => !(m.type === type && m.id === id)) }),
      clear: () => set({ queries: [], titles: [] }),
    }),
    {
      name: 'selna-search-history',
      version: 1,
      partialize: (state) => ({ queries: state.queries, titles: state.titles }),
    },
  ),
);
