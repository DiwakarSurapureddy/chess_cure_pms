"""
Pytest configuration and test database isolation for ChessCure PMS.
Ensures ALL tests execute strictly against an isolated temporary SQLite database
and CANNOT connect to or mutate the production Neon PostgreSQL database.
"""

import os
import tempfile
from pathlib import Path
from datetime import datetime, timezone, timedelta
import dotenv
import pytest

# ==============================================================================
# 1. HARDCODED NEON SAFETY ASSERTION
# ==============================================================================
def assert_not_neon(url: str | None):
    """Fails immediately if any database URL references production Neon PostgreSQL."""
    if not url:
        return
    url_str = str(url).lower()
    neon_markers = ["neon.tech", "ep-floral-fog", "npg_mmpi"]
    for marker in neon_markers:
        if marker in url_str:
            raise RuntimeError(
                f"CRITICAL SAFETY VIOLATION PREVENTED: Attempted to use Neon production database URL in tests: {url}"
            )

# ==============================================================================
# 2. CONFIGURE ISOLATED SQLITE DATABASE
# ==============================================================================
TEST_DB_PATH = Path(tempfile.gettempdir()) / f"chesscure_test_{os.getpid()}.db"
if TEST_DB_PATH.exists():
    try:
        TEST_DB_PATH.unlink()
    except Exception:
        pass

TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"

# Ensure dotenv.load_dotenv cannot overwrite DATABASE_URL with Neon credentials from .env
orig_load_dotenv = dotenv.load_dotenv
def safe_load_dotenv(*args, **kwargs):
    res = orig_load_dotenv(*args, **kwargs)
    os.environ["DATABASE_URL"] = TEST_DB_URL
    return res
dotenv.load_dotenv = safe_load_dotenv

# Set environment variable before app configuration is imported
os.environ["DATABASE_URL"] = TEST_DB_URL

# Import config and re-enforce test SQLite URL
from app.config import settings
settings.DATABASE_URL = TEST_DB_URL
assert_not_neon(settings.DATABASE_URL)

# ==============================================================================
# 3. CONFIGURE SQLITE ENGINE & SESSIONMAKER
# ==============================================================================
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    echo=False
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Repoint app.database globals to isolated test engine & sessionmaker
import app.database as app_db
app_db.engine = test_engine
app_db.SessionLocal = TestSessionLocal
app_db.is_sqlite = True
assert_not_neon(str(app_db.engine.url))

# Repoint app.main engine & sessionmaker
import app.main as app_main
app_main.engine = test_engine
app_main.SessionLocal = TestSessionLocal
assert_not_neon(str(app_main.engine.url))

# Override FastAPI get_db dependency to supply test SQLite session
def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

app_main.app.dependency_overrides[app_db.get_db] = override_get_db

# ==============================================================================
# 4. INITIALIZE TABLES AND SEED TEST DATA
# ==============================================================================
from app.database import Base
from app.models.user import User
from app.models.game import CareerGame, GameDB
from app.models.profile import UserPreference
from app.models.friend import FriendRequest, MatchChallenge
from app.models.presence import UserPresence
from app.models.chat import ChatMessage, ChatUnlockSession
from app.models.otp import OTPVerification

# Create all 10 tables on the isolated SQLite test database
Base.metadata.create_all(bind=test_engine)

# Seed baseline default accounts (admin, diwa, GM, IM) into SQLite
from app.services.auth_service import seed_default_users
with TestSessionLocal() as db:
    seed_default_users(db)

# ==============================================================================
# 5. PYTEST HOOKS & FIXTURES
# ==============================================================================
def pytest_runtest_setup(item):
    """Enforces database isolation before each test runs."""
    assert_not_neon(os.environ.get("DATABASE_URL"))
    assert_not_neon(settings.DATABASE_URL)
    assert_not_neon(str(app_db.engine.url))
    assert_not_neon(str(app_main.engine.url))

@pytest.fixture
def db_session():
    """Provides a transactional database session for tests."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

def seed_test_otp(identifier: str, code: str = "654321", purpose: str = "registration", expired: bool = False) -> str:
    """Helper function to insert a valid or expired OTP record into SQLite test database."""
    from app.utils.otp import hash_otp, normalize_identifier
    clean_id = normalize_identifier(identifier)
    now = datetime.now(timezone.utc)
    expires_at = now - timedelta(minutes=5) if expired else now + timedelta(minutes=10)
    
    with TestSessionLocal() as db:
        # Invalidate existing pending OTPs
        db.query(OTPVerification).filter(
            OTPVerification.identifier == clean_id,
            OTPVerification.purpose == purpose,
            OTPVerification.is_used == False
        ).update({"is_used": True}, synchronize_session=False)
        
        record = OTPVerification(
            identifier=clean_id,
            hashed_otp=hash_otp(code),
            purpose=purpose,
            attempts=0,
            max_attempts=5,
            is_used=False,
            expires_at=expires_at,
            last_sent_at=now,
            created_at=now
        )
        db.add(record)
        db.commit()
    return code

@pytest.fixture
def otp_seeder():
    """Fixture providing the seed_test_otp function to test files."""
    return seed_test_otp

def pytest_sessionfinish(session, exitstatus):
    """Cleans up SQLite database after all tests complete."""
    test_engine.dispose()
    try:
        if TEST_DB_PATH.exists():
            TEST_DB_PATH.unlink()
    except Exception:
        pass

