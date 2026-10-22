import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { detailsQuery } from '@/lib/queries';
import type { MediaItem } from '@/lib/media';

/** Warms the detail page while the pointer rests on a card, so opening it feels instant. */
export function usePrefetchDetails(item: Pick<MediaItem, 'type' | 'id'>) {
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onPointerEnter = useCallback(() => {
    timer.current = setTimeout(() => {
      void queryClient.prefetchQuery(detailsQuery(locale, item.type, item.id));
    }, 250);
  }, [queryClient, locale, item.type, item.id]);

  const onPointerLeave = useCallback(() => clearTimeout(timer.current), []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return { onPointerEnter, onPointerLeave };
}
