import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useLang } from './LanguageContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { lang } = useLang();
  const [user, setUser] = useState(null);
  const [state, setState] = useState({ favorites: [], wishlist: [] });
  const [loading, setLoading] = useState(true);

  const refreshState = useCallback(async () => {
    try {
      const { data } = await api('/me/state');
      setState({
        favorites: data.favorites || [],
        wishlist: data.wishlist || [],
      });
    } catch {
      setState({ favorites: [], wishlist: [] });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api('/auth/me');
      setUser(data.user);
      await refreshState();
      return data.user;
    } catch {
      setUser(null);
      setState({ favorites: [], wishlist: [] });
      return null;
    }
  }, [refreshState]);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = async (email, password) => {
    const { data } = await api('/auth/login', { method: 'POST', body: { email, password } });
    setUser(data.user);
    await refreshState();
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api('/auth/register', { method: 'POST', body: { ...payload, lang } });
    return data;
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setState({ favorites: [], wishlist: [] });
    }
  };

  const isFavorite = (id) => state.favorites.includes(id);
  const isWishlisted = (id) => state.wishlist.some((w) => w.id === id);

  const toggleFavorite = async (monumentId) => {
    if (!user) return;
    if (isFavorite(monumentId)) {
      await api(`/me/favorites/${monumentId}`, { method: 'DELETE' });
    } else {
      await api(`/me/favorites/${monumentId}`, { method: 'PUT' });
    }
    await refreshState();
  };

  const toggleWishlist = async (monumentId, extras = {}) => {
    if (!user) return;
    if (isWishlisted(monumentId) && extras.remove) {
      await api(`/me/wishlist/${monumentId}`, { method: 'DELETE' });
    } else {
      await api(`/me/wishlist/${monumentId}`, { method: 'PUT', body: extras });
    }
    await refreshState();
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      isStaff: user?.role === 'admin' || user?.role === 'editor',
      login,
      register,
      logout,
      refreshUser,
      refreshState,
      favorites: state.favorites,
      wishlist: state.wishlist,
      isFavorite,
      isWishlisted,
      toggleFavorite,
      toggleWishlist,
      setUser,
    }),
    [user, loading, state, refreshUser, refreshState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
