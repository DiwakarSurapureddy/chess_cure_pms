from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String

from app.database import Base


class UserPresence(Base):
    __tablename__ = "user_presence"

    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    last_seen = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
