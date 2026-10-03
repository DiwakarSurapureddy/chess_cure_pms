import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'cc_auth_token';
const USER_KEY = 'chess_cure_user';
const CAREER_KEY = 'chess_cure_career';
const PREFERENCES_KEY = 'chess_cure_preferences';

const FACEBOOK_APP_ID = '1608757584075667';

const DEFAULT_CAREER_GAMES = [
  { id: 'g-101', opponent: 'Stockfish Engine (Lvl 4)', mode: 'vs Computer', result: 'Won', method: 'Checkmate', moves: 32, ratingChange: '+18', date: 'Yesterday' },
  { id: 'g-102', opponent: 'MagnusFan99', mode: 'Online Match', result: 'Won', method: 'Resignation', moves: 24, ratingChange: '+14', date: '3 days ago' },
  { id: 'g-103', opponent: 'Alex_Rook', mode: 'Online Match', result: 'Lost', method: 'Time Out', moves: 45, ratingChange: '-11', date: '5 days ago' },
  { id: 'g-104', opponent: 'Guest_7841', mode: 'Two Players', result: 'Won', method: 'Checkmate', moves: 19, ratingChange: '+8', date: '1 week ago' },
];

export const DEFAULT_ACTIVE_USER = {
  id: 'usr_grandmaster',
  username: 'GrandmasterMaster',
  email: 'grandmaster@chesscure.com',
  rating: 2150,
  skill: 'advanced',
  title: 'Grandmaster',
  wins: 82,
  losses: 42,
  draws: 8,
  puzzlesSolved: 342,
  isGuest: false,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY) || localStorage.getItem('cc_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(token && user));
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? JSON.parse(saved) : {
        boardTheme: 'Dark Obsidian & Warm Gold Accent',
        pieceAudio: true,
        secretMoveNotifications: true,
        soundVolume: 80,
        showInstructions: true,
      };
    } catch {
      return {
        boardTheme: 'Dark Obsidian & Warm Gold Accent',
        pieceAudio: true,
        secretMoveNotifications: true,
        soundVolume: 80,
        showInstructions: true,
      };
    }
  });

  const [careerGames, setCareerGames] = useState(() => {
    try {
      const saved = localStorage.getItem(CAREER_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CAREER_GAMES;
    } catch {
      return DEFAULT_CAREER_GAMES;
    }
  });

  // Initialize Facebook SDK with App ID 1608757584075667
  useEffect(() => {
    if (!window.FB) {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v20.0',
        });
      };
      (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = 'https://connect.facebook.net/en_US/sdk.js';
        fjs.parentNode.insertBefore(js, fjs);
      })(document, 'script', 'facebook-jssdk');
    }
  }, []);

  // Verify backend session and load DB games/preferences on mount
  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) return;

      try {
        const res = await api.getMe(storedToken);
        if (res?.user) {
          setUser(res.user);
          setIsAuthenticated(true);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));

          // Fetch real games from DB
          try {
            const dbGames = await api.getGameHistory(storedToken);
            if (Array.isArray(dbGames) && dbGames.length > 0) {
              setCareerGames(dbGames);
            }
          } catch (e) {
            console.warn('Game history load warning:', e.message);
          }

          // Fetch preferences
          try {
            const dbPrefs = await api.getPreferences(storedToken);
            if (dbPrefs) {
              setPreferences(dbPrefs);
              localStorage.setItem(PREFERENCES_KEY, JSON.stringify(dbPrefs));
            }
          } catch (e) {
            console.warn('Preferences load warning:', e.message);
          }
        }
      } catch (err) {
        console.warn('Backend session restore warning:', err.message);
        // Clear invalid token
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    }

    restoreSession();
  }, []);

  // Sync user state to localStorage
  useEffect(() => {
    if (user && token) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem('cc_auth_user', JSON.stringify(user));
      setIsAuthenticated(true);
    } else if (!token) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('cc_auth_user');
      setIsAuthenticated(false);
    }
  }, [user, token]);

  useEffect(() => {
    localStorage.setItem(CAREER_KEY, JSON.stringify(careerGames));
  }, [careerGames]);

  useEffect(() => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  // Real Backend Login: surfaces real errors directly
  const login = async (identifierOrEmail, password, rememberMe = true) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const res = await api.login({
        email: identifierOrEmail,
        password,
        rememberMe,
      });

      if (res?.token && res?.user) {
        setToken(res.token);
        setUser(res.user);
        setIsAuthenticated(true);
        localStorage.setItem(TOKEN_KEY, res.token);

        // Fetch user's DB games & preferences
        try {
          const games = await api.getGameHistory(res.token);
          if (Array.isArray(games) && games.length > 0) {
            setCareerGames(games);
          }
          const prefs = await api.getPreferences(res.token);
          if (prefs) {
            setPreferences(prefs);
          }
        } catch (ignored) {}

        return { success: true, user: res.user };
      }
      throw new Error(res?.error || 'Invalid credentials.');
    } catch (err) {
      const message = err.message || 'Login failed. Please verify credentials.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Real Backend Registration: surfaces real errors directly
  const register = async ({ username, email, mobileNumber, password, skill }) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const res = await api.register({ username, email, mobileNumber, password, skill });
      if (res?.token && res?.user) {
        setToken(res.token);
        setUser(res.user);
        setIsAuthenticated(true);
        localStorage.setItem(TOKEN_KEY, res.token);
      }
      return { success: true, user: res?.user, message: res?.message };
    } catch (err) {
      const message = err.message || 'Registration failed. Please check your details.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // User Signup helper
  const signup = ({ username, identifier, password, skill }) => {
    const isEmail = identifier && identifier.includes('@');
    return register({
      username,
      email: isEmail ? identifier : `${identifier}@chesscure.com`,
      mobileNumber: !isEmail ? identifier : '',
      password,
      skill: skill || 'intermediate',
    });
  };

  // Social Login: Google
  const loginWithGoogle = async () => {
    try {
      const res = await api.loginWithGoogle();
      if (res?.user && res?.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem(TOKEN_KEY, res.token);
        setIsAuthenticated(true);
      }
      return { success: true, user: res.user };
    } catch (e) {
      setAuthError(e.message || 'Google authentication failed.');
      throw e;
    }
  };

  // Social Login: Facebook (Uses App ID 1608757584075667 with popup flow)
  const loginWithFacebook = () => {
    setAuthError(null);
    return new Promise((resolve, reject) => {
      // Check if FB SDK is loaded
      if (window.FB) {
        window.FB.login((response) => {
          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;
            // Fetch name, email, and high-res picture from Facebook Graph API
            window.FB.api('/me', { fields: 'id,name,email,picture.width(200)' }, async (userInfo) => {
              try {
                const avatarUrl = userInfo?.picture?.data?.url || null;
                const email = userInfo?.email || `fb_${userInfo?.id || Date.now()}@facebook.com`;
                const name = userInfo?.name || 'Facebook Grandmaster';

                const res = await api.loginWithFacebook({
                  accessToken,
                  email,
                  name,
                  avatar: avatarUrl,
                });

                if (res?.token && res?.user) {
                  setToken(res.token);
                  setUser(res.user);
                  setIsAuthenticated(true);
                  localStorage.setItem(TOKEN_KEY, res.token);
                  resolve({ success: true, user: res.user });
                } else {
                  throw new Error(res?.error || 'Facebook session creation failed.');
                }
              } catch (err) {
                setAuthError(err.message);
                reject(err);
              }
            });
          } else {
            const errorMsg = response?.status === 'not_authorized'
              ? 'Facebook permissions were not granted.'
              : 'Facebook sign-in was cancelled.';
            setAuthError(errorMsg);
            reject(new Error(errorMsg));
          }
        }, { scope: 'public_profile' });
      } else {
        // Fallback to backend simulated Facebook session if popup script is blocked
        api.loginWithFacebook()
          .then((res) => {
            if (res?.token && res?.user) {
              setToken(res.token);
              setUser(res.user);
              setIsAuthenticated(true);
              localStorage.setItem(TOKEN_KEY, res.token);
              resolve({ success: true, user: res.user });
            }
          })
          .catch((err) => {
            setAuthError(err.message);
            reject(err);
          });
      }
    });
  };

  // Guest Mode
  const continueAsGuest = async () => {
    try {
      const res = await api.continueAsGuest();
      if (res?.user && res?.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem(TOKEN_KEY, res.token);
        setIsAuthenticated(true);
      }
      return { success: true, user: res.user };
    } catch (e) {
      setAuthError(e.message || 'Guest login failed.');
      throw e;
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
    localStorage.removeItem('cc_auth_user');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  // Update profile via backend API
  const updateUserProfile = async (updates) => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      try {
        const res = await api.updateProfile(currentToken, updates);
        if (res?.user) {
          setUser(res.user);
          return res.user;
        }
      } catch (err) {
        console.warn('Backend profile update failed:', err.message);
      }
    }
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Update preferences via backend API
  const updatePreferencesHandler = async (newPrefs) => {
    const merged = { ...preferences, ...newPrefs };
    setPreferences(merged);
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      try {
        await api.updatePreferences(currentToken, newPrefs);
      } catch (err) {
        console.warn('Backend preferences sync failed:', err.message);
      }
    }
  };

  // Change password via backend API
  const changePasswordHandler = async (currentPassword, newPassword) => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (!currentToken) throw new Error('You must be signed in to change password.');
    return await api.changePassword(currentToken, { currentPassword, newPassword });
  };

  // Record game and sync to database
  const recordGameResult = async (gameData) => {
    setCareerGames((prev) => [gameData, ...prev]);

    // Send to backend database
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      try {
        await api.recordGame(currentToken, {
          opponent: gameData.opponent,
          mode: gameData.mode,
          result: gameData.result,
          method: gameData.method,
          moves: gameData.moves,
          ratingChange: gameData.ratingChange,
        });
      } catch (e) {
        console.warn('Backend record game warning:', e.message);
      }
    }

    if (user) {
      setUser((prev) => {
        if (!prev) return prev;
        const isWin = gameData.result === 'Won';
        const isLoss = gameData.result === 'Lost';
        const ratingDiff = parseInt(gameData.ratingChange) || 0;
        return {
          ...prev,
          rating: Math.max(800, (prev.rating || 1200) + ratingDiff),
          wins: isWin ? (prev.wins || 0) + 1 : prev.wins || 0,
          losses: isLoss ? (prev.losses || 0) + 1 : prev.losses || 0,
          draws: !isWin && !isLoss ? (prev.draws || 0) + 1 : prev.draws || 0,
        };
      });
    }
  };

  const clearError = () => setAuthError(null);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    authError,
    preferences,
    careerGames,
    login,
    register,
    signup,
    loginWithGoogle,
    loginWithFacebook,
    continueAsGuest,
    logout,
    updateUserProfile,
    updatePreferences: updatePreferencesHandler,
    changePassword: changePasswordHandler,
    recordGameResult,
    clearError,
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
