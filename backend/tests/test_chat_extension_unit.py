from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.services.chat_service import chat_service


def make_session(expires_at, active=True, extended_count=0):
    return SimpleNamespace(
        is_unlocked=active,
        expires_at=expires_at,
        payment_status=None,
        extended_count=extended_count,
        check_and_update_expiry=lambda: active and expires_at is not None
        and expires_at > datetime.now(timezone.utc),
    )


def test_active_chat_extension_adds_five_minutes(monkeypatch):
    now = datetime.now(timezone.utc)
    old_expiry = now + timedelta(minutes=2)
    session = make_session(old_expiry)
    db = MagicMock()

    monkeypatch.setattr(
        chat_service,
        "get_or_create_unlock_session",
        lambda db, user1_id, user2_id: session,
    )

    result = chat_service.extend_chat(
        db=db,
        user1_id="user1",
        user2_id="user2",
        amount=10,
    )

    assert result.expires_at == old_expiry + timedelta(minutes=5)
    assert result.payment_status == "demo_paid_10_inr"
    assert result.extended_count == 1
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(session)


def test_second_extension_increments_count(monkeypatch):
    old_expiry = datetime.now(timezone.utc) + timedelta(minutes=3)
    session = make_session(old_expiry, extended_count=1)
    db = MagicMock()

    monkeypatch.setattr(
        chat_service,
        "get_or_create_unlock_session",
        lambda db, user1_id, user2_id: session,
    )

    result = chat_service.extend_chat(
        db=db,
        user1_id="user1",
        user2_id="user2",
        amount=10,
    )

    assert result.expires_at == old_expiry + timedelta(minutes=5)
    assert result.extended_count == 2


def test_wrong_payment_amount_is_rejected():
    db = MagicMock()

    with pytest.raises(HTTPException) as exc:
        chat_service.extend_chat(
            db=db,
            user1_id="user1",
            user2_id="user2",
            amount=5,
        )

    assert exc.value.status_code == 400
    db.commit.assert_not_called()


def test_expired_chat_extension_is_rejected(monkeypatch):
    old_expiry = datetime.now(timezone.utc) - timedelta(minutes=1)
    session = make_session(old_expiry, active=True)
    db = MagicMock()

    monkeypatch.setattr(
        chat_service,
        "get_or_create_unlock_session",
        lambda db, user1_id, user2_id: session,
    )

    with pytest.raises(HTTPException) as exc:
        chat_service.extend_chat(
            db=db,
            user1_id="user1",
            user2_id="user2",
            amount=10,
        )

    assert exc.value.status_code == 403
    db.commit.assert_called_once()
