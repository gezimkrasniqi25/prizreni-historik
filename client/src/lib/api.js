function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Thin fetch wrapper: credentials for the HttpOnly session cookie, CSRF header
 * for state-changing methods, and a normalised { data | error } shape.
 */
export async function api(path, { method = 'GET', body, formData, signal } = {}) {
  const headers = {};
  if (!formData) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && method !== 'HEAD') {
    const csrf = getCookie('ph_csrf');
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers,
    body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
    signal,
  });

  if (res.status === 204) return { ok: true, data: null, status: 204 };

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!res.ok) {
    const err = new Error(payload?.error || 'Request failed');
    err.status = res.status;
    err.code = payload?.code;
    err.details = payload?.details;
    throw err;
  }
  return { ok: true, data: payload, status: res.status };
}

export const mediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
};
