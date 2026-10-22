import { create } from 'zustand';

interface Toast {
  id: number;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string) => void;
}

let nextId = 0;

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message) => {
    const id = ++nextId;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
}));

export const toast = (message: string) => useToastStore.getState().push(message);

/** Tiny replacement for a toast library: bottom-centered, stacked, auto-dismissed. */
export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-8">
      {toasts.map((t) => (
        <div key={t.id} className="glass animate-rise rounded-full border border-line px-4 py-2.5 text-sm font-medium shadow-2xl">
          {t.message}
        </div>
      ))}
    </div>
  );
}
