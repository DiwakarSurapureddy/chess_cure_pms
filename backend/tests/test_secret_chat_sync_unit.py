from types import SimpleNamespace
from unittest.mock import MagicMock

from app.routers import games


def test_sync_secret_chat_does_not_restart_expired_session(monkeypatch):
    player1 = SimpleNamespace(id="user1", username="PlayerOne")
    player2 = SimpleNamespace(id="user2", username="PlayerTwo")

    # Simulate a chat that was unlocked before, but has expired.
    expired_session = SimpleNamespace(
        unlocked_at="previously-unlocked",
        is_unlocked=False,
    )

    query1 = MagicMock()
    query1.filter.return_value.first.return_value = player1

    query2 = MagicMock()
    query2.filter.return_value.first.return_value = player2

    db = MagicMock()
    db.query.side_effect = [query1, query2]

    monkeypatch.setattr(
        games.chat_service,
        "is_friend",
        lambda db, user1_id, user2_id: True,
    )
    monkeypatch.setattr(
        games.chat_service,
        "get_or_create_unlock_session",
        lambda db, user1_id, user2_id: expired_session,
    )

    unlock_mock = MagicMock()
    monkeypatch.setattr(
        games.chat_service,
        "unlock_chat",
        unlock_mock,
    )

    game = SimpleNamespace(
        chat_unlocked=True,
        player1="PlayerOne",
        player2="PlayerTwo",
    )

    games.sync_secret_chat(game, db)

    unlock_mock.assert_not_called()


def test_sync_secret_chat_unlocks_never_unlocked_session(monkeypatch):
    player1 = SimpleNamespace(id="user1", username="PlayerOne")
    player2 = SimpleNamespace(id="user2", username="PlayerTwo")

    new_session = SimpleNamespace(
        unlocked_at=None,
        is_unlocked=False,
    )

    query1 = MagicMock()
    query1.filter.return_value.first.return_value = player1

    query2 = MagicMock()
    query2.filter.return_value.first.return_value = player2

    db = MagicMock()
    db.query.side_effect = [query1, query2]

    monkeypatch.setattr(
        games.chat_service,
        "is_friend",
        lambda db, user1_id, user2_id: True,
    )
    monkeypatch.setattr(
        games.chat_service,
        "get_or_create_unlock_session",
        lambda db, user1_id, user2_id: new_session,
    )

    unlock_mock = MagicMock()
    monkeypatch.setattr(
        games.chat_service,
        "unlock_chat",
        unlock_mock,
    )

    game = SimpleNamespace(
        chat_unlocked=True,
        player1="PlayerOne",
        player2="PlayerTwo",
    )

    games.sync_secret_chat(game, db)

    unlock_mock.assert_called_once_with(
        db=db,
        user1_id="user1",
        user2_id="user2",
        reason="Both players completed 5 legal moves each",
        minutes=5,
    )
