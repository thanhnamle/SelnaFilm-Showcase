import { Link } from 'react-router';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

const STRIP = 'M16.6 6.3C15.2 4.5 12.6 4 10.5 4.7 8.1 5.5 7.2 7.8 8.6 9.6 10 11.3 13.9 11.5 15.6 13.3 17.3 15.1 16.6 17.9 14.3 19 12 20.1 8.9 19.5 7.3 17.6';

/** A film strip curled into an "S" with a little heart — the vector take on public/logo.ico. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative grid size-8 place-items-center rounded-[30%] bg-linear-to-br from-accent to-accent-2',
        'shadow-[0_6px_20px_-6px_var(--color-accent),inset_0_1px_0_rgb(255_255_255/0.35)]',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-3/4" fill="none" aria-hidden>
        <path d={STRIP} stroke="white" strokeWidth="5.2" />
        {/* Sprocket holes, tinted with the theme so they read as cut-outs. */}
        <path d={STRIP} className="stroke-accent" strokeWidth="1.3" strokeDasharray="1.1 1.5" />
        <path fill="white" d="M19.2 3.1c.5-.6 1.5-.3 1.5.5 0 .9-1.5 1.8-1.5 1.8s-1.5-.9-1.5-1.8c0-.8 1-1.1 1.5-.5z" />
      </svg>
    </span>
  );
}

export default function Logo({ className }: { className?: string }) {
  const { href } = useI18n();
  return (
    <Link to={href('/')} className={cn('group flex items-center gap-2.5 select-none', className)} aria-label="SelnaFilm">
      <LogoMark className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-6" />
      <span className="flex items-baseline gap-1.5">
        <span className="font-script text-[25px] leading-none font-bold">Selna</span>
        <span className="text-[10px] font-semibold tracking-[0.28em] text-muted uppercase">film</span>
      </span>
    </Link>
  );
}
