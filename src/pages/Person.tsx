import { useState } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { personQuery } from '@/lib/queries';
import { img } from '@/lib/media';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import Img from '@/components/ui/Img';
import MediaGrid from '@/components/media/MediaGrid';
import { PAGE_X } from '@/components/media/MediaRow';

export default function Person() {
  const { id = '' } = useParams();
  const { t, locale } = useI18n();
  const { data, isPending, error } = useQuery(personQuery(locale, id));
  const [expanded, setExpanded] = useState(false);
  useDocumentTitle(data?.person.name);

  if (error) throw error;

  if (isPending || !data) {
    return (
      <div className={cn('mx-auto flex max-w-[1680px] gap-10 pt-28', PAGE_X)}>
        <div className="skeleton hidden aspect-[2/3] w-64 rounded-panel md:block" />
        <div className="flex-1 space-y-4">
          <div className="skeleton h-10 w-72 rounded-xl" />
          <div className="skeleton h-32 w-full max-w-2xl rounded-xl" />
        </div>
      </div>
    );
  }

  const { person, credits } = data;
  const facts = [
    [t('person.department'), person.known_for_department],
    [t('person.born'), person.birthday],
    [t('person.died'), person.deathday],
    [t('person.birthplace'), person.place_of_birth],
  ].filter((f): f is [string, string] => Boolean(f[1]));
  const longBio = person.biography.length > 600;

  return (
    <div className={cn('mx-auto max-w-[1680px] pt-24 sm:pt-28', PAGE_X)}>
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">
        <div className="w-44 shrink-0 md:w-64">
          <div className="aspect-[2/3] overflow-hidden rounded-panel bg-surface-2 ring-1 ring-line">
            {person.profile_path && <Img priority src={img(person.profile_path, 'h632')} alt={person.name} className="size-full object-cover" />}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{person.name}</h1>
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-subtle">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-8 mb-2 font-bold">{t('person.biography')}</h2>
          <p className={cn('max-w-3xl text-[15px] leading-relaxed whitespace-pre-line text-muted', !expanded && longBio && 'line-clamp-6')}>
            {person.biography || t('person.noBio')}
          </p>
          {longBio && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-2 text-sm font-semibold text-accent hover:underline">
              {expanded ? t('person.readLess') : t('person.readMore')}
            </button>
          )}
        </div>
      </div>

      {credits.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-lg font-bold tracking-tight sm:text-xl">
            {t('person.knownFor')} <span className="text-subtle">· {credits.length}</span>
          </h2>
          <MediaGrid items={credits.map((c) => c.media)} />
        </section>
      )}
    </div>
  );
}
