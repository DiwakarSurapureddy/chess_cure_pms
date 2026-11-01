from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from datetime import datetime, timezone
from app.core.security import get_password_hash
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    FacebookAuthRequest,
    GuestAuthRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    AuthResponse,
)
from app.services.auth_service import (
    register_user,
    authenticate_user,
    facebook_auth,
    guest_auth,
)
from app.utils.otp import create_and_send_otp, verify_otp_in_db, store_otp, verify_otp
from app.services.delivery_service import resolve_delivery_target

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """[POST] Registers a new user and returns their profile with JWT access token."""
    # Enforce OTP verification before registration (Safeguard 1 & 2)
    target = payload.email or payload.mobileNumber
    if not payload.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code (OTP) is required to complete registration."
        )

    try:
        verify_otp_in_db(db=db, identifier=target, code=payload.otp, purpose="registration", consume=True)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    try:
        result = register_user(
            db=db,
            username=payload.username,
            email=payload.email,
            password=payload.password,
            mobile_number=payload.mobileNumber,
            skill=payload.skill or "intermediate",
        )
        return {
            "success": True,
            "message": "Account created successfully! Please sign in.",
            "token": result["token"],
            "user": result["user"],
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """[POST] Authenticates user with email/username/mobile and password."""
    try:
        result = authenticate_user(
            db=db,
            identifier=payload.email,
            password=payload.password,
            remember_me=payload.rememberMe if payload.rememberMe is not None else True,
        )
        return {
            "success": True,
            "message": "Login successful.",
            "token": result["token"],
            "user": result["user"],
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """[GET] Retrieves current authenticated user profile."""
    return {
        "success": True,
        "user": current_user.to_dict()
    }

@router.put("/me")
def update_me(payload: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """[PUT] Updates current authenticated user profile (username, phone, skill, avatar, rating)."""
    if payload.username is not None and payload.username.strip():
        current_user.username = payload.username.strip()
    if payload.mobileNumber is not None:
        current_user.mobile_number = payload.mobileNumber.strip()
    if payload.skill is not None:
        current_user.skill = payload.skill
    if payload.avatar is not None:
        current_user.avatar = payload.avatar
    if payload.rating is not None:
        current_user.rating = payload.rating
    if payload.title is not None:
        current_user.title = payload.title

    db.commit()
    db.refresh(current_user)
    return {
        "success": True,
        "message": "Profile updated successfully.",
        "user": current_user.to_dict()
    }

@router.delete("/me")
def delete_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """[DELETE] Deletes current authenticated user account."""
    user_id = current_user.id
    db.delete(current_user)
    db.commit()
    return {
        "success": True,
        "message": f"User account '{user_id}' deleted successfully."
    }

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    """[GET] Lists all registered users."""
    users = db.query(User).all()
    return {
        "success": True,
        "total": len(users),
        "users": [u.to_dict() for u in users]
    }

@router.get("/user/{user_id}")
def get_user_by_id(user_id: str, db: Session = Depends(get_db)):
    """[GET] Retrieves a specific user profile by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID '{user_id}' not found.")
    return {
        "success": True,
        "user": user.to_dict()
    }

@router.put("/user/{user_id}")
def update_user_by_id(user_id: str, payload: UpdateProfileRequest, db: Session = Depends(get_db)):
    """[PUT] Updates a user profile by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID '{user_id}' not found.")
    
    if payload.username is not None and payload.username.strip():
        user.username = payload.username.strip()
    if payload.mobileNumber is not None:
        user.mobile_number = payload.mobileNumber.strip()
    if payload.skill is not None:
        user.skill = payload.skill
    if payload.avatar is not None:
        user.avatar = payload.avatar
    if payload.rating is not None:
        user.rating = payload.rating
    if payload.title is not None:
        user.title = payload.title

    db.commit()
    db.refresh(user)
    return {
        "success": True,
        "message": f"User '{user_id}' updated successfully.",
        "user": user.to_dict()
    }

@router.delete("/user/{user_id}")
def delete_user_by_id(user_id: str, db: Session = Depends(get_db)):
    """[DELETE] Deletes a user profile by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID '{user_id}' not found.")
    
    db.delete(user)
    db.commit()
    return {
        "success": True,
        "message": f"User '{user_id}' deleted successfully."
    }

@router.post("/logout")
def logout():
    """[POST] Logs out current user session."""
    return {
        "success": True,
        "message": "Successfully logged out."
    }

@router.post("/facebook", response_model=AuthResponse)
def login_with_facebook(payload: FacebookAuthRequest, db: Session = Depends(get_db)):
    """[POST] Social login via Facebook authentication."""
    try:
        result = facebook_auth(
            db=db,
            email=payload.email,
            name=payload.name,
            avatar=payload.avatar
        )
        return {
            "success": True,
            "message": "Facebook authentication successful.",
            "token": result["token"],
            "user": result["user"],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Facebook authentication failed: {str(e)}"
        )

@router.post("/guest", response_model=AuthResponse)
def continue_as_guest(payload: GuestAuthRequest, db: Session = Depends(get_db)):
    """[POST] Instant guest player login without credentials."""
    try:
        result = guest_auth(db=db, username=payload.username)
        return {
            "success": True,
            "message": "Guest session created successfully.",
            "token": result["token"],
            "user": result["user"],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Guest login failed: {str(e)}"
        )

@router.post("/otp/send")
def send_otp(payload: OtpSendRequest, db: Session = Depends(get_db)):
    """[POST] Sends a 6-digit verification code to user email or mobile number with security safeguards and email priority."""
    channel, target = resolve_delivery_target(
        email=payload.email,
        mobile_number=payload.mobileNumber,
        identifier=payload.identifier
    )
    if not target:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or mobile number is required.")
    
    purpose = (payload.purpose or "registration").strip().lower()

    # Safeguard 7: Account Enumeration Protection for password reset
    if purpose == "password_reset":
        user_exists = db.query(User).filter(
            (User.email == target) |
            (User.mobile_number == target)
        ).first()
        if not user_exists:
            # Generic success message to prevent user enumeration
            return {
                "success": True,
                "message": f"If an account is associated with {target}, a verification code has been dispatched.",
                "channel": channel,
                "identifier": target,
                "expiresIn": 600,
                "cooldownSeconds": 60
            }

    try:
        create_and_send_otp(db=db, identifier=target, purpose=purpose)
    except ValueError as e:
        status_code = status.HTTP_429_TOO_MANY_REQUESTS if "wait" in str(e).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(e))

    # Safeguard 11: Delivery Security -> Never expose plain OTP in API response
    channel_label = "email" if channel == "email" else "mobile number"
    return {
        "success": True,
        "message": f"Verification code sent to your {channel_label} ({target}).",
        "channel": channel,
        "identifier": target,
        "expiresIn": 600,
        "cooldownSeconds": 60
    }

@router.post("/otp/verify")
def verify_otp_code(payload: OtpVerifyRequest, db: Session = Depends(get_db)):
    """[POST] Verifies a 6-digit OTP code against secure hashed storage."""
    target = payload.identifier or payload.email or payload.mobileNumber
    if not target:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or mobile number is required.")
    
    purpose = (payload.purpose or "registration").strip().lower()
    try:
        verify_otp_in_db(db=db, identifier=target, code=payload.otp, purpose=purpose, consume=False)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    return {
        "success": True,
        "message": "Verification code confirmed successfully."
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """[POST] Securely resets user password after OTP verification."""
    target = payload.identifier.strip().lower()
    
    # 1. Safeguards 1, 2, 4, 6: Verify and consume OTP for password_reset
    try:
        verify_otp_in_db(db=db, identifier=target, code=payload.otp, purpose="password_reset", consume=True)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    # 2. Find user
    user = db.query(User).filter(
        (User.email == target) |
        (User.mobile_number == payload.identifier.strip())
    ).first()

    if not user:
        return {
            "success": True,
            "message": "Password reset processed successfully."
        }

    # 3. Safeguard 9: Hash new password using bcrypt
    user.hashed_password = get_password_hash(payload.newPassword)
    # 4. Safeguard 10: Invalidate existing sessions by updating user timestamp
    user.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "success": True,
        "message": "Password reset successfully. You can now log in with your new password."
    }

@router.get("/demo-users")
def get_demo_users():
    """[GET] Provides demo test credentials for quick frontend login."""
    return {
        "demoUsers": [
            {
                "role": "Grandmaster",
                "identifier": "grandmaster@chesscure.com",
                "password": "Checkmate2026!",
                "rating": 2150
            },
            {
                "role": "International Master",
                "identifier": "master@chesscure.com",
                "password": "Checkmate2026!",
                "rating": 2050
            }
        ]
    }
