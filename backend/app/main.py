from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse

from app.config import settings
import app.database as app_db
from app.models.user import User
from app.models.game import CareerGame
from app.models.profile import UserPreference
from app.models.friend import FriendRequest, MatchChallenge
from app.models.presence import UserPresence
from app.models.chat import ChatMessage, ChatUnlockSession
from app.models.otp import OTPVerification
from app.services.auth_service import seed_default_users
from app.routers.auth import router as auth_router
from app.routers.settings import router as settings_router
from app.routers.profile import router as profile_router
from app.routers.friends import router as friends_router
from app.routers.chat import router as chat_router
from app.routers import games
from app.portal import get_portal_html
from app.models.game import GameDB, MoveRequest
from app.services.chess_engine import ChessEngine
import chess

def apply_lightweight_migrations(db_engine):
    from sqlalchemy import text
    try:
        with db_engine.connect() as conn:
            try:
                res = conn.execute(text("PRAGMA table_info(games)")).fetchall()
                if res:
                    cols = {r[1] for r in res}
                    if "chat_unlocked" not in cols:
                        conn.execute(text("ALTER TABLE games ADD COLUMN chat_unlocked BOOLEAN DEFAULT 0"))
                    if "chat_unlock_count" not in cols:
                        conn.execute(text("ALTER TABLE games ADD COLUMN chat_unlock_count INTEGER DEFAULT 0"))
                    if "chat_expires_at" not in cols:
                        conn.execute(text("ALTER TABLE games ADD COLUMN chat_expires_at TEXT"))
                    if "chat_unlock_reason" not in cols:
                        conn.execute(text("ALTER TABLE games ADD COLUMN chat_unlock_reason TEXT"))
                    if "round1_unlock_ply" not in cols:
                        conn.execute(text("ALTER TABLE games ADD COLUMN round1_unlock_ply INTEGER"))
                    if "round2_window_start_ply" not in cols:
                        conn.execute(text("ALTER TABLE games ADD COLUMN round2_window_start_ply INTEGER"))
                    conn.commit()

                res_chat = conn.execute(text("PRAGMA table_info(chat_unlock_sessions)")).fetchall()
                if res_chat:
                    cols_chat = {r[1] for r in res_chat}
                    if "game_id" not in cols_chat:
                        conn.execute(text("ALTER TABLE chat_unlock_sessions ADD COLUMN game_id VARCHAR(36)"))
                    if "unlock_count" not in cols_chat:
                        conn.execute(text("ALTER TABLE chat_unlock_sessions ADD COLUMN unlock_count INTEGER DEFAULT 0"))
                    conn.commit()
            except Exception:
                pass
    except Exception:
        pass

def init_db():
    app_db.Base.metadata.create_all(bind=app_db.engine)
    apply_lightweight_migrations(app_db.engine)
    db = app_db.SessionLocal()
    try:
        seed_default_users(db)
    finally:
        db.close()

# Database tables and seed routines are managed cleanly inside FastAPI lifespan context
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware to support frontend on any port (3000, 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Exception Handler to format errors matching frontend expectations (data.error)
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "detail": exc.detail,
        },
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_msg = "Invalid request format."
    if errors:
        loc = errors[0].get("loc", [])
        field = loc[-1] if loc else "field"
        msg = errors[0].get("msg", "Invalid value")
        first_msg = f"{field}: {msg}"
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": first_msg,
            "detail": errors,
        },
    )

# Include Authentication Router at both `/api/auth` (standard frontend api) and `/auth`
app.include_router(auth_router, prefix="/api/auth")
app.include_router(auth_router, prefix="/auth")

# Include Settings Router
app.include_router(settings_router, prefix="/api/settings")
app.include_router(settings_router, prefix="/settings")

# Include Profile Router
app.include_router(profile_router, prefix="/api/profile")
app.include_router(profile_router, prefix="/profile")

# Include Friends & Notifications Router
app.include_router(friends_router, prefix="/api/friends")
app.include_router(friends_router, prefix="/friends")

# Include Chat & Unlocks Router
app.include_router(chat_router, prefix="/api/chat", include_in_schema=True)
app.include_router(chat_router, prefix="/chat", include_in_schema=True)

app.include_router(games.router)

isolated_boards: dict[str, chess.Board] = {}

def get_board_for_session(session_id: str | None = None) -> chess.Board:
    sid = session_id or "default"
    if sid not in isolated_boards:
        if len(isolated_boards) >= 1000:
            oldest_key = next(iter(isolated_boards))
            isolated_boards.pop(oldest_key, None)
        isolated_boards[sid] = chess.Board()
    return isolated_boards[sid]

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "success": True,
        "message": "Chess Cure API is healthy",
        "status": "ok",
        "service": "ChessCure PMS Backend",
        "version": settings.VERSION,
    }

@app.get("/", response_class=HTMLResponse)
@app.get("/portal", response_class=HTMLResponse)
@app.get("/auth", response_class=HTMLResponse)
def root_portal():
    """Serves the interactive web portal for creating accounts, logging in, and managing users."""
    return HTMLResponse(content=get_portal_html())

@app.get("/api")
def api_info():
    """Returns API metadata in JSON format."""
    return {
        "message": "Welcome to ChessCure PMS Backend API. Access interactive documentation at /docs",
        "portal": "/",
        "docs": "/docs",
        "health": "/api/health",
        "endpoints": {
            "register": "POST /api/auth/register",
            "login": "POST /api/auth/login",
            "facebook": "POST /api/auth/facebook",
            "guest": "POST /api/auth/guest",
            "me": "GET /api/auth/me",
            "profile_stats": "GET /api/profile/stats",
            "profile_games": "GET /api/profile/games",
            "settings_preferences": "GET/PUT /api/settings/preferences",
            "settings_password": "PUT /api/settings/password",
        }
    }

@app.get("/api/board")
def get_board(session_id: str | None = None, request: Request = None):
    sid = session_id or (request.headers.get("x-session-id") if request else None) or "default"
    current_board = get_board_for_session(sid)
    return {
        "success": True,
        "session_id": sid,
        "fen": current_board.fen(),
        "turn": "white" if current_board.turn == chess.WHITE else "black",
        "game_over": current_board.is_game_over(),
    }

@app.post("/api/move")
def make_simple_move(request: MoveRequest, req: Request = None, session_id: str | None = None):
    sid = session_id or getattr(request, "session_id", None) or (req.headers.get("x-session-id") if req else None) or "default"
    current_board = get_board_for_session(sid)

    uci_str = (request.from_square + request.to_square).lower()
    move = None
    try:
        m = chess.Move.from_uci(uci_str)
        if m in current_board.legal_moves:
            move = m
    except ValueError:
        pass

    if move is None and len(uci_str) == 4:
        try:
            m = chess.Move.from_uci(uci_str + "q")
            if m in current_board.legal_moves:
                move = m
        except ValueError:
            pass

    if move is None or move not in current_board.legal_moves:
        raise HTTPException(status_code=400, detail="Illegal chess move")

    player_move = move.uci()
    current_board.push(move)
    computer_move = None

    if not current_board.is_game_over():
        reply = ChessEngine.get_computer_move(current_board, "easy")
        if reply is not None:
            current_board.push(reply)
            computer_move = reply.uci()

    return {
        "success": True,
        "session_id": sid,
        "player_move": player_move,
        "computer_move": computer_move,
        "fen": current_board.fen(),
        "game_over": current_board.is_game_over(),
    }

@app.post("/api/reset")
def reset_board(session_id: str | None = None, request: Request = None):
    sid = session_id or (request.headers.get("x-session-id") if request else None) or "default"
    current_board = get_board_for_session(sid)
    current_board.reset()
    return {
        "success": True,
        "session_id": sid,
        "message": "Chess board reset successfully",
        "fen": current_board.fen(),
    }
