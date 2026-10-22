
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

from app.services.game_service import GameService


def test_restore_secret_chat_state_stores_expiry_as_iso_string():
    service = GameService()

    player1 = SimpleNamespace(id="user1", username="PlayerOne")
    player2 = SimpleNamespace(id="user2", username="PlayerTwo")
    expiry = datetime.now(timezone.utc) + timedelta(minutes=4)

    session = SimpleNamespace(
        is_unlocked=True,
        expires_at=expiry,
        unlock_reason="Both players completed 5 legal moves each",
        check_and_update_expiry=lambda: True,
    )

    query1 = MagicMock()
    query1.filter.return_value.first.return_value = player1

    query2 = MagicMock()
    query2.filter.return_value.first.return_value = player2

    friendship_query = MagicMock()
    friendship_query.filter.return_value.first.return_value = (
        SimpleNamespace(status="accepted")
    )

    session_query = MagicMock()
    session_query.filter.return_value.first.return_value = session

    db = MagicMock()
    db.query.side_effect = [
        query1,
        query2,
        friendship_query,
        session_query,
    ]

    game = SimpleNamespace(
        player1="PlayerOne",
        player2="PlayerTwo",
        chat_unlocked=False,
        chat_unlock_reason=None,
        chat_expires_at=None,
    )

    service._restore_secret_chat_state(game, db)

    assert game.chat_unlocked is True
    assert game.chat_unlock_reason == session.unlock_reason
    assert isinstance(game.chat_expires_at, str)
    assert datetime.fromisoformat(game.chat_expires_at) == expiry


def test_get_game_refreshes_cached_chat_state(monkeypatch):
    service = GameService()
    game = SimpleNamespace(game_id="game-123")
    service.games["game-123"] = game

    db = MagicMock()
    restore_mock = MagicMock()

    monkeypatch.setattr(
        service, "_restore_secret_chat_state", restore_mock
    )

    result = service.get_game("game-123", db)

    assert result is game
    restore_mock.assert_called_once_with(game, db)


def test_get_game_without_db_does_not_restore_cached_state(monkeypatch):
    service = GameService()
    game = SimpleNamespace(game_id="game-123")
    service.games["game-123"] = game

    restore_mock = MagicMock()

    monkeypatch.setattr(
        service, "_restore_secret_chat_state", restore_mock
    )

    result = service.get_game("game-123")

    assert result is game
    restore_mock.assert_not_called()


def test_batch_restore_stores_expiry_as_iso_string():
    service = GameService()

    expiry = datetime.now(timezone.utc) + timedelta(minutes=3)

    game = SimpleNamespace(
        player1="PlayerOne",
        player2="PlayerTwo",
        chat_unlocked=False,
        chat_unlock_reason=None,
        chat_expires_at=None,
    )

    player1 = SimpleNamespace(id="user1", username="PlayerOne")
    player2 = SimpleNamespace(id="user2", username="PlayerTwo")

    session = SimpleNamespace(
        user1_id="user1",
        user2_id="user2",
        is_unlocked=True,
        expires_at=expiry,
        unlock_reason="Both players completed 5 legal moves each",
        check_and_update_expiry=lambda: True,
    )

    query1 = MagicMock()
    query1.filter.return_value.all.return_value = [player1, player2]
    friendship = SimpleNamespace(
        sender_id="user1",
        receiver_id="user2",
    )

    query2 = MagicMock()
    query2.filter.return_value.all.return_value = [friendship]

    query3 = MagicMock()
    query3.filter.return_value.all.return_value = [session]

    db = MagicMock()
    db.query.side_effect = [query1, query2, query3]

    service._restore_secret_chat_states_batch([game], db)

    assert isinstance(game.chat_expires_at, str)
    assert datetime.fromisoformat(game.chat_expires_at) == expiry


