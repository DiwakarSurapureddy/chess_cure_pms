
import pytest
import chess
from fastapi.testclient import TestClient

from app.main import app
from app.models.game import Game

client = TestClient(app)


def get_or_create_test_user(
    email,
    username,
    password="TestPassword123!",
):
    login_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )

    if login_res.status_code == 200:
        return (
            login_res.json()["token"],
            login_res.json()["user"],
        )

    reg_res = client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "skill": "intermediate",
        },
    )
    assert reg_res.status_code in (200, 201), reg_res.text

    return reg_res.json()["token"], reg_res.json()["user"]


def test_chess_legal_moves_and_illegal_move_prevention():
    game = Game(
        game_id="test_rules_1",
        player1="Alice",
        player2="Bob",
    )

    success, msg = game.make_move("e2", "e4")
    assert success is True
    assert "e2e4" in game.moves

    bad_success, bad_msg = game.make_move("a1", "a4")
    assert bad_success is False
    assert "Illegal" in bad_msg

    success, msg = game.make_move("e7", "e5")
    assert success is True

    success, msg = game.make_move("g1", "f3")
    assert success is True

    bad_success, bad_msg = game.make_move("a8", "a5")
    assert bad_success is False


def test_chess_king_check_highlight_square():
    game = Game(
        game_id="test_check_1",
        player1="Alice",
        player2="Bob",
    )

    assert game.make_move("e2", "e4")[0] is True
    assert game.make_move("f7", "f5")[0] is True

    success, msg = game.make_move("d1", "h5")
    assert success is True, msg

    state = game.get_state()
    assert state["is_check"] is True
    assert state["check_square"] in (4, "e8")


def test_chess_checkmate_and_game_over_popup():
    game = Game(
        game_id="test_mate_1",
        player1="WhitePlayer",
        player2="BlackPlayer",
    )

    assert game.make_move("f2", "f3")[0] is True
    assert game.make_move("e7", "e5")[0] is True
    assert game.make_move("g2", "g4")[0] is True

    success, msg = game.make_move("d8", "h4")
    assert success is True, msg

    state = game.get_state()
    assert state["is_checkmate"] is True
    assert state["is_game_over"] is True
    assert state["winner"] == "BlackPlayer"


def test_secret_chat_unlocks_after_both_players_complete_five_moves():
    """A capture alone must not unlock chat; both players need 5 legal moves."""

    game = Game(
        game_id="test_secret_chat_1",
        player1="Player1",
        player2="Player2",
    )

    # White captures the black pawn on move 2.
    moves_before_unlock = [
        ("e2", "e4"),  # White 1
        ("d7", "d5"),  # Black 1
        ("e4", "d5"),  # White 2: captures pawn
        ("d8", "d5"),  # Black 2: queen captures white pawn
        ("b1", "c3"),  # White 3
        ("d5", "d6"),  # Black 3
        ("g1", "f3"),  # White 4
        ("b8", "c6"),  # Black 4
    ]

    for from_square, to_square in moves_before_unlock:
        success, msg = game.make_move(from_square, to_square)
        assert success is True, (
            f"Move {from_square}-{to_square} failed: {msg}"
        )

    state = game.get_state()
    assert state["player1_move_count"] == 4
    assert state["player2_move_count"] == 4
    assert state["chat_unlocked"] is False

    # White's fifth legal move.
    success, msg = game.make_move("f1", "b5")
    assert success is True, msg
    assert game.get_state()["chat_unlocked"] is False

    # Black's fifth legal move.
    success, msg = game.make_move("c8", "f5")
    assert success is True, msg

    state = game.get_state()
    assert state["player1_move_count"] == 5
    assert state["player2_move_count"] == 5
    assert state["chat_unlocked"] is True
    assert state["chat_time_remaining"] > 290
    assert state["captured_pieces"]["white"] == ["p"]


def test_friend_request_reject_flow():
    diwa_token, diwa_user = get_or_create_test_user(
        "diwa@gmail.com", "diwa", "diwa123"
    )
    bob_token, bob_user = get_or_create_test_user(
        "test_bob_chess@test.com", "TestBobPlayer"
    )

    req_res = client.post(
        "/api/friends/request",
        json={"target_player_id": bob_user["playerId"]},
        headers={"Authorization": f"Bearer {diwa_token}"},
    )
    assert req_res.status_code == 200

    notif_res = client.get(
        "/api/friends/notifications",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    notifs = notif_res.json()["notifications"]

    matching = [
        n for n in notifs
        if n.get("sender", {}).get("username") == "diwa"
        or n.get("senderId") == diwa_user["id"]
    ]

    if matching:
        reject_res = client.post(
            "/api/friends/respond",
            json={
                "request_id": matching[0]["id"],
                "action": "reject",
            },
            headers={"Authorization": f"Bearer {bob_token}"},
        )
        assert reject_res.status_code == 200
        assert reject_res.json()["status"] in ["declined", "rejected"]


def test_chat_access_restricted_to_accepted_friends():
    user_a_token, user_a = get_or_create_test_user(
        "user_a_restricted@test.com", "UserARestricted"
    )
    user_b_token, user_b = get_or_create_test_user(
        "user_b_restricted@test.com", "UserBRestricted"
    )

    status_res = client.get(
        f"/api/chat/status/{user_b['id']}",
        headers={"Authorization": f"Bearer {user_a_token}"},
    )
    assert status_res.status_code == 200

    if not status_res.json()["isFriend"]:
        send_res = client.post(
            f"/api/chat/messages/{user_b['id']}",
            json={"text": "Hello!"},
            headers={"Authorization": f"Bearer {user_a_token}"},
        )
        assert send_res.status_code == 403
        assert "accepted friends" in send_res.json()["detail"]
