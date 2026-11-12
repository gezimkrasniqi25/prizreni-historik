import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { api, mediaUrl } from '../lib/api';
import { EmptyState, ErrorBox, Field, PageLoader, SuccessBox } from '../components/ui';

const TABS = ['overview', 'monuments', 'users', 'comments', 'content', 'stats'];
const CATS = ['fortress', 'mosque', 'church', 'cathedral', 'hamam', 'bridge', 'complex', 'tekke', 'museum'];
const emptyTranslation = () => ({
  name: '', altName: '', periodLabel: '', architecturalStyle: '',
  shortDescription: '', history: '', significance: '', architecture: '', visitorInfo: '',
});

export default function AdminPage() {
  const { user, loading, isStaff, isAdmin } = useAuth();
  const { t, te, lang } = useLang();
  const [tab, setTab] = useState('overview');
  const [monuments, setMonuments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [moderation, setModeration] = useState(null);
  const [content, setContent] = useState(null);
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const flash = (m) => { setMsg(m); setError(''); };
  const fail = (err) => { setError(te(err.code) || te(err.message) || t('common.error')); setMsg(''); };

  const loadMonuments = async () => {
    const { data } = await api(`/admin/monuments?lang=${lang}`);
    setMonuments(data.monuments || []);
  };

  useEffect(() => {
    if (!user || !isStaff) return;
    (async () => {
      try {
        if (tab === 'overview' || tab === 'monuments') await loadMonuments();
        if (tab === 'stats' && isAdmin) {
          const { data } = await api('/admin/stats?days=30');
          setStats(data);
        }
        if (tab === 'users' && isAdmin) {
          const { data } = await api('/admin/users?page=1');
          setUsers(data);
        }
        if (tab === 'comments') {
          const { data } = await api('/admin/comments?type=comments&page=1');
          setModeration(data);
        }
        if (tab === 'content') {
          const [c, i] = await Promise.all([api('/admin/content'), api('/admin/items')]);
          setContent(c.data.content || {});
          setItems(i.data.items || []);
        }
      } catch (err) {
        fail(err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user, isStaff, isAdmin, lang]);

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/" replace />;

  const startCreate = () => {
    setEditing({
      id: null,
      slug: '',
      category: 'mosque',
      modelArchetype: 'mosque',
      latitude: 42.2095,
      longitude: 20.7415,
      builtYearStart: '',
      builtYearEnd: '',
      heritageReference: '',
      sources: [],
      isPublished: true,
      sortOrder: monuments.length + 1,
      translations: { sq: emptyTranslation(), en: emptyTranslation(), de: emptyTranslation() },
      images: [],
      models: [],
    });
  };

  const startEdit = async (id) => {
    const { data } = await api(`/admin/monuments/${id}`);
    setEditing({
      id: data.monument.id,
      slug: data.monument.slug,
      category: data.monument.category,
      modelArchetype: data.monument.modelArchetype,
      latitude: data.monument.latitude,
      longitude: data.monument.longitude,
      builtYearStart: data.monument.builtYearStart ?? '',
      builtYearEnd: data.monument.builtYearEnd ?? '',
      heritageReference: data.monument.heritageReference || '',
      sources: data.monument.sources || [],
      isPublished: data.monument.isPublished,
      sortOrder: data.monument.sortOrder ?? 0,
      translations: {
        sq: { ...emptyTranslation(), ...data.translations.sq },
        en: { ...emptyTranslation(), ...data.translations.en },
        de: { ...emptyTranslation(), ...data.translations.de },
      },
      images: data.monument.images || [],
      models: data.monument.models || [],
    });
    setTab('monuments');
  };

  const saveMonument = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        ...editing,
        builtYearStart: editing.builtYearStart === '' ? null : Number(editing.builtYearStart),
        builtYearEnd: editing.builtYearEnd === '' ? null : Number(editing.builtYearEnd),
        latitude: Number(editing.latitude),
        longitude: Number(editing.longitude),
        sortOrder: Number(editing.sortOrder) || 0,
      };
      delete body.id;
      delete body.images;
      delete body.models;
      if (editing.id) {
        await api(`/admin/monuments/${editing.id}`, { method: 'PUT', body });
      } else {
        const { data } = await api('/admin/monuments', { method: 'POST', body });
        editing.id = data.id;
      }
      await loadMonuments();
      if (editing.id) await startEdit(editing.id);
      flash(t('dashboard.saved'));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const deleteMonument = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    await api(`/admin/monuments/${id}`, { method: 'DELETE' });
    setEditing(null);
    await loadMonuments();
    flash(t('dashboard.saved'));
  };

  const uploadImages = async (files) => {
    if (!editing?.id || !files?.length) return;
    const fd = new FormData();
    [...files].forEach((f) => fd.append('images', f));
    fd.append('author', 'Admin upload');
    fd.append('license', 'All rights reserved');
    const { data } = await api(`/admin/monuments/${editing.id}/images`, { method: 'POST', formData: fd });
    setEditing((e) => ({ ...e, images: data.images }));
    flash(t('dashboard.saved'));
  };

  const uploadModel = async (file, meta) => {
    if (!editing?.id || !file) return;
    const fd = new FormData();
    fd.append('model', file);
    Object.entries(meta).forEach(([k, v]) => fd.append(k, v));
    const { data } = await api(`/admin/monuments/${editing.id}/models`, { method: 'POST', formData: fd });
    setEditing((e) => ({ ...e, models: [...(e.models || []), data.model] }));
    flash(t('dashboard.saved'));
  };

  const visibleTabs = TABS.filter((key) => {
    if ((key === 'users' || key === 'stats') && !isAdmin) return false;
    return true;
  });

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-4xl">{t('admin.title')}</h1>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-ink/10 pb-3">
        {visibleTabs.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setMsg(''); setError(''); if (key !== 'monuments') setEditing(null); }}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === key ? 'bg-gold text-white' : 'bg-sand-soft text-ink-soft'}`}
          >
            {t(`admin.${key}`)}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {msg && <div className="mb-4"><SuccessBox message={msg} /></div>}
        {error && <div className="mb-4"><ErrorBox message={error} /></div>}

        {tab === 'overview' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t('admin.monuments')} value={monuments.length} />
            <Stat label={t('admin.published')} value={monuments.filter((m) => m.isPublished !== false).length} />
            <Stat label="3D" value={monuments.filter((m) => m.hasModel).length} />
            <button type="button" className="card flex items-center justify-center p-6 text-gold-dark hover:border-gold" onClick={() => { setTab('monuments'); startCreate(); }}>
              + {t('admin.newMonument')}
            </button>
          </div>
        )}

        {tab === 'monuments' && !editing && (
          <div>
            <div className="mb-4 flex justify-between">
              <h2 className="font-display text-2xl">{t('admin.monuments')}</h2>
              <button type="button" className="btn-primary" onClick={startCreate}>{t('admin.newMonument')}</button>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-ink/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-sand-deep/60 text-xs uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">{t('auth.firstName')}</th>
                    <th className="px-4 py-3">{t('admin.category')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {monuments.map((m) => (
                    <tr key={m.id} className="border-t border-ink/10">
                      <td className="px-4 py-3">{m.sortOrder}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {m.coverThumb && <img src={mediaUrl(m.coverThumb)} alt="" className="h-12 w-16 rounded object-cover" />}
                          <div>
                            <p className="font-medium">{m.name}</p>
                            <p className="text-xs text-ink-muted">{m.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{t(`categories.${m.category}`)}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" className="btn-ghost !px-3 !py-1 text-xs" onClick={() => startEdit(m.id)}>{t('common.edit')}</button>
                        <Link to={`/monuments/${m.slug}`} className="btn-ghost !px-3 !py-1 text-xs">{t('common.open')}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'monuments' && editing && (
          <MonumentEditor
            editing={editing}
            setEditing={setEditing}
            t={t}
            busy={busy}
            onSave={saveMonument}
            onDelete={() => deleteMonument(editing.id)}
            onUploadImages={uploadImages}
            onUploadModel={uploadModel}
            onCancel={() => setEditing(null)}
          />
        )}

        {tab === 'users' && isAdmin && (
          <UsersPanel data={users} t={t} onReload={async () => setUsers((await api('/admin/users?page=1')).data)} />
        )}

        {tab === 'comments' && (
          <ModerationPanel data={moderation} t={t} onReload={async () => setModeration((await api('/admin/comments?type=comments&page=1')).data)} />
        )}

        {tab === 'content' && content && (
          <ContentPanel content={content} items={items} setContent={setContent} setItems={setItems} t={t} flash={flash} fail={fail} monuments={monuments} />
        )}

        {tab === 'stats' && isAdmin && stats && (
          <StatsPanel stats={stats} t={t} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-6">
      <p className="text-xs uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
    </div>
  );
}

function MonumentEditor({ editing, setEditing, t, busy, onSave, onDelete, onUploadImages, onUploadModel, onCancel }) {
  const [langTab, setLangTab] = useState('sq');
  const [modelMeta, setModelMeta] = useState({
    title: '', kind: 'artist_model', isAuthentic: false, sourceName: '', sourceUrl: '', license: '', credit: '',
  });
  const tr = editing.translations[langTab] || emptyTranslation();
  const setTr = (key, val) => setEditing({
    ...editing,
    translations: { ...editing.translations, [langTab]: { ...tr, [key]: val } },
  });

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl">{editing.id ? t('common.edit') : t('admin.newMonument')}</h2>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>{t('common.cancel')}</button>
          {editing.id && <button type="button" className="btn-danger" onClick={onDelete}>{t('common.delete')}</button>}
          <button type="submit" className="btn-primary" disabled={busy}>{t('common.save')}</button>
        </div>
      </div>

      <div className="card grid gap-4 p-6 md:grid-cols-2">
        <Field label="Slug">
          <input className="input" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="auto from Albanian name" />
        </Field>
        <Field label={t('admin.sortOrder')}>
          <input className="input" type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: e.target.value })} />
        </Field>
        <Field label={t('admin.category')}>
          <select className="input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
            {CATS.map((c) => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
          </select>
        </Field>
        <Field label={t('admin.archetype')}>
          <select className="input" value={editing.modelArchetype} onChange={(e) => setEditing({ ...editing, modelArchetype: e.target.value })}>
            {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label={t('admin.latitude')}>
          <input className="input" type="number" step="any" value={editing.latitude} onChange={(e) => setEditing({ ...editing, latitude: e.target.value })} required />
        </Field>
        <Field label={t('admin.longitude')}>
          <input className="input" type="number" step="any" value={editing.longitude} onChange={(e) => setEditing({ ...editing, longitude: e.target.value })} required />
        </Field>
        <Field label={t('admin.yearStart')}>
          <input className="input" type="number" value={editing.builtYearStart} onChange={(e) => setEditing({ ...editing, builtYearStart: e.target.value })} />
        </Field>
        <Field label={t('admin.yearEnd')}>
          <input className="input" type="number" value={editing.builtYearEnd} onChange={(e) => setEditing({ ...editing, builtYearEnd: e.target.value })} />
        </Field>
        <Field label={t('admin.heritageRef')}>
          <input className="input" value={editing.heritageReference} onChange={(e) => setEditing({ ...editing, heritageReference: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={editing.isPublished} onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })} />
          {t('admin.published')}
        </label>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex gap-2">
          {['sq', 'en', 'de'].map((l) => (
            <button key={l} type="button" onClick={() => setLangTab(l)} className={`rounded-full px-3 py-1 text-xs ${langTab === l ? 'bg-gold text-white' : 'bg-sand-deep'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="grid gap-4">
          <Field label="Name *"><input className="input" required={langTab === 'sq'} value={tr.name} onChange={(e) => setTr('name', e.target.value)} /></Field>
          <Field label="Alt name"><input className="input" value={tr.altName} onChange={(e) => setTr('altName', e.target.value)} /></Field>
          <Field label={t('monuments.period')}><input className="input" value={tr.periodLabel} onChange={(e) => setTr('periodLabel', e.target.value)} /></Field>
          <Field label={t('monuments.style')}><input className="input" value={tr.architecturalStyle} onChange={(e) => setTr('architecturalStyle', e.target.value)} /></Field>
          <Field label="Short description *"><textarea className="input min-h-[70px]" required={langTab === 'sq'} value={tr.shortDescription} onChange={(e) => setTr('shortDescription', e.target.value)} /></Field>
          <Field label={t('monuments.history')}><textarea className="input min-h-[120px]" required={langTab === 'sq'} value={tr.history} onChange={(e) => setTr('history', e.target.value)} /></Field>
          <Field label={t('monuments.significance')}><textarea className="input min-h-[90px]" required={langTab === 'sq'} value={tr.significance} onChange={(e) => setTr('significance', e.target.value)} /></Field>
          <Field label={t('monuments.architecture')}><textarea className="input min-h-[90px]" required={langTab === 'sq'} value={tr.architecture} onChange={(e) => setTr('architecture', e.target.value)} /></Field>
          <Field label={t('monuments.visitorInfo')}><textarea className="input min-h-[90px]" required={langTab === 'sq'} value={tr.visitorInfo} onChange={(e) => setTr('visitorInfo', e.target.value)} /></Field>
        </div>
      </div>

      {editing.id && (
        <>
          <div className="card p-6">
            <h3 className="font-display text-xl">{t('admin.uploadImages')}</h3>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-3 block w-full text-sm" onChange={(e) => uploadAndClear(e, onUploadImages)} />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(editing.images || []).map((img) => (
                <div key={img.id} className="overflow-hidden rounded-lg border border-ink/10">
                  <img src={mediaUrl(img.thumb)} alt="" className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    className="w-full py-1 text-xs text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      await api(`/admin/images/${img.id}`, { method: 'DELETE' });
                      setEditing((ed) => ({ ...ed, images: ed.images.filter((i) => i.id !== img.id) }));
                    }}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-3 p-6">
            <h3 className="font-display text-xl">{t('admin.uploadModel')}</h3>
            <p className="text-xs text-ink-muted">GLB/GLTF only. Mark as authentic only for scans / documented reconstructions with a named source.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title"><input className="input" value={modelMeta.title} onChange={(e) => setModelMeta({ ...modelMeta, title: e.target.value })} /></Field>
              <Field label={t('admin.modelKind')}>
                <select className="input" value={modelMeta.kind} onChange={(e) => setModelMeta({ ...modelMeta, kind: e.target.value })}>
                  <option value="artist_model">artist_model</option>
                  <option value="photogrammetry_scan">photogrammetry_scan</option>
                  <option value="laser_scan">laser_scan</option>
                  <option value="documented_reconstruction">documented_reconstruction</option>
                </select>
              </Field>
              <Field label={t('admin.sourceName')}><input className="input" value={modelMeta.sourceName} onChange={(e) => setModelMeta({ ...modelMeta, sourceName: e.target.value })} /></Field>
              <Field label={t('admin.sourceUrl')}><input className="input" value={modelMeta.sourceUrl} onChange={(e) => setModelMeta({ ...modelMeta, sourceUrl: e.target.value })} /></Field>
              <Field label={t('admin.license')}><input className="input" value={modelMeta.license} onChange={(e) => setModelMeta({ ...modelMeta, license: e.target.value })} /></Field>
              <Field label={t('admin.credit')}><input className="input" value={modelMeta.credit} onChange={(e) => setModelMeta({ ...modelMeta, credit: e.target.value })} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={modelMeta.isAuthentic} onChange={(e) => setModelMeta({ ...modelMeta, isAuthentic: e.target.checked })} />
              {t('admin.isAuthentic')}
            </label>
            <input type="file" accept=".glb,.gltf" className="block w-full text-sm" onChange={(e) => { if (e.target.files?.[0]) onUploadModel(e.target.files[0], modelMeta); e.target.value = ''; }} />
            <ul className="space-y-2 text-sm">
              {(editing.models || []).map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg bg-sand px-3 py-2">
                  <span>{m.title} · {m.kind} {m.isAuthentic ? '✓' : ''}</span>
                  <button type="button" className="text-xs text-red-700" onClick={async () => { await api(`/admin/models/${m.id}`, { method: 'DELETE' }); setEditing((ed) => ({ ...ed, models: ed.models.filter((x) => x.id !== m.id) })); }}>{t('common.delete')}</button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </form>
  );
}

function uploadAndClear(e, handler) {
  handler(e.target.files);
  e.target.value = '';
}

function UsersPanel({ data, t, onReload }) {
  if (!data) return <PageLoader />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-sand-deep/60 text-xs uppercase text-ink-muted">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">{t('admin.role')}</th>
            <th className="px-4 py-3">{t('admin.active')}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {data.users.map((u) => (
            <tr key={u.id} className="border-t border-ink/10">
              <td className="px-4 py-3">
                <p className="font-medium">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-ink-muted">{u.email}</p>
              </td>
              <td className="px-4 py-3">
                <select
                  className="input !py-1"
                  value={u.role}
                  onChange={async (e) => { await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { role: e.target.value } }); onReload(); }}
                >
                  <option value="user">user</option>
                  <option value="editor">editor</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="btn-ghost !px-2 !py-1 text-xs"
                  onClick={async () => { await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { isActive: !u.isActive } }); onReload(); }}
                >
                  {u.isActive ? t('admin.active') : 'off'}
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <button type="button" className="text-xs text-red-700" onClick={async () => { if (window.confirm(t('admin.confirmDelete'))) { await api(`/admin/users/${u.id}`, { method: 'DELETE' }); onReload(); } }}>{t('common.delete')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModerationPanel({ data, t, onReload }) {
  if (!data) return <PageLoader />;
  if (!data.items.length) return <EmptyState>{t('common.noResults')}</EmptyState>;
  return (
    <div className="space-y-3">
      {data.items.map((item) => (
        <div key={item.id} className="card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{item.author} · {item.monument}</p>
              <p className="mt-1 text-sm text-ink-muted">{item.body}</p>
              {item.hidden && <span className="badge mt-2">hidden</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary !px-3 !py-1 text-xs" onClick={async () => { await api(`/admin/comments/${item.id}`, { method: 'PATCH', body: { hidden: !item.hidden } }); onReload(); }}>
                {item.hidden ? t('admin.show') : t('admin.hide')}
              </button>
              <button type="button" className="btn-danger !px-3 !py-1 text-xs" onClick={async () => { await api(`/admin/comments/${item.id}`, { method: 'DELETE' }); onReload(); }}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentPanel({ content, items, setContent, setItems, t, flash, fail, monuments }) {
  const [key, setKey] = useState(Object.keys(content)[0] || 'hero.title');
  const values = content[key] || { sq: '', en: '', de: '' };

  const saveKey = async () => {
    try {
      await api('/admin/content', { method: 'PUT', body: { key, values } });
      flash(t('dashboard.saved'));
    } catch (err) { fail(err); }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card space-y-4 p-6">
        <h3 className="font-display text-xl">{t('admin.content')}</h3>
        <Field label="Key">
          <select className="input" value={key} onChange={(e) => setKey(e.target.value)}>
            {Object.keys(content).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        {['sq', 'en', 'de'].map((l) => (
          <Field key={l} label={l.toUpperCase()}>
            <textarea
              className="input min-h-[90px]"
              value={values[l] || ''}
              onChange={(e) => setContent({ ...content, [key]: { ...values, [l]: e.target.value } })}
            />
          </Field>
        ))}
        <button type="button" className="btn-primary" onClick={saveKey}>{t('common.save')}</button>
      </div>
      <div className="card p-6">
        <h3 className="font-display text-xl">Events / Activities / Timeline</h3>
        <p className="mt-2 text-sm text-ink-muted">{items.length} items · manage via seed or extend this panel as needed.</p>
        <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto text-sm">
          {items.map((i) => (
            <li key={i.id} className="rounded-lg bg-sand px-3 py-2">
              <span className="badge mr-2">{i.type}</span>
              {i.translations?.sq?.title || '—'}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-muted">{monuments.length} monuments available for linking.</p>
      </div>
    </div>
  );
}

function StatsPanel({ stats, t }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('admin.visits')} value={stats.totals.visits} />
        <Stat label={t('admin.unique')} value={stats.totals.uniqueVisitors} />
        <Stat label={t('admin.users')} value={stats.counts.users} />
        <Stat label={t('admin.monuments')} value={stats.counts.monuments} />
      </div>
      <div className="card p-6">
        <h3 className="font-display text-xl">Top monuments ({stats.days}d)</h3>
        <ul className="mt-4 space-y-2">
          {stats.topMonuments.map((m) => (
            <li key={m.id} className="flex justify-between text-sm">
              <Link to={`/monuments/${m.slug}`} className="text-gold-dark hover:underline">{m.name}</Link>
              <span className="text-ink-muted">{m.visits} visits</span>
            </li>
          ))}
          {!stats.topMonuments.length && <EmptyState>{t('common.noResults')}</EmptyState>}
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-display text-lg">By language</h3>
          <ul className="mt-3 space-y-1 text-sm">{stats.byLang.map((r) => <li key={r.lang || 'x'}>{r.lang || '—'} · {r.visits}</li>)}</ul>
        </div>
        <div className="card p-6">
          <h3 className="font-display text-lg">By device</h3>
          <ul className="mt-3 space-y-1 text-sm">{stats.byDevice.map((r) => <li key={r.device}>{r.device} · {r.visits}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
