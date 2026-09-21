import { 
  findUserByEmail, 
  findUserByUsername, 
  createUser, 
  verifyPassword, 
  createSession, 
  getSessionUser, 
  deleteSession 
} from './db.js';

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    // If body is already parsed by prior middleware
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) {
        return resolve({});
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format in request body.'));
      }
    });
    req.on('error', err => reject(err));
  });
}

function getBearerToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
}

export async function handleAuthRequest(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return true;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Health Check
  if (pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
    return true;
  }

  // 1. REGISTER ENDPOINT
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { username, email, mobileNumber, password, skill } = body;

      if (!username || !username.trim()) {
        sendJson(res, 400, { error: 'Username is required.' });
        return true;
      }
      if (!email || !email.trim()) {
        sendJson(res, 400, { error: 'Email address is required.' });
        return true;
      }
      if (!mobileNumber || !mobileNumber.trim()) {
        sendJson(res, 400, { error: 'Mobile number is required.' });
        return true;
      }
      if (!password) {
        sendJson(res, 400, { error: 'Password is required.' });
        return true;
      }

      const cleanUsername = username.trim();
      const cleanEmail = email.trim();
      const cleanMobile = mobileNumber.trim();

      if (cleanUsername.length < 3) {
        sendJson(res, 400, { error: 'Username must be at least 3 characters long.' });
        return true;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        sendJson(res, 400, { error: 'Please enter a valid email address.' });
        return true;
      }

      const phoneClean = cleanMobile.replace(/[\s\-()]/g, '');
      if (!/^\+?[0-9]{7,15}$/.test(phoneClean)) {
        sendJson(res, 400, { error: 'Please enter a valid mobile number (7 to 15 digits).' });
        return true;
      }

      if (password.length < 6) {
        sendJson(res, 400, { error: 'Password must be at least 6 characters long.' });
        return true;
      }

      const existingEmail = findUserByEmail(cleanEmail);
      if (existingEmail) {
        sendJson(res, 409, { error: 'An account with this email address already exists.' });
        return true;
      }

      const existingUsername = findUserByUsername(cleanUsername);
      if (existingUsername) {
        sendJson(res, 409, { error: 'This username is already taken. Please choose another.' });
        return true;
      }

      const newUser = createUser({
        username: cleanUsername,
        email: cleanEmail,
        mobileNumber: cleanMobile,
        password,
        skill: skill || 'intermediate'
      });

      console.log(`[AUTH] Registered user: ${newUser.username} (${newUser.email})`);

      sendJson(res, 201, {
        success: true,
        message: 'Account created successfully! Please sign in.',
        user: newUser
      });
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      sendJson(res, 500, { error: err.message || 'Internal server error while registering.' });
      return true;
    }
  }

  // 2. LOGIN ENDPOINT
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { email, password, rememberMe } = body;

      if (!email || !email.trim()) {
        sendJson(res, 400, { error: 'Email is required.' });
        return true;
      }
      if (!password) {
        sendJson(res, 400, { error: 'Password is required.' });
        return true;
      }

      const cleanEmail = email.trim();
      const user = findUserByEmail(cleanEmail);

      if (!user) {
        sendJson(res, 401, { error: 'Invalid email or password.' });
        return true;
      }

      const isMatch = verifyPassword(user, password);
      if (!isMatch) {
        sendJson(res, 401, { error: 'Invalid email or password.' });
        return true;
      }

      const session = createSession(user.id, rememberMe !== false);
      console.log(`[AUTH] User logged in: ${user.username} (${user.email})`);

      const safeUser = {
        id: user.id,
        username: user.username,
        name: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        phone: user.mobileNumber,
        rating: user.rating,
        skill: user.skill,
        playerId: user.playerId,
        createdAt: user.createdAt
      };

      sendJson(res, 200, {
        success: true,
        message: 'Login successful.',
        token: session.token,
        user: safeUser
      });
      return true;
    } catch (err) {
      console.error('Login error:', err);
      sendJson(res, 500, { error: err.message || 'Internal server error while logging in.' });
      return true;
    }
  }

  // 3. GET CURRENT USER (ME) ENDPOINT
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    try {
      const token = getBearerToken(req);
      if (!token) {
        sendJson(res, 401, { error: 'No authorization token provided.' });
        return true;
      }

      const user = getSessionUser(token);
      if (!user) {
        sendJson(res, 401, { error: 'Invalid or expired session. Please sign in again.' });
        return true;
      }

      sendJson(res, 200, {
        success: true,
        user
      });
      return true;
    } catch (err) {
      console.error('Get user error:', err);
      sendJson(res, 500, { error: 'Internal server error while fetching session profile.' });
      return true;
    }
  }

  // 4. LOGOUT ENDPOINT
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    try {
      const token = getBearerToken(req);
      if (token) {
        deleteSession(token);
        console.log(`[AUTH] Session ended: ${token.substring(0, 10)}...`);
      }

      sendJson(res, 200, {
        success: true,
        message: 'Successfully logged out.'
      });
      return true;
    } catch (err) {
      console.error('Logout error:', err);
      sendJson(res, 500, { error: 'Internal server error while logging out.' });
      return true;
    }
  }

  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { error: `Endpoint ${req.method} ${pathname} not found.` });
    return true;
  }

  return false;
}
