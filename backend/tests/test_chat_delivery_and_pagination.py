import pytest
from datetime import datetime, timezone, timedelta
from app.routers.chat import SendMessageRequest
from app.services.chat_service import chat_service
from app.models.chat import ChatMessage
from app.models.user import User
from app.models.friend import FriendRequest
from app.database import SessionLocal


def test_send_message_request_accepts_client_message_id():
    req1 = SendMessageRequest(text="Hello", client_message_id="client-123")
    assert req1.client_message_id == "client-123"

    req2 = SendMessageRequest(text="World", clientMessageId="client-456")
    assert req2.clientMessageId == "client-456"


def test_chat_service_pagination_and_ordering():
    db = SessionLocal()
    try:
        # Create test users
        u1 = User(
            username=f"pag_test_u1_{datetime.now().timestamp()}",
            email=f"pag_u1_{datetime.now().timestamp()}@example.com",
            player_id=f"P_{int(datetime.now().timestamp() * 1000)}",
            is_active=True,
        )
        u2 = User(
            username=f"pag_test_u2_{datetime.now().timestamp()}",
            email=f"pag_u2_{datetime.now().timestamp()}@example.com",
            player_id=f"P_{int(datetime.now().timestamp() * 1000) + 1}",
            is_active=True,
        )
        db.add_all([u1, u2])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)

        # Make them friends
        fr = FriendRequest(sender_id=u1.id, receiver_id=u2.id, status="accepted")
        db.add(fr)
        db.commit()

        # Insert 15 messages sequentially
        now = datetime.now(timezone.utc)
        for i in range(15):
            msg = ChatMessage(
                sender_id=u1.id,
                receiver_id=u2.id,
                text=f"Message {i+1}",
                client_message_id=f"cid-{i+1}",
                created_at=now + timedelta(seconds=i * 10),
            )
            db.add(msg)
        db.commit()

        # Query latest 5 messages
        latest_msgs, has_more = chat_service.get_messages(
            db, u1.id, u2.id, limit=5, return_has_more=True
        )
        assert len(latest_msgs) == 5
        assert has_more is True
        # Must be in chronological order
        assert [m.text for m in latest_msgs] == [
            "Message 11",
            "Message 12",
            "Message 13",
            "Message 14",
            "Message 15",
        ]
        assert latest_msgs[-1].client_message_id == "cid-15"

        # Query older 5 messages before the oldest of latest_msgs
        oldest_ts = latest_msgs[0].created_at.isoformat()
        older_msgs, has_more_older = chat_service.get_messages(
            db, u1.id, u2.id, limit=5, before=oldest_ts, return_has_more=True
        )
        assert len(older_msgs) == 5
        assert has_more_older is True
        assert [m.text for m in older_msgs] == [
            "Message 6",
            "Message 7",
            "Message 8",
            "Message 9",
            "Message 10",
        ]

        # Query first 5 messages before Message 6
        oldest_of_older = older_msgs[0].created_at.isoformat()
        first_msgs, has_more_first = chat_service.get_messages(
            db, u1.id, u2.id, limit=5, before=oldest_of_older, return_has_more=True
        )
        assert len(first_msgs) == 5
        assert has_more_first is False
        assert [m.text for m in first_msgs] == [
            "Message 1",
            "Message 2",
            "Message 3",
            "Message 4",
            "Message 5",
        ]
    finally:
        db.close()


def test_get_chat_messages_endpoint_enrichment_and_eager_loading():
    from app.routers.chat import get_chat_messages
    db = SessionLocal()
    try:
        ts = datetime.now().timestamp()
        u1 = User(
            username=f"enrich_u1_{ts}",
            email=f"enrich_u1_{ts}@example.com",
            player_id=f"P_{int(ts * 1000)}",
            is_active=True,
        )
        u2 = User(
            username=f"enrich_u2_{ts}",
            email=f"enrich_u2_{ts}@example.com",
            player_id=f"P_{int(ts * 1000) + 1}",
            is_active=True,
        )
        db.add_all([u1, u2])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)

        fr = FriendRequest(sender_id=u1.id, receiver_id=u2.id, status="accepted")
        db.add(fr)
        db.commit()

        msg = ChatMessage(
            sender_id=u1.id,
            receiver_id=u2.id,
            text="Unified endpoint test message",
            client_message_id="client-unified-1",
        )
        db.add(msg)
        db.commit()

        res = get_chat_messages(friend_id=u2.id, limit=50, current_user=u1, db=db)
        assert res["success"] is True
        assert res["isFriend"] is True
        assert "isUnlocked" in res
        assert "timeRemainingSeconds" in res
        assert "expiresAt" in res
        assert "friend" in res
        assert res["friend"]["id"] == u2.id
        assert len(res["messages"]) == 1
        assert res["messages"][0]["text"] == "Unified endpoint test message"
        assert res["messages"][0]["clientMessageId"] == "client-unified-1"
        assert res["messages"][0]["senderUsername"] == u1.username
        assert res["hasMore"] is False
    finally:
        db.close()


def test_read_authorization_separated_from_send_authorization():
    from fastapi import HTTPException
    from app.routers.chat import get_chat_messages, check_can_chat, check_can_read_chat, send_chat_message, SendMessageRequest
    import asyncio
    db = SessionLocal()
    try:
        ts = datetime.now().timestamp()
        u1 = User(
            username=f"read_u1_{ts}",
            email=f"read_u1_{ts}@example.com",
            player_id=f"P_{int(ts * 1000)}",
            is_active=True,
        )
        u2 = User(
            username=f"read_u2_{ts}",
            email=f"read_u2_{ts}@example.com",
            player_id=f"P_{int(ts * 1000) + 1}",
            is_active=True,
        )
        u3 = User(
            username=f"read_u3_{ts}",
            email=f"read_u3_{ts}@example.com",
            player_id=f"P_{int(ts * 1000) + 2}",
            is_active=True,
        )
        db.add_all([u1, u2, u3])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)
        db.refresh(u3)

        # Before any messages: u1 and u2 are not friends and not unlocked
        assert check_can_chat(db, u1.id, u2.id) is False
        assert check_can_read_chat(db, u1.id, u2.id) is False

        # Non-participant or unauthorized read raises 403
        with pytest.raises(HTTPException) as exc_info:
            get_chat_messages(friend_id=u2.id, limit=50, current_user=u1, db=db)
        assert exc_info.value.status_code == 403

        # Now simulate a past message between u1 and u2 (e.g. from an earlier completed game)
        past_msg = ChatMessage(
            sender_id=u1.id,
            receiver_id=u2.id,
            text="Historical message between u1 and u2",
            client_message_id="cid-hist-1",
        )
        db.add(past_msg)
        db.commit()

        # Now: READ authorization must succeed for conversation participants!
        assert check_can_read_chat(db, u1.id, u2.id) is True
        assert check_can_read_chat(db, u2.id, u1.id) is True

        res_u1 = get_chat_messages(friend_id=u2.id, limit=50, current_user=u1, db=db)
        assert res_u1["success"] is True
        assert res_u1["canRead"] is True
        assert res_u1["canChat"] is False  # Cannot send new messages without unlock/friendship
        assert len(res_u1["messages"]) == 1
        assert res_u1["messages"][0]["text"] == "Historical message between u1 and u2"

        # SEND authorization must still be rejected!
        assert check_can_chat(db, u1.id, u2.id) is False
        with pytest.raises(HTTPException) as send_exc:
            chat_service.send_message(
                db=db,
                sender_id=u1.id,
                receiver_id=u2.id,
                text="Unauthorized new message",
                can_chat_verified=False,
            )
        assert send_exc.value.status_code == 403

        # Third party u3 must NOT be authorized to read u1-u2 chat!
        assert check_can_read_chat(db, u3.id, u1.id) is False
        assert check_can_read_chat(db, u3.id, u2.id) is False
        with pytest.raises(HTTPException) as exc_u3:
            get_chat_messages(friend_id=u2.id, limit=50, current_user=u3, db=db)
        assert exc_u3.value.status_code == 403
    finally:
        db.close()


def test_bidirectional_and_commutative_chat_history():
    from app.routers.chat import get_chat_messages
    db = SessionLocal()
    try:
        ts = datetime.now().timestamp()
        u1 = User(
            username=f"comm_u1_{ts}",
            email=f"comm_u1_{ts}@example.com",
            player_id=f"P_{int(ts * 1000)}",
            is_active=True,
        )
        u2 = User(
            username=f"comm_u2_{ts}",
            email=f"comm_u2_{ts}@example.com",
            player_id=f"P_{int(ts * 1000) + 1}",
            is_active=True,
        )
        db.add_all([u1, u2])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)

        # Alternating messages between u1 and u2
        now = datetime.now(timezone.utc)
        m1 = ChatMessage(sender_id=u1.id, receiver_id=u2.id, text="Hello from u1", created_at=now)
        m2 = ChatMessage(sender_id=u2.id, receiver_id=u1.id, text="Hi back from u2", created_at=now + timedelta(seconds=5))
        m3 = ChatMessage(sender_id=u1.id, receiver_id=u2.id, text="Good game!", created_at=now + timedelta(seconds=10))
        db.add_all([m1, m2, m3])
        db.commit()

        # User 1 views conversation with User 2 (by UUID)
        res_from_u1 = get_chat_messages(friend_id=u2.id, limit=50, current_user=u1, db=db)
        # User 2 views conversation with User 1 (by UUID)
        res_from_u2 = get_chat_messages(friend_id=u1.id, limit=50, current_user=u2, db=db)
        # User 1 views conversation with User 2 using User 2's player_id
        res_by_player_id = get_chat_messages(friend_id=u2.player_id, limit=50, current_user=u1, db=db)

        # Both users retrieve the exact same message IDs in the exact same chronological order
        msgs1 = res_from_u1["messages"]
        msgs2 = res_from_u2["messages"]
        msgs_pid = res_by_player_id["messages"]

        assert len(msgs1) == 3
        assert len(msgs2) == 3
        assert len(msgs_pid) == 3

        ids1 = [m["id"] for m in msgs1]
        ids2 = [m["id"] for m in msgs2]
        ids_pid = [m["id"] for m in msgs_pid]

        assert ids1 == ids2 == ids_pid
        assert [m["text"] for m in msgs1] == ["Hello from u1", "Hi back from u2", "Good game!"]
        assert [m["text"] for m in msgs2] == ["Hello from u1", "Hi back from u2", "Good game!"]

        # Canonical friend identity is returned as UUID regardless of input format
        assert res_by_player_id["friend"]["id"] == u2.id
        assert res_by_player_id["friend"]["playerId"] == u2.player_id
    finally:
        db.close()


def test_chat_pagination_by_message_id_and_iso_timestamp():
    db = SessionLocal()
    try:
        ts = datetime.now().timestamp()
        u1 = User(
            username=f"cursor_u1_{ts}",
            email=f"cursor_u1_{ts}@example.com",
            player_id=f"P_{int(ts * 1000)}",
            is_active=True,
        )
        u2 = User(
            username=f"cursor_u2_{ts}",
            email=f"cursor_u2_{ts}@example.com",
            player_id=f"P_{int(ts * 1000) + 1}",
            is_active=True,
        )
        db.add_all([u1, u2])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)

        now = datetime.now(timezone.utc)
        messages = []
        for i in range(10):
            msg = ChatMessage(
                sender_id=u1.id,
                receiver_id=u2.id,
                text=f"Batch {i}",
                created_at=now + timedelta(seconds=i * 2),
            )
            messages.append(msg)
        db.add_all(messages)
        db.commit()
        for m in messages:
            db.refresh(m)

        # Pagination using Message ID (UUID)
        pivot_msg = messages[5]  # "Batch 5"
        msgs_by_id, has_more_id = chat_service.get_messages(
            db, u1.id, u2.id, limit=5, before=pivot_msg.id, return_has_more=True
        )
        assert len(msgs_by_id) == 5
        assert [m.text for m in msgs_by_id] == ["Batch 0", "Batch 1", "Batch 2", "Batch 3", "Batch 4"]

        # Pagination using ISO string timestamp
        pivot_iso = pivot_msg.created_at.isoformat()
        msgs_by_iso, has_more_iso = chat_service.get_messages(
            db, u1.id, u2.id, limit=5, before=pivot_iso, return_has_more=True
        )
        assert len(msgs_by_iso) == 5
        assert [m.text for m in msgs_by_iso] == ["Batch 0", "Batch 1", "Batch 2", "Batch 3", "Batch 4"]
        assert [m.id for m in msgs_by_id] == [m.id for m in msgs_by_iso]
    finally:
        db.close()


