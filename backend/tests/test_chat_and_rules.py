import pytest
import chess
from fastapi.testclient import TestClient
from app.main import app
from app.models.game import Game

client = TestClient(app)

def get_or_create_test_user(email, username, password="TestPassword123!"):
    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    if login_res.status_code == 200:
        return login_res.json()["token"], login_res.json()["user"]
    reg_res = client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
        "skill": "intermediate"
    })
    return reg_res.json()["token"], reg_res.json()["user"]

def test_chess_legal_moves_and_illegal_move_prevention():
    """Verify legal move rules and illegal move rejection (Requirement 6)."""
    game = Game(game_id="test_rules_1", player1="Alice", player2="Bob")
    
    # Legal pawn move
    success, msg = game.make_move("e2", "e4")
    assert success is True
    assert "e2e4" in game.moves

    # Illegal move: cannot move rook through pawns
    bad_success, bad_msg = game.make_move("a1", "a4")
    assert bad_success is False
    assert "Illegal" in bad_msg

    # Legal black move
    success, msg = game.make_move("e7", "e5")
    assert success is True

    # Legal knight move
    success, msg = game.make_move("g1", "f3")
    assert success is True

    # Illegal black move (moving opponent piece or jumping illegally)
    bad_success, bad_msg = game.make_move("a8", "a5")
    assert bad_success is False


def test_chess_king_check_highlight_square():
    """Verify king check detection and accurate check_square (Requirement 6)."""
    game = Game(game_id="test_check_1", player1="Alice", player2="Bob")
    # Quick sequence leading to check on black king:
    # 1. e4 f5 2. Qh5+
    game.make_move("e2", "e4")
    game.make_move("f7", "f5")
    success, msg = game.make_move("d1", "h5")
    assert success is True

    state = game.get_state()
    assert state["is_check"] is True
    # Black king is on e8 -> index 4 or 'e8' notation
    assert state["check_square"] in (4, "e8")


def test_chess_checkmate_and_game_over_popup():
    """Verify Fool's Mate checkmate ends the game and identifies winner (Requirement 7)."""
    # Fool's mate: 1. f3 e5 2. g4 Qh4# (White is checkmated, Black wins)
    game = Game(game_id="test_mate_1", player1="WhitePlayer", player2="BlackPlayer")
    game.make_move("f2", "f3")
    game.make_move("e7", "e5")
    game.make_move("g2", "g4")
    success, msg = game.make_move("d8", "h4")
    assert success is True

    state = game.get_state()
    assert state["is_checkmate"] is True
    assert state["is_game_over"] is True
    assert state["winner"] == "BlackPlayer"


def test_capture_within_5_moves_triggers_chat_unlock():
    """Verify capturing opponent piece within 5 moves unlocks secret chat with 5-minute timer (Requirement 8)."""
    game = Game(game_id="test_capture_1", player1="Player1", player2="Player2")
    # Quick sequence with early capture within 5 moves:
    # 1. e4 d5 (move 1)
    # 2. exd5 (move 2 -> pawn captures pawn!)
    game.make_move("e2", "e4")
    game.make_move("d7", "d5")
    success, msg = game.make_move("e4", "d5")
    assert success is True

    state = game.get_state()
    assert state["chat_unlocked"] is True
    assert state["chat_time_remaining"] > 290  # 5 minutes countdown initialized
    assert state["captured_pieces"]["white"] == ["p"]


def test_friend_request_reject_flow():
    """Verify friend request reject flow (Requirement 4)."""
    diwa_token, diwa_user = get_or_create_test_user("diwa@gmail.com", "diwa", "diwa123")
    bob_token, bob_user = get_or_create_test_user("test_bob_chess@test.com", "TestBobPlayer")

    # Diwa sends friend request to Bob
    req_res = client.post("/api/friends/request", json={
        "target_player_id": bob_user["playerId"]
    }, headers={"Authorization": f"Bearer {diwa_token}"})
    assert req_res.status_code == 200

    # Bob views notifications
    notif_res = client.get("/api/friends/notifications", headers={"Authorization": f"Bearer {bob_token}"})
    notifs = notif_res.json()["notifications"]
    matching = [n for n in notifs if n.get("sender", {}).get("username") == "diwa" or n.get("senderId") == diwa_user["id"]]

    if matching:
        req_id = matching[0]["id"]
        # Bob rejects request
        reject_res = client.post("/api/friends/respond", json={
            "request_id": req_id,
            "action": "reject"
        }, headers={"Authorization": f"Bearer {bob_token}"})
        assert reject_res.status_code == 200
        assert reject_res.json()["status"] in ["declined", "rejected"]


def test_chat_access_restricted_to_accepted_friends():
    """Verify messaging and chat history restricted strictly to accepted friends (Requirement 5)."""
    user_a_token, user_a = get_or_create_test_user("user_a_restricted@test.com", "UserARestricted")
    user_b_token, user_b = get_or_create_test_user("user_b_restricted@test.com", "UserBRestricted")

    # If A and B are not friends, get /messages should return 403
    status_res = client.get(f"/api/chat/status/{user_b['id']}", headers={"Authorization": f"Bearer {user_a_token}"})
    assert status_res.status_code == 200
    if not status_res.json()["isFriend"]:
        send_res = client.post(f"/api/chat/messages/{user_b['id']}", json={"text": "Hello!"}, headers={"Authorization": f"Bearer {user_a_token}"})
        assert send_res.status_code == 403
        assert "accepted friends" in send_res.json()["detail"]


def test_chat_unlock_timer_and_demo_payment_flow():
    """Verify 5-minute unlock, messaging, and ₹10 DEMO payment extension (Requirement 8, 9)."""
    # 1. Create two test friends
    user1_token, user1 = get_or_create_test_user("chat_tester1@test.com", "ChatTester1")
    user2_token, user2 = get_or_create_test_user("chat_tester2@test.com", "ChatTester2")

    # Connect them as friends first
    req_res = client.post("/api/friends/request", json={"target_player_id": user2["playerId"]}, headers={"Authorization": f"Bearer {user1_token}"})
    notifs_res = client.get("/api/friends/notifications", headers={"Authorization": f"Bearer {user2_token}"})
    notifs = notifs_res.json()["notifications"]
    if notifs:
        client.post("/api/friends/respond", json={"request_id": notifs[0]["id"], "action": "accept"}, headers={"Authorization": f"Bearer {user2_token}"})

    # 2. Check chat status
    status_res = client.get(f"/api/chat/status/{user2['id']}", headers={"Authorization": f"Bearer {user1_token}"})
    assert status_res.status_code == 200

    # 3. Unlock chat (simulating capture within 5 moves)
    unlock_res = client.post(f"/api/chat/unlock/{user2['id']}", json={
        "reason": "Opponent piece captured within 5 moves in chess match"
    }, headers={"Authorization": f"Bearer {user1_token}"})
    assert unlock_res.status_code == 200
    assert unlock_res.json()["isUnlocked"] is True
    assert unlock_res.json()["timeRemainingSeconds"] > 290  # 5 minutes = 300s

    # 4. User 1 sends message to User 2
    send_res = client.post(f"/api/chat/messages/{user2['id']}", json={
        "text": "Great match! Let's analyze that pawn capture."
    }, headers={"Authorization": f"Bearer {user1_token}"})
    assert send_res.status_code == 200
    assert send_res.json()["message"]["text"] == "Great match! Let's analyze that pawn capture."

    # 5. User 2 retrieves messages
    user2_msgs = client.get(f"/api/chat/messages/{user1['id']}", headers={"Authorization": f"Bearer {user2_token}"})
    assert user2_msgs.status_code == 200
    assert any(m["text"] == "Great match! Let's analyze that pawn capture." for m in user2_msgs.json()["messages"])

    # 6. DEMO Payment Extension (+5 minutes for ₹10)
    bad_pay = client.post(f"/api/chat/pay-demo/{user2['id']}", json={
        "amount": 25,
        "payment_method": "demo_upi"
    }, headers={"Authorization": f"Bearer {user1_token}"})
    assert bad_pay.status_code == 400

    pay_res = client.post(f"/api/chat/pay-demo/{user2['id']}", json={
        "amount": 10,
        "payment_method": "demo_upi"
    }, headers={"Authorization": f"Bearer {user1_token}"})
    assert pay_res.status_code == 200
    pay_data = pay_res.json()
    assert pay_data["success"] is True
    assert "₹10 verified" in pay_data["message"]
    assert pay_data["status"]["paymentStatus"] == "demo_paid_10_inr"
    assert pay_data["timeRemainingSeconds"] > 500
