import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { cn, formatRating } from '@/lib/utils';

export default function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-semibold tabular-nums', className)}>
      <Star className="size-[0.95em] fill-star text-star" />
      {formatRating(value)}
    </span>
  );
}

/** "★ 8.4 · 2024 · Action · Drama" */
export function MetaLine({ items, className }: { items: (ReactNode | undefined | false)[]; className?: string }) {
  const parts = items.filter(Boolean);
  return (
    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted', className)}>
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="size-1 rounded-full bg-subtle" aria-hidden />}
          {part}
        </span>
      ))}
    </div>
  );
}
