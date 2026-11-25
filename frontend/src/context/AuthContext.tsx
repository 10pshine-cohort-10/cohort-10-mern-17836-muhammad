import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, fetchCurrentUser, logoutUser } from '../services/authApi';
import { LoginCredentials, RegisterCredentials, User } from '../types/models';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('noted_token'));
  const [loading, setLoading] = useState<boolean>(Boolean(localStorage.getItem('noted_token')));

  useEffect(() => {
    let active = true;
    async function hydrateSession(): Promise<void> {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchCurrentUser();
        if (active) {
          setUser(data.user);
        }
      } catch {
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

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    const data = await loginUser(credentials);
    localStorage.setItem('noted_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<User> => {
    const data = await registerUser(credentials);
    localStorage.setItem('noted_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
    } catch {
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
