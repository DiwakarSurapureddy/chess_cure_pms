from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.services.chat_service import chat_service


def make_session(expired=False, never_unlocked=False):
    now = datetime.now(timezone.utc)

    session = SimpleNamespace(
        is_unlocked=not expired,
        unlocked_at=None if never_unlocked else now - timedelta(minutes=10),
        expires_at=(
            None if never_unlocked
            else now - timedelta(minutes=1) if expired
            else now + timedelta(minutes=3)
        ),
        unlock_reason=None,
    )

    def check_and_update_expiry():
        if session.expires_at is None:
            return False

        if session.expires_at <= datetime.now(timezone.utc):
            session.is_unlocked = False
            return False

        return session.is_unlocked

    session.check_and_update_expiry = check_and_update_expiry
    return session


def test_expired_chat_cannot_restart_automatically(monkeypatch):
    session = make_session(expired=True)
    db = MagicMock()

    monkeypatch.setattr(
        chat_service,
        "get_or_create_unlock_session",
        lambda db, user1_id, user2_id: session,
    )

    with pytest.raises(HTTPException) as exc:
        chat_service.unlock_chat(
            db=db,
            user1_id="user1",
            user2_id="user2",
        )

    assert exc.value.status_code == 403
    assert "cannot be automatically restarted" in exc.value.detail
    assert session.is_unlocked is False
    db.commit.assert_called_once()


def test_active_chat_timer_is_not_reset(monkeypatch):
    session = make_session(expired=False)
    original_expiry = session.expires_at
    db = MagicMock()

    monkeypatch.setattr(
        chat_service,
        "get_or_create_unlock_session",
        lambda db, user1_id, user2_id: session,
    )

    result = chat_service.unlock_chat(
        db=db,
        user1_id="user1",
        user2_id="user2",
    )

    assert result is session
    assert result.expires_at == original_expiry
    db.commit.assert_not_called()


def test_never_unlocked_chat_can_unlock_for_first_time(monkeypatch):
    session = make_session(never_unlocked=True)
    db = MagicMock()

    monkeypatch.setattr(
        chat_service,
        "get_or_create_unlock_session",
        lambda db, user1_id, user2_id: session,
    )

    result = chat_service.unlock_chat(
        db=db,
        user1_id="user1",
        user2_id="user2",
    )

    assert result.is_unlocked is True
    assert result.unlocked_at is not None
    assert result.expires_at > datetime.now(timezone.utc)
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(session)
