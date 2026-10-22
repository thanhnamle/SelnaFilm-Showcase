import { X } from 'lucide-react';
import { useI18n } from '@/i18n';
import Dialog from './Dialog';

/** The YouTube iframe only exists while the dialog is open, so pages stay light. */
export default function TrailerDialog({ videoKey, open, onClose }: { videoKey?: string; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Dialog open={open && Boolean(videoKey)} onClose={onClose} label={t('common.trailer')} className="max-w-5xl">
      <div className="relative overflow-hidden rounded-panel border border-line bg-black shadow-2xl">
        <div className="aspect-video">
          <iframe
            className="size-full"
            src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`}
            title={t('common.trailer')}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
        >
          <X className="size-4" />
        </button>
      </div>
    </Dialog>
  );
}
