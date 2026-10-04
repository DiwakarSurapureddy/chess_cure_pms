import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    receiver_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    status = Column(String(20), default="pending")  # pending, accepted, declined
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

    def to_dict(self):
        return {
            "id": self.id,
            "type": "friend_request",
            "senderId": self.sender_id,
            "receiverId": self.receiver_id,
            "senderUsername": self.sender.username if self.sender else "Player",
            "senderPlayerId": self.sender.player_id if self.sender else "100001",
            "senderRating": self.sender.rating if self.sender else 1200,
            "receiverUsername": self.receiver.username if self.receiver else "Player",
            "receiverPlayerId": self.receiver.player_id if self.receiver else "100001",
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }

class MatchChallenge(Base):
    __tablename__ = "match_challenges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    receiver_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    game_id = Column(String(50), nullable=False)
    status = Column(String(20), default="pending")  # pending, accepted, declined, completed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

    def to_dict(self):
        return {
            "id": self.id,
            "type": "match_challenge",
            "gameId": self.game_id,
            "senderId": self.sender_id,
            "receiverId": self.receiver_id,
            "senderUsername": self.sender.username if self.sender else "Player",
            "senderPlayerId": self.sender.player_id if self.sender else "100001",
            "senderRating": self.sender.rating if self.sender else 1200,
            "receiverUsername": self.receiver.username if self.receiver else "Player",
            "receiverPlayerId": self.receiver.player_id if self.receiver else "100001",
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }

