import { lazy, Suspense } from 'react';
import { useLang } from '../context/LanguageContext';
import { useFetch, useTrackVisit } from '../hooks/useFetch';
import { PageLoader, Section, Spinner } from '../components/ui';

const MonumentMap = lazy(() => import('../components/MonumentMap'));

export default function MapPage() {
  const { t, lang } = useLang();
  const { data, loading } = useFetch(`/monuments?lang=${lang}`, [lang]);
  useTrackVisit('/map', null, lang);

  if (loading) return <PageLoader />;
  const monuments = data?.monuments || [];

  return (
    <Section kicker={t('nav.map')} title={t('home.map')}>
      <Suspense fallback={<div className="flex justify-center py-24"><Spinner /></div>}>
        <MonumentMap monuments={monuments} height="70vh" />
      </Suspense>
      <p className="mt-4 text-center text-sm text-ink-muted">
        {monuments.length} {t('nav.monuments').toLowerCase()}
      </p>
    </Section>
  );
}
