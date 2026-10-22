
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.chat import ChatUnlockSession
from app.models.friend import FriendRequest

client = TestClient(app)


def register_test_user(label: str):
    suffix = uuid.uuid4().hex[:10]

    response = client.post(
        "/api/auth/register",
        json={
            "username": f"scapi_{label}_{suffix}",
            "email": f"scapi_{label}_{suffix}@example.com",
            "password": "TestPassword123!",
            "skill": "intermediate",
        },
    )

    assert response.status_code in (200, 201), response.text

    payload = response.json()
    assert "token" in payload, payload
    assert "user" in payload, payload

    return payload["token"], payload["user"]


@pytest.fixture
def secret_chat_pair():
    token_a, user_a = register_test_user("alice")
    token_b, user_b = register_test_user("bob")

    db = SessionLocal()
    try:
        friendship = FriendRequest(
            sender_id=user_a["id"],
            receiver_id=user_b["id"],
            status="accepted",
        )
        db.add(friendship)
        db.commit()
    finally:
        db.close()

    return {
        "token_a": token_a,
        "token_b": token_b,
        "user_a": user_a,
        "user_b": user_b,
    }


def create_unlocked_game(user_a, user_b):
    response = client.post(
        "/api/games",
        json={
            "player1": user_a["username"],
            "player2": user_b["username"],
        },
    )

    assert response.status_code in (200, 201), response.text

    game_data = response.json().get("game", {})
    game_id = game_data.get("game_id")
    assert game_id, response.json()

    # Five moves by each player.
    moves = [
        ("e2", "e4"),
        ("d7", "d5"),
        ("e4", "d5"),
        ("d8", "d5"),
        ("b1", "c3"),
        ("d5", "d6"),
        ("g1", "f3"),
        ("b8", "c6"),
        ("f1", "b5"),
        ("c8", "f5"),
    ]

    for from_square, to_square in moves:
        move_response = client.post(
            f"/api/games/{game_id}/move",
            json={
                "from_square": from_square,
                "to_square": to_square,
            },
        )
        assert move_response.status_code == 200, move_response.text

    return game_id


def find_chat_session(user_a_id, user_b_id):
    db = SessionLocal()
    try:
        return db.query(ChatUnlockSession).filter(
            (
                (ChatUnlockSession.user1_id == user_a_id)
                & (ChatUnlockSession.user2_id == user_b_id)
            )
            |
            (
                (ChatUnlockSession.user1_id == user_b_id)
                & (ChatUnlockSession.user2_id == user_a_id)
            )
        ).first()
    finally:
        db.close()


def test_secret_chat_api_unlock_message_extension_and_expiry(
    secret_chat_pair,
):
    user_a = secret_chat_pair["user_a"]
    user_b = secret_chat_pair["user_b"]

    headers = {
        "Authorization": f"Bearer {secret_chat_pair['token_a']}"
    }

    game_id = create_unlocked_game(user_a, user_b)

    # 1. Verify that playing the required moves unlocks Secret Chat.
    status_response = client.get(
        f"/api/chat/status/{user_b['username']}",
        headers=headers,
    )

    assert status_response.status_code == 200, status_response.text
    assert status_response.json()["isUnlocked"] is True
    assert status_response.json()["timeRemainingSeconds"] > 0

    # 2. Send a message and verify the bot reply.
    send_response = client.post(
        f"/api/chat/messages/{user_b['username']}",
        json={
            "text": "hello",
            "game_id": game_id,
        },
        headers=headers,
    )

    assert send_response.status_code == 200, send_response.text
    assert send_response.json().get("success") is True
    assert send_response.json().get("botReply")

    # 3. Retrieve the conversation.
    messages_response = client.get(
        f"/api/chat/messages/{user_b['username']}",
        headers=headers,
    )

    assert messages_response.status_code == 200, messages_response.text

    messages_payload = messages_response.json()
    assert messages_payload.get("success") is True
    assert len(messages_payload.get("messages", [])) >= 2

    # 4. Extend the active session through the demo payment endpoint.
    before_extension = find_chat_session(user_a["id"], user_b["id"])

    assert before_extension is not None
    old_extension_count = before_extension.extended_count or 0
    old_expiry = before_extension.expires_at

    payment_response = client.post(
        f"/api/chat/pay-demo/{user_b['username']}?game_id={game_id}",
        json={
            "amount": 10,
            "payment_method": "demo_upi",
            "transaction_id": f"test-{uuid.uuid4().hex}",
        },
        headers=headers,
    )

    assert payment_response.status_code == 200, payment_response.text

    after_extension = find_chat_session(user_a["id"], user_b["id"])

    assert after_extension is not None
    assert after_extension.extended_count == old_extension_count + 1
    assert after_extension.payment_status == "demo_paid_10_inr"
    assert old_expiry is not None
    assert after_extension.expires_at > old_expiry

    # 5. Force the persisted session to expire.
    db = SessionLocal()
    try:
        session = db.query(ChatUnlockSession).filter(
            (
                (ChatUnlockSession.user1_id == user_a["id"])
                & (ChatUnlockSession.user2_id == user_b["id"])
            )
            |
            (
                (ChatUnlockSession.user1_id == user_b["id"])
                & (ChatUnlockSession.user2_id == user_a["id"])
            )
        ).first()

        assert session is not None
        assert session.unlocked_at is not None

        session.is_unlocked = True
        session.expires_at = (
            datetime.now(timezone.utc) - timedelta(seconds=10)
        )
        db.commit()
    finally:
        db.close()

    # 6. Verify that checking status does not restart the session.
    expired_status = client.get(
        f"/api/chat/status/{user_b['username']}",
        headers=headers,
    )

    assert expired_status.status_code == 200, expired_status.text
    assert expired_status.json()["isUnlocked"] is False
    assert expired_status.json()["timeRemainingSeconds"] == 0

    # 7. Explicit unlock must not restart the expired session.
    restart_response = client.post(
        f"/api/chat/unlock/{user_b['username']}",
        json={"game_id": game_id},
        headers=headers,
    )

    assert restart_response.status_code == 403, restart_response.text
    assert "expired" in restart_response.json()["detail"].lower()



def test_self_chat_is_rejected_for_all_chat_endpoints(secret_chat_pair):
    user = secret_chat_pair["user_a"]
    token = secret_chat_pair["token_a"]
    username = user["username"]
    headers = {"Authorization": f"Bearer {token}"}

    responses = [
        client.get(
            f"/api/chat/status/{username}",
            headers=headers,
        ),
        client.get(
            f"/api/chat/messages/{username}",
            headers=headers,
        ),
        client.post(
            f"/api/chat/messages/{username}",
            json={"text": "Hello"},
            headers=headers,
        ),
        client.post(
            f"/api/chat/unlock/{username}",
            json={"game_id": "self-chat-test"},
            headers=headers,
        ),
        client.post(
            f"/api/chat/pay-demo/{username}?game_id=self-chat-test",
            json={"amount": 10},
            headers=headers,
        ),
    ]

    for response in responses:
        assert response.status_code == 400, (
            f"Expected 400 for self-chat, got "
            f"{response.status_code}: {response.text}"
        )
