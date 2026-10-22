
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    receiver_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    game_id = Column(String(50), nullable=True)
    text = Column(Text, nullable=False)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

    def to_dict(self):
        created_at_utc = self.created_at
        if created_at_utc is not None:
            if created_at_utc.tzinfo is None:
                # Older database rows may have been returned without tzinfo,
                # but chat timestamps have always been stored in UTC.
                created_at_utc = created_at_utc.replace(tzinfo=timezone.utc)
            else:
                created_at_utc = created_at_utc.astimezone(timezone.utc)

        return {
            "id": self.id,
            "senderId": self.sender_id,
            "receiverId": self.receiver_id,
            "senderUsername": (
                self.sender.username if self.sender else "Player"
            ),
            "gameId": self.game_id,
            "text": self.text,
            "message": self.text,
            "createdAt": (
                created_at_utc.isoformat(timespec="milliseconds")
                if created_at_utc else None
            ),
            "timestamp": (
                created_at_utc.strftime("%I:%M %p")
                if created_at_utc
                else "Just now"
            ),
        }


class ChatUnlockSession(Base):
    __tablename__ = "chat_unlock_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user1_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    user2_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    is_unlocked = Column(Boolean, default=False)
    unlocked_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    unlock_reason = Column(
        String(255),
        default="Opponent piece captured within 5 moves",
    )
    payment_status = Column(String(50), default="none")
    extended_count = Column(Integer, default=0)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])

    @staticmethod
    def _normalize_dt(dt: Optional[datetime]) -> Optional[datetime]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    def get_remaining_seconds(self) -> int:
        if not self.is_unlocked or not self.expires_at:
            return 0

        now = datetime.now(timezone.utc)
        exp = self._normalize_dt(self.expires_at)

        if exp is None or now >= exp:
            return 0

        return max(0, int((exp - now).total_seconds()))

    def check_and_update_expiry(self) -> bool:
        """Return True if the chat is still unlocked; otherwise False."""
        if not self.is_unlocked or not self.expires_at:
            self.is_unlocked = False
            return False

        now = datetime.now(timezone.utc)
        exp = self._normalize_dt(self.expires_at)

        if exp is None or now >= exp:
            self.is_unlocked = False
            return False

        return True

    def to_dict(self):
        remaining = self.get_remaining_seconds()
        is_active = self.is_unlocked and remaining > 0

        return {
            "id": self.id,
            "user1Id": self.user1_id,
            "user2Id": self.user2_id,
            "isUnlocked": is_active,
            "unlockedAt": (
                self.unlocked_at.isoformat() if self.unlocked_at else None
            ),
            "expiresAt": (
                self.expires_at.isoformat() if self.expires_at else None
            ),
            "timeRemainingSeconds": remaining,
            "unlockReason": self.unlock_reason,
            "paymentStatus": self.payment_status,
            "extendedCount": self.extended_count,
        }
