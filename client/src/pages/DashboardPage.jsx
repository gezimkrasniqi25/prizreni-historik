import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { api, mediaUrl } from '../lib/api';
import { EmptyState, ErrorBox, Field, PageLoader, Stars, SuccessBox } from '../components/ui';

const TABS = ['profile', 'favorites', 'wishlist', 'activity', 'password'];

export default function DashboardPage() {
  const { user, loading, refreshUser } = useAuth();
  const { t, te, lang } = useLang();
  const [tab, setTab] = useState('profile');
  const [favorites, setFavorites] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activity, setActivity] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio || '',
      preferredLang: user.preferredLang || lang,
    });
  }, [user, lang]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (tab === 'favorites') {
        const { data } = await api(`/me/favorites?lang=${lang}`);
        setFavorites(data.items || []);
      }
      if (tab === 'wishlist') {
        const { data } = await api(`/me/wishlist?lang=${lang}`);
        setWishlist(data.items || []);
      }
      if (tab === 'activity') {
        const { data } = await api(`/me/activity?lang=${lang}`);
        setActivity(data);
      }
    })().catch(() => {});
  }, [tab, user, lang]);

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await api('/me/profile', { method: 'PUT', body: profile });
      await refreshUser();
      setMsg(t('dashboard.saved'));
    } catch (err) {
      setError(te(err.code) || te(err.message));
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await api('/me/password', { method: 'PUT', body: pw });
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMsg(t('dashboard.saved'));
    } catch (err) {
      setError(te(err.code) || te(err.message));
    }
  };

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-4xl">{t('dashboard.title')}</h1>
      <p className="mt-2 text-ink-muted">{user.firstName} {user.lastName} · {user.email}</p>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-ink/10 pb-3">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setMsg(''); setError(''); }}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === key ? 'bg-gold text-white' : 'bg-sand-soft text-ink-soft hover:bg-ink/5'}`}
          >
            {t(`dashboard.${key}`)}
          </button>
        ))}
      </div>

      <div className="mt-8 max-w-3xl">
        {msg && <div className="mb-4"><SuccessBox message={msg} /></div>}
        {error && <div className="mb-4"><ErrorBox message={error} /></div>}

        {tab === 'profile' && profile && (
          <form onSubmit={saveProfile} className="card space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('auth.firstName')}>
                <input className="input" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} required />
              </Field>
              <Field label={t('auth.lastName')}>
                <input className="input" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} required />
              </Field>
            </div>
            <Field label={t('dashboard.bio')}>
              <textarea className="input min-h-[100px]" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} maxLength={500} />
            </Field>
            <Field label={t('dashboard.preferredLang')}>
              <select className="input" value={profile.preferredLang} onChange={(e) => setProfile({ ...profile, preferredLang: e.target.value })}>
                <option value="sq">Shqip</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </Field>
            <button type="submit" className="btn-primary">{t('common.save')}</button>
          </form>
        )}

        {tab === 'favorites' && (
          <List items={favorites} empty={t('dashboard.emptyFav')} />
        )}

        {tab === 'wishlist' && (
          <div className="space-y-3">
            {wishlist.length === 0 && <EmptyState>{t('dashboard.emptyWish')}</EmptyState>}
            {wishlist.map((item) => (
              <div key={item.id} className="card flex gap-4 p-3">
                {item.cover && <img src={mediaUrl(item.cover)} alt="" className="h-20 w-28 rounded-lg object-cover" />}
                <div className="flex-1">
                  <Link to={`/monuments/${item.slug}`} className="font-display text-lg hover:text-gold-dark">{item.name}</Link>
                  <p className="mt-1 text-xs text-ink-muted">{item.visited ? t('dashboard.visited') : t('monuments.wishlist')}</p>
                  {!item.visited && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-gold-dark hover:underline"
                      onClick={async () => {
                        await api(`/me/wishlist/${item.id}`, { method: 'PUT', body: { visited: true } });
                        const { data } = await api(`/me/wishlist?lang=${lang}`);
                        setWishlist(data.items || []);
                      }}
                    >
                      {t('dashboard.markVisited')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'activity' && (
          <div className="space-y-6">
            {!activity && <PageLoader />}
            {activity && (
              <>
                <div>
                  <h2 className="mb-3 font-display text-xl">{t('dashboard.activity')}</h2>
                  {(activity.activity || []).length === 0 && <EmptyState>{t('dashboard.emptyActivity')}</EmptyState>}
                  <ul className="space-y-2">
                    {(activity.activity || []).map((a) => (
                      <li key={a.id} className="card px-4 py-3 text-sm">
                        <span className="font-medium">{a.action}</span>
                        {a.monumentName && (
                          <>
                            {' · '}
                            <Link to={`/monuments/${a.monumentSlug}`} className="text-gold-dark hover:underline">{a.monumentName}</Link>
                          </>
                        )}
                        <span className="ml-2 text-xs text-ink-muted">{new Date(a.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="mb-3 font-display text-xl">{t('monuments.reviews')}</h2>
                  {(activity.reviews || []).map((r) => (
                    <div key={r.id} className="card mb-2 p-4">
                      <div className="flex items-center justify-between">
                        <Link to={`/monuments/${r.monumentSlug}`} className="font-medium text-gold-dark">{r.monumentName}</Link>
                        <Stars value={r.rating} size="sm" />
                      </div>
                      {r.body && <p className="mt-1 text-sm text-ink-muted">{r.body}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'password' && (
          <form onSubmit={savePassword} className="card space-y-4 p-6">
            <Field label={t('dashboard.currentPassword')}>
              <input className="input" type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            </Field>
            <Field label={t('dashboard.newPassword')}>
              <input className="input" type="password" required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            </Field>
            <Field label={t('auth.confirmPassword')}>
              <input className="input" type="password" required value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} />
            </Field>
            <button type="submit" className="btn-primary">{t('common.save')}</button>
          </form>
        )}
      </div>
    </div>
  );
}

function List({ items, empty }) {
  if (!items.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link key={item.id} to={`/monuments/${item.slug}`} className="card flex gap-4 p-3 hover:border-gold/40">
          {item.cover && <img src={mediaUrl(item.cover)} alt="" className="h-20 w-28 rounded-lg object-cover" />}
          <div>
            <h3 className="font-display text-lg">{item.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{item.shortDescription}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
