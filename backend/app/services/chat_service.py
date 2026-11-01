

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

        game_id: Optional[str] = None,

    ) -> ChatUnlockSession:

        query = db.query(ChatUnlockSession).filter(

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

        )

        if game_id:

            query = query.filter(ChatUnlockSession.game_id == game_id)

        session = query.order_by(ChatUnlockSession.created_at.desc()).first()

        if session is None:

            session = ChatUnlockSession(

                user1_id=user1_id,

                user2_id=user2_id,

                game_id=game_id,

                is_unlocked=False,

                expires_at=None,

                unlock_reason="Not unlocked yet",

                payment_status="none",

                unlock_count=0,

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
        reason: str = "Opponent piece captured within 5 moves",
        minutes: int = 5,
        game_id: Optional[str] = None,
        force_unlock: bool = False,
    ) -> ChatUnlockSession:
        try:
            session = self.get_or_create_unlock_session(
                db, user1_id, user2_id, game_id=game_id
            )
        except TypeError:
            session = self.get_or_create_unlock_session(
                db, user1_id, user2_id
            )

        # Do not reset the timer while the chat is actively unlocked.
        if hasattr(session, "check_and_update_expiry") and session.check_and_update_expiry():
            return session

        # If previously unlocked and expired, cannot restart automatically without fresh game qualification
        if getattr(session, "unlocked_at", None) is not None and not force_unlock:
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chat session has expired. It cannot be automatically restarted.",
            )

        # Maximum two free unlocks per game
        if (getattr(session, "unlock_count", 0) or 0) >= 2 and not force_unlock:
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Maximum 2 free chat unlocks reached for this game. Payment of ₹10 is required to extend.",
            )

        now = datetime.now(timezone.utc)

        session.is_unlocked = True
        session.unlocked_at = now
        session.expires_at = now + timedelta(minutes=minutes)
        session.unlock_reason = reason
        session.unlock_count = (getattr(session, "unlock_count", 0) or 0) + 1

        db.commit()
        if hasattr(db, "refresh"):
            try:
                db.refresh(session)
            except Exception:
                pass
        return session

    def extend_chat(
        self,
        db: Session,
        user1_id: str,
        user2_id: str,
        amount: int = 10,
        payment_method: str = "demo_upi",
        minutes: int = 5,
        game_id: Optional[str] = None,
    ) -> ChatUnlockSession:
        if amount != 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Demo extension requires exactly INR 10.",
            )

        try:
            session = self.get_or_create_unlock_session(
                db, user1_id, user2_id, game_id=game_id
            )
        except TypeError:
            session = self.get_or_create_unlock_session(
                db, user1_id, user2_id
            )

        if not getattr(session, "is_unlocked", False) or (hasattr(session, "check_and_update_expiry") and not session.check_and_update_expiry()):
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The chat session has expired. Complete the game unlock requirement again.",
            )

        now = datetime.now(timezone.utc)
        cur_exp = session._normalize_dt(session.expires_at) if hasattr(session, "_normalize_dt") else session.expires_at
        if cur_exp and cur_exp > now:
            new_expiry = cur_exp + timedelta(minutes=minutes)
        else:
            new_expiry = now + timedelta(minutes=minutes)

        session.is_unlocked = True
        session.expires_at = new_expiry
        session.payment_status = f"demo_paid_{amount}_inr"
        session.extended_count = (getattr(session, "extended_count", 0) or 0) + 1

        db.commit()
        if hasattr(db, "refresh"):
            try:
                db.refresh(session)
            except Exception:
                pass

        if game_id:
            try:
                from app.services.game_service import game_service
                game = game_service.get_game(game_id, db)
                if game:
                    game.chat_unlocked = True
                    game.chat_expires_at = session.expires_at.isoformat()
                    if db:
                        game_service.save_game(game, db)
            except Exception:
                pass

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
        has_active_unlock = False
        try:
            session = self.get_or_create_unlock_session(db, sender_id, receiver_id)
            has_active_unlock = bool(session.is_unlocked and session.get_remaining_seconds() > 0)
        except Exception:
            pass

        is_active_match = False
        try:
            from app.models.friend import MatchChallenge
            from sqlalchemy import or_
            active_challenge = db.query(MatchChallenge).filter(
                or_(
                    (MatchChallenge.sender_id == sender_id) & (MatchChallenge.receiver_id == receiver_id),
                    (MatchChallenge.sender_id == receiver_id) & (MatchChallenge.receiver_id == sender_id),
                ),
                MatchChallenge.status.in_(["pending", "accepted"]),
            ).first()
            if active_challenge:
                is_active_match = True
        except Exception:
            pass

        if not (self.is_friend(db, sender_id, receiver_id) or has_active_unlock or is_active_match):
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

