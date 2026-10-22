import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toMedia, type MediaItem, type MediaType, type RawMedia } from '@/lib/media';

interface MyListState {
  items: MediaItem[];
  has: (type: MediaType, id: number) => boolean;
  toggle: (item: MediaItem) => boolean;
  remove: (type: MediaType, id: number) => void;
}

export const useMyListStore = create<MyListState>()(
  persist(
    (set, get) => ({
      items: [],
      has: (type, id) => get().items.some((m) => m.type === type && m.id === id),
      /** Returns true when the item is now in the list. */
      toggle: (item) => {
        if (get().has(item.type, item.id)) {
          get().remove(item.type, item.id);
          return false;
        }
        set({ items: [item, ...get().items] });
        return true;
      },
      remove: (type, id) => set({ items: get().items.filter((m) => !(m.type === type && m.id === id)) }),
    }),
    {
      name: 'selna-my-list', // same key as the Next.js version, so saved lists survive the migration
      version: 1,
      partialize: (state) => ({ items: state.items }),
      migrate: (persisted, version) => {
        // v0 stored raw TMDB objects under `myList`.
        if (version === 0) {
          const old = (persisted as { myList?: RawMedia[] }).myList ?? [];
          return { items: old.map((raw) => toMedia(raw)) };
        }
        return persisted as { items: MediaItem[] };
      },
    },
  ),
);
