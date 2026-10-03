/**
 * Chess Cure PMS API Service
 * Handles communication with the backend authentication endpoints.
 */

const BASE_URL = '/api';

export const api = {
  /**
   * Register a new user
   * @param {Object} data { username, email, mobileNumber, password, skill }
   */
  async register({ username, email, mobileNumber, password, skill }) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        mobileNumber,
        password,
        skill,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed. Please check your details.');
    }
    return data;
  },

  /**
   * Authenticate user with email and password
   * @param {Object} data { email, password, rememberMe }
   */
  async login({ email, password, rememberMe = true }) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        rememberMe,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials. Please verify and try again.');
    }
    return data;
  },

  /**
   * Fetch current authenticated user session profile
   * @param {string} token
   */
  async getMe(token) {
    if (!token) throw new Error('No token provided');
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Session expired. Please log in again.');
    }
    return data;
  },

  /**
   * Terminate user session
   * @param {string} token
   */
  async logout(token) {
    if (!token) return { success: true };
    try {
      const res = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await res.json().catch(() => ({ success: true }));
    } catch (err) {
      console.warn('Logout network notification failed, local state will still clear:', err);
      return { success: true };
    }
  },

  /**
   * Authenticate via Google
   */
  async loginWithGoogle(payload = {}) {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Google login failed.');
    return data;
  },

  /**
   * Authenticate via Facebook
   */
  async loginWithFacebook(payload = {}) {
    const res = await fetch(`${BASE_URL}/auth/facebook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Facebook login failed.');
    return data;
  },

  /**
   * Instant guest login
   */
  async continueAsGuest(payload = {}) {
    const res = await fetch(`${BASE_URL}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Guest login failed.');
    return data;
  },

  /**
   * Fetch user game stats
   * @param {string} token
   */
  async getProfileStats(token) {
    if (!token) throw new Error('No token provided');
    const res = await fetch(`${BASE_URL}/profile/stats`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to fetch game statistics.');
    return data;
  },

  /**
   * Fetch user game history
   * @param {string} token
   */
  async getGameHistory(token) {
    if (!token) return [];
    const res = await fetch(`${BASE_URL}/profile/games`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) return [];
    return data;
  },

  /**
   * Record a completed game
   * @param {string} token
   * @param {Object} gameData
   */
  async recordGame(token, gameData) {
    if (!token) return null;
    const res = await fetch(`${BASE_URL}/profile/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(gameData),
    });
    const data = await res.json().catch(() => null);
    return data;
  },

  /**
   * Update authenticated user profile
   * @param {string} token
   * @param {Object} profileData
   */
  async updateProfile(token, profileData) {
    if (!token) throw new Error('No token provided');
    const res = await fetch(`${BASE_URL}/profile/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
    return data;
  },

  /**
   * Fetch user platform preferences
   * @param {string} token
   */
  async getPreferences(token) {
    if (!token) return null;
    const res = await fetch(`${BASE_URL}/settings/preferences`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json().catch(() => null);
    return data;
  },

  /**
   * Update user platform preferences
   * @param {string} token
   * @param {Object} preferences
   */
  async updatePreferences(token, preferences) {
    if (!token) return null;
    const res = await fetch(`${BASE_URL}/settings/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(preferences),
    });
    const data = await res.json().catch(() => null);
    return data;
  },

  /**
   * Change user password
   * @param {string} token
   * @param {Object} data { currentPassword, newPassword }
   */
  async changePassword(token, { currentPassword, newPassword }) {
    if (!token) throw new Error('No token provided');
    const res = await fetch(`${BASE_URL}/settings/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Password update failed.');
    return data;
  },
};

export default api;
