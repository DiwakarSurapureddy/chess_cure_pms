from datetime import datetime, timedelta, timezone

# Register User model before creating ChatUnlockSession objects.
from app.models.user import User
from app.models.chat import ChatUnlockSession


def test_chat_timer_starts_with_five_minutes():
    now = datetime.now(timezone.utc)

    session = ChatUnlockSession(
        is_unlocked=True,
        unlocked_at=now,
        expires_at=now + timedelta(minutes=5),
    )

    remaining = session.get_remaining_seconds()

    assert session.is_unlocked is True
    assert 295 <= remaining <= 300


def test_expired_chat_returns_zero_seconds():
    now = datetime.now(timezone.utc)

    session = ChatUnlockSession(
        is_unlocked=True,
        unlocked_at=now - timedelta(minutes=6),
        expires_at=now - timedelta(minutes=1),
    )

    assert session.get_remaining_seconds() == 0


def test_expired_chat_becomes_locked():
    now = datetime.now(timezone.utc)

    session = ChatUnlockSession(
        is_unlocked=True,
        unlocked_at=now - timedelta(minutes=6),
        expires_at=now - timedelta(minutes=1),
    )

    assert session.check_and_update_expiry() is False
    assert session.is_unlocked is False

def test_chat_without_expiry_returns_zero_and_locks():
    session = ChatUnlockSession(
        is_unlocked=True,
        unlocked_at=datetime.now(timezone.utc),
        expires_at=None,
    )

    assert session.get_remaining_seconds() == 0
    assert session.check_and_update_expiry() is False
    assert session.is_unlocked is False