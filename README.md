♞ ChessCure 

> A modern, full-stack chess career and player performance management system built with **React (Vite)** on the frontend and **FastAPI (Python)** with **SQLite** on the backend.

---

## 📁 Project Structure

```text
chess_cure_pms/
├── frontend/          # React 18 + Vite Web Application
│   ├── src/           # Components, Pages, State Context, and API services
│   └── package.json   # Frontend dependencies & scripts (Port 3000)
│
├── backend/           # FastAPI (Python) REST API & Database
│   ├── app/           # Core logic, SQLite models, schemas, and routers
│   ├── main.py        # ASGI application entrypoint (Port 8000)
│   ├── chess_cure.db  # Unified SQLite database
│   └── requirements.txt
│
└── README.md
```

---

## 🚀 Features & Technologies

### 💻 Technologies
- **Frontend**: React 18, Vite, Lucide Icons, Custom Design System
- **Backend**: Python 3.12, FastAPI, Uvicorn (ASGI Server)
- **Database**: SQLite with SQLAlchemy 2.0 ORM
- **Security**: JWT (HS256 Bearer Tokens) + Bcrypt Password Hashing (12 rounds)

### 🌟 Key Features
- **Stateless Authentication**: Fast, secure registration and login using JWT tokens and Bcrypt.
- **Unified SQLite Database**: Single persistent database storing user profiles, ratings, and stats.
- **Social & Guest Play**: One-click Google, Facebook, and instant Guest player modes.
- **Pre-Seeded Demo Accounts**: Quick testing with built-in Grandmaster & Master credentials.
- **Interactive API Documentation**: Live Swagger UI at `/docs` and built-in control portal.

---

## ⚙️ Installation & How to Run

### 1. Start the Backend (FastAPI)
Open terminal in the project root:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 2. Start the Frontend (React + Vite)
Open a second terminal in the project root:
```bash
cd frontend
npm install
npm run dev
```
- **Frontend Web App**: [http://localhost:3000](http://localhost:3000)

*(The frontend automatically proxies all `/api` authentication requests to the FastAPI backend at port 8000).*

commands to run backend
cd ~/projects/chess_cure_pms/backend
source .venv/bin/activate
python -m uvicorn main:app --reload --port 8000