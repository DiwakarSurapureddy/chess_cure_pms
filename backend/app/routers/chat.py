
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.core.security import decode_access_token
from app.dependencies import get_current_user
from app.models.user import User
from app.models.presence import UserPresence
from app.services.chat_service import chat_service
from app.services.game_service import game_service
from app.websockets.chat_connection_manager import chat_connection_manager, chat_room_key


router = APIRouter(tags=["Chat"])


@router.websocket("/ws/{friend_id}")
async def chat_websocket(websocket: WebSocket, friend_id: str):
    """Authenticate a participant and stream new messages for this conversation."""
    await websocket.accept()
    db = SessionLocal()
    room = None
    connected_user_id = None
    try:
        credentials = await websocket.receive_json()
        token = credentials.get("token") if isinstance(credentials, dict) else None
        token_data = decode_access_token(token) if token else None
        user_id = token_data.get("sub") if token_data else None
        current_user = db.query(User).filter(
            User.id == user_id,
            User.is_active == True,
        ).first() if user_id else None
        if not current_user:
            await websocket.close(code=1008, reason="Authentication required")
            return
        connected_user_id = current_user.id

        target_friend = resolve_friend_user(db, friend_id)
        if target_friend.id == current_user.id or not chat_service.is_friend(
            db, current_user.id, target_friend.id
        ):
            await websocket.close(code=1008, reason="Accepted friendship required")
            return

        room = chat_room_key(current_user.id, target_friend.id)
        db.close()
        db = None
        chat_connection_manager.connect(room, websocket)
        await websocket.send_json({"type": "ready"})

        # Keep the connection open; client pings are acknowledged to detect stale links.
        while True:
            payload = await websocket.receive_json()
            if not isinstance(payload, dict):
                continue
            if payload.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            elif payload.get("type") in {
                "call-offer", "call-answer", "call-ice", "call-reject", "call-end"
            }:
                # Identity is always taken from the authenticated socket, never the client payload.
                event = {
                    "type": payload["type"],
                    "senderId": current_user.id,
                    "callId": str(payload.get("callId", ""))[:100],
                }
                if payload["type"] in {"call-offer", "call-answer"}:
                    event["description"] = payload.get("description")
                elif payload["type"] == "call-ice":
                    event["candidate"] = payload.get("candidate")
                await chat_connection_manager.relay(room, event, websocket)
    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
    finally:
        if db is not None:
            db.close()
        if room:
            chat_connection_manager.disconnect(room, websocket)
        if connected_user_id and not chat_connection_manager.is_user_online(connected_user_id):
            presence_db = SessionLocal()
            try:
                presence = presence_db.query(UserPresence).filter(
                    UserPresence.user_id == connected_user_id
                ).first()
                if presence:
                    presence.last_seen = datetime.now(timezone.utc)
                else:
                    presence_db.add(UserPresence(
                        user_id=connected_user_id,
                        last_seen=datetime.now(timezone.utc),
                    ))
                presence_db.commit()
            finally:
                presence_db.close()


class SendMessageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    game_id: Optional[str] = None

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError(
                "Message cannot be empty or whitespace only."
            )
        return value


class UnlockChatRequest(BaseModel):
    reason: Optional[str] = None
    game_id: Optional[str] = None


class DemoPaymentRequest(BaseModel):
    amount: int = Field(default=10)
    payment_method: Optional[str] = "demo_upi"
    transaction_id: Optional[str] = None


def resolve_friend_user(db: Session, friend_id: str) -> User:
    clean_id = friend_id.strip()

    user = db.query(User).filter(
        or_(
            User.id == clean_id,
            User.player_id == clean_id,
            User.username == clean_id,
        )
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found.",
        )

    return user


def reject_self_chat(current_user: User, target_friend: User, action: str):
    if current_user.id == target_friend.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You cannot {action} with yourself.",
        )


def validate_game_unlock(
    game_id: Optional[str],
    current_user: User,
    target_friend: User,
    db: Session,
):
    if not game_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A game_id is required.",
        )

    game = game_service.get_game(game_id, db)

    if game is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found.",
        )

    expected_players = {
        current_user.username,
        target_friend.username,
    }
    actual_players = {game.player1, game.player2}

    if actual_players != expected_players:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This game does not belong to these two players.",
        )

    if (
        getattr(game, "player1_move_count", 0) < 5
        or getattr(game, "player2_move_count", 0) < 5
        or not getattr(game, "chat_unlocked", False)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Both players must complete 5 legal moves each "
                "before chat can unlock."
            ),
        )

    return game


@router.get("/status/{friend_id}")
def get_chat_status(
    friend_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_friend = resolve_friend_user(db, friend_id)
    reject_self_chat(current_user, target_friend, "check a chat")

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        return {
            "success": True,
            "isFriend": False,
            "isUnlocked": False,
            "timeRemainingSeconds": 0,
            "message": "You must be accepted friends to chat.",
            "friend": target_friend.to_dict(),
        }

    session = chat_service.get_or_create_unlock_session(
        db, current_user.id, target_friend.id
    )
    remaining = session.get_remaining_seconds()

    return {
        "success": True,
        "isFriend": True,
        "isUnlocked": bool(session.is_unlocked and remaining > 0),
        "timeRemainingSeconds": remaining,
        "expiresAt": (
            session.expires_at.isoformat()
            if session.expires_at else None
        ),
        "unlockedAt": (
            session.unlocked_at.isoformat()
            if session.unlocked_at else None
        ),
        "unlockReason": session.unlock_reason,
        "paymentStatus": session.payment_status,
        "extendedCount": session.extended_count,
        "priceInr": 10,
        "friend": target_friend.to_dict(),
    }


@router.get("/messages/{friend_id}")
def get_chat_messages(
    friend_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_friend = resolve_friend_user(db, friend_id)
    reject_self_chat(current_user, target_friend, "read messages")

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Messaging allowed only between accepted friends.",
        )

    session = chat_service.get_or_create_unlock_session(
        db, current_user.id, target_friend.id
    )
    remaining = session.get_remaining_seconds()

    messages = chat_service.get_messages(
        db, current_user.id, target_friend.id
    )

    return {
        "success": True,
        "isUnlocked": bool(session.is_unlocked and remaining > 0),
        "timeRemainingSeconds": remaining,
        "messages": [message.to_dict() for message in messages],
    }


@router.post("/messages/{friend_id}")
async def send_chat_message(
    friend_id: str,
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_friend = resolve_friend_user(db, friend_id)
    reject_self_chat(current_user, target_friend, "start a chat")

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Messaging allowed only between accepted friends.",
        )

    session = chat_service.get_or_create_unlock_session(
        db, current_user.id, target_friend.id
    )

    message = chat_service.send_message(
        db=db,
        sender_id=current_user.id,
        receiver_id=target_friend.id,
        text=payload.text.strip(),
        game_id=payload.game_id,
    )

    await chat_connection_manager.publish(
        chat_room_key(current_user.id, target_friend.id),
        {"type": "message", "message": message.to_dict()},
    )

    updated_session = chat_service.get_or_create_unlock_session(
        db, current_user.id, target_friend.id
    )

    return {
        "success": True,
        "message": message.to_dict(),
        "timeRemainingSeconds": updated_session.get_remaining_seconds(),
    }


@router.post("/unlock/{friend_id}")
def unlock_chat_session(
    friend_id: str,
    payload: UnlockChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_friend = resolve_friend_user(db, friend_id)
    reject_self_chat(current_user, target_friend, "unlock a chat")

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be accepted friends to unlock chat.",
        )

    existing_session = chat_service.get_or_create_unlock_session(
        db, current_user.id, target_friend.id
    )

    if (
        existing_session.unlocked_at is not None
        and existing_session.get_remaining_seconds() <= 0
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Chat session has expired. "
                "It cannot be automatically restarted."
            ),
        )

    game = validate_game_unlock(
        payload.game_id,
        current_user,
        target_friend,
        db,
    )

    session = chat_service.unlock_chat(
        db=db,
        user1_id=current_user.id,
        user2_id=target_friend.id,
        reason="Both players completed 5 legal moves each",
        minutes=5,
    )

    return {
        "success": True,
        "message": "Chat unlocked for 5 minutes!",
        "isUnlocked": True,
        "timeRemainingSeconds": session.get_remaining_seconds(),
        "expiresAt": (
            session.expires_at.isoformat()
            if session.expires_at else None
        ),
        "status": session.to_dict(),
        "game_id": game.game_id,
    }


@router.post("/pay-demo/{friend_id}")
def pay_demo_extend(
    friend_id: str,
    payload: DemoPaymentRequest,
    game_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_friend = resolve_friend_user(db, friend_id)
    reject_self_chat(current_user, target_friend, "extend a chat")

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Chat extension is only available "
                "between accepted friends."
            ),
        )

    if payload.amount != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DEMO payment amount must be 10 INR.",
        )

    validate_game_unlock(game_id, current_user, target_friend, db)

    existing_session = chat_service.get_or_create_unlock_session(
        db, current_user.id, target_friend.id
    )

    if (
        not existing_session.is_unlocked
        or existing_session.get_remaining_seconds() <= 0
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "The chat session has expired. Complete "
                "the game unlock requirement again."
            ),
        )

    session = chat_service.extend_chat(
        db=db,
        user1_id=current_user.id,
        user2_id=target_friend.id,
        amount=payload.amount,
        payment_method=payload.payment_method or "demo_upi",
        minutes=5,
    )

    return {
        "success": True,
        "message": "DEMO payment accepted; chat extension processed.",
        "isUnlocked": True,
        "timeRemainingSeconds": session.get_remaining_seconds(),
        "expiresAt": (
            session.expires_at.isoformat()
            if session.expires_at else None
        ),
        "status": session.to_dict(),
    }




