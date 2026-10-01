"""
Interactive Web Portal for ChessCure PMS Backend.
Served directly at http://127.0.0.1:8000/ so users can create accounts,
log in, view stored data, test social auth, update profiles (PUT), and delete accounts (DELETE).
OTP has been completely removed as requested.
"""

def get_portal_html() -> str:
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChessCure - Live Backend Auth Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #070d19;
      --card-bg: #0d172a;
      --card-border: #1e293b;
      --primary: #e5a93c;
      --primary-hover: #f5b94e;
      --accent-blue: #38bdf8;
      --accent-green: #34d399;
      --accent-red: #f87171;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --input-bg: #050913;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: radial-gradient(circle at 10% 20%, #101c38 0%, #070d19 90%);
      color: var(--text-main);
      min-height: 100vh;
      padding: 24px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 24px; border-bottom: 1px solid var(--card-border); margin-bottom: 24px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo-badge {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #e5a93c, #b47b19);
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      font-size: 24px; color: #000; font-weight: 800;
    }
    .brand-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .brand-title span { color: var(--primary); }
    .badge {
      display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700;
      border-radius: 20px; text-transform: uppercase;
    }
    .badge-live {
      background: rgba(52, 211, 153, 0.15); color: var(--accent-green);
      border: 1px solid rgba(52, 211, 153, 0.3);
    }
    .alert-box {
      display: none; padding: 14px 18px; border-radius: 12px; margin-bottom: 20px;
      font-size: 14px; font-weight: 600;
    }
    .alert-success { background: rgba(52, 211, 153, 0.12); border: 1px solid rgba(52, 211, 153, 0.35); color: var(--accent-green); }
    .alert-error { background: rgba(248, 113, 113, 0.12); border: 1px solid rgba(248, 113, 113, 0.35); color: var(--accent-red); }
    .tabs {
      display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;
      background: rgba(13, 23, 42, 0.8); padding: 6px; border-radius: 14px; border: 1px solid var(--card-border);
    }
    .tab-btn {
      background: transparent; border: none; color: var(--text-muted);
      padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600;
      font-family: inherit; cursor: pointer; transition: all 0.2s;
    }
    .tab-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }
    .tab-btn.active { background: var(--primary); color: #000; font-weight: 700; }
    .main-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 24px; }
    @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
    .card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 20px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    .card-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; display: flex; justify-content: space-between; }
    .card-sub { color: var(--text-muted); font-size: 13px; margin-bottom: 20px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; }
    input, select {
      width: 100%; padding: 12px 14px; background: var(--input-bg);
      border: 1px solid #1e293b; border-radius: 12px; color: #fff;
      font-size: 14px; font-family: inherit; outline: none;
    }
    input:focus, select:focus { border-color: var(--primary); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .btn {
      width: 100%; padding: 13px 20px; border-radius: 12px; border: none;
      font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-primary { background: linear-gradient(135deg, var(--primary), var(--primary-hover)); color: #000; }
    .btn-secondary { background: #1e293b; color: #fff; border: 1px solid #334155; }
    .btn-danger { background: rgba(248, 113, 113, 0.15); color: var(--accent-red); border: 1px solid rgba(248, 113, 113, 0.3); }
    .btn-google { background: #fff; color: #1f2937; margin-bottom: 10px; }
    .btn-facebook { background: #1877f2; color: #fff; margin-bottom: 10px; }
    .btn-guest { background: rgba(229, 169, 60, 0.15); color: var(--primary); border: 1px solid rgba(229, 169, 60, 0.3); }
    .logged-user-card {
      display: none; background: #091322; border: 1px solid rgba(52, 211, 153, 0.3);
      border-radius: 16px; padding: 18px; margin-top: 18px;
    }
    .console-box {
      background: #040711; border: 1px solid #1e293b; border-radius: 14px;
      padding: 16px; font-family: 'JetBrains Mono', monospace; font-size: 12px;
      max-height: 480px; overflow-y: auto; color: #a7f3d0; line-height: 1.5;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .quick-actions { display: flex; gap: 8px; margin-top: 12px; }
    .quick-btn {
      background: transparent; border: 1px dashed #334155; color: var(--text-muted);
      padding: 6px 12px; border-radius: 8px; font-size: 11px; cursor: pointer;
    }
    .user-list-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px; background: var(--input-bg); border: 1px solid #1e293b;
      border-radius: 12px; margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="logo-badge">♞</div>
        <div>
          <div class="brand-title">Chess<span>Cure</span> Backend</div>
          <p style="font-size: 12px; color: var(--text-muted);">Unified SQLite Backend & Auth Control Center</p>
        </div>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span class="badge badge-live">● SQLite Active</span>
        <a href="http://localhost:3000" target="_blank" style="color: var(--primary); font-size: 13px; font-weight: 600; text-decoration: none; padding: 6px 14px; border: 1px solid var(--primary); border-radius: 8px;">Open Frontend (Port 3000) ↗</a>
        <a href="/docs" target="_blank" style="color: #fff; font-size: 13px; text-decoration: none; padding: 6px 14px; border: 1px solid #334155; border-radius: 8px;">Swagger /docs ↗</a>
      </div>
    </header>

    <div id="globalAlert" class="alert-box"></div>

    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('register-tab', this)">📝 1. Create Own Account (POST)</button>
      <button class="tab-btn" onclick="switchTab('login-tab', this)" id="loginTabBtn">🔑 2. Login (POST)</button>
      <button class="tab-btn" onclick="switchTab('social-tab', this)">🌐 3. Social / Guest</button>
      <button class="tab-btn" onclick="switchTab('profile-tab', this)">👤 4. Profile & Update (GET / PUT)</button>
      <button class="tab-btn" onclick="switchTab('users-tab', this)" id="tabUsersBtn">👥 5. SQLite Users & Delete (GET / DELETE)</button>
    </div>

    <div class="main-grid">
      <div class="card">
        <!-- 1. SIGNUP FORM -->
        <div id="register-tab" class="tab-content active">
          <div class="card-title">Create Account in SQLite Database <span class="badge" style="background:#1e293b; color:var(--accent-green);">POST /api/auth/register</span></div>
          <p class="card-sub">No OTP required. Account is saved directly into backend SQLite database.</p>
          <form id="registerForm" onsubmit="handleRegister(event)">
            <div class="form-group">
              <label>Username</label>
              <input type="text" id="regUsername" placeholder="e.g. DiwakarChess" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="regEmail" placeholder="diwa@example.com" required />
              </div>
              <div class="form-group">
                <label>Mobile Number (Optional)</label>
                <input type="tel" id="regMobile" placeholder="+91 9876543210" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Skill Level</label>
                <select id="regSkill">
                  <option value="beginner">Beginner (Rating ~850)</option>
                  <option value="intermediate" selected>Intermediate (Rating ~1350)</option>
                  <option value="advanced">Advanced (Rating ~1750)</option>
                  <option value="master">Grandmaster (Rating ~2150)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" id="regPassword" placeholder="Min 6 characters" required />
              </div>
            </div>
            <button type="submit" class="btn btn-primary">Create Account & Store in SQLite (POST)</button>
          </form>
        </div>

        <!-- 2. LOGIN FORM -->
        <div id="login-tab" class="tab-content">
          <div class="card-title">User Login <span class="badge" style="background:#1e293b; color:var(--accent-blue);">POST /api/auth/login</span></div>
          <p class="card-sub">Login with Email, Username, or Mobile + Password.</p>
          <form id="loginForm" onsubmit="handleLogin(event)">
            <div class="form-group">
              <label>Email / Username / Mobile</label>
              <input type="text" id="loginIdentifier" placeholder="Email, username, or phone" required />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="loginPassword" placeholder="••••••••" required />
            </div>
            <button type="submit" class="btn btn-primary">Sign In & Load Stored Data (POST)</button>
          </form>

          <div style="margin-top: 18px;">
            <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">One-click demo autofill:</p>
            <div class="quick-actions">
              <button class="quick-btn" onclick="demoLogin('grandmaster@chesscure.com', 'Checkmate2026!')">⚡ Demo Grandmaster</button>
              <button class="quick-btn" onclick="demoLogin('master@chesscure.com', 'Checkmate2026!')">⚡ Demo Master</button>
            </div>
          </div>

          <div id="loggedInUserCard" class="logged-user-card">
            <h3 id="cardUsername" style="font-size: 16px; font-weight: 700; color: #fff;">-</h3>
            <p id="cardEmail" style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">-</p>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <span id="cardRating" style="background:#1e293b; padding:4px 8px; border-radius:6px; font-size:12px; color:var(--primary);">Rating: -</span>
              <span id="cardPlayerId" style="background:#1e293b; padding:4px 8px; border-radius:6px; font-size:12px; color:var(--accent-blue);">ID: -</span>
            </div>
            <p id="cardToken" style="font-family: 'JetBrains Mono', monospace; color: var(--accent-blue); word-break: break-all; font-size: 10px;">-</p>
          </div>
        </div>

        <!-- 3. SOCIAL / GUEST -->
        <div id="social-tab" class="tab-content">
          <div class="card-title">Social & Instant Guest Auth</div>
          <p class="card-sub">All social and guest logins are stored in SQLite database.</p>
          <button class="btn btn-google" onclick="handleSocial('google')">Continue with Google (POST /api/auth/google)</button>
          <button class="btn btn-facebook" onclick="handleSocial('facebook')">Continue with Facebook (POST /api/auth/facebook)</button>
          <button class="btn btn-guest" onclick="handleSocial('guest')">⚡ Play Instantly as Guest (POST /api/auth/guest)</button>
        </div>

        <!-- 4. PROFILE & UPDATE -->
        <div id="profile-tab" class="tab-content">
          <div class="card-title">Profile & Update <span class="badge" style="background:#1e293b; color:var(--primary);">GET & PUT</span></div>
          <div class="form-group">
            <label>Bearer Token</label>
            <input type="text" id="activeToken" placeholder="Login first or paste your token here" />
          </div>
          <button class="btn btn-secondary" onclick="fetchProfile()" style="margin-bottom:16px;">Fetch Profile (GET /api/auth/me)</button>
          <div class="form-row">
            <div class="form-group">
              <label>New Username</label>
              <input type="text" id="updateUsername" placeholder="New display name" />
            </div>
            <div class="form-group">
              <label>New Title</label>
              <input type="text" id="updateTitle" placeholder="e.g. Grandmaster Supreme" />
            </div>
          </div>
          <button class="btn btn-primary" onclick="updateProfile()">Save Updates (PUT /api/auth/me)</button>
        </div>

        <!-- 5. USERS & DELETE -->
        <div id="users-tab" class="tab-content">
          <div class="card-title">SQLite Database Accounts <span class="badge" style="background:#1e293b; color:var(--accent-red);">GET / DELETE</span></div>
          <button class="btn btn-secondary" onclick="loadAllUsers()" style="margin-bottom: 16px;">🔄 Refresh Accounts from SQLite</button>
          <div id="usersListContainer">
            <p style="font-size: 13px; color: var(--text-muted);">Click button to load stored accounts.</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span style="font-size: 14px; font-weight: 700; color: #cbd5e1;">Live Backend Output Console</span>
          <span id="responseStatus" class="badge badge-live">READY</span>
        </div>
        <div class="console-box" id="consoleOutput">
// Live API response from SQLite backend will appear here...
        </div>
        <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: center;">
          <button class="quick-btn" onclick="clearConsole()">Clear Output</button>
          <span style="font-size: 11px; color: var(--text-muted);">Database: SQLite (chess_cure.db)</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentToken = localStorage.getItem('cc_portal_token') || '';
    if (currentToken && document.getElementById('activeToken')) {
      document.getElementById('activeToken').value = currentToken;
    }

    function showAlert(msg, isSuccess = true) {
      const el = document.getElementById('globalAlert');
      el.textContent = msg;
      el.className = 'alert-box ' + (isSuccess ? 'alert-success' : 'alert-error');
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 5000);
    }

    function switchTab(tabId, btn) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      if (btn) btn.classList.add('active');
      if (tabId === 'users-tab') loadAllUsers();
    }

    function displayOutput(status, data, method, url) {
      document.getElementById('responseStatus').textContent = `${method} ${status}`;
      const out = { request: { method, url }, status, timestamp: new Date().toLocaleTimeString(), response: data };
      document.getElementById('consoleOutput').textContent = JSON.stringify(out, null, 2);
    }

    function clearConsole() {
      document.getElementById('consoleOutput').textContent = '// Console cleared.';
      document.getElementById('responseStatus').textContent = 'READY';
    }

    async function handleRegister(e) {
      e.preventDefault();
      const body = {
        username: document.getElementById('regUsername').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        mobileNumber: document.getElementById('regMobile').value.trim() || null,
        skill: document.getElementById('regSkill').value,
        password: document.getElementById('regPassword').value
      };
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        const data = await res.json();
        displayOutput(res.status, data, 'POST', '/api/auth/register');
        if (res.ok && data.success) {
          showAlert(`🎉 Account created for ${body.username}! Saved to SQLite database.`, true);
          document.getElementById('loginIdentifier').value = body.email;
          document.getElementById('loginPassword').value = body.password;
          if (data.token) saveToken(data.token);
          switchTab('login-tab', document.getElementById('loginTabBtn'));
        } else {
          showAlert(data.error || 'Registration failed.', false);
        }
      } catch (err) {
        displayOutput(500, { error: err.message }, 'POST', '/api/auth/register');
      }
    }

    async function handleLogin(e) {
      if (e && e.preventDefault) e.preventDefault();
      const email = document.getElementById('loginIdentifier').value.trim();
      const password = document.getElementById('loginPassword').value;
      const body = { email, password, rememberMe: true };
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        const data = await res.json();
        displayOutput(res.status, data, 'POST', '/api/auth/login');
        if (res.ok && data.success) {
          showAlert(`✅ Successfully logged in! Welcome back, ${data.user.username}.`, true);
          if (data.token) saveToken(data.token);
          const card = document.getElementById('loggedInUserCard');
          card.style.display = 'block';
          document.getElementById('cardUsername').textContent = data.user.username + (data.user.title ? ` (${data.user.title})` : '');
          document.getElementById('cardEmail').textContent = `Email: ${data.user.email} | Mobile: ${data.user.mobileNumber || data.user.phone || 'N/A'}`;
          document.getElementById('cardRating').textContent = `Rating: ${data.user.rating || 1200}`;
          document.getElementById('cardPlayerId').textContent = `ID: ${data.user.playerId || 'CC-ACTIVE'}`;
          document.getElementById('cardToken').textContent = data.token;
        } else {
          showAlert(data.error || 'Invalid credentials.', false);
        }
      } catch (err) {
        displayOutput(500, { error: err.message }, 'POST', '/api/auth/login');
      }
    }

    function demoLogin(email, pwd) {
      document.getElementById('loginIdentifier').value = email;
      document.getElementById('loginPassword').value = pwd;
      handleLogin(new Event('submit'));
    }

    async function handleSocial(provider) {
      const endpoint = `/api/auth/${provider}`;
      const body = provider === 'guest' ? { username: 'GuestChallenger' } : {};
      try {
        const res = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        const data = await res.json();
        displayOutput(res.status, data, 'POST', endpoint);
        if (data.token) {
          saveToken(data.token);
          showAlert(`✅ Logged in via ${provider.toUpperCase()}! Stored in SQLite.`, true);
        }
      } catch (err) {
        displayOutput(500, { error: err.message }, 'POST', endpoint);
      }
    }

    function saveToken(token) {
      currentToken = token;
      localStorage.setItem('cc_portal_token', token);
      if (document.getElementById('activeToken')) document.getElementById('activeToken').value = token;
    }

    async function fetchProfile() {
      const token = (document.getElementById('activeToken') && document.getElementById('activeToken').value.trim()) || currentToken;
      if (!token) return alert('Please login first.');
      try {
        const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        displayOutput(res.status, data, 'GET', '/api/auth/me');
      } catch (err) {
        displayOutput(500, { error: err.message }, 'GET', '/api/auth/me');
      }
    }

    async function updateProfile() {
      const token = (document.getElementById('activeToken') && document.getElementById('activeToken').value.trim()) || currentToken;
      if (!token) return alert('Please login first.');
      const body = {};
      const u = document.getElementById('updateUsername').value.trim();
      const t = document.getElementById('updateTitle').value.trim();
      if (u) body.username = u;
      if (t) body.title = t;
      try {
        const res = await fetch('/api/auth/me', {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        displayOutput(res.status, data, 'PUT', '/api/auth/me');
        if (res.ok) showAlert('Profile updated in SQLite!', true);
      } catch (err) {
        displayOutput(500, { error: err.message }, 'PUT', '/api/auth/me');
      }
    }

    async function loadAllUsers() {
      try {
        const res = await fetch('/api/auth/users');
        const data = await res.json();
        displayOutput(res.status, data, 'GET', '/api/auth/users');
        const container = document.getElementById('usersListContainer');
        container.innerHTML = '';
        if (data.users && data.users.length) {
          data.users.forEach(u => {
            const div = document.createElement('div');
            div.className = 'user-list-item';
            div.innerHTML = `
              <div>
                <strong>${u.username}</strong> (${u.email}) [Rating: ${u.rating || 1200}]
              </div>
              <button class="btn btn-danger" style="width:auto; padding:4px 10px; font-size:11px;" onclick="deleteUser('${u.id}')">Delete</button>
            `;
            container.appendChild(div);
          });
        }
      } catch (err) {
        displayOutput(500, { error: err.message }, 'GET', '/api/auth/users');
      }
    }

    async function deleteUser(userId) {
      if (!confirm(`Delete user ${userId}?`)) return;
      try {
        const res = await fetch(`/api/auth/user/${userId}`, { method: 'DELETE' });
        const data = await res.json();
        displayOutput(res.status, data, 'DELETE', `/api/auth/user/${userId}`);
        loadAllUsers();
      } catch (err) {
        displayOutput(500, { error: err.message }, 'DELETE', `/api/auth/user/${userId}`);
      }
    }
  </script>
</body>
</html>
"""
