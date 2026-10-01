from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.auth_service import seed_default_users
from app.routers.auth import router as auth_router
from app.portal import get_portal_html

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_users(db)
    finally:
        db.close()

# Initialize immediately upon import so tables exist synchronously
init_db()

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

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
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
            "google": "POST /api/auth/google",
            "facebook": "POST /api/auth/facebook",
            "guest": "POST /api/auth/guest",
            "me": "GET /api/auth/me",
            "update_me": "PUT /api/auth/me",
            "users": "GET /api/auth/users",
            "delete_user": "DELETE /api/auth/user/{user_id}"
        }
    }
