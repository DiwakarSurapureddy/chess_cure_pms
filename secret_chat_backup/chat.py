
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.chat_service import chat_service
from app.services.game_service import game_service


router = APIRouter(tags=["Chat"])


class SendMessageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    game_id: Optional[str] = None


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


def validate_game_unlock(
    game_id: Optional[str],
    current_user: User,
    target_friend: User,
    db: Session,
):
    """Verify the game and the five-legal-moves-per-side requirement."""

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
        "expiresAt": session.expires_at.isoformat() if session.expires_at else None,
        "unlockedAt": session.unlocked_at.isoformat() if session.unlocked_at else None,
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

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Messaging allowed only between accepted friends.",
        )

    session = chat_service.get_or_create_unlock_session(
        db, current_user.id, target_friend.id
    )
    remaining = session.get_remaining_seconds()

    if not session.is_unlocked or remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chat is locked or its 5-minute session has expired.",
        )

    messages = chat_service.get_messages(
        db, current_user.id, target_friend.id
    )

    return {
        "success": True,
        "isUnlocked": True,
        "timeRemainingSeconds": remaining,
        "messages": [message.to_dict() for message in messages],
    }


@router.post("/messages/{friend_id}")
def send_chat_message(
    friend_id: str,
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_friend = resolve_friend_user(db, friend_id)

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Messaging allowed only between accepted friends.",
        )

    session = chat_service.get_or_create_unlock_session(
        db, current_user.id, target_friend.id
    )

    if not session.is_unlocked or session.get_remaining_seconds() <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chat is locked or its 5-minute session has expired.",
        )

    message = chat_service.send_message(
        db=db,
        sender_id=current_user.id,
        receiver_id=target_friend.id,
        text=payload.text.strip(),
        game_id=payload.game_id,
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

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be accepted friends to unlock chat.",
        )

    game = validate_game_unlock(
        payload.game_id, current_user, target_friend, db
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
        "expiresAt": session.expires_at.isoformat() if session.expires_at else None,
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

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chat extension is only available between accepted friends.",
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

    if not existing_session.is_unlocked or existing_session.get_remaining_seconds() <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The chat session has expired. Complete the game unlock requirement again.",
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
        "expiresAt": session.expires_at.isoformat() if session.expires_at else None,
        "status": session.to_dict(),
    }
