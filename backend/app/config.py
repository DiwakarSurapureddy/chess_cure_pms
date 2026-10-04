import os
from pathlib import Path
from typing import List

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "chess_cure.db"

class Settings:
    PROJECT_NAME: str = "ChessCure PMS Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # JWT & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "chesscure-super-secret-jwt-key-2026-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days default
    
    # Database - cross-platform POSIX path compatible with Windows, Linux, macOS
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")
    
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

settings = Settings()
