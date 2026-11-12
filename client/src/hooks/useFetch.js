import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return undefined;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api(path, { signal: ctrl.signal })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  return { data, error, loading, setData };
}

export function useTrackVisit(path, monumentSlug, lang) {
  useEffect(() => {
    if (!path) return;
    api('/stats/visit', {
      method: 'POST',
      body: { path, monumentSlug: monumentSlug || null, lang },
    }).catch(() => {});
  }, [path, monumentSlug, lang]);
}
