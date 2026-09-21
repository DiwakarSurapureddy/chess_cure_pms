import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'chesscure_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Database Structure
const initialData = {
  users: [],
  sessions: []
};

function loadDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return { ...initialData };
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
    };
  } catch (err) {
    console.error('Error loading database file, initializing default:', err);
    return { ...initialData };
  }
}

function saveDatabase(data) {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error persisting database:', err);
    throw err;
  }
}

let db = loadDatabase();

// Seed default demo user if users list is empty
if (db.users.length === 0) {
  const demoSalt = crypto.randomBytes(16).toString('hex');
  const demoPasswordHash = crypto.scryptSync('Checkmate2026!', demoSalt, 64).toString('hex');
  const demoUser = {
    id: crypto.randomUUID(),
    username: 'GrandmasterMaster',
    email: 'master@chesscure.com',
    mobileNumber: '+1 (555) 019-2834',
    passwordHash: demoPasswordHash,
    salt: demoSalt,
    skill: 'master',
    rating: 2150,
    playerId: 'CC-994120',
    createdAt: new Date().toISOString()
  };
  db.users.push(demoUser);
  saveDatabase(db);
}

export function getSafeUser(user) {
  if (!user) return null;
  const { passwordHash, salt, ...safeUser } = user;
  return {
    ...safeUser,
    name: safeUser.username,
    phone: safeUser.mobileNumber
  };
}

export function findUserByEmail(email) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return db.users.find(u => u.email.toLowerCase() === normalized) || null;
}

export function findUserByUsername(username) {
  if (!username) return null;
  const normalized = username.trim().toLowerCase();
  return db.users.find(u => u.username.toLowerCase() === normalized) || null;
}

export function findUserById(id) {
  if (!id) return null;
  return db.users.find(u => u.id === id) || null;
}

export function createUser({ username, email, mobileNumber, password, skill = 'intermediate' }) {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanMobile = mobileNumber.trim();

  // Generate salt and hash
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');

  // Skill to rating mapping
  let defaultRating = 1540;
  if (skill === 'beginner') defaultRating = 850;
  else if (skill === 'intermediate') defaultRating = 1350;
  else if (skill === 'advanced') defaultRating = 1750;
  else if (skill === 'master') defaultRating = 2150;

  const newUser = {
    id: crypto.randomUUID(),
    username: cleanUsername,
    email: cleanEmail,
    mobileNumber: cleanMobile,
    passwordHash,
    salt,
    skill,
    rating: defaultRating,
    playerId: `CC-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDatabase(db);

  return getSafeUser(newUser);
}

export function verifyPassword(user, password) {
  if (!user || !user.passwordHash || !user.salt || !password) {
    return false;
  }
  try {
    const computedHash = crypto.scryptSync(password, user.salt, 64).toString('hex');
    const storedBuf = Buffer.from(user.passwordHash, 'hex');
    const computedBuf = Buffer.from(computedHash, 'hex');
    if (storedBuf.length !== computedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(storedBuf, computedBuf);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

export function createSession(userId, rememberMe = true) {
  const token = `cc_${crypto.randomBytes(32).toString('hex')}`;
  const now = new Date();
  // 30 days if rememberMe, 24 hours otherwise
  const expiryDays = rememberMe ? 30 : 1;
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

  // Purge any expired sessions
  const validSessions = db.sessions.filter(s => new Date(s.expiresAt) > now);
  validSessions.push({
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt
  });

  db.sessions = validSessions;
  saveDatabase(db);

  return { token, expiresAt };
}

export function getSessionUser(token) {
  if (!token) return null;
  const now = new Date();
  const session = db.sessions.find(s => s.token === token && new Date(s.expiresAt) > now);
  if (!session) return null;

  const user = findUserById(session.userId);
  return getSafeUser(user);
}

export function deleteSession(token) {
  if (!token) return;
  db.sessions = db.sessions.filter(s => s.token !== token);
  saveDatabase(db);
}
