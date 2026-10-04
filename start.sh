#!/usr/bin/env bash
# ==============================================================================
# ChessCure PMS - Cross-Platform Startup Script (Linux / macOS / WSL)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "=================================================="
echo "      Starting ChessCure PMS (Cross-Platform)     "
echo "=================================================="

# 1. Check Python
PYTHON_BIN=""
if command -v python3 &>/dev/null; then
    PYTHON_BIN="python3"
elif command -v python &>/dev/null; then
    PYTHON_BIN="python"
else
    echo "❌ Error: Python is not installed. Please install Python 3.10+."
    exit 1
fi
echo "✓ Using Python: $($PYTHON_BIN --version)"

# 2. Check Node / npm
if ! command -v npm &>/dev/null; then
    echo "❌ Error: Node.js / npm is not installed. Please install Node.js 18+."
    exit 1
fi
echo "✓ Using Node.js: $(node --version) | npm: $(npm --version)"

# 3. Setup Backend Virtual Environment
cd "$BACKEND_DIR"
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment in backend/venv..."
    $PYTHON_BIN -m venv venv
fi

# Activate venv
source venv/bin/activate
echo "✓ Backend venv activated."

# Install / update backend dependencies
echo "📦 Checking backend dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

# 4. Setup Frontend Dependencies
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# 5. Trap cleanup on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "🛑 Shutting down ChessCure PMS..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 6. Start Backend in Background
cd "$BACKEND_DIR"
echo "🚀 Starting FastAPI backend on http://0.0.0.0:8000 ..."
python main.py &
BACKEND_PID=$!

# Wait briefly for backend to initialize
sleep 2

# 7. Start Frontend in Foreground
cd "$FRONTEND_DIR"
echo "🚀 Starting React Vite frontend on http://0.0.0.0:3000 ..."
npm run dev -- --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!

echo ""
echo "=================================================="
echo " ChessCure PMS is running!"
echo " Frontend : http://localhost:3000"
echo " Backend  : http://localhost:8000"
echo " API Docs : http://localhost:8000/docs"
echo " Press Ctrl+C to stop all servers."
echo "=================================================="
echo ""

wait
