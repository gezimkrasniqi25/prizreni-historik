import { motion } from 'framer-motion';

export function Spinner({ className = 'h-8 w-8' }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gold/30 border-t-gold ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

export function ErrorBox({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}
    </div>
  );
}

export function SuccessBox({ message }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {message}
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="rounded-2xl border border-dashed border-ink/15 bg-sand-soft/60 px-6 py-10 text-center text-ink-muted">{children}</div>;
}

export function Section({ kicker, title, intro, children, id, className = '' }) {
  return (
    <section id={id} className={`py-16 sm:py-20 ${className}`}>
      <div className="container-page">
        {(kicker || title || intro) && (
          <div className="mx-auto mb-10 max-w-3xl text-center">
            {kicker && <p className="section-kicker">{kicker}</p>}
            {title && <h2 className="section-title">{title}</h2>}
            <div className="gold-divider" />
            {intro && <p className="text-base leading-relaxed text-ink-muted sm:text-lg">{intro}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function FadeIn({ children, delay = 0, className = '', y = 18 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

export function Stars({ value = 0, onChange, size = 'md' }) {
  const cls = size === 'sm' ? 'text-base' : 'text-xl';
  return (
    <div className="inline-flex gap-1" role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`${cls} ${n <= value ? 'text-gold' : 'text-ink/20'} ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          aria-label={`${n}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function Attribution({ author, license, licenseUrl, sourceUrl, className = '' }) {
  if (!author && !license) return null;
  return (
    <p className={`text-[11px] leading-snug text-ink-muted ${className}`}>
      {author && <span>{author}</span>}
      {license && (
        <>
          {' · '}
          {licenseUrl ? (
            <a href={licenseUrl} target="_blank" rel="noreferrer" className="underline hover:text-gold-dark">
              {license}
            </a>
          ) : (
            license
          )}
        </>
      )}
      {sourceUrl && (
        <>
          {' · '}
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-gold-dark">
            Commons
          </a>
        </>
      )}
    </p>
  );
}
