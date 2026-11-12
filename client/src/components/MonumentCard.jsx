import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mediaUrl } from '../lib/api';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function MonumentCard({ monument, index = 0 }) {
  const { t } = useLang();
  const { user, isFavorite, toggleFavorite } = useAuth();
  const cover = mediaUrl(monument.coverThumb || monument.cover);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
      className="group card overflow-hidden"
    >
      <Link to={`/monuments/${monument.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-sand-deep">
        {cover ? (
          <img
            src={cover}
            alt={monument.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted">—</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-90" />
        <span className="badge absolute left-3 top-3 bg-sand-soft/90 backdrop-blur">
          {t(`categories.${monument.category}`)}
        </span>
        {user && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(monument.id);
            }}
            className={`absolute right-3 top-3 rounded-full bg-sand-soft/90 px-2.5 py-1 text-sm backdrop-blur ${
              isFavorite(monument.id) ? 'text-gold' : 'text-ink-muted'
            }`}
            aria-label={t('monuments.favorite')}
          >
            {isFavorite(monument.id) ? '♥' : '♡'}
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-display text-xl leading-tight">{monument.name}</h3>
          {monument.periodLabel && <p className="mt-1 text-xs text-white/80">{monument.periodLabel}</p>}
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-muted">{monument.shortDescription}</p>
        <div className="flex items-center justify-between gap-2">
          {monument.avgRating != null ? (
            <span className="text-sm text-gold-dark">★ {monument.avgRating} <span className="text-ink-muted">({monument.reviewCount})</span></span>
          ) : (
            <span className="text-xs text-ink-muted">—</span>
          )}
          <Link to={`/monuments/${monument.slug}`} className="text-sm font-medium text-gold-dark hover:text-gold">
            {t('common.learnMore')} →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
