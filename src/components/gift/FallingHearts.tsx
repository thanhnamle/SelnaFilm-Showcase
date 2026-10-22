import { useMemo } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Pure-CSS falling hearts; `loop={false}` lets each heart fall once and disappear. */
export default function FallingHearts({ count = 24, loop = true, className }: { count?: number; loop?: boolean; className?: string }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        size: 12 + Math.random() * 22,
        duration: 7 + Math.random() * 6,
        delay: Math.random() * (loop ? 8 : 3),
        sway: 20 + Math.random() * 40,
        alt: i % 3 === 0,
      })),
    [count, loop],
  );

  return (
    <div aria-hidden className={cn('pointer-events-none fixed inset-0 overflow-hidden', className)}>
      {hearts.map((h, i) => (
        <Heart
          key={i}
          className={cn('absolute -top-10 opacity-0', h.alt ? 'fill-accent-2 text-accent-2' : 'fill-accent text-accent')}
          style={{
            left: `${h.left}%`,
            width: h.size,
            height: h.size,
            ['--sway' as string]: `${h.sway}px`,
            animation: `heart-fall ${h.duration}s linear ${h.delay}s ${loop ? 'infinite' : '1'} both`,
          }}
        />
      ))}
    </div>
  );
}
