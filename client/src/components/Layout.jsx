import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-sm transition ${isActive ? 'bg-gold/15 text-gold-dark' : 'text-ink-soft hover:bg-ink/5'}`;

export default function Layout() {
  const { t, lang, setLang, langs } = useLang();
  const { user, logout, isStaff, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/monuments', label: t('nav.monuments') },
    { to: '/map', label: t('nav.map') },
    { to: '/explore-3d', label: t('nav.explore3d') },
    { to: '/#history', label: t('nav.history'), hash: true },
  ];

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-sand/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Link to="/" className="group flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-gold-light shadow-soft">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 18 L12 5 L20 18 Z" />
                <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className="font-display text-lg tracking-wide text-ink group-hover:text-gold-dark">{t('brand')}</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) =>
              l.hash ? (
                <a key={l.to} href={l.to} className="rounded-full px-3 py-1.5 text-sm text-ink-soft hover:bg-ink/5">
                  {l.label}
                </a>
              ) : (
                <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                  {l.label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="lang">
              {t('common.language')}
            </label>
            <select
              id="lang"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="rounded-full border border-ink/15 bg-sand-soft px-2.5 py-1.5 text-xs text-ink"
            >
              {langs.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>

            {!loading && (
              <div className="hidden items-center gap-2 sm:flex">
                {user ? (
                  <>
                    <Link to="/dashboard" className="btn-ghost !px-3 !py-1.5 text-xs">
                      {t('nav.dashboard')}
                    </Link>
                    {isStaff && (
                      <Link to="/admin" className="btn-ghost !px-3 !py-1.5 text-xs">
                        {t('nav.admin')}
                      </Link>
                    )}
                    <button type="button" onClick={onLogout} className="btn-secondary !px-3 !py-1.5 text-xs">
                      {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-ghost !px-3 !py-1.5 text-xs">
                      {t('nav.login')}
                    </Link>
                    <Link to="/register" className="btn-primary !px-3 !py-1.5 text-xs">
                      {t('nav.signup')}
                    </Link>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              className="rounded-lg p-2 text-ink lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {open ? (
                  <path strokeLinecap="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-ink/10 lg:hidden"
            >
              <div className="container-page flex flex-col gap-1 py-3">
                {links.map((l) =>
                  l.hash ? (
                    <a key={l.to} href={l.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm hover:bg-ink/5">
                      {l.label}
                    </a>
                  ) : (
                    <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm hover:bg-ink/5">
                      {l.label}
                    </NavLink>
                  ),
                )}
                <div className="mt-2 flex flex-wrap gap-2 border-t border-ink/10 pt-3">
                  {user ? (
                    <>
                      <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-secondary text-xs">
                        {t('nav.dashboard')}
                      </Link>
                      {isStaff && (
                        <Link to="/admin" onClick={() => setOpen(false)} className="btn-secondary text-xs">
                          {t('nav.admin')}
                        </Link>
                      )}
                      <button type="button" onClick={() => { setOpen(false); onLogout(); }} className="btn-ghost text-xs">
                        {t('nav.logout')}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary text-xs">
                        {t('nav.login')}
                      </Link>
                      <Link to="/register" onClick={() => setOpen(false)} className="btn-primary text-xs">
                        {t('nav.signup')}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-ink/10 bg-ink text-sand">
        <div className="container-page grid gap-8 py-12 md:grid-cols-3">
          <div>
            <p className="font-display text-xl text-gold-light">{t('brand')}</p>
            <p className="mt-3 text-sm leading-relaxed text-sand/70">{t('footer.made')}</p>
          </div>
          <div className="text-sm text-sand/70">
            <p className="mb-2 font-medium text-sand">{t('nav.monuments')}</p>
            <div className="flex flex-col gap-1">
              <Link to="/monuments" className="hover:text-gold-light">{t('nav.monuments')}</Link>
              <Link to="/map" className="hover:text-gold-light">{t('nav.map')}</Link>
              <Link to="/explore-3d" className="hover:text-gold-light">{t('nav.explore3d')}</Link>
            </div>
          </div>
          <div className="text-sm text-sand/70">
            <p>
              © {new Date().getFullYear()} {t('brand')}. {t('footer.rights')}
            </p>
            <p className="mt-2 text-xs text-sand/50">
              Photos: Wikimedia Commons · Sources listed on each monument page.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
