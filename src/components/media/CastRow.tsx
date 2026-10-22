import { Link } from 'react-router';
import { useI18n } from '@/i18n';
import { img } from '@/lib/media';
import type { CastMember } from '@/types/movie';
import Img from '@/components/ui/Img';

export default function CastRow({ cast, limit = 16 }: { cast: CastMember[]; limit?: number }) {
  const { t, href } = useI18n();
  if (!cast.length) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold tracking-tight sm:text-xl">{t('detail.cast')}</h2>
      <div className="scrollbar-none -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {cast.slice(0, limit).map((person) => (
          <Link key={person.id} to={href(`/person/${person.id}`)} className="group w-24 shrink-0 text-center">
            <div className="mx-auto mb-2 size-20 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line transition-[box-shadow] group-hover:ring-2 group-hover:ring-accent sm:size-24">
              {person.profile_path ? (
                <Img src={img(person.profile_path, 'w185')} alt={person.name} className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-xl font-bold text-subtle">{person.name.charAt(0)}</span>
              )}
            </div>
            <p className="line-clamp-1 text-[13px] font-medium group-hover:text-ink">{person.name}</p>
            <p className="line-clamp-1 text-xs text-subtle">{person.character}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
