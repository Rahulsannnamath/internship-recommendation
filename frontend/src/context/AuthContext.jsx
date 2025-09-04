import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API = 'http://localhost:8080';
const TOKEN_KEY = 'token';
const USER_META_KEY = 'userMeta';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  );
  // Seed user immediately (optimistic) from cached meta so nav switches instantly
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_META_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState(null);
  const [hydrating, setHydrating] = useState(!!token);

  const hydrateUser = useCallback(async () => {
    if (!token) {
      setHydrating(false);
      return;
    }
    setHydrating(true);
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const u = {
        id: json?.user?.id || json?.user?._id,
        email: json?.user?.email,
        name: json?.user?.name || 'User'
      };
      setUser(u);
      setProfile(json?.user?.profile || null);
      localStorage.setItem(USER_META_KEY, JSON.stringify(u));
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_META_KEY);
      setToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setHydrating(false);
    }
  }, [token]);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY || e.key === USER_META_KEY) {
        const t = localStorage.getItem(TOKEN_KEY);
        setToken(t);
        if (!t) {
          setUser(null);
          setProfile(null);
        } else {
          try {
            const raw = localStorage.getItem(USER_META_KEY);
            setUser(raw ? JSON.parse(raw) : null);
          } catch {
            setUser(null);
          }
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    const u = {
      id: json.user.id,
      email: json.user.email,
      name: json.user.name || 'User'
    };
    localStorage.setItem(TOKEN_KEY, json.token);
    localStorage.setItem(USER_META_KEY, JSON.stringify(u));
    setToken(json.token);
    setUser(u);              // immediate nav switch
    setProfile(json.user.profile || null);
  };

  const signup = async (email, password) => {
    const res = await fetch(`${API}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Signup failed');
    const u = {
      id: json.user.id,
      email: json.user.email,
      name: json.user.name || 'User'
    };
    localStorage.setItem(TOKEN_KEY, json.token);
    localStorage.setItem(USER_META_KEY, JSON.stringify(u));
    setToken(json.token);
    setUser(u);
    setProfile(json.user.profile || null);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_META_KEY);
    setToken(null);
    setUser(null);
    setProfile(null);
    setHydrating(false);
  };

  const isAuthed = !!token; // optimistic flag

  return (
    <AuthContext.Provider value={{
      token, user, profile,
      isAuthed,
      hydrating,
      login, signup, logout,
      setProfile, reload: hydrateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};