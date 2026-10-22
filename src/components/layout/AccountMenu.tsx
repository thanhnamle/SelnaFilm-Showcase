import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useI18n } from '@/i18n';
import { meQuery } from '@/lib/queries';

/** Cloudflare Access ends the session here, on the app's own hostname. */
const LOGOUT_URL = '/cdn-cgi/access/logout';

/** Avatar + sign-out popover. Hidden when nobody is signed in through Access (e.g. local dev). */
export default function AccountMenu() {
  const { t } = useI18n();
  const { data } = useQuery(meQuery());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const email = data?.email;
  if (!email) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t('nav.account')}
        title={email}
        className="grid size-9 place-items-center rounded-full bg-linear-to-br from-accent to-accent-2 text-sm font-bold text-white uppercase ring-1 ring-white/15 transition-transform hover:scale-105"
      >
        {email[0]}
      </button>

      {open && (
        <div className="absolute top-12 right-0 z-50 w-72 animate-rise rounded-2xl border border-line bg-surface/95 p-2 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-accent to-accent-2 font-bold text-white uppercase">
              {email[0]}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-subtle">{t('nav.signedInAs')}</p>
              <p className="truncate text-sm font-semibold">{email}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <a
            href={LOGOUT_URL}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            <LogOut className="size-4" />
            {t('nav.signOut')}
          </a>
        </div>
      )}
    </div>
  );
}
