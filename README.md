# ♞ ChessCure

> A modern, full-stack chess career and player performance management system built with **React 18 (Vite)** on the frontend and **FastAPI (Python)** with **PostgreSQL / SQLite** on the backend. Designed to run smoothly and consistently across **Windows**, **Linux**, **macOS**, and **Docker**.

---

## 🌟 Key Features

- **Interactive Chess Gameplay**: Play vs Computer (Easy, Medium, Hard) or Live 2-Player Online via WebSockets.
- **In-Game Secret Chat Unlock**:
  - Captures on moves 1–3 do not unlock chat.
  - A legal opponent piece capture on individual **Move 4 or 5** unlocks an interactive 5-minute chat session.
  - Both players share an authoritative server expiry countdown.
  - Upon expiry, return to the exact same chessboard with full game state and history preserved.
- **Paid Extension**: Extend active chat sessions by +5 minutes through ₹10 demo payment.
- **Persistent Chat History**: User-to-user conversation history persisted in the database across page refreshes.
- **Modern Authentication**: Secure JWT-based auth, password hashing via bcrypt, and OTP verification (email/SMS).
- **Cross-Platform Ready**: 1-click startup for Windows (`start.bat`), 1-command startup for Linux/macOS (`start.sh`), and zero-install Docker orchestration.

---

## 📁 Project Structure

```text
chess_cure_pms/
├── start.bat              # ⚡ 1-Click Startup script for Windows
├── start.sh               # ⚡ 1-Command Startup script for Linux / macOS / WSL
├── docker-compose.yml     # 🐳 Universal Docker container orchestration
├── .gitattributes         # Cross-platform line-ending normalization (LF)
├── .gitignore             # Comprehensive Git exclusion rules
├── backend/               # 🐍 FastAPI REST API & Database
│   ├── app/               # Routers, models, schemas, and services
│   ├── tests/             # 62 unit & integration test suites
│   ├── main.py            # ASGI application entrypoint (Port 8000)
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile         # Backend container definition
│   ├── .dockerignore      # Container build hygiene
│   ├── .env.example       # Backend environment configuration template
│   └── pytest.ini         # Pytest configuration
├── frontend/              # ⚛️ React 18 + Vite Web Application
│   ├── src/               # UI components, pages, sound synthesis, state context
│   ├── public/sounds/     # Wooden chess move & capture sounds
│   ├── package.json       # Frontend dependencies & scripts (Port 3000)
│   ├── vite.config.js     # Dev server & reverse proxy configuration
│   ├── Dockerfile         # Frontend container definition
│   └── .env.example       # Frontend environment configuration template
└── README.md
```

---

## 💻 System Prerequisites

| Tool | Supported Versions | Notes |
| :--- | :--- | :--- |
| **Python** | 3.10 – 3.14 | [python.org/downloads](https://www.python.org/downloads/) *(Check "Add Python to PATH" on Windows)* |
| **Node.js & npm** | Node v18+ & npm v9+ | [nodejs.org](https://nodejs.org/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |
| *(Optional)* **Docker** | Latest | [docker.com](https://www.docker.com/) |

---

## ⚙️ Environment Configuration

Before running, create your local `.env` files from the provided templates:

### 1. Backend Environment
```bash
# In the backend directory:
cp .env.example .env
```
- **Default Database**: Zero-config local SQLite (`sqlite:///./chess_cure.db`).
- **Cloud Database (Optional)**: If connecting to PostgreSQL (e.g. Neon Cloud), set:
  ```ini
  DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
  ```
- **JWT & Delivery**: Set `SECRET_KEY`, and optionally configure SMTP credentials for OTP verification.

### 2. Frontend Environment
```bash
# In the frontend directory:
cp .env.example .env
```
Contains `VITE_BACKEND_URL=http://localhost:8000`.

---

## ⚡ Quick Start (Recommended)

### 🪟 Windows (1-Click Run)
Double-click **`start.bat`** in the project root, or execute in PowerShell / CMD:
```cmd
start.bat
```
*What this does automatically:*
- Verifies Python and Node.js.
- Creates and activates virtual environment `backend/venv`.
- Installs all dependencies (`requirements.txt` & `npm install`).
- Launches Backend (Port 8000) and Frontend (Port 3000) in dedicated terminal windows.

---

### 🐧 Linux / macOS / WSL (1-Command Run)
Open your terminal in the project root and execute:
```bash
chmod +x start.sh
./start.sh
```
*What this does automatically:*
- Verifies `python3` and `npm`.
- Creates and activates `backend/venv`.
- Installs dependencies automatically.
- Launches backend and frontend concurrently with graceful `Ctrl + C` shutdown.

---

### 🐳 Docker (Zero-Install / Any OS)
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

---

## 🛠️ Manual Step-by-Step Setup

### Step 1: Start Backend (Terminal 1)
```bash
cd backend

# On Windows:
python -m venv venv
venv\Scripts\activate

# On Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (choose either method):
# Method 1: Using Python script entrypoint
python main.py

# Method 2: Using Uvicorn CLI directly
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```
> Backend: **http://127.0.0.1:8000**  
> Swagger Docs: **http://127.0.0.1:8000/docs**

### Step 2: Start Frontend (Terminal 2)
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
> Web Application: **http://localhost:3000**

---

## 🧪 Running Tests

All 62 backend test suites run against an isolated SQLite test database and will not touch production data:

```bash
cd backend
# With virtual environment activated:
pytest
```
*Expected result: 62 passed.*

To build the frontend for production:
```bash
cd frontend
npm run build
```

---

## 🔑 Default Accounts & Credentials

You can register a new account instantly with username, password, and OTP, or use any of the pre-seeded accounts:

| Username | Email | Password | Role / Starting Elo |
| :--- | :--- | :--- | :--- |
| **admin_player** | `player@example.com` | `ChangeThisPassword123!` | System Administrator |
| **facebook_chess** | `facebook_chess@gmail.com` | `facebook_chess123` | Master (2150) |
| **guest** | *(Instant Login)* | *(No Password)* | Local Guest Mode |

---

## 🔄 Git Workflow

Run all Git commands from the project root:

```bash
# Check status
git status

# Stage changes
git add -A

# Commit
git commit -m "feat: your descriptive message"

# Push to your branch
git push origin <your-branch-name>
```
