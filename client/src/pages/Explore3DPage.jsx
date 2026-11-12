import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useFetch, useTrackVisit } from '../hooks/useFetch';
import { FadeIn, PageLoader, Section, Spinner } from '../components/ui';

const ModelViewer = lazy(() => import('../components/ModelViewer'));

export default function Explore3DPage() {
  const { t, lang } = useLang();
  const { data, loading } = useFetch(`/monuments?lang=${lang}`, [lang]);
  const { data: contentData } = useFetch(`/content?lang=${lang}`, [lang]);
  useTrackVisit('/explore-3d', null, lang);

  if (loading) return <PageLoader />;
  const monuments = data?.monuments || [];

  return (
    <Section kicker="3D" title={t('home.explore3d')} intro={contentData?.content?.['explore3d.intro']}>
      <Suspense fallback={<div className="flex justify-center py-24"><Spinner /></div>}>
        <div className="grid gap-8 md:grid-cols-2">
          {monuments.map((m, i) => (
            <FadeIn key={m.id} delay={Math.min(i * 0.04, 0.24)}>
              <ModelViewer archetype={m.modelArchetype} />
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl">{m.name}</h3>
                  <p className="mt-1 text-xs text-amber-800/80">{t('home.schematicNote')}</p>
                </div>
                <Link to={`/monuments/${m.slug}`} className="btn-secondary shrink-0 !px-3 !py-1.5 text-xs">
                  {t('common.open')}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </Suspense>
    </Section>
  );
}
