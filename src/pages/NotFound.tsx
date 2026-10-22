import { Link } from 'react-router';
import { useI18n } from '@/i18n';
import { buttonClass } from '@/components/ui/button';

export default function NotFound({ message }: { message?: string }) {
  const { t, href } = useI18n();
  return (
    <div className="grid min-h-[80vh] place-items-center px-4 text-center">
      <div>
        <p className="text-gradient text-7xl font-extrabold tracking-tighter">404</p>
        <h1 className="mt-4 text-2xl font-bold">{message ?? t('notFound.title')}</h1>
        <p className="mt-2 text-muted">{t('notFound.desc')}</p>
        <Link to={href('/')} className={buttonClass('primary', 'md', 'mt-8')}>
          {t('notFound.home')}
        </Link>
      </div>
    </div>
  );
}
