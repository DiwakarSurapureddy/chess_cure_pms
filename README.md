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

---

## 🔄 Git: Pull and Push Changes

Run Git commands from the project root. Git tracks project source and configuration files, including `.gitignore`; Git's internal `.git` directory is managed automatically and should not be copied or committed.

### Get the latest project files

```bash
git status
git pull --rebase
```

If you have local changes, commit or safely store them before pulling. If a pull has already started a merge and Git reports unmerged paths, do not pull again: resolve each conflict, stage each resolved file with `git add <file>`, and then run `git status` to confirm the conflicts are cleared. Use `git merge --abort` only if you intend to abandon that merge.

When the merge is ready to finish, create the merge commit and then push:

```bash
git commit
git push
```

### Share your changes

```bash
git status
git add <file-or-folder>
git commit -m "Describe your changes"
git push
```

Stage only the files you intend to share. For a new branch that has not been pushed before, publish it with:

```bash
git push -u origin <branch-name>
```

Files matched by `.gitignore` (such as local environment files, virtual environments, dependency folders, and generated databases) are normally kept out of commits. Do not force-add secrets or local-only data.
