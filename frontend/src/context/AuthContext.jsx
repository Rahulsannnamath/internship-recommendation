import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API = 'http://localhost:8080';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
            setUser({ id: json.user.id, email: json.user.email });
            setProfile(json.user.profile);
        } else {
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    localStorage.setItem('token', json.token);
    setUser({ id: json.user.id, email: json.user.email });
    setProfile(json.user.profile);
  };

  const signup = async (email, password) => {
    const res = await fetch(`${API}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Signup failed');
    localStorage.setItem('token', json.token);
    setUser({ id: json.user.id, email: json.user.email });
    setProfile(json.user.profile);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, login, signup, logout, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};