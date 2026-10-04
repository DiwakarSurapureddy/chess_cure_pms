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

  /**
   * Play move against backend Chess Engine
   * @param {Object} data { from_square, to_square }
   */
  async makeEngineMove({ from_square, to_square }) {
    const res = await fetch(`${BASE_URL}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_square, to_square }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.error || 'Failed to make engine move');
    return data;
  },

  /**
   * Create a new match in backend Game Service
   * @param {Object} data { player1, player2 }
   */
  async createBackendGame({ player1 = 'Player', player2 = 'Computer' } = {}) {
    const res = await fetch(`${BASE_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player1, player2 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Failed to create backend game');
    return data;
  },

  /**
   * Play vs Computer through backend game instance
   * @param {string} gameId
   * @param {Object} data { from_square, to_square, difficulty }
   */
  async playComputerGame(gameId, { from_square, to_square, difficulty = 'easy' }) {
    const res = await fetch(`${BASE_URL}/games/${gameId}/play-computer?difficulty=${encodeURIComponent(difficulty)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_square, to_square }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Computer move failed');
    return data;
  },

  /**
   * Fetch random challenge from backend
   * @param {string} difficulty
   */
  async getRandomChallenge(difficulty = 'easy') {
    const res = await fetch(`${BASE_URL}/challenges/random?difficulty=${encodeURIComponent(difficulty)}`, {
      method: 'POST',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch challenge');
    return data;
  },

  /**
   * Validate challenge solution with backend
   * @param {string} challengeId
   * @param {string} move
   */
  async solveChallenge(challengeId, move) {
    const res = await fetch(`${BASE_URL}/challenges/${challengeId}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Failed to solve challenge');
    return data;
  },

  /**
   * Look up player by Game ID
   * @param {string} gameId
   */
  async getPlayerByGameId(gameId) {
    const res = await fetch(`${BASE_URL}/profile/player/${encodeURIComponent(gameId)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.error || `Player #${gameId} not found`);
    return data;
  },

  /**
   * Send friend request to player by Game ID or username
   */
  async sendFriendRequest(token, { target_player_id, target_username }) {
    if (!token) throw new Error('You must be signed in to send friend requests.');
    const res = await fetch(`${BASE_URL}/friends/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ target_player_id, target_username }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.error || 'Failed to send friend request.');
    return data;
  },

  /**
   * Get incoming friend notifications
   */
  async getFriendNotifications(token) {
    if (!token) return { count: 0, notifications: [] };
    const res = await fetch(`${BASE_URL}/friends/notifications`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({ count: 0, notifications: [] }));
    return data;
  },

  /**
   * Respond to friend request (accept / decline)
   */
  async respondFriendRequest(token, { request_id, action }) {
    if (!token) throw new Error('Authentication required.');
    const res = await fetch(`${BASE_URL}/friends/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ request_id, action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.error || 'Failed to respond to request.');
    return data;
  },

  /**
   * Get list of accepted friends
   */
  async getFriendsList(token) {
    if (!token) return { count: 0, friends: [] };
    const res = await fetch(`${BASE_URL}/friends/list`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({ count: 0, friends: [] }));
    return data;
  },

  /**
   * Send online match challenge to friend
   */
  async sendMatchChallenge(token, { target_player_id, target_username }) {
    if (!token) throw new Error('Authentication required to challenge players.');
    const res = await fetch(`${BASE_URL}/friends/challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ target_player_id, target_username }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.error || 'Failed to send match challenge.');
    return data;
  },

  /**
   * Respond to incoming match challenge
   */
  async respondMatchChallenge(token, { challenge_id, action }) {
    if (!token) throw new Error('Authentication required.');
    const res = await fetch(`${BASE_URL}/friends/challenge/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ challenge_id, action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.error || 'Failed to respond to challenge.');
    return data;
  },

  /**
   * Check status of match challenge
   */
  async getChallengeStatus(token, gameId) {
    if (!token) return { success: false, status: 'unknown' };
    const res = await fetch(`${BASE_URL}/friends/challenge/status/${encodeURIComponent(gameId)}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({ success: false, status: 'unknown' }));
    return data;
  },
};

export default api;
