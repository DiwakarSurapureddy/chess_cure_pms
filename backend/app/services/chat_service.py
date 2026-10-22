
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, asc, or_
from sqlalchemy.orm import Session

from app.models.chat import ChatMessage, ChatUnlockSession
from app.models.friend import FriendRequest


class ChatService:
    def is_friend(
        self,
        db: Session,
        user1_id: str,
        user2_id: str,
    ) -> bool:
        accepted = db.query(FriendRequest).filter(
            FriendRequest.status == "accepted",
            or_(
                and_(
                    FriendRequest.sender_id == user1_id,
                    FriendRequest.receiver_id == user2_id,
                ),
                and_(
                    FriendRequest.sender_id == user2_id,
                    FriendRequest.receiver_id == user1_id,
                ),
            ),
        ).first()

        return accepted is not None

    def get_or_create_unlock_session(
        self,
        db: Session,
        user1_id: str,
        user2_id: str,
    ) -> ChatUnlockSession:
        session = db.query(ChatUnlockSession).filter(
            or_(
                and_(
                    ChatUnlockSession.user1_id == user1_id,
                    ChatUnlockSession.user2_id == user2_id,
                ),
                and_(
                    ChatUnlockSession.user1_id == user2_id,
                    ChatUnlockSession.user2_id == user1_id,
                ),
            )
        ).first()

        if session is None:
            session = ChatUnlockSession(
                user1_id=user1_id,
                user2_id=user2_id,
                is_unlocked=False,
                expires_at=None,
                unlock_reason="Not unlocked yet",
                payment_status="none",
                extended_count=0,
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        else:
            was_unlocked = session.is_unlocked
            is_active = session.check_and_update_expiry()

            if was_unlocked and not is_active:
                db.commit()

        return session

    def unlock_chat(
        self,
        db: Session,
        user1_id: str,
        user2_id: str,
        reason: str = "Both players completed 5 legal moves each",
        minutes: int = 5,
    ) -> ChatUnlockSession:
        session = self.get_or_create_unlock_session(
            db, user1_id, user2_id
        )

        # Do not reset the timer while the chat is active.
        if session.check_and_update_expiry():
            return session

        # Do not automatically restart an expired session.
        if session.unlocked_at is not None:
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Chat session has expired. "
                    "It cannot be automatically restarted."
                ),
            )

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
        minutes: int = 5,
    ) -> ChatUnlockSession:
        if amount != 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Demo extension requires exactly INR 10.",
            )

        session = self.get_or_create_unlock_session(
            db, user1_id, user2_id
        )

        # Extension is allowed only while the chat is active.
        if not session.check_and_update_expiry():
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Chat has expired. "
                    "Unlock it again before extending."
                ),
            )

        expiry = session.expires_at

        if expiry is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chat has expired. Unlock it again before extending.",
            )

        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

        # Add five minutes to the existing expiry time.
        session.expires_at = expiry + timedelta(minutes=minutes)
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
        limit: int = 100,
    ) -> List[ChatMessage]:
        return db.query(ChatMessage).filter(
            or_(
                and_(
                    ChatMessage.sender_id == user1_id,
                    ChatMessage.receiver_id == user2_id,
                ),
                and_(
                    ChatMessage.sender_id == user2_id,
                    ChatMessage.receiver_id == user1_id,
                ),
            )
        ).order_by(
            asc(ChatMessage.created_at)
        ).limit(limit).all()

    def send_message(
        self,
        db: Session,
        sender_id: str,
        receiver_id: str,
        text: str,
        game_id: Optional[str] = None,
    ) -> ChatMessage:
        if not self.is_friend(db, sender_id, receiver_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Messaging allowed only between accepted friends.",
            )

        clean_text = text.strip()

        if not clean_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty.",
            )

        message = ChatMessage(
            sender_id=sender_id,
            receiver_id=receiver_id,
            game_id=game_id,
            text=clean_text,
        )

        db.add(message)
        db.commit()
        db.refresh(message)

        return message


chat_service = ChatService()


