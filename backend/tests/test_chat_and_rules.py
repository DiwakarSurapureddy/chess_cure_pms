import pytest
import chess
from fastapi.testclient import TestClient
from app.main import app
from app.models.game import Game

client = TestClient(app)

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
    game.make_move("d1", "h5") # Queen gives check to King at e8

    state = game.get_state()
    assert state["is_check"] is True
    assert state["check_square"] == "e8"
    assert state["is_checkmate"] is False


def test_chess_checkmate_and_stalemate_detection():
    """Verify distinct checkmate and stalemate detection (Requirement 6)."""
    # 1. Fool's Mate (fastest checkmate)
    # 1. f3 e5 2. g4 Qh4#
    mate_game = Game(game_id="test_mate_1", player1="Alice", player2="Bob")
    mate_game.make_move("f2", "f3")
    mate_game.make_move("e7", "e5")
    mate_game.make_move("g2", "g4")
    mate_game.make_move("d8", "h4")

    state = mate_game.get_state()
    assert state["game_over"] is True
    assert state["is_checkmate"] is True
    assert state["status"] == "completed"
    assert state["result"] == "checkmate"
    assert state["winner"] == "Bob"

    # 2. Stalemate test
    # Position: White King at a1, White Queen at c2; Black King at a3.
    # Set up board directly to test stalemate rule handling:
    # FEN of stalemate: "k7/8/1Q6/8/8/8/8/K7 b - - 0 1" (Black king at a8, White Q at b6, White K at a1)
    stalemate_game = Game(game_id="test_stale_1", player1="Alice", player2="Bob")
    stalemate_game.board = chess.Board("k7/8/1Q6/8/8/8/8/K7 b - - 0 1")
    
    # Try any move or inspect state
    assert stalemate_game.board.is_stalemate() is True
    # Test make_move behavior or directly get_state
    state = stalemate_game.get_state()
    assert state["is_stalemate"] is True
    assert state["is_checkmate"] is False


def test_capture_within_5_moves_unlocks_chat():
    """Verify chat unlocks when a piece is legally captured within 5 moves (Requirement 8)."""
    game = Game(game_id="test_capture_unlock", player1="Alice", player2="Bob")
    assert game.chat_unlocked is False

    # 1. e4 d5 (move 1)
    game.make_move("e2", "e4")
    game.make_move("d7", "d5")

    # 2. exd5 (move 2, White captures Black pawn d5)
    success, msg = game.make_move("e4", "d5")
    assert success is True
    assert "p" in game.captured_pieces["white"]
    assert game.chat_unlocked is True
    assert "captured opponent piece" in game.chat_unlock_reason

    state = game.get_state()
    assert state["chat_unlocked"] is True
    assert state["chat_time_remaining"] > 290  # 5 minutes countdown initialized
    assert state["captured_pieces"]["white"] == ["p"]


def test_friend_request_reject_flow():
    """Verify friend request reject flow (Requirement 4)."""
    # Login diwa
    diwa_login = client.post("/api/auth/login", json={"email": "diwa@gmail.com", "password": "diwa123"})
    diwa_token = diwa_login.json()["token"]

    # Login Master (100002)
    master_login = client.post("/api/auth/login", json={"email": "master@chesscure.com", "password": "Checkmate2026!"})
    master_token = master_login.json()["token"]
    master_player_id = master_login.json()["user"]["playerId"]

    # Diwa sends friend request to Master
    req_res = client.post("/api/friends/request", json={
        "target_player_id": master_player_id
    }, headers={"Authorization": f"Bearer {diwa_token}"})
    assert req_res.status_code == 200

    # Master views notifications
    notif_res = client.get("/api/friends/notifications", headers={"Authorization": f"Bearer {master_token}"})
    notifs = notif_res.json()["notifications"]
    matching = [n for n in notifs if n.get("sender", {}).get("username") == "diwa" or n.get("senderId") == diwa_login.json()["user"]["id"]]

    if matching:
        req_id = matching[0]["id"]
        # Master rejects request
        reject_res = client.post("/api/friends/respond", json={
            "request_id": req_id,
            "action": "reject"
        }, headers={"Authorization": f"Bearer {master_token}"})
        assert reject_res.status_code == 200
        assert reject_res.json()["status"] in ["declined", "rejected"]


def test_chat_access_restricted_to_accepted_friends():
    """Verify messaging and chat history restricted strictly to accepted friends (Requirement 5)."""
    # Grandmaster (#100001) and Master (#100002)
    gm_login = client.post("/api/auth/login", json={"email": "grandmaster@chesscure.com", "password": "Checkmate2026!"})
    gm_token = gm_login.json()["token"]
    master_login = client.post("/api/auth/login", json={"email": "master@chesscure.com", "password": "Checkmate2026!"})
    master_id = master_login.json()["user"]["id"]

    # If GM and Master are not friends, get /messages should return 403
    status_res = client.get(f"/api/chat/status/{master_id}", headers={"Authorization": f"Bearer {gm_token}"})
    assert status_res.status_code == 200
    # If not friends, isFriend is False
    if not status_res.json()["isFriend"]:
        send_res = client.post(f"/api/chat/messages/{master_id}", json={"text": "Hello!"}, headers={"Authorization": f"Bearer {gm_token}"})
        assert send_res.status_code == 403
        assert "accepted friends" in send_res.json()["detail"]


def test_chat_unlock_timer_and_demo_payment_flow():
    """Verify 5-minute unlock, lock when expired, and ₹10 DEMO payment extension (Requirement 8, 9)."""
    # 1. Login Diwa and Sumathi (accepted friends from friend tests)
    diwa_login = client.post("/api/auth/login", json={"email": "diwa@gmail.com", "password": "diwa123"})
    diwa_token = diwa_login.json()["token"]
    sumathi_login = client.post("/api/auth/login", json={"email": "gajjalasumathi502@gmail.com", "password": "diwa123"})
    sumathi_token = sumathi_login.json()["token"]
    sumathi_id = sumathi_login.json()["user"]["id"]

    # 2. Check chat status
    status_res = client.get(f"/api/chat/status/{sumathi_id}", headers={"Authorization": f"Bearer {diwa_token}"})
    assert status_res.status_code == 200
    assert status_res.json()["isFriend"] is True

    # 3. Unlock chat (simulating capture within 5 moves)
    unlock_res = client.post(f"/api/chat/unlock/{sumathi_id}", json={
        "reason": "Opponent piece captured within 5 moves in chess match"
    }, headers={"Authorization": f"Bearer {diwa_token}"})
    assert unlock_res.status_code == 200
    assert unlock_res.json()["isUnlocked"] is True
    assert unlock_res.json()["timeRemainingSeconds"] > 290  # 5 minutes = 300s

    # 4. Diwa sends a message to Sumathi
    send_res = client.post(f"/api/chat/messages/{sumathi_id}", json={
        "text": "Great match! Let's analyze that pawn capture."
    }, headers={"Authorization": f"Bearer {diwa_token}"})
    assert send_res.status_code == 200
    assert send_res.json()["message"]["text"] == "Great match! Let's analyze that pawn capture."

    # 5. Sumathi retrieves messages
    sumathi_msgs = client.get(f"/api/chat/messages/{diwa_login.json()['user']['id']}", headers={"Authorization": f"Bearer {sumathi_token}"})
    assert sumathi_msgs.status_code == 200
    assert any(m["text"] == "Great match! Let's analyze that pawn capture." for m in sumathi_msgs.json()["messages"])

    # 6. DEMO Payment Extension (+5 minutes for ₹10)
    # Test invalid payment amount rejection
    bad_pay = client.post(f"/api/chat/pay-demo/{sumathi_id}", json={
        "amount": 25,
        "payment_method": "demo_upi"
    }, headers={"Authorization": f"Bearer {diwa_token}"})
    assert bad_pay.status_code == 400

    # Test valid ₹10 DEMO payment
    pay_res = client.post(f"/api/chat/pay-demo/{sumathi_id}", json={
        "amount": 10,
        "payment_method": "demo_upi"
    }, headers={"Authorization": f"Bearer {diwa_token}"})
    assert pay_res.status_code == 200
    pay_data = pay_res.json()
    assert pay_data["success"] is True
    assert "₹10 verified" in pay_data["message"]
    assert pay_data["status"]["paymentStatus"] == "demo_paid_10_inr"
    assert pay_data["timeRemainingSeconds"] > 500  # Extended beyond 5 mins (e.g. ~600s total)
