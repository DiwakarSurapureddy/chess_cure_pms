import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    mobile_number = Column(String(20), index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    auth_provider = Column(String(20), default="local")  # local, google, facebook, guest
    auth_provider_id = Column(String(100), nullable=True)
    avatar = Column(String(255), nullable=True)
    skill = Column(String(30), default="intermediate")
    rating = Column(Integer, default=1200)
    title = Column(String(50), default="Tactical Aspirant")
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    puzzles_solved = Column(Integer, default=0)
    player_id = Column(String(20), unique=True, index=True, nullable=True)
    is_guest = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "name": self.username,
            "email": self.email,
            "mobileNumber": self.mobile_number,
            "phone": self.mobile_number,
            "avatar": self.avatar,
            "skill": self.skill,
            "rating": self.rating,
            "title": self.title,
            "wins": self.wins,
            "losses": self.losses,
            "draws": self.draws,
            "puzzlesSolved": self.puzzles_solved,
            "isGuest": self.is_guest,
            "playerId": self.player_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
