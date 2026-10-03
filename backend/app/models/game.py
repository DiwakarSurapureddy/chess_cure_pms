import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Game(Base):
    __tablename__ = "games"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    opponent = Column(String(100), nullable=False)
    mode = Column(String(50), default="vs Computer")  # vs Computer, Online Match, Two Players
    result = Column(String(20), nullable=False)  # Won, Lost, Draw
    method = Column(String(50), default="Checkmate")  # Checkmate, Resignation, Time Out, Stalemate
    moves = Column(Integer, default=0)
    rating_change = Column(String(10), default="+0")
    played_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "opponent": self.opponent,
            "mode": self.mode,
            "result": self.result,
            "method": self.method,
            "moves": self.moves,
            "ratingChange": self.rating_change,
            "date": self.played_at.strftime("%Y-%m-%d %H:%M") if self.played_at else "Recently"
        }
