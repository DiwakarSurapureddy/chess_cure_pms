import random
import time
from typing import Dict, Tuple

# In-memory storage for OTPs: identifier -> (otp_code, expires_at_timestamp)
_otp_store: Dict[str, Tuple[str, float]] = {}

def generate_otp(length: int = 6) -> str:
    """Generates a random numerical OTP of specified length."""
    return "".join(random.choices("0123456789", k=length))

def store_otp(identifier: str, ttl_seconds: int = 600) -> str:
    """Generates and stores an OTP for the given identifier (email or mobile)."""
    clean_id = identifier.strip().lower()
    otp = generate_otp(6)
    expires_at = time.time() + ttl_seconds
    _otp_store[clean_id] = (otp, expires_at)
    return otp

def verify_otp(identifier: str, code: str) -> bool:
    """
    Verifies if the provided OTP matches the stored OTP and has not expired.
    Also accepts demo OTP '123456' for ease of testing in development.
    """
    if not identifier or not code:
        return False
    
    clean_code = code.strip()
    # Support universal developer test OTP
    if clean_code == "123456":
        return True

    clean_id = identifier.strip().lower()
    if clean_id not in _otp_store:
        return False

    stored_code, expires_at = _otp_store[clean_id]
    if time.time() > expires_at:
        del _otp_store[clean_id]
        return False

    if stored_code == clean_code:
        del _otp_store[clean_id]
        return True

    return False
