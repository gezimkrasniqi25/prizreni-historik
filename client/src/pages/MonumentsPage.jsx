import { useMemo, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { useFetch, useTrackVisit } from '../hooks/useFetch';
import MonumentCard from '../components/MonumentCard';
import { EmptyState, PageLoader, Section } from '../components/ui';

export default function MonumentsPage() {
  const { t, lang } = useLang();
  const { data, loading } = useFetch(`/monuments?lang=${lang}`, [lang]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  useTrackVisit('/monuments', null, lang);

  const monuments = data?.monuments || [];
  const categories = useMemo(() => ['all', ...new Set(monuments.map((m) => m.category))], [monuments]);

  const filtered = monuments.filter((m) => {
    const matchCat = cat === 'all' || m.category === cat;
    const matchQ = !q || `${m.name} ${m.shortDescription}`.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  });

  if (loading) return <PageLoader />;

  return (
    <Section kicker={t('nav.monuments')} title={t('monuments.title')} intro={t('monuments.subtitle')}>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="input max-w-md"
          placeholder={t('common.search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                cat === c ? 'bg-gold text-white' : 'border border-ink/15 bg-sand-soft text-ink-soft hover:border-gold/40'
              }`}
            >
              {c === 'all' ? t('common.all') : t(`categories.${c}`)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>{t('common.noResults')}</EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => (
            <MonumentCard key={m.id} monument={m} index={i} />
          ))}
        </div>
      )}
    </Section>
  );
}
