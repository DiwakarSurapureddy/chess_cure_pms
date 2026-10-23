import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
# Load environment variables from .env
load_dotenv(BACKEND_DIR / ".env")
load_dotenv()

# Cloud Neon PostgreSQL Database URL (Unified across all team members and environments)
DEFAULT_NEON_URL = "postgresql://neondb_owner:npg_mMPI6FHs5uxb@ep-floral-fog-b3ljxoce-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

raw_db_url = os.getenv("DATABASE_URL")
# If DATABASE_URL is not set or contains placeholders, always use Neon Cloud PostgreSQL
if not raw_db_url or "YOUR_PASSWORD_HERE" in raw_db_url:
    raw_db_url = DEFAULT_NEON_URL

# SQLAlchemy 2.0 requires 'postgresql://' instead of legacy 'postgres://'
if raw_db_url and raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

# Use the PostgreSQL driver declared in requirements.txt. SQLAlchemy can
# otherwise select psycopg (v3), which is not installed by psycopg2-binary.
if raw_db_url and raw_db_url.startswith("postgresql://"):
    raw_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Strip channel_binding=require if present for psycopg2 compatibility
if raw_db_url and "channel_binding" in raw_db_url:
    raw_db_url = raw_db_url.replace("&channel_binding=require", "").replace("channel_binding=require&", "").replace("channel_binding=require", "")

class Settings:
    PROJECT_NAME: str = "ChessCure PMS Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # JWT & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "chesscure-super-secret-jwt-key-2026-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days default
    
    # Database - supports SQLite and PostgreSQL (Neon/Supabase)
    DATABASE_URL: str = raw_db_url
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    # Optional Seed User Defaults (Safely loaded from .env, with generic fallbacks)
    SEED_ADMIN_USERNAME: str = os.getenv("SEED_ADMIN_USERNAME", "admin_player")
    SEED_ADMIN_EMAIL: str = os.getenv("SEED_ADMIN_EMAIL", "player@example.com")
    SEED_ADMIN_MOBILE: str = os.getenv("SEED_ADMIN_MOBILE", "+1 555-0199")
    SEED_ADMIN_PASSWORD: str = os.getenv("SEED_ADMIN_PASSWORD", "Chess@2026Secure")
    SEED_BENSPIDY_ID: str = os.getenv("SEED_BENSPIDY_ID", "benspidy_oauth")

settings = Settings()
