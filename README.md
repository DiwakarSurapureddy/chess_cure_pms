# ♞ ChessCure 

> A modern, full-stack chess career and player performance management system built with **React 18 (Vite)** on the frontend and **FastAPI (Python)** with **SQLite** on the backend. Designed to run smoothly and consistently across **Windows**, **Linux**, **macOS**, and **Docker**.

---

## 📁 Project Structure

```text
chess_cure_pms/
├── start.bat              # ⚡ 1-Click Startup script for Windows
├── start.sh               # ⚡ 1-Command Startup script for Linux / macOS / WSL
├── docker-compose.yml     # 🐳 Universal Docker container orchestration
├── backend/               # 🐍 FastAPI REST API & Database
│   ├── app/               # Routers, models, schemas, and services
│   ├── main.py            # ASGI application entrypoint (Port 8000)
│   ├── chess_cure.db      # Unified SQLite database
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile         # Backend container definition
│   ├── conftest.py        # Cross-platform test path resolution
│   └── pytest.ini         # Pytest configuration
├── frontend/              # ⚛️ React 18 + Vite Web Application
│   ├── src/               # UI components, pages, sound synthesis, state context
│   ├── public/sounds/     # Wooden chess move & capture sounds
│   ├── package.json       # Frontend dependencies & scripts (Port 3000)
│   ├── vite.config.js     # Dev server & reverse proxy configuration
│   └── Dockerfile         # Frontend container definition
└── README.md
```

---

## 💻 System Prerequisites

Before starting, ensure your operating system has the following installed:

| Tool | Recommended Version | Download Link |
| :--- | :--- | :--- |
| **Python** | 3.10, 3.11, or 3.12 | [python.org/downloads](https://www.python.org/downloads/) *(Check "Add Python to PATH" during Windows install)* |
| **Node.js & npm** | Node v18+ & npm v9+ | [nodejs.org](https://nodejs.org/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |
| *(Optional)* **Docker** | Latest | [docker.com](https://www.docker.com/) |

---

## ⚡ Quick Start (Recommended)

Choose your operating system below for the fastest single-command startup:

### 🪟 Windows (1-Click Run)
Simply double-click **`start.bat`** in the project root, or open Command Prompt / PowerShell in the project directory and run:
```cmd
start.bat
```
*What this does automatically:*
- Checks Python and Node.js installation.
- Automatically creates and activates the Python virtual environment (`backend/venv`).
- Automatically installs backend (`requirements.txt`) and frontend (`npm install`) dependencies.
- Launches backend (Port 8000) and frontend (Port 3000) in separate dedicated terminal windows.

---

### 🐧 Linux / Ubuntu / macOS / WSL (1-Command Run)
Open your terminal in the project root directory and execute:
```bash
chmod +x start.sh
./start.sh
```
*What this does automatically:*
- Verifies `python3` and `npm`.
- Creates and activates virtual environment `backend/venv`.
- Installs all Python and Node dependencies if not already installed.
- Starts backend and frontend concurrently.
- Pressing `Ctrl + C` gracefully shuts down both servers cleanly without leaving zombie background processes.

---

### 🐳 Docker (Zero-Install / Any OS)
If you have Docker installed, you do not need Python or Node on your host machine:
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 🛠️ Manual Installation & Running Step-by-Step

If you prefer to start each service manually in separate terminal tabs, follow these instructions for your operating system:

### 🪟 Windows Manual Setup

#### Step 1: Start Backend (Terminal 1)
```powershell
# 1. Navigate to backend directory
cd backend

# 2. Create Python virtual environment
python -m venv venv

# 3. Activate the virtual environment
venv\Scripts\activate

# 4. Install requirements
pip install -r requirements.txt

# 5. Start FastAPI server
python main.py
```
> Backend runs at: **http://127.0.0.1:8000**  
> Live Swagger Docs: **http://127.0.0.1:8000/docs**

#### Step 2: Start Frontend (Terminal 2)
```powershell
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
> Web Application runs at: **http://localhost:3000**

---

### 🐧 Linux / macOS Manual Setup

#### Step 1: Start Backend (Terminal 1)
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create Python virtual environment
python3 -m venv venv

# 3. Activate the virtual environment
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Start FastAPI server
python main.py
```
> Backend runs at: **http://127.0.0.1:8000**  
> Live Swagger Docs: **http://127.0.0.1:8000/docs**

#### Step 2: Start Frontend (Terminal 2)
```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
> Web Application runs at: **http://localhost:3000**

---

## 🧪 Running Tests

To verify backend tests on any OS:

```bash
cd backend
# With virtual environment activated:
pytest
```
*All 22 test suites for authentication, gameplay, and profile management should pass.*

---

## 🔑 Default Accounts & Credentials

You can register a new account instantly with username and password, or use any of the pre-seeded accounts:

| Username | Email | Password | Role / Starting Elo |
| :--- | :--- | :--- | :--- |
| **Google** | `google[EMAIL_ADDRESS]` | `GOOG123` | Grandmaster (2420) |
| **facebook_chess** | `facebook_chess@gmail.com` | `facebook_chess123` | Master (2150) |
| **guest** | *(Instant Login)* | *(No Password)* | Local Guest Mode |

---

## 🔄 Git: Pull and Push Changes

Run all Git commands from the project root.

### 1. Pull Latest Changes
```bash
git status
git pull --rebase
```
*Note: If you have active changes in progress, commit or stash them before pulling.*

### 2. Share Your Changes
```bash
git status
git add <file-or-folder>
git commit -m "Describe your changes"
git push
```
