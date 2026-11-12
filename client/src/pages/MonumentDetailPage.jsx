import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useFetch, useTrackVisit } from '../hooks/useFetch';
import { api, mediaUrl } from '../lib/api';
import {
  Attribution, EmptyState, ErrorBox, Field, PageLoader, Spinner, Stars, SuccessBox,
} from '../components/ui';

const MonumentMap = lazy(() => import('../components/MonumentMap'));
const ModelViewer = lazy(() => import('../components/ModelViewer'));

export default function MonumentDetailPage() {
  const { slug } = useParams();
  const { t, te, lang } = useLang();
  const { user, isFavorite, isWishlisted, toggleFavorite, toggleWishlist } = useAuth();
  const { data, loading, error } = useFetch(`/monuments/${slug}?lang=${lang}`, [slug, lang]);
  const { data: reviewsData, setData: setReviews } = useFetch(`/monuments/${slug}/reviews`, [slug]);
  const { data: commentsData, setData: setComments } = useFetch(`/monuments/${slug}/comments`, [slug]);
  useTrackVisit(`/monuments/${slug}`, slug, lang);

  const [activeImg, setActiveImg] = useState(0);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => setActiveImg(0), [slug]);

  if (loading) return <PageLoader />;
  if (error || !data?.monument) {
    return (
      <div className="container-page py-16">
        <ErrorBox message={te(error?.code) || t('common.error')} />
        <Link to="/monuments" className="btn-secondary mt-4 inline-flex">{t('common.back')}</Link>
      </div>
    );
  }

  const m = data.monument;
  const images = m.images || [];
  const cover = images[activeImg] || images[0];
  const model = (m.models || []).find((x) => x.isActive) || m.models?.[0];

  const refreshReviews = async () => {
    const { data: d } = await api(`/monuments/${slug}/reviews`);
    setReviews(d);
  };
  const refreshComments = async () => {
    const { data: d } = await api(`/monuments/${slug}/comments`);
    setComments(d);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    try {
      await api(`/monuments/${slug}/reviews`, { method: 'POST', body: { rating, body: reviewBody } });
      setMsg(t('dashboard.saved'));
      setReviewBody('');
      await refreshReviews();
    } catch (ex) {
      setErr(te(ex.code) || te(ex.message));
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    try {
      await api(`/monuments/${slug}/comments`, { method: 'POST', body: { body: commentBody } });
      setMsg(t('dashboard.saved'));
      setCommentBody('');
      await refreshComments();
    } catch (ex) {
      setErr(te(ex.code) || te(ex.message));
    }
  };

  return (
    <div>
      <section className="relative min-h-[52vh] overflow-hidden">
        {cover && (
          <img src={mediaUrl(cover.url)} alt={m.name} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/25" />
        <div className="container-page relative z-10 flex min-h-[52vh] flex-col justify-end pb-10 pt-24 text-white">
          <Link to="/monuments" className="mb-4 text-sm text-white/70 hover:text-gold-light">← {t('nav.monuments')}</Link>
          <span className="badge mb-3 w-fit border-white/20 bg-white/10 text-gold-light">{t(`categories.${m.category}`)}</span>
          <h1 className="font-display text-4xl sm:text-5xl">{m.name}</h1>
          {m.altName && <p className="mt-2 text-white/70">{m.altName}</p>}
          <p className="mt-4 max-w-3xl text-base text-white/85">{m.shortDescription}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {user ? (
              <>
                <button type="button" onClick={() => toggleFavorite(m.id)} className="btn-secondary !bg-white/10 !text-white !border-white/25">
                  {isFavorite(m.id) ? '♥' : '♡'} {t('monuments.favorite')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(m.id, isWishlisted(m.id) ? { remove: true } : {})}
                  className="btn-secondary !bg-white/10 !text-white !border-white/25"
                >
                  {isWishlisted(m.id) ? '★' : '☆'} {t('monuments.wishlist')}
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-secondary !bg-white/10 !text-white !border-white/25">
                {t('monuments.loginToInteract')}
              </Link>
            )}
            <a
              href={`https://www.openstreetmap.org/directions?to=${m.latitude}%2C${m.longitude}#map=16/${m.latitude}/${m.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              {t('common.directions')}
            </a>
          </div>
          {cover && (
            <Attribution className="mt-4 !text-white/50" author={cover.author} license={cover.license} licenseUrl={cover.licenseUrl} sourceUrl={cover.sourceUrl} />
          )}
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <Meta label={t('monuments.period')} value={m.periodLabel} />
            <Meta label={t('monuments.style')} value={m.architecturalStyle} />
            <Meta
              label={t('monuments.rating')}
              value={reviewsData?.summary?.average != null ? `★ ${reviewsData.summary.average} (${reviewsData.summary.count})` : '—'}
            />
          </div>

          <TextBlock title={t('monuments.history')} text={m.history} />
          <TextBlock title={t('monuments.significance')} text={m.significance} />
          <TextBlock title={t('monuments.architecture')} text={m.architecture} />
          <TextBlock title={t('monuments.visitorInfo')} text={m.visitorInfo} />

          {!!images.length && (
            <section>
              <h2 className="font-display text-2xl">{t('monuments.gallery')}</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10">
                <img src={mediaUrl(cover?.url)} alt="" className="max-h-[480px] w-full object-cover" />
              </div>
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={img.id} type="button" onClick={() => setActiveImg(i)} className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImg ? 'border-gold' : 'border-transparent'}`}>
                    <img src={mediaUrl(img.thumb)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
              {cover && <Attribution className="mt-2" author={cover.author} license={cover.license} licenseUrl={cover.licenseUrl} sourceUrl={cover.sourceUrl} />}
            </section>
          )}

          <section>
            <h2 className="font-display text-2xl">{t('monuments.model3d')}</h2>
            <div className="mt-4">
              <Suspense fallback={<div className="flex h-[360px] items-center justify-center"><Spinner /></div>}>
                <ModelViewer model={model} archetype={m.modelArchetype} />
              </Suspense>
            </div>
          </section>

          {(m.sources || []).length > 0 && (
            <section>
              <h2 className="font-display text-2xl">{t('common.sources')}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {m.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-gold-dark hover:underline">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
              {m.heritageReference && <p className="mt-3 text-sm text-ink-muted">{m.heritageReference}</p>}
            </section>
          )}
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div>
            <h2 className="mb-3 font-display text-xl">{t('monuments.location')}</h2>
            <Suspense fallback={<div className="flex h-[280px] items-center justify-center"><Spinner /></div>}>
              <MonumentMap monuments={[m]} focus={m} height="280px" />
            </Suspense>
          </div>

          <div className="card p-5">
            <h2 className="font-display text-xl">{t('monuments.reviews')}</h2>
            <div className="mt-4 space-y-3">
              {(reviewsData?.reviews || []).length === 0 && <EmptyState>{t('common.noResults')}</EmptyState>}
              {(reviewsData?.reviews || []).map((r) => (
                <div key={r.id} className="border-b border-ink/10 pb-3 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{r.author.name}</span>
                    <Stars value={r.rating} size="sm" />
                  </div>
                  {r.body && <p className="mt-1 text-sm text-ink-muted">{r.body}</p>}
                </div>
              ))}
            </div>
            {user ? (
              <form onSubmit={submitReview} className="mt-4 space-y-3 border-t border-ink/10 pt-4">
                <p className="text-sm font-medium">{t('monuments.writeReview')}</p>
                <Stars value={rating} onChange={setRating} />
                <textarea className="input min-h-[80px]" value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} maxLength={1500} />
                <button type="submit" className="btn-primary w-full">{t('common.save')}</button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">{t('monuments.loginToInteract')}</p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-display text-xl">{t('monuments.comments')}</h2>
            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
              {(commentsData?.comments || []).length === 0 && <EmptyState>{t('common.noResults')}</EmptyState>}
              {(commentsData?.comments || []).map((c) => (
                <div key={c.id} className={`rounded-xl bg-sand/80 p-3 ${c.parentId ? 'ml-4' : ''}`}>
                  <p className="text-xs font-medium text-ink">
                    {c.author.name} {c.author.isStaff && <span className="badge ml-1">staff</span>}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{c.body}</p>
                </div>
              ))}
            </div>
            {user ? (
              <form onSubmit={submitComment} className="mt-4 space-y-3 border-t border-ink/10 pt-4">
                <Field label={t('monuments.writeComment')}>
                  <textarea className="input min-h-[80px]" value={commentBody} onChange={(e) => setCommentBody(e.target.value)} required minLength={2} maxLength={1500} />
                </Field>
                <button type="submit" className="btn-primary w-full">{t('common.save')}</button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">{t('monuments.loginToInteract')}</p>
            )}
          </div>

          {msg && <SuccessBox message={msg} />}
          {err && <ErrorBox message={err} />}
        </aside>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value || '—'}</p>
    </div>
  );
}

function TextBlock({ title, text }) {
  if (!text) return null;
  return (
    <section>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="prose-heritage mt-3">
        {String(text).split(/\n\n+/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}
