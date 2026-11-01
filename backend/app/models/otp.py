import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from app.database import Base

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    identifier = Column(String(100), index=True, nullable=False)
    hashed_otp = Column(String(128), nullable=False)
    purpose = Column(String(30), default="registration", nullable=False)  # "registration", "password_reset"
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=5, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "identifier": self.identifier,
            "purpose": self.purpose,
            "attempts": self.attempts,
            "maxAttempts": self.max_attempts,
            "isUsed": self.is_used,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "lastSentAt": self.last_sent_at.isoformat() if self.last_sent_at else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }

