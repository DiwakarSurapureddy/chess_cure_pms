# ♞ ChessCure Backend (Python + FastAPI)

Backend API service for **ChessCure** built with Python and FastAPI, handling user authentication, chess move validation, career history tracking, challenges, and database persistence.

---

## 🛠️ Tech Stack & Requirements

- **Language**: Python 3.10 or higher
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **Database**: SQLite (via SQLAlchemy)
- **Chess Engine**: `python-chess`
- **Security**: JWT (`python-jose`) + Password Hashing (`passlib[bcrypt]`)

---

## 🚀 How to Run the Backend (Step-by-Step CMD)

> ⚠️ **Note**: Backend is built with Python. Do NOT use `npm run dev` here (that is for the `frontend` folder). Use `uvicorn` and `python` instead.

### 1. Open Terminal and Navigate to Backend Folder

Open your Command Prompt (`cmd`) or PowerShell in the project root:

```cmd
cd backend
```

---

### 2. Create a Python Virtual Environment

Create an isolated virtual environment named `venv`:

```cmd
python -m venv venv
```

---

### 3. Activate the Virtual Environment

- **On Windows (Command Prompt - CMD):**
  ```cmd
  venv\Scripts\activate
  ```

- **On Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```

*(Once activated, you will see `(venv)` at the beginning of your terminal prompt).*

---

### 4. Install Dependencies

Install all required Python libraries from `requirements.txt`:

```cmd
pip install -r requirements.txt
```

---

### 5. Run the FastAPI Development Server

Start the server using `uvicorn`:

```cmd
uvicorn app.main:app --reload --port 8000
```

- `--reload`: Automatically reloads the server on code changes.
- `--port 8000`: Runs the API on port `8000`.

---

## 🌐 Interactive API Documentation

Once the server is running, open your browser and navigate to:

- **Swagger UI (Interactive Docs)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc (Alternative Docs)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📁 Backend Directory Structure

```text
backend/
├── app/
│   ├── core/
│   │   ├── auth.py             # JWT token handling & password hashing
│   │   ├── exceptions.py       # Custom HTTP error exceptions
│   │   └── security.py         # OAuth2 password bearer schemes
│   ├── models/
│   │   ├── challenge.py        # Challenge database models
│   │   ├── chat.py             # Chat room & message models
│   │   ├── game.py             # Chess game records & career models
│   │   ├── profile.py          # User profile & statistics models
│   │   └── user.py             # User account models
│   ├── routers/
│   │   ├── auth.py             # Signup, login, social auth, OTP
│   │   ├── challenges.py       # Tactical puzzles & challenges
│   │   ├── chat.py             # Secret chat endpoints
│   │   ├── games.py            # Game matchmaking & move history
│   │   ├── profile.py          # Career stats & user profile
│   │   ├── settings.py         # User preferences
│   │   └── users.py            # User management
│   ├── schemas/
│   │   ├── auth.py             # Pydantic request/response schemas
│   │   ├── challenge.py
│   │   ├── chat.py
│   │   ├── game.py
│   │   ├── profile.py
│   │   └── user.py
│   ├── services/
│   │   ├── auth_service.py     # Auth business logic
│   │   ├── challenge_service.py# Puzzle scoring logic
│   │   ├── chat_service.py     # Chat message handling
│   │   ├── chess_engine.py     # python-chess move validation
│   │   ├── game_service.py     # Match state logic
│   │   ├── profile_service.py  # Rating calculation
│   │   └── user_service.py     # User CRUD service
│   ├── utils/
│   │   ├── helpers.py          # Utility helpers
│   │   ├── otp.py              # OTP generator & verifier
│   │   └── validators.py       # Input validation
│   ├── websockets/
│   │   └── connection_manager.py# Real-time WebSocket manager
│   ├── config.py               # Environment variables configuration
│   ├── database.py             # SQLite SQLAlchemy engine & session
│   ├── dependencies.py         # FastAPI dependency injection
│   └── main.py                 # FastAPI application entrypoint
├── tests/                      # Unit & integration tests
├── .env                        # Environment variables
├── .gitignore                  # Git ignore rules for Python
├── requirements.txt            # Python dependencies
└── README.md                   # Documentation & command instructions
```

---

## ⚡ Quick Command Summary (CMD)

| Action | Command |
| :--- | :--- |
| **Go to Backend** | `cd backend` |
| **Create Venv** | `python -m venv venv` |
| **Activate Venv** | `venv\Scripts\activate` |
| **Install Packages** | `pip install -r requirements.txt` |
| **Start Server** | `uvicorn app.main:app --reload --port 8000` |
| **Deactivate Venv** | `deactivate` |

---

## Chess Game and Challenge APIs

The backend also provides chess game, real-time multiplayer, and challenge endpoints:

- `POST /api/games` and `GET /api/games` to create and list chess games
- `GET /api/games/{game_id}` and `POST /api/games/{game_id}/move` to inspect a game and play a move
- `POST /api/games/{game_id}/computer-move` and `POST /api/games/{game_id}/play-computer` to play against the computer
- `WebSocket /api/games/{game_id}/ws` for real-time multiplayer games
- `POST /api/challenges`, `GET /api/challenges`, and `POST /api/challenges/{challenge_id}/solve` for chess challenges
- `GET /api/board`, `POST /api/move`, and `POST /api/reset` for the simple computer-play board

See the interactive API documentation at `/docs` for request formats and the full endpoint list.

Game sessions and user career history are stored separately so both APIs can use their own data models.
