from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc

from app.models.chat import ChatMessage, ChatUnlockSession
from app.models.friend import FriendRequest
from app.models.user import User


class ChatService:
    def is_friend(self, db: Session, user1_id: str, user2_id: str) -> bool:
        """Verifies if two users are accepted friends."""
        accepted = db.query(FriendRequest).filter(
            FriendRequest.status == "accepted",
            or_(
                and_(FriendRequest.sender_id == user1_id, FriendRequest.receiver_id == user2_id),
                and_(FriendRequest.sender_id == user2_id, FriendRequest.receiver_id == user1_id),
            )
        ).first()
        return accepted is not None

    def get_or_create_unlock_session(
        self,
        db: Session,
        user1_id: str,
        user2_id: str,
    ) -> ChatUnlockSession:
        """Retrieves or initializes a chat unlock session between two users."""
        session = db.query(ChatUnlockSession).filter(
            or_(
                and_(ChatUnlockSession.user1_id == user1_id, ChatUnlockSession.user2_id == user2_id),
                and_(ChatUnlockSession.user1_id == user2_id, ChatUnlockSession.user2_id == user1_id),
            )
        ).first()

        if not session:
            session = ChatUnlockSession(
                user1_id=user1_id,
                user2_id=user2_id,
                is_unlocked=False,
                expires_at=None,
                unlock_reason="Not unlocked yet",
                payment_status="none",
                extended_count=0
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        else:
            # Check expiry
            session.check_and_update_expiry()
            db.commit()

        return session

    def unlock_chat(
        self,
        db: Session,
        user1_id: str,
        user2_id: str,
        reason: str = "Opponent piece captured within 5 moves",
        minutes: int = 5
    ) -> ChatUnlockSession:
        """Unlocks chat session for 5 minutes (Requirement 8 & 9)."""
        session = self.get_or_create_unlock_session(db, user1_id, user2_id)
        now = datetime.now(timezone.utc)
        session.is_unlocked = True
        session.unlocked_at = now
        session.expires_at = now + timedelta(minutes=minutes)
        session.unlock_reason = reason
        db.commit()
        db.refresh(session)
        return session

    def extend_chat(
        self,
        db: Session,
        user1_id: str,
        user2_id: str,
        amount: int = 10,
        payment_method: str = "demo_upi",
        minutes: int = 5
    ) -> ChatUnlockSession:
        """Extends chat timer by +5 minutes through simulated demo payment (Requirement 9 & 10)."""
        session = self.get_or_create_unlock_session(db, user1_id, user2_id)
        now = datetime.now(timezone.utc)

        # Extend from current expiry if active, or from now if expired
        exp = session.expires_at
        if exp and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)

        if session.is_unlocked and exp and exp > now:
            session.expires_at = exp + timedelta(minutes=minutes)
        else:
            session.is_unlocked = True
            session.unlocked_at = now
            session.expires_at = now + timedelta(minutes=minutes)

        session.payment_status = f"demo_paid_{amount}_inr"
        session.extended_count = (session.extended_count or 0) + 1
        db.commit()
        db.refresh(session)
        return session

    def get_messages(
        self,
        db: Session,
        user1_id: str,
        user2_id: str,
        limit: int = 100
    ) -> List[ChatMessage]:
        """Retrieves message history between two users."""
        return db.query(ChatMessage).filter(
            or_(
                and_(ChatMessage.sender_id == user1_id, ChatMessage.receiver_id == user2_id),
                and_(ChatMessage.sender_id == user2_id, ChatMessage.receiver_id == user1_id),
            )
        ).order_by(asc(ChatMessage.created_at)).limit(limit).all()

    def send_message(
        self,
        db: Session,
        sender_id: str,
        receiver_id: str,
        text: str,
        game_id: Optional[str] = None
    ) -> ChatMessage:
        """Sends a message. Validates friendship and chat unlock / timer (Requirement 5, 8, 9, 10)."""
        if not self.is_friend(db, sender_id, receiver_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Messaging allowed only between accepted friends."
            )

        session = self.get_or_create_unlock_session(db, sender_id, receiver_id)
        if not session.check_and_update_expiry():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chat is locked. Unlock by capturing an opponent's piece within 5 moves in a chess match, or extend with ₹10 DEMO payment."
            )

        msg = ChatMessage(
            sender_id=sender_id,
            receiver_id=receiver_id,
            game_id=game_id,
            text=text.strip()
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return msg


chat_service = ChatService()
