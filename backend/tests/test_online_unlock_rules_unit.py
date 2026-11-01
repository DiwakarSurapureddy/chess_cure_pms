import pytest
from datetime import datetime, timezone
import chess
from app.models.game import Game
from app.services.chat_service import chat_service
from app.models.chat import ChatMessage
from app.models.friend import FriendRequest
from app.database import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def test_captures_on_moves_1_2_3_do_not_unlock_chat():
    """Captures on moves 1, 2, and 3 must NOT unlock chat."""
    game = Game(game_id="test_early_caps", player1="Alice", player2="Bob")

    # Move 1: White 1, Black 1
    assert game.make_move("e2", "e4")[0] is True
    assert game.make_move("d7", "d5")[0] is True
    assert game.chat_unlocked is False

    # Move 2: White 2 captures on d5!
    assert game.make_move("e4", "d5")[0] is True  # White move 2 capture
    assert game.captured_pieces["white"] == ["p"]
    # MUST NOT UNLOCK CHAT
    assert game.chat_unlocked is False
    assert game.chat_unlock_count == 0

    # Move 2: Black 2 captures on d5!
    assert game.make_move("d8", "d5")[0] is True  # Black move 2 capture
    assert game.captured_pieces["black"] == ["p"]
    # MUST NOT UNLOCK CHAT
    assert game.chat_unlocked is False
    assert game.chat_unlock_count == 0

    # Move 3: White 3, Black 3 (e.g. Nc3, Qd6)
    assert game.make_move("b1", "c3")[0] is True
    assert game.make_move("d5", "d6")[0] is True
    assert game.chat_unlocked is False
    assert game.chat_unlock_count == 0


def test_capture_on_move_4_unlocks_chat_immediately():
    """Capture on move 4 of either player unlocks chat immediately."""
    game = Game(game_id="test_move_4_unlock", player1="Alice", player2="Bob")

    # Move 1
    assert game.make_move("e2", "e4")[0] is True
    assert game.make_move("e7", "e5")[0] is True

    # Move 2
    assert game.make_move("g1", "f3")[0] is True
    assert game.make_move("b8", "c6")[0] is True

    # Move 3
    assert game.make_move("d2", "d4")[0] is True
    assert game.make_move("d7", "d6")[0] is True
    assert game.chat_unlocked is False

    # Move 4: White plays move 4 and captures pawn on e5!
    success, msg = game.make_move("d4", "e5")
    assert success is True

    # Chat must unlock immediately on move 4 capture!
    assert game.chat_unlocked is True
    assert game.chat_unlock_count == 1
    assert game.chat_expires_at is not None
    assert game.chat_unlock_reason is not None
    assert "move 4" in game.chat_unlock_reason

    state = game.get_state()
    assert state["chat_unlocked"] is True
    assert state["chat_time_remaining"] > 290
    assert state["chat_expires_at"] == game.chat_expires_at


def test_black_capture_on_move_4_unlocks_chat():
    """If White doesn't capture on move 4, but Black captures on move 4, chat unlocks."""
    game = Game(game_id="test_black_move_4_unlock", player1="Alice", player2="Bob")

    # Move 1
    game.make_move("e2", "e4")
    game.make_move("e7", "e5")

    # Move 2
    game.make_move("g1", "f3")
    game.make_move("b8", "c6")

    # Move 3
    game.make_move("f1", "c4")
    game.make_move("g8", "f6")

    # Move 4: White does not capture
    game.make_move("d2", "d3")
    assert game.chat_unlocked is False

    # Move 4: Black captures on e4
    success, msg = game.make_move("f6", "e4")
    assert success is True, msg

    assert game.chat_unlocked is True
    assert game.chat_unlock_count == 1
    assert "move 4" in game.chat_unlock_reason


def test_capture_on_move_5_unlocks_chat_when_move_4_had_no_capture():
    """Capture on move 5 unlocks chat when move 4 had no capture."""
    game = Game(game_id="test_move_5_unlock", player1="Alice", player2="Bob")

    # Move 1
    game.make_move("e2", "e4")
    game.make_move("e7", "e5")

    # Move 2
    game.make_move("g1", "f3")
    game.make_move("b8", "c6")

    # Move 3
    game.make_move("f1", "c4")
    game.make_move("f8", "c5")

    # Move 4: No captures by either player
    game.make_move("c2", "c3")
    game.make_move("g8", "f6")
    assert game.chat_unlocked is False
    assert game.chat_unlock_count == 0

    # Move 5: White plays d2-d4 (no capture)
    game.make_move("d2", "d4")
    assert game.chat_unlocked is False

    # Move 5: Black captures on d4! (e5xd4)
    success, msg = game.make_move("e5", "d4")
    assert success is True, msg

    assert game.chat_unlocked is True
    assert game.chat_unlock_count == 1
    assert "move 5" in game.chat_unlock_reason


def test_no_capture_on_moves_4_and_5_means_no_unlock():
    """If neither player captures on moves 4 or 5, chat remains locked even if move 6 captures."""
    game = Game(game_id="test_no_unlock", player1="Alice", player2="Bob")

    # Move 1
    game.make_move("e2", "e4")
    game.make_move("e7", "e5")

    # Move 2
    game.make_move("g1", "f3")
    game.make_move("b8", "c6")

    # Move 3
    game.make_move("f1", "c4")
    game.make_move("f8", "c5")

    # Move 4 (no captures)
    game.make_move("c2", "c3")
    game.make_move("g8", "f6")

    # Move 5 (no captures)
    game.make_move("d2", "d3")
    game.make_move("d7", "d6")

    # At the end of move 5 for both players, chat MUST remain locked
    assert game.chat_unlocked is False
    assert game.chat_unlock_count == 0

    # Move 6: White plays h2-h3, Black plays Be6
    game.make_move("h2", "h3")
    game.make_move("c8", "e6")
    # Move 7: White captures on e6
    game.make_move("c4", "e6")
    # Captures on move 6 or 7 must NOT unlock chat!
    assert game.chat_unlocked is False
    assert game.chat_unlock_count == 0


def test_both_players_receive_same_unlock_and_expiry_timestamp():
    """Both players receive identical unlock state and expiry timestamp in get_state()."""
    game = Game(game_id="test_shared_expiry", player1="Alice", player2="Bob")

    # Play moves to reach move 4 capture
    game.make_move("e2", "e4")
    game.make_move("e7", "e5")
    game.make_move("g1", "f3")
    game.make_move("b8", "c6")
    game.make_move("d2", "d4")
    game.make_move("d7", "d6")
    game.make_move("d4", "e5")  # White move 4 capture

    state = game.get_state()
    assert state["chat_unlocked"] is True
    assert state["chat_expires_at"] is not None

    # Expiry timestamp is identical for both players
    assert state["chat_expires_at"] == game.chat_expires_at
    assert state["chat_time_remaining"] > 290


def test_shared_chat_history_is_user_to_user_independent_of_game_id():
    """Messages between Alice and Bob must load in full chronological order regardless of game_id."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    u1_id = "user_alice_uuid"
    u2_id = "user_bob_uuid"

    # Seed accepted friendship between Alice and Bob
    req = FriendRequest(sender_id=u1_id, receiver_id=u2_id, status="accepted")
    db.add(req)
    db.commit()

    # Message 1 sent in Play With Computer (no game_id)
    msg1 = chat_service.send_message(db, sender_id=u1_id, receiver_id=u2_id, text="Hi Bob from Computer mode!", game_id=None)

    # Message 2 sent in Play Online (with online game_id)
    msg2 = chat_service.send_message(db, sender_id=u2_id, receiver_id=u1_id, text="Hey Alice from Online match!", game_id="game_online_123")

    # Message 3 sent in Play Online
    msg3 = chat_service.send_message(db, sender_id=u1_id, receiver_id=u2_id, text="Nice capture on move 4!", game_id="game_online_123")

    # Fetch messages between Alice and Bob - must return ALL 3 messages in order
    messages = chat_service.get_messages(db, u1_id, u2_id)
    assert len(messages) == 3
    texts = [m.text for m in messages]
    assert texts == [
        "Hi Bob from Computer mode!",
        "Hey Alice from Online match!",
        "Nice capture on move 4!",
    ]
    db.close()


def test_chat_unlock_session_iso_format_has_timezone_and_inr_10():
    """ChatUnlockSession.to_dict() must format naive datetimes with timezone and priceInr=10."""
    from app.models.chat import ChatUnlockSession
    now = datetime(2026, 11, 1, 10, 45, 0)
    exp = datetime(2026, 11, 1, 10, 50, 0)
    session = ChatUnlockSession(
        user1_id="u1",
        user2_id="u2",
        is_unlocked=True,
        unlocked_at=now,
        expires_at=exp,
        unlock_reason="Move 4 capture",
    )
    d = session.to_dict()
    assert d["priceInr"] == 10
    assert d["expiresAt"] is not None
    assert d["expiresAt"].endswith("+00:00") or d["expiresAt"].endswith("Z")
    assert d["unlockedAt"].endswith("+00:00") or d["unlockedAt"].endswith("Z")


def test_check_can_chat_allows_online_opponent_with_unlocked_chat():
    """check_can_chat must permit online opponents with unlocked chat, games, or past messages."""
    from datetime import datetime, timedelta, timezone
    from app.routers.chat import check_can_chat
    from app.models.chat import ChatUnlockSession
    from app.models.user import User

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    u1 = User(id="u1_id", username="player1", email="p1@example.com", hashed_password="hash")
    u2 = User(id="u2_id", username="player2", email="p2@example.com", hashed_password="hash")
    db.add_all([u1, u2])
    db.commit()

    # Case 1: Active unlocked session
    session = ChatUnlockSession(
        user1_id="u1_id",
        user2_id="u2_id",
        is_unlocked=True,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        unlock_count=1,
    )
    db.add(session)
    db.commit()

    assert check_can_chat(db, "u1_id", "u2_id", session=session) is True

    # Case 2: Session expired (remaining == 0) but unlock_count > 0 allows viewing past conversation
    session.is_unlocked = False
    session.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()

    assert check_can_chat(db, "u1_id", "u2_id", session=session) is True
    db.close()


def test_get_chat_messages_endpoint_returns_history_for_online_opponents():
    """get_chat_messages endpoint must return 200 with messages and UTC expiresAt for online opponents."""
    from datetime import datetime, timedelta, timezone
    from app.routers.chat import get_chat_messages
    from app.models.chat import ChatUnlockSession
    from app.models.user import User

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    u1 = User(id="u1_id", username="player1", email="p1@example.com", hashed_password="hash")
    u2 = User(id="u2_id", username="player2", email="p2@example.com", hashed_password="hash")
    db.add_all([u1, u2])
    db.commit()

    # Create unlocked session between player1 and player2
    exp = datetime.now(timezone.utc) + timedelta(minutes=5)
    session = ChatUnlockSession(
        user1_id="u1_id",
        user2_id="u2_id",
        is_unlocked=True,
        unlocked_at=datetime.now(timezone.utc),
        expires_at=exp,
        unlock_count=1,
    )
    db.add(session)
    db.commit()

    # Send messages between player1 and player2
    chat_service.send_message(db, sender_id="u1_id", receiver_id="u2_id", text="Hello from player1!", game_id="game_123")
    chat_service.send_message(db, sender_id="u2_id", receiver_id="u1_id", text="Hello back from player2!", game_id="game_123")

    # Call get_chat_messages as player1 querying player2
    res = get_chat_messages(friend_id="u2_id", current_user=u1, db=db)
    assert res["success"] is True
    assert res["isUnlocked"] is True
    assert res["timeRemainingSeconds"] > 0
    assert res["expiresAt"] is not None
    assert res["expiresAt"].endswith("+00:00") or res["expiresAt"].endswith("Z")
    assert len(res["messages"]) == 2
    assert res["messages"][0]["text"] == "Hello from player1!"
    assert res["messages"][1]["text"] == "Hello back from player2!"

    # Refresh simulation after session expires: player1 should still be able to read their message history!
    session.is_unlocked = False
    session.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()

    res_expired = get_chat_messages(friend_id="u2_id", current_user=u1, db=db)
    assert res_expired["success"] is True
    assert res_expired["isUnlocked"] is False
    assert res_expired["timeRemainingSeconds"] == 0
    assert len(res_expired["messages"]) == 2
    assert res_expired["messages"][0]["text"] == "Hello from player1!"
    assert res_expired["messages"][1]["text"] == "Hello back from player2!"

    db.close()
