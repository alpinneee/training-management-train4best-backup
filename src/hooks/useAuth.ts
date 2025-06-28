import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  userType: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    authenticated: false,
  });

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();

      if (data.authenticated) {
        setAuthState({
          user: data.user,
          loading: false,
          authenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setAuthState({
          user: data.user,
          loading: false,
          authenticated: true,
        });
        return { success: true, redirectUrl: data.redirectUrl };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Terjadi kesalahan saat login' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
      });

      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error: 'Terjadi kesalahan saat logout' };
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuth,
  };
} 