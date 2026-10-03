import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from app.database import Base

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, index=True, nullable=False)
    board_theme = Column(String(50), default="Dark Obsidian & Warm Gold Accent")
    piece_audio = Column(Boolean, default=True)
    secret_move_notifications = Column(Boolean, default=True)
    sound_volume = Column(Integer, default=80)
    show_instructions = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "boardTheme": self.board_theme,
            "pieceAudio": self.piece_audio,
            "secretMoveNotifications": self.secret_move_notifications,
            "soundVolume": self.sound_volume,
            "showInstructions": self.show_instructions if self.show_instructions is not None else True,
        }
