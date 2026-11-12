import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { lazy, Suspense, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { useFetch, useTrackVisit } from '../hooks/useFetch';
import { mediaUrl } from '../lib/api';
import MonumentCard from '../components/MonumentCard';
import { Attribution, FadeIn, PageLoader, Section, Spinner } from '../components/ui';

const MonumentMap = lazy(() => import('../components/MonumentMap'));
const ModelViewer = lazy(() => import('../components/ModelViewer'));

export default function HomePage() {
  const { t, lang } = useLang();
  const { data: monumentsData, loading: mLoading } = useFetch(`/monuments?lang=${lang}`, [lang]);
  const { data: contentData, loading: cLoading } = useFetch(`/content?lang=${lang}`, [lang]);
  useTrackVisit('/', null, lang);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.35]);

  if (mLoading || cLoading) return <PageLoader />;

  const monuments = monumentsData?.monuments || [];
  const content = contentData?.content || {};
  const siteImages = contentData?.siteImages || [];
  const hero = siteImages[0];
  const featured = [...monuments].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 6);
  const explore3d = monuments.slice(0, 3);

  return (
    <>
      <section ref={heroRef} className="relative min-h-[88vh] overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0">
          {hero?.url ? (
            <img
              src={mediaUrl(hero.url)}
              alt="Prizren"
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          ) : (
            <div className="h-full w-full bg-ink" />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-hero-veil" />
        <motion.div style={{ opacity }} className="relative z-10 flex min-h-[88vh] items-end pb-20 pt-28">
          <div className="container-page max-w-4xl text-white">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-gold-light"
            >
              Kosovo · Prizren
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl"
            >
              {content['hero.title'] || t('brand')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg"
            >
              {content['hero.subtitle']}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link to="/monuments" className="btn-primary">
                {t('common.explore')}
              </Link>
              <Link to="/map" className="btn border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20">
                {t('nav.map')}
              </Link>
            </motion.div>
            {hero && (
              <div className="mt-8">
                <Attribution
                  author={hero.author}
                  license={hero.license}
                  licenseUrl={hero.licenseUrl}
                  sourceUrl={hero.sourceUrl}
                  className="!text-white/55"
                />
              </div>
            )}
          </div>
        </motion.div>
      </section>

      <Section kicker={t('nav.monuments')} title={t('home.featured')} intro={content['monuments.intro']}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((m, i) => (
            <MonumentCard key={m.id} monument={m} index={i} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/monuments" className="btn-secondary">
            {t('home.viewAll')}
          </Link>
        </div>
      </Section>

      <Section id="history" kicker={t('nav.history')} title={t('home.history')} intro={content['history.intro']} className="bg-sand-deep/40">
        <div className="relative mx-auto max-w-3xl">
          <div className="absolute bottom-0 left-4 top-0 w-px bg-gold/40 sm:left-1/2" />
          <div className="space-y-8">
            {(contentData?.timeline || []).map((item, i) => (
              <FadeIn key={item.id} delay={i * 0.03} className={`relative flex ${i % 2 ? 'sm:justify-end' : 'sm:justify-start'}`}>
                <div className="card ml-10 w-full p-5 sm:ml-0 sm:w-[calc(50%-1.5rem)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-dark">{item.whenLabel}</p>
                  <h3 className="mt-1 font-display text-xl text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
                  {item.monumentSlug && (
                    <Link to={`/monuments/${item.monumentSlug}`} className="mt-3 inline-block text-sm text-gold-dark hover:underline">
                      {t('home.openMonument')} →
                    </Link>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      <Section kicker="3D" title={t('home.explore3d')} intro={content['explore3d.intro']}>
        <Suspense fallback={<div className="flex justify-center py-16"><Spinner /></div>}>
          <div className="grid gap-6 lg:grid-cols-3">
            {explore3d.map((m) => (
              <FadeIn key={m.id}>
                <ModelViewer archetype={m.modelArchetype} className="mb-3" />
                <h3 className="font-display text-lg">{m.name}</h3>
                <p className="mt-1 text-xs text-amber-800/80">{t('home.schematicNote')}</p>
                <Link to={`/monuments/${m.slug}`} className="mt-2 inline-block text-sm text-gold-dark hover:underline">
                  {t('common.learnMore')} →
                </Link>
              </FadeIn>
            ))}
          </div>
        </Suspense>
        <div className="mt-8 text-center">
          <Link to="/explore-3d" className="btn-secondary">{t('nav.explore3d')}</Link>
        </div>
      </Section>

      <Section kicker={t('nav.map')} title={t('home.map')} intro={content['map.intro']} className="bg-sand-deep/30">
        <Suspense fallback={<div className="flex justify-center py-16"><Spinner /></div>}>
          <MonumentMap monuments={monuments} height="520px" />
        </Suspense>
      </Section>

      <Section kicker={t('home.events')} title={t('home.events')} intro={content['activities.intro']}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-display text-2xl">{t('home.events')}</h3>
            {(contentData?.events || []).map((e) => (
              <article key={e.id} className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-dark">{e.whenLabel}</p>
                <h4 className="mt-1 font-display text-xl">{e.title}</h4>
                <p className="mt-2 text-sm text-ink-muted">{e.description}</p>
                {e.linkUrl && (
                  <a href={e.linkUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-gold-dark hover:underline">
                    {e.linkUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </article>
            ))}
          </div>
          <div className="space-y-4">
            <h3 className="font-display text-2xl">{t('home.activities')}</h3>
            {(contentData?.activities || []).map((a) => (
              <article key={a.id} className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-dark">{a.whenLabel}</p>
                <h4 className="mt-1 font-display text-xl">{a.title}</h4>
                <p className="mt-2 text-sm text-ink-muted">{a.description}</p>
                {a.monumentSlug && (
                  <Link to={`/monuments/${a.monumentSlug}`} className="mt-3 inline-block text-sm text-gold-dark hover:underline">
                    {t('home.openMonument')} →
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
