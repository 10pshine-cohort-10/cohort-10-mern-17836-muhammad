import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, fetchCurrentUser, logoutUser } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('noted_token'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('noted_token')));

  useEffect(() => {
    let active = true;
    async function hydrateSession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchCurrentUser();
        if (active) {
          setUser(data.user);
        }
      } catch (_err) {
        localStorage.removeItem('noted_token');
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void hydrateSession();
    return () => {
      active = false;
    };
  }, [token]);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    localStorage.setItem('noted_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (credentials) => {
    const data = await registerUser(credentials);
    localStorage.setItem('noted_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (_err) {
      // Proceed with local session cleanup even if network fails
    }
    localStorage.removeItem('noted_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
