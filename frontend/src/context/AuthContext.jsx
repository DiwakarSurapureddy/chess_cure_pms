import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'cc_auth_token';
const USER_KEY = 'cc_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize and verify session on load
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken) {
          // Pre-populate if cached
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              setUser(parsed);
              setIsAuthenticated(true);
              setToken(storedToken);
            } catch (e) {
              // Ignore JSON parse error
            }
          }

          // Verify with backend
          try {
            const res = await api.getMe(storedToken);
            if (res?.user) {
              setUser(res.user);
              setToken(storedToken);
              setIsAuthenticated(true);
              localStorage.setItem(USER_KEY, JSON.stringify(res.user));
            } else {
              throw new Error('Invalid user payload');
            }
          } catch (err) {
            console.warn('Session verification failed, logging out:', err.message);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error('Error during session restoration:', err);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (email, password, rememberMe = true) => {
    setAuthError(null);
    try {
      const res = await api.login({ email, password, rememberMe });
      if (res?.token && res?.user) {
        setToken(res.token);
        setUser(res.user);
        setIsAuthenticated(true);

        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        return { success: true, user: res.user };
      } else {
        throw new Error('Authentication response was incomplete.');
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async ({ username, email, mobileNumber, password, skill }) => {
    setAuthError(null);
    try {
      const res = await api.register({ username, email, mobileNumber, password, skill });
      return { success: true, user: res.user, message: res.message };
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      try {
        await api.logout(currentToken);
      } catch (e) {
        // ignore logout network errors
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  const updateUserProfile = (updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearError = () => setAuthError(null);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    authError,
    login,
    register,
    logout,
    updateUserProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
