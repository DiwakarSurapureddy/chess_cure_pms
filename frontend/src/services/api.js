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
};

export default api;
