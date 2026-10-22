import { useI18n } from '@/i18n';
import type { Details } from '@/lib/queries';
import { img } from '@/lib/media';

const money = (value?: number) => (value ? `$${(value / 1_000_000).toFixed(1)}M` : undefined);

export function useRuntimeLabel() {
  const { t } = useI18n();
  return (minutes?: number) => {
    if (!minutes) return undefined;
    return minutes >= 60 ? t('common.hoursMinutes', { h: Math.floor(minutes / 60), m: minutes % 60 }) : t('common.minutes', { n: minutes });
  };
}

export default function InfoPanel({ details }: { details: Details }) {
  const { t } = useI18n();
  const runtime = useRuntimeLabel();
  const { media } = details;

  const rows = [
    [t('detail.status'), details.status],
    [t('detail.runtime'), runtime(details.runtime)],
    [media.type === 'movie' ? t('detail.release') : t('detail.firstAir'), media.year],
    [t('detail.country'), details.country],
    [t('detail.studio'), details.studio],
    [t('detail.budget'), money(details.budget)],
    [t('detail.revenue'), money(details.revenue)],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const providers = [...(details.providers?.flatrate ?? []), ...(details.providers?.free ?? []), ...(details.providers?.ads ?? [])];

  return (
    <aside className="space-y-6">
      <div className="rounded-panel border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-bold tracking-wider text-subtle uppercase">{t('detail.info')}</h2>
        <dl className="space-y-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {details.genres.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5 border-t border-line pt-4">
            {details.genres.map((g) => (
              <span key={g.id} className="rounded-full bg-white/6 px-2.5 py-1 text-xs text-muted">
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {providers.length > 0 && (
        <div className="rounded-panel border border-line bg-surface p-5">
          <h2 className="mb-4 text-sm font-bold tracking-wider text-subtle uppercase">{t('detail.providers')}</h2>
          <div className="flex flex-wrap gap-2.5">
            {providers.slice(0, 8).map((p) => (
              <a
                key={p.provider_id}
                href={details.providers?.link}
                target="_blank"
                rel="noreferrer"
                title={p.provider_name}
                className="size-11 overflow-hidden rounded-xl ring-1 ring-line transition-transform hover:scale-105"
              >
                <img src={img(p.logo_path, 'w92')} alt={p.provider_name} className="size-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
