import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Heart, Play } from 'lucide-react';
import { useI18n } from '@/i18n';
import { GIFT } from '@/config/gift';
import { dailyMessage, dayPart, daysTogether, occasionOn, today } from '@/lib/gift';
import { cn } from '@/lib/utils';
import { LogoMark } from '@/components/layout/Logo';
import FallingHearts from './FallingHearts';

/** Content fades first, then the two curtain halves slide apart. */
const EXIT_MS = 1150;
const NAME_MARK = '\u0001';

/** Fine film grain, as a tiny inline SVG noise texture. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function Stars({ count = 70 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() < 0.15 ? 2.5 : 1 + Math.random() * 1.2,
        duration: 2.5 + Math.random() * 4,
        delay: Math.random() * -6,
      })),
    [count],
  );
  return (
    <div aria-hidden className="absolute inset-0">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            boxShadow: s.size > 2 ? '0 0 6px 1px rgb(255 255 255 / 0.6)' : undefined,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/** A cinema ticket: the message on the left, a perforated stub with the day counter on the right. */
function Ticket({ message, days, now }: { message: string; days: number | null; now: Date }) {
  const { t, locale } = useI18n();
  const intl = locale === 'vi' ? 'vi-VN' : 'en-US';
  // Half-circle notches where the stub tears off, cut with a mask so the stars show through.
  const notch: CSSProperties = {
    WebkitMaskImage:
      'radial-gradient(circle at var(--nx) 0, transparent 11px, #000 11.5px), radial-gradient(circle at var(--nx) 100%, transparent 11px, #000 11.5px)',
    WebkitMaskComposite: 'source-in',
    maskImage:
      'radial-gradient(circle at var(--nx) 0, transparent 11px, #000 11.5px), radial-gradient(circle at var(--nx) 100%, transparent 11px, #000 11.5px)',
    maskComposite: 'intersect',
  };

  return (
    <div
      className="relative mx-auto mt-10 flex w-full max-w-xl flex-col overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.06] text-left shadow-[0_30px_80px_-30px_var(--color-accent)] backdrop-blur-xl [--nx:-100px] sm:flex-row sm:[--nx:calc(100%-9.5rem)]"
      style={notch}
    >
      <div className="flex-1 px-6 py-6 sm:px-7">
        <p className="text-[10px] font-semibold tracking-[0.3em] text-subtle uppercase">{t('gift.screening')}</p>
        {message && <p className="mt-3 text-[17px] leading-relaxed text-ink/90 text-pretty">{message}</p>}
        {GIFT.from && <p className="mt-3 font-script text-2xl text-accent-2">— {GIFT.from}</p>}
      </div>

      {/* Tear line: dashed, horizontal on phones and vertical beside the stub on wider screens. */}
      <div aria-hidden className="mx-5 border-t-2 border-dashed border-white/15 sm:mx-0 sm:my-4 sm:border-t-0 sm:border-l-2" />

      <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-5 sm:w-38 sm:flex-col sm:justify-center sm:px-4 sm:text-center">
        <p className="text-[10px] font-bold tracking-[0.3em] text-accent-2 uppercase sm:order-first">{t('gift.ticket')}</p>
        {days ? (
          <div className="text-right sm:my-2 sm:text-center">
            <p className="text-gradient text-4xl leading-none font-extrabold tracking-tight tabular-nums">{days.toLocaleString(intl)}</p>
            <p className="mt-1 text-xs text-muted">{t('gift.daysLabel')}</p>
          </div>
        ) : null}
        <div className="hidden text-[11px] leading-relaxed text-subtle sm:block">
          <p>{now.toLocaleDateString(intl, { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          <p>{t('gift.seat')}</p>
        </div>
      </div>
    </div>
  );
}

/** Shown every time the site opens: a private-screening greeting that opens like a curtain. */
export default function WelcomeSplash() {
  const { t } = useI18n();
  const now = useMemo(() => today(), []);
  const occasion = useMemo(() => occasionOn(now), [now]);
  const days = daysTogether(now);
  const [open, setOpen] = useState(true);
  const [closing, setClosing] = useState(false);
  // On special days the hearts keep falling briefly over the site after the splash closes.
  const [afterglow, setAfterglow] = useState(false);

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    if (!afterglow) return;
    const timer = setTimeout(() => setAfterglow(false), 14000);
    return () => clearTimeout(timer);
  }, [afterglow]);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      if (occasion?.effect === 'hearts') setAfterglow(true);
    }, EXIT_MS);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter') && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open) return afterglow ? <FallingHearts loop={false} count={18} className="z-[45]" /> : null;

  const message = occasion?.message ?? dailyMessage(now);
  // Split the localized title around the name so the name can be set in the script face.
  const [before, after] = t('gift.welcomeTitle', { name: NAME_MARK }).split(NAME_MARK);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={occasion?.title ?? t('gift.welcomeTitle', { name: GIFT.name })}
      className="fixed inset-0 z-[60] overflow-hidden"
    >
      {/* Curtains: two halves of the backdrop that slide apart on exit. */}
      {(['left', 'right'] as const).map((side) => (
        <div
          key={side}
          aria-hidden
          className={cn(
            'absolute inset-y-0 w-1/2 bg-canvas transition-transform duration-[900ms] ease-[cubic-bezier(.7,0,.2,1)]',
            side === 'left' ? 'left-0 bg-linear-to-r from-[#0b0912] to-canvas' : 'right-0 bg-linear-to-l from-[#0b0912] to-canvas',
            closing && 'delay-200',
            closing && (side === 'left' ? '-translate-x-full' : 'translate-x-full'),
          )}
        >
          <div className={cn('absolute inset-y-0 w-px bg-white/10', side === 'left' ? 'right-0' : 'left-0', !closing && 'opacity-0')} />
        </div>
      ))}

      {/* Atmosphere: aurora glows, projector beam, stars, grain and a vignette. */}
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 transition-opacity duration-300', closing ? 'opacity-0' : 'animate-fade-in')}
      >
        <div className="absolute -top-1/3 -left-1/4 size-[70vmax] rounded-full bg-accent/20 blur-[120px] [animation:glow-drift_14s_ease-in-out_infinite]" />
        <div className="absolute -right-1/4 -bottom-1/3 size-[60vmax] rounded-full bg-accent-2/15 blur-[120px] [animation:glow-drift_18s_ease-in-out_infinite_reverse]" />
        <div
          className="absolute inset-x-0 top-0 h-[85%] [animation:beam-flicker_6s_ease-in-out_infinite]"
          style={{
            background:
              'conic-gradient(from 180deg at 50% -8%, transparent 158deg, rgb(255 255 255 / 0.07) 172deg, rgb(255 255 255 / 0.11) 180deg, rgb(255 255 255 / 0.07) 188deg, transparent 202deg)',
            maskImage: 'linear-gradient(to bottom, #000 30%, transparent)',
          }}
        />
        <Stars />
        <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(0_0_0/0.65))]" />
      </div>
      {occasion?.effect === 'hearts' && !closing && <FallingHearts />}

      {/* Content */}
      <div
        className={cn(
          'relative h-full overflow-y-auto transition-[opacity,transform,filter] duration-500 ease-out-soft',
          closing && 'scale-[1.04] opacity-0 blur-sm',
        )}
      >
        <div className="mx-auto grid min-h-full w-full max-w-2xl place-items-center px-5 py-10 text-center">
          <div className="w-full">
            <div className="mb-7 flex justify-center [animation:float_5s_ease-in-out_infinite]">
              <LogoMark className="size-14 animate-fade-in shadow-[0_12px_40px_-8px_var(--color-accent),inset_0_1px_0_rgb(255_255_255/0.35)]" />
            </div>
  
            <p className="flex animate-rise items-center justify-center gap-3 text-xs font-semibold tracking-[0.32em] text-muted uppercase">
              <span className="h-px w-8 bg-linear-to-r from-transparent to-white/30" />
              {t(`gift.${dayPart(now)}`)}
              <span className="h-px w-8 bg-linear-to-l from-transparent to-white/30" />
            </p>
  
            {occasion ? (
              <h1 className="mt-5 animate-rise font-script text-5xl leading-tight text-balance text-gradient drop-shadow-[0_4px_30px_var(--color-accent)] [animation-delay:120ms] sm:text-7xl">
                {occasion.title}
              </h1>
            ) : (
              <h1 className="mt-4 animate-rise [animation-delay:120ms]">
                {before?.trim() && <span className="block text-xl font-medium text-ink/80 sm:text-2xl">{before.trim()}</span>}
                <span className="text-gradient block px-4 pt-1 pb-3 font-script text-[clamp(5rem,24vw,8.5rem)] leading-[1.05] drop-shadow-[0_6px_40px_var(--color-accent)]">
                  {GIFT.name}
                </span>
                {after?.trim() && <span className="block text-xl font-medium text-ink/80 sm:text-2xl">{after.trim().replace(/^,\s*/, '')}</span>}
              </h1>
            )}
  
            <div className="animate-rise [animation-delay:240ms]">
              <Ticket message={message} days={days} now={now} />
            </div>
  
            <div className="mt-10 flex animate-rise flex-col items-center gap-3 [animation-delay:360ms]">
              <div className="relative isolate">
                <span aria-hidden className="absolute -inset-1 -z-10 animate-pulse rounded-full bg-linear-to-r from-accent to-accent-2 opacity-60 blur-md" />
                <button
                  type="button"
                  onClick={close}
                  autoFocus
                  className="inline-flex h-14 items-center gap-3 rounded-full bg-white pr-7 pl-2 text-[15px] font-bold text-black shadow-[0_10px_40px_-8px_var(--color-accent)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-linear-to-br from-accent to-accent-2 text-white">
                    <Play className="ml-0.5 size-4 fill-current" />
                  </span>
                  {t('gift.enter')}
                </button>
              </div>
              <p className="hidden items-center gap-1.5 text-xs text-subtle sm:flex">
                <Heart className="size-3 fill-accent-2 text-accent-2" />
                {t('gift.pressEnter')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
