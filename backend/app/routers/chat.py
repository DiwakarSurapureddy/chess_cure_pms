import asyncio



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

from app.models.friend import MatchChallenge
from app.models.chat import ChatMessage, ChatUnlockSession

from app.services.chat_service import chat_service

from app.services.game_service import game_service

from app.websockets.chat_connection_manager import chat_connection_manager, chat_room_key





router = APIRouter(tags=["Chat"])


def _to_utc_iso(dt: Optional[datetime]) -> Optional[str]:
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.isoformat()





@router.websocket("/ws/{friend_id}")

async def chat_websocket(websocket: WebSocket, friend_id: str):

    """Authenticate a participant and stream new messages for this conversation."""

    try:

        await websocket.accept()

    except RuntimeError:

        pass



    db = SessionLocal()

    room = None

    connected_user_id = None

    try:

        token = websocket.query_params.get("token")

        if not token:

            try:

                credentials = await asyncio.wait_for(websocket.receive_json(), timeout=5.0)

                token = credentials.get("token") if isinstance(credentials, dict) else None

            except Exception:

                token = None



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

        if target_friend.id == current_user.id:

            await websocket.close(code=1008, reason="Self-chat not permitted")

            return



        session = None
        try:
            session = chat_service.get_or_create_unlock_session(db, current_user.id, target_friend.id)
            session.check_and_update_expiry()
        except Exception:
            pass

        if not check_can_read_chat(db, current_user.id, target_friend.id, session=session):
            await websocket.close(code=1008, reason="Participant authorization required")
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

            elif payload.get("type") == "message":
                msg_text = str(payload.get("text", "")).strip()
                if msg_text:
                    cid = payload.get("clientMessageId") or payload.get("client_message_id")
                    game_id = payload.get("game_id")
                    msg_db = SessionLocal()
                    try:
                        ws_session = chat_service.get_or_create_unlock_session(
                            msg_db, current_user.id, target_friend.id
                        )
                        if not check_can_chat(msg_db, current_user.id, target_friend.id, session=ws_session):
                            await websocket.send_json({"type": "error", "message": "Messaging not allowed."})
                        else:
                            saved_msg = chat_service.send_message(
                                db=msg_db,
                                sender_id=current_user.id,
                                receiver_id=target_friend.id,
                                text=msg_text,
                                game_id=game_id,
                                client_message_id=cid,
                                can_chat_verified=True,
                                session=ws_session,
                            )
                            msg_dict = saved_msg.to_dict()
                            if cid and not msg_dict.get("clientMessageId"):
                                msg_dict["clientMessageId"] = cid
                            await chat_connection_manager.publish(
                                room,
                                {"type": "message", "message": msg_dict},
                            )
                            await websocket.send_json({
                                "type": "ack",
                                "clientMessageId": cid,
                                "message": msg_dict,
                            })
                    except Exception as ex:
                        await websocket.send_json({
                            "type": "error",
                            "clientMessageId": cid,
                            "message": str(ex),
                        })
                    finally:
                        msg_db.close()

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

    client_message_id: Optional[str] = None

    clientMessageId: Optional[str] = None



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

    game_id: Optional[str] = None





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

        return None



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



    return game





def check_can_chat(db: Session, user1_id: str, user2_id: str, session: Optional[ChatUnlockSession] = None) -> bool:
    """Historical message SEND authorization: requires accepted friendship, active unlock session, or active match."""
    if chat_service.is_friend(db, user1_id, user2_id):
        return True
    if session and session.is_unlocked and session.get_remaining_seconds() > 0:
        return True
    try:
        active_challenge = db.query(MatchChallenge).filter(
            or_(
                (MatchChallenge.sender_id == user1_id) & (MatchChallenge.receiver_id == user2_id),
                (MatchChallenge.sender_id == user2_id) & (MatchChallenge.receiver_id == user1_id),
            ),
            MatchChallenge.status.in_(["pending", "accepted"]),
        ).first()
        if active_challenge:
            return True
    except Exception:
        pass
    try:
        from app.models.game import GameDB
        active_game = db.query(GameDB).filter(
            or_(
                (GameDB.player1 == user1_id) & (GameDB.player2 == user2_id),
                (GameDB.player1 == user2_id) & (GameDB.player2 == user1_id),
            ),
        ).first()
        if active_game:
            return True
        u1 = db.query(User).filter(User.id == user1_id).first()
        u2 = db.query(User).filter(User.id == user2_id).first()
        if u1 and u2:
            named_game = db.query(GameDB).filter(
                or_(
                    (GameDB.player1 == u1.username) & (GameDB.player2 == u2.username),
                    (GameDB.player1 == u2.username) & (GameDB.player2 == u1.username),
                ),
            ).first()
            if named_game:
                return True
    except Exception:
        pass
    return False


def check_can_read_chat(db: Session, user1_id: str, user2_id: str, session: Optional[ChatUnlockSession] = None) -> bool:
    """Historical message READ authorization: only authenticated conversation participants may read their existing history."""
    if check_can_chat(db, user1_id, user2_id, session=session):
        return True
    try:
        has_msg = db.query(ChatMessage.id).filter(
            or_(
                (ChatMessage.sender_id == user1_id) & (ChatMessage.receiver_id == user2_id),
                (ChatMessage.sender_id == user2_id) & (ChatMessage.receiver_id == user1_id),
            )
        ).first()
        if has_msg:
            return True
    except Exception:
        pass
    return False


@router.get("/status/{friend_id}")
def get_chat_status(
    friend_id: str,
    game_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_friend = resolve_friend_user(db, friend_id)
    reject_self_chat(current_user, target_friend, "check a chat")

    is_friend = chat_service.is_friend(db, current_user.id, target_friend.id)
    session = chat_service.get_or_create_unlock_session(
        db, current_user.id, target_friend.id, game_id=game_id
    )
    remaining = session.get_remaining_seconds()
    can_send = check_can_chat(db, current_user.id, target_friend.id, session=session)
    can_read = check_can_read_chat(db, current_user.id, target_friend.id, session=session)

    if not can_read:
        return {
            "success": True,
            "isFriend": False,
            "canChat": False,
            "canRead": False,
            "isUnlocked": False,
            "timeRemainingSeconds": 0,
            "message": "You must be accepted friends to chat.",
            "friend": target_friend.to_dict(),
        }

    return {
        "success": True,
        "isFriend": is_friend or can_send,
        "canChat": can_send,
        "canRead": True,
        "isUnlocked": bool(session.is_unlocked and remaining > 0),
        "timeRemainingSeconds": remaining,
        "expiresAt": _to_utc_iso(session.expires_at) if session.expires_at else None,
        "unlockedAt": _to_utc_iso(session.unlocked_at) if session.unlocked_at else None,
        "unlockReason": session.unlock_reason,
        "paymentStatus": session.payment_status,
        "extendedCount": session.extended_count,
        "unlockCount": session.unlock_count,
        "priceInr": 10,
        "gameId": session.game_id,
        "friend": target_friend.to_dict(),
    }


@router.get("/messages/{friend_id}")
def get_chat_messages(
    friend_id: str,
    limit: int = 50,
    before: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_friend = resolve_friend_user(db, friend_id)
    reject_self_chat(current_user, target_friend, "read messages")

    session = chat_service.get_or_create_unlock_session(
        db, current_user.id, target_friend.id
    )
    can_read = check_can_read_chat(db, current_user.id, target_friend.id, session=session)
    if not can_read:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Messaging allowed only between accepted friends.",
        )

    can_send = check_can_chat(db, current_user.id, target_friend.id, session=session)
    is_friend = chat_service.is_friend(db, current_user.id, target_friend.id)
    remaining = session.get_remaining_seconds()
    messages, has_more = chat_service.get_messages(
        db, current_user.id, target_friend.id, limit=limit, before=before, return_has_more=True
    )

    return {
        "success": True,
        "isFriend": is_friend or can_send,
        "canChat": can_send,
        "canRead": True,
        "isUnlocked": bool(session.is_unlocked and remaining > 0),
        "timeRemainingSeconds": remaining,
        "expiresAt": _to_utc_iso(session.expires_at) if session and session.expires_at else None,
        "unlockedAt": _to_utc_iso(session.unlocked_at) if session and session.unlocked_at else None,
        "unlockReason": session.unlock_reason if session else None,
        "paymentStatus": session.payment_status if session else None,
        "extendedCount": session.extended_count if session else 0,
        "unlockCount": session.unlock_count if session else 0,
        "priceInr": 10,
        "gameId": session.game_id if session else None,
        "friend": target_friend.to_dict(),
        "messages": [message.to_dict() for message in messages],
        "hasMore": has_more,
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

    session = chat_service.get_or_create_unlock_session(
        db, current_user.id, target_friend.id
    )
    if not check_can_chat(db, current_user.id, target_friend.id, session=session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Messaging allowed only between accepted friends.",
        )

    cid = payload.client_message_id or payload.clientMessageId
    message = chat_service.send_message(
        db=db,
        sender_id=current_user.id,
        receiver_id=target_friend.id,
        text=payload.text.strip(),
        game_id=payload.game_id,
        client_message_id=cid,
        can_chat_verified=True,
        session=session,
    )

    msg_dict = message.to_dict()
    if cid and not msg_dict.get("clientMessageId"):
        msg_dict["clientMessageId"] = cid

    await chat_connection_manager.publish(
        chat_room_key(current_user.id, target_friend.id),
        {"type": "message", "message": msg_dict},
    )

    return {
        "success": True,
        "message": msg_dict,
        "timeRemainingSeconds": session.get_remaining_seconds(),
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



    if not (chat_service.is_friend(db, current_user.id, target_friend.id) or payload.game_id or check_can_chat(db, current_user.id, target_friend.id)):

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="You must be accepted friends to unlock chat.",

        )



    if payload.game_id:

        validate_game_unlock(

            payload.game_id,

            current_user,

            target_friend,

            db,

        )



    session = chat_service.unlock_chat(

        db=db,

        user1_id=current_user.id,

        user2_id=target_friend.id,

        reason=payload.reason or "Opponent piece captured within 5 moves",

        minutes=5,

        game_id=payload.game_id,

    )



    return {

        "success": True,

        "message": "Chat unlocked for 5 minutes!",

        "isUnlocked": True,

        "timeRemainingSeconds": session.get_remaining_seconds(),

        "expiresAt": (
            _to_utc_iso(session.expires_at)
            if session.expires_at else None
        ),

        "status": session.to_dict(),

        "game_id": payload.game_id,

        "priceInr": 10,

    }





@router.post("/pay-demo/{friend_id}")

def pay_demo_extend(

    friend_id: str,

    payload: DemoPaymentRequest,

    game_id: Optional[str] = None,

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



    target_game_id = payload.game_id or game_id

    if target_game_id:

        validate_game_unlock(target_game_id, current_user, target_friend, db)



    session = chat_service.extend_chat(

        db=db,

        user1_id=current_user.id,

        user2_id=target_friend.id,

        amount=payload.amount,

        payment_method=payload.payment_method or "demo_upi",

        minutes=5,

        game_id=target_game_id,

    )



    return {

        "success": True,

        "message": "DEMO payment accepted; chat extension processed.",

        "isUnlocked": True,

        "timeRemainingSeconds": session.get_remaining_seconds(),

        "expiresAt": (
            _to_utc_iso(session.expires_at)
            if session.expires_at else None
        ),

        "paymentStatus": session.payment_status,

        "extendedCount": session.extended_count,

        "unlockCount": session.unlock_count,

        "priceInr": 10,

        "status": session.to_dict(),

    }









