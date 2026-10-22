import { Check, Plus } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { MediaItem } from '@/lib/media';
import { useMyListStore } from '@/store/useMyListStore';
import { buttonClass } from './button';
import { toast } from './Toaster';

export default function MyListButton({ item, compact }: { item: MediaItem; compact?: boolean }) {
  const { t } = useI18n();
  const inList = useMyListStore((s) => s.items.some((m) => m.type === item.type && m.id === item.id));
  const toggle = useMyListStore((s) => s.toggle);
  const Icon = inList ? Check : Plus;

  const onClick = () => {
    const added = toggle(item);
    toast(added ? t('common.added') : t('common.removed'));
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={inList}
        aria-label={inList ? t('common.inList') : t('common.addToList')}
        className={buttonClass('secondary', 'icon')}
      >
        <Icon className="size-5" />
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={inList} className={buttonClass('secondary', 'lg')}>
      <Icon className="size-5" />
      {inList ? t('common.inList') : t('common.addToList')}
    </button>
  );
}
