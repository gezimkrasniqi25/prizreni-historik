import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { ErrorBox, Field, SuccessBox } from '../components/ui';

function AuthShell({ title, children }) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-display text-3xl text-ink">{title}</h1>
        <div className="gold-divider !mx-0" />
        {children}
      </div>
    </div>
  );
}

function fieldError(details, key, te) {
  if (!details?.[key]) return undefined;
  return te(details[key]) || details[key];
}

export function LoginPage() {
  const { t, te } = useLang();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(te(err.code) || te(err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('auth.loginTitle')}>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error && <ErrorBox message={error} />}
        <Field label={t('auth.email')}>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label={t('auth.password')}>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {t('nav.login')}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink-muted">
        <Link to="/forgot-password" className="text-gold-dark hover:underline">{t('auth.forgot')}</Link>
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-gold-dark hover:underline">{t('nav.signup')}</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { t, te } = useLang();
  const { user, register } = useAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', acceptTerms: false,
  });
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm((f) => ({
    ...f,
    [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setDetails(null);
    try {
      await register(form);
      setDone(true);
    } catch (err) {
      setError(te(err.code) || te(err.message));
      setDetails(err.details || null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('auth.signupTitle')}>
      {done ? (
        <div className="mt-6 space-y-4">
          <SuccessBox message={t('auth.registered')} />
          <Link to="/login" className="btn-primary inline-flex">{t('nav.login')}</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <ErrorBox message={error} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('auth.firstName')} error={fieldError(details, 'firstName', te)}>
              <input className="input" required value={form.firstName} onChange={set('firstName')} />
            </Field>
            <Field label={t('auth.lastName')} error={fieldError(details, 'lastName', te)}>
              <input className="input" required value={form.lastName} onChange={set('lastName')} />
            </Field>
          </div>
          <Field label={t('auth.email')} error={fieldError(details, 'email', te)}>
            <input className="input" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
          </Field>
          <Field label={t('auth.password')} error={fieldError(details, 'password', te)} hint="Aa1····· (8+)">
            <input className="input" type="password" required value={form.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
          <Field label={t('auth.confirmPassword')} error={fieldError(details, 'confirmPassword', te)}>
            <input className="input" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
          </Field>
          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input type="checkbox" className="mt-1" checked={form.acceptTerms} onChange={set('acceptTerms')} />
            <span>
              {t('auth.acceptTerms')}
              <span className="mt-1 block text-xs text-ink-muted">{t('auth.termsNote')}</span>
            </span>
          </label>
          {fieldError(details, 'acceptTerms', te) && <p className="text-xs text-red-700">{fieldError(details, 'acceptTerms', te)}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {t('nav.signup')}
          </button>
        </form>
      )}
      <p className="mt-4 text-sm text-ink-muted">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-gold-dark hover:underline">{t('nav.login')}</Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const { t, te, lang } = useLang();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api('/auth/forgot-password', { method: 'POST', body: { email, lang } });
      setMsg(data.message);
    } catch (err) {
      setError(te(err.code) || te(err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('auth.forgotTitle')}>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {msg && <SuccessBox message={msg} />}
        {error && <ErrorBox message={error} />}
        <Field label={t('auth.email')}>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={busy}>{t('auth.sendLink')}</button>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const { t, te } = useLang();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api('/auth/reset-password', {
        method: 'POST',
        body: { token, password, confirmPassword },
      });
      setMsg(data.message);
    } catch (err) {
      setError(te(err.code) || te(err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('auth.resetTitle')}>
      {msg ? (
        <div className="mt-6 space-y-4">
          <SuccessBox message={msg} />
          <Link to="/login" className="btn-primary inline-flex">{t('nav.login')}</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <ErrorBox message={error} />}
          <Field label={t('auth.password')}>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label={t('auth.confirmPassword')}>
            <input className="input" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Field>
          <button type="submit" className="btn-primary w-full" disabled={busy || !token}>{t('common.save')}</button>
        </form>
      )}
    </AuthShell>
  );
}

export function VerifyEmailPage() {
  const { t, te, lang } = useLang();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState(token ? 'pending' : 'fail');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('fail');
      return;
    }
    let cancelled = false;
    api('/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => { if (!cancelled) setStatus('ok'); })
      .catch(() => { if (!cancelled) setStatus('fail'); });
    return () => { cancelled = true; };
  }, [token]);

  const resend = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api('/auth/resend-verification', { method: 'POST', body: { email, lang } });
      setMsg(data.message);
    } catch (err) {
      setMsg(te(err.code) || te(err.message));
    }
  };

  return (
    <AuthShell title={t('auth.verifyTitle')}>
      <div className="mt-6 space-y-4">
        {status === 'pending' && <p className="text-sm text-ink-muted">{t('common.loading')}</p>}
        {status === 'ok' && <SuccessBox message={t('auth.verifySuccess')} />}
        {status === 'fail' && <ErrorBox message={t('auth.verifyFail')} />}
        {status === 'ok' && <Link to="/login" className="btn-primary inline-flex">{t('nav.login')}</Link>}
        {status === 'fail' && (
          <form onSubmit={resend} className="space-y-3">
            {msg && <SuccessBox message={msg} />}
            <Field label={t('auth.email')}>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <button type="submit" className="btn-secondary w-full">{t('auth.resend')}</button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
