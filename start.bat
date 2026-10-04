@echo off
REM ==============================================================================
REM ChessCure PMS - Windows Startup Script
REM ==============================================================================
echo ==================================================
echo       Starting ChessCure PMS (Windows)
echo ==================================================

set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%backend
set FRONTEND_DIR=%ROOT_DIR%frontend

REM 1. Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in PATH.
    pause
    exit /b 1
)

REM 2. Check Node/NPM
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js / npm is not installed or not in PATH.
    pause
    exit /b 1
)

REM 3. Backend Setup
cd /d "%BACKEND_DIR%"
if not exist "venv" (
    echo [Backend] Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo [Backend] Checking dependencies...
pip install -r requirements.txt -q

REM 4. Frontend Setup
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo [Frontend] Installing node dependencies...
    call npm install
)

REM 5. Start Servers in Separate Windows
echo.
echo Launching Backend server...
start "ChessCure Backend (FastAPI)" cmd /k "cd /d %BACKEND_DIR% && call venv\Scripts\activate.bat && python main.py"

echo Launching Frontend server...
start "ChessCure Frontend (Vite React)" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo ==================================================
echo  ChessCure PMS is running!
echo  Frontend : http://localhost:3000
echo  Backend  : http://localhost:8000
echo  API Docs : http://localhost:8000/docs
echo ==================================================
pause
