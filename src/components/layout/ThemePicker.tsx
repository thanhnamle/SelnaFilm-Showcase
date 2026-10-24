import { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { useI18n } from '@/i18n';
import { THEMES, useThemeStore } from '@/store/useThemeStore';
import { cn } from '@/lib/utils';

/** Navbar popover for choosing the accent color pair. */
export default function ThemePicker() {
  const { t } = useI18n();
  const { theme, setTheme } = useThemeStore();
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t('theme.label')}
        title={t('theme.label')}
        className="grid size-9 place-items-center rounded-full border border-line bg-white/5 text-muted transition-colors hover:border-line-strong hover:text-ink"
      >
        <Palette className="size-4" />
      </button>

      {open && (
        <div className="absolute top-12 right-0 z-50 w-64 animate-rise rounded-2xl border border-line bg-surface/95 p-3 shadow-2xl backdrop-blur-xl">
          <p className="px-1 pb-2.5 text-xs font-semibold tracking-wider text-subtle uppercase">{t('theme.label')}</p>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t('theme.label')}>
            {THEMES.map((preset) => {
              const selected = preset.id === theme;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={t(`theme.presets.${preset.id}` as Parameters<typeof t>[0])}
                  title={t(`theme.presets.${preset.id}` as Parameters<typeof t>[0])}
                  onClick={() => setTheme(preset.id)}
                  className={cn(
                    'grid aspect-square place-items-center rounded-xl ring-offset-2 ring-offset-surface transition-transform hover:scale-105',
                    selected && 'ring-2 ring-white',
                  )}
                  style={{ background: `linear-gradient(135deg, ${preset.accent}, ${preset.accent2})` }}
                >
                  {selected && <Check className="size-4 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 px-1 text-xs text-muted">{t(`theme.presets.${theme}` as Parameters<typeof t>[0])}</p>
        </div>
      )}
    </div>
  );
}
