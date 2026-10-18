from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.chat_service import chat_service
from app.services.game_service import game_service

router = APIRouter(tags=["Chat"])


class SendMessageRequest(BaseModel):
    text: str = Field(..., min_length=1)
    game_id: Optional[str] = None


class UnlockChatRequest(BaseModel):
    reason: Optional[str] = "Opponent piece captured within 5 moves"
    game_id: Optional[str] = None


class DemoPaymentRequest(BaseModel):
    amount: int = Field(default=10, description="Amount in INR for demo extension")
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
            detail="Player not found."
        )
    return user


@router.get("/status/{friend_id}")
def get_chat_status(
    friend_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Checks chat lock/unlock status and remaining countdown seconds between current user and friend."""
    target_friend = resolve_friend_user(db, friend_id)

    is_fr = chat_service.is_friend(db, current_user.id, target_friend.id)
    if not is_fr:
        return {
            "success": True,
            "isFriend": False,
            "isUnlocked": False,
            "timeRemainingSeconds": 0,
            "message": "You must be accepted friends to chat.",
            "friend": target_friend.to_dict(),
        }

    session = chat_service.get_or_create_unlock_session(db, current_user.id, target_friend.id)
    remaining = session.get_remaining_seconds()

    return {
        "success": True,
        "isFriend": True,
        "isUnlocked": session.is_unlocked and remaining > 0,
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
    """Retrieves message history between current user and accepted friend."""
    target_friend = resolve_friend_user(db, friend_id)

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Messaging allowed only between accepted friends."
        )

    messages = chat_service.get_messages(db, current_user.id, target_friend.id)
    session = chat_service.get_or_create_unlock_session(db, current_user.id, target_friend.id)

    return {
        "success": True,
        "isUnlocked": session.is_unlocked and session.get_remaining_seconds() > 0,
        "timeRemainingSeconds": session.get_remaining_seconds(),
        "messages": [m.to_dict() for m in messages],
    }


@router.post("/messages/{friend_id}")
def send_chat_message(
    friend_id: str,
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sends a chat message to an accepted friend if chat is unlocked and timer active."""
    target_friend = resolve_friend_user(db, friend_id)

    msg = chat_service.send_message(
        db=db,
        sender_id=current_user.id,
        receiver_id=target_friend.id,
        text=payload.text,
        game_id=payload.game_id
    )

    session = chat_service.get_or_create_unlock_session(db, current_user.id, target_friend.id)

    return {
        "success": True,
        "message": msg.to_dict(),
        "timeRemainingSeconds": session.get_remaining_seconds(),
    }


@router.post("/unlock/{friend_id}")
def unlock_chat_session(
    friend_id: str,
    payload: UnlockChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Unlocks chat between two players for 5 minutes after a legal piece capture."""
    target_friend = resolve_friend_user(db, friend_id)

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be accepted friends to unlock chat."
        )

    reason = payload.reason or "Opponent piece captured within first 5 moves"

    # If game_id provided, check game capture
    if payload.game_id:
        game = game_service.get_game(payload.game_id, db)
        if game and game.captured_pieces:
            total_caps = len(game.captured_pieces.get("white", [])) + len(game.captured_pieces.get("black", []))
            if total_caps > 0:
                reason = game.chat_unlock_reason or reason

    session = chat_service.unlock_chat(
        db=db,
        user1_id=current_user.id,
        user2_id=target_friend.id,
        reason=reason,
        minutes=5
    )

    return {
        "success": True,
        "message": "Chat unlocked for 5 minutes!",
        "isUnlocked": True,
        "timeRemainingSeconds": session.get_remaining_seconds(),
        "expiresAt": session.expires_at.isoformat() if session.expires_at else None,
        "status": session.to_dict(),
    }


@router.post("/pay-demo/{friend_id}")
def pay_demo_extend(
    friend_id: str,
    payload: DemoPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Extends chat timer by +5 minutes through clearly labelled DEMO payment flow (₹10)."""
    target_friend = resolve_friend_user(db, friend_id)

    if not chat_service.is_friend(db, current_user.id, target_friend.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chat extension is only available between accepted friends."
        )

    if payload.amount != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DEMO payment amount must be ₹10 for a 5-minute extension."
        )

    # Simulated DEMO payment verification
    session = chat_service.extend_chat(
        db=db,
        user1_id=current_user.id,
        user2_id=target_friend.id,
        amount=payload.amount,
        payment_method=payload.payment_method or "demo_upi",
        minutes=5
    )

    return {
        "success": True,
        "message": "DEMO payment of ₹10 verified successfully! Chat extended by +5 minutes.",
        "isUnlocked": True,
        "timeRemainingSeconds": session.get_remaining_seconds(),
        "expiresAt": session.expires_at.isoformat() if session.expires_at else None,
        "status": session.to_dict(),
    }
