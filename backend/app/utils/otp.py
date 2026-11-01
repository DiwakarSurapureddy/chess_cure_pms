import hashlib
import random
import time
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from app.config import settings
from app.database import SessionLocal
from app.models.otp import OTPVerification

OTP_EXPIRY_MINUTES = 10
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_ATTEMPTS = 5
OTP_RATE_LIMIT_PER_HOUR = 5

def generate_otp(length: int = 6) -> str:
    """Generates a cryptographically strong random numerical OTP of specified length."""
    # Use SystemRandom for cryptographic randomness
    rng = random.SystemRandom()
    return "".join(rng.choices("0123456789", k=length))

def hash_otp(code: str) -> str:
    """Securely hashes an OTP using SHA-256 with application secret salt."""
    salt = settings.SECRET_KEY
    return hashlib.sha256(f"{salt}:{code.strip()}".encode("utf-8")).hexdigest()

def normalize_identifier(identifier: Optional[str]) -> str:
    """Normalizes an email or phone identifier."""
    if not identifier:
        return ""
    clean = identifier.strip().lower()
    # Normalize phone numbers if purely digits and formatting
    if not "@" in clean:
        clean = "".join(ch for ch in clean if ch.isdigit() or ch == "+")
    return clean

def create_and_send_otp(
    db: Session,
    identifier: str,
    purpose: str = "registration"
) -> Tuple[str, datetime]:
    """
    Implements:
    - Safeguard 1: 10-Minute Expiry
    - Safeguard 3: 60-Second Resend Cooldown
    - Safeguard 5: Hourly Rate Limiting
    - Safeguard 6: Secure OTP Storage (Hashed)
    - Safeguard 8: Invalidate Previous OTPs
    """
    clean_id = normalize_identifier(identifier)
    if not clean_id:
        raise ValueError("A valid email address or mobile number is required.")

    now = datetime.now(timezone.utc)

    # 1. Safeguard 3: Check 60-second cooldown from most recent attempt
    latest_record = (
        db.query(OTPVerification)
        .filter(
            and_(
                OTPVerification.identifier == clean_id,
                OTPVerification.purpose == purpose
            )
        )
        .order_by(desc(OTPVerification.created_at))
        .first()
    )

    if latest_record and latest_record.last_sent_at:
        last_sent = latest_record.last_sent_at
        if last_sent.tzinfo is None:
            last_sent = last_sent.replace(tzinfo=timezone.utc)
        elapsed = (now - last_sent).total_seconds()
        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            raise ValueError(f"Please wait {remaining} seconds before requesting a new code.")

    # 2. Safeguard 5: Hourly Rate Limiting (max 5 requests per hour)
    one_hour_ago = now - timedelta(hours=1)
    recent_count = (
        db.query(OTPVerification)
        .filter(
            and_(
                OTPVerification.identifier == clean_id,
                OTPVerification.created_at >= one_hour_ago
            )
        )
        .count()
    )
    if recent_count >= OTP_RATE_LIMIT_PER_HOUR:
        raise ValueError("Too many OTP requests. Please wait an hour before requesting again.")

    # 3. Safeguard 8: Invalidate previous pending OTPs for this identifier & purpose
    db.query(OTPVerification).filter(
        and_(
            OTPVerification.identifier == clean_id,
            OTPVerification.purpose == purpose,
            OTPVerification.is_used == False
        )
    ).update({"is_used": True}, synchronize_session=False)

    # 4. Generate new OTP and compute secure hash
    plain_otp = generate_otp(6)
    hashed_value = hash_otp(plain_otp)
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # 5. Safeguard 12: Persist in Database
    otp_record = OTPVerification(
        identifier=clean_id,
        hashed_otp=hashed_value,
        purpose=purpose,
        attempts=0,
        max_attempts=OTP_MAX_ATTEMPTS,
        is_used=False,
        expires_at=expires_at,
        last_sent_at=now,
        created_at=now
    )
    db.add(otp_record)
    db.commit()
    db.refresh(otp_record)

    # 6. Real delivery dispatch via email or mobile
    from app.services.delivery_service import dispatch_otp_delivery
    try:
        dispatch_otp_delivery(identifier=clean_id, code=plain_otp, purpose=purpose)
    except Exception as e:
        # If delivery fails, clean up the pending OTP record so user is not locked by 60s cooldown
        db.delete(otp_record)
        db.commit()
        raise e

    return plain_otp, expires_at

def verify_otp_in_db(
    db: Session,
    identifier: str,
    code: str,
    purpose: str = "registration",
    consume: bool = True
) -> bool:
    """
    Implements:
    - Safeguard 1: 10-Minute Expiry Check
    - Safeguard 2: One-Time Usage (marks is_used = True)
    - Safeguard 4: Maximum 5 Incorrect Attempts & Invalidation
    - Safeguard 6: Hashed Comparison
    """
    clean_id = normalize_identifier(identifier)
    clean_code = (code or "").strip()
    if not clean_id or not clean_code:
        raise ValueError("Identifier and verification code are required.")

    now = datetime.now(timezone.utc)

    # Retrieve most recent unused OTP record for this identifier & purpose
    record = (
        db.query(OTPVerification)
        .filter(
            and_(
                OTPVerification.identifier == clean_id,
                OTPVerification.purpose == purpose,
                OTPVerification.is_used == False
            )
        )
        .order_by(desc(OTPVerification.created_at))
        .first()
    )

    if not record:
        raise ValueError("Invalid or expired verification code. Please request a new code.")

    # 1. Safeguard 1: Check Expiry
    record_expires = record.expires_at
    if record_expires.tzinfo is None:
        record_expires = record_expires.replace(tzinfo=timezone.utc)

    if now > record_expires:
        record.is_used = True
        db.commit()
        raise ValueError("Verification code has expired. Please request a new code.")

    # 2. Safeguard 4: Check if already reached max attempts
    if record.attempts >= record.max_attempts:
        record.is_used = True
        db.commit()
        raise ValueError("Too many failed attempts. This code is invalidated. Please request a new one.")

    # 3. Safeguard 6: Secure hash check
    expected_hash = hash_otp(clean_code)
    is_valid = (record.hashed_otp == expected_hash)

    if not is_valid:
        record.attempts += 1
        if record.attempts >= record.max_attempts:
            record.is_used = True
            db.commit()
            raise ValueError("Too many failed attempts. This code is invalidated. Please request a new one.")
        db.commit()
        attempts_left = record.max_attempts - record.attempts
        raise ValueError(f"Invalid verification code. {attempts_left} attempt(s) remaining.")

    # 4. Safeguard 2: One-Time Usage -> Mark as used to prevent replay
    if consume:
        record.is_used = True
        db.commit()

    return True

# Backward-compatibility wrappers for legacy code
def store_otp(identifier: str, ttl_seconds: int = 600) -> str:
    db = SessionLocal()
    try:
        otp, _ = create_and_send_otp(db, identifier, purpose="registration")
        return otp
    finally:
        db.close()

def verify_otp(identifier: str, code: str) -> bool:
    db = SessionLocal()
    try:
        return verify_otp_in_db(db, identifier, code, purpose="registration", consume=True)
    except Exception:
        return False
    finally:
        db.close()
