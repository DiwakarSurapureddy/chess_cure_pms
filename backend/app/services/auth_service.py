import random
import re
from datetime import timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token
from app.config import settings

def normalize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    return re.sub(r"[\s\-()]+", "", phone.strip())

def get_initial_rating_for_skill(skill: str) -> int:
    skill_lower = (skill or "").lower()
    if "beginner" in skill_lower:
        return 850
    elif "intermediate" in skill_lower or "club" in skill_lower:
        return 1350
    elif "advanced" in skill_lower or "grandmaster aspirant" in skill_lower:
        return 1750
    elif "master" in skill_lower:
        return 2150
    return 1200

def get_initial_title_for_skill(skill: str) -> str:
    skill_lower = (skill or "").lower()
    if "beginner" in skill_lower:
        return "Apprentice"
    elif "intermediate" in skill_lower or "club" in skill_lower:
        return "Tactical Aspirant"
    elif "advanced" in skill_lower:
        return "Candidate Master"
    elif "master" in skill_lower:
        return "Grandmaster"
    return "Chess Strategist"

def seed_default_users(db: Session):
    """Seed demo and testing accounts if not already present."""
    # 1. Grandmaster demo account (matched with Frontend demo fill button)
    gm_email = "grandmaster@chesscure.com"
    existing_gm = db.query(User).filter(User.email == gm_email).first()
    if not existing_gm:
        gm_user = User(
            username="GrandmasterMaster",
            email=gm_email,
            mobile_number="+1 555-019-2834",
            hashed_password=get_password_hash("Checkmate2026!"),
            auth_provider="local",
            skill="advanced",
            rating=2150,
            title="Grandmaster",
            wins=82,
            losses=42,
            draws=8,
            puzzles_solved=342,
            player_id="CC-994120",
            is_guest=False,
            is_active=True
        )
        db.add(gm_user)

    # 2. Master demo account
    master_email = "master@chesscure.com"
    existing_master = db.query(User).filter(User.email == master_email).first()
    if not existing_master:
        master_user = User(
            username="MasterStrategist",
            email=master_email,
            mobile_number="+1 555-019-2835",
            hashed_password=get_password_hash("Checkmate2026!"),
            auth_provider="local",
            skill="master",
            rating=2050,
            title="International Master",
            wins=64,
            losses=18,
            draws=10,
            puzzles_solved=280,
            player_id="CC-772910",
            is_guest=False,
            is_active=True
        )
        db.add(master_user)

    db.commit()

    # Seed initial demo games if not present
    from app.models.game import Game
    target_gm = existing_gm or db.query(User).filter(User.email == gm_email).first()
    if target_gm and db.query(Game).filter(Game.user_id == target_gm.id).count() == 0:
        demo_games = [
            Game(user_id=target_gm.id, opponent="Stockfish Engine (Lvl 4)", mode="vs Computer", result="Won", method="Checkmate", moves=32, rating_change="+18"),
            Game(user_id=target_gm.id, opponent="MagnusFan99", mode="Online Match", result="Won", method="Resignation", moves=24, rating_change="+14"),
            Game(user_id=target_gm.id, opponent="Alex_Rook", mode="Online Match", result="Lost", method="Time Out", moves=45, rating_change="-11"),
            Game(user_id=target_gm.id, opponent="Guest_7841", mode="Two Players", result="Won", method="Checkmate", moves=19, rating_change="+8")
        ]
        db.add_all(demo_games)
        db.commit()

def register_user(
    db: Session,
    username: str,
    email: str,
    password: str,
    mobile_number: Optional[str] = None,
    skill: str = "intermediate"
) -> Dict[str, Any]:
    clean_username = username.strip()
    clean_email = email.strip().lower()
    clean_mobile = mobile_number.strip() if mobile_number else None

    # Check for existing email
    if db.query(User).filter(User.email == clean_email).first():
        raise ValueError("An account with this email address already exists.")

    # Check for existing username
    if db.query(User).filter(User.username.ilike(clean_username)).first():
        raise ValueError("This username is already taken. Please choose another.")

    rating = get_initial_rating_for_skill(skill)
    title = get_initial_title_for_skill(skill)
    player_id = f"CC-{random.randint(100000, 999999)}"

    new_user = User(
        username=clean_username,
        email=clean_email,
        mobile_number=clean_mobile,
        hashed_password=get_password_hash(password),
        auth_provider="local",
        skill=skill,
        rating=rating,
        title=title,
        player_id=player_id,
        is_guest=False,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(subject=new_user.id)
    return {
        "token": token,
        "user": new_user.to_dict()
    }

def authenticate_user(
    db: Session,
    identifier: str,
    password: str,
    remember_me: bool = True
) -> Dict[str, Any]:
    clean_ident = identifier.strip().lower()
    clean_phone = normalize_phone(identifier)

    # Search user by email, username, or normalized mobile number
    user = db.query(User).filter(
        (User.email == clean_ident) |
        (User.username.ilike(clean_ident)) |
        (User.mobile_number == identifier.strip()) |
        (User.mobile_number == clean_phone)
    ).first()

    if not user:
        raise ValueError("Invalid email, username, or password.")

    if not user.hashed_password or not verify_password(password, user.hashed_password):
        raise ValueError("Invalid email, username, or password.")

    expires_delta = timedelta(days=30) if remember_me else timedelta(days=1)
    token = create_access_token(subject=user.id, expires_delta=expires_delta)

    return {
        "token": token,
        "user": user.to_dict()
    }

def google_auth(
    db: Session,
    email: Optional[str] = "player@gmail.com",
    name: Optional[str] = "Google Player",
    avatar: Optional[str] = None
) -> Dict[str, Any]:
    clean_email = (email or "player@gmail.com").strip().lower()
    clean_name = (name or "Google Player").strip()
    default_avatar = avatar or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        # Generate unique username
        base_username = clean_name.replace(" ", "") or "GooglePlayer"
        username_candidate = base_username
        suffix = 1
        while db.query(User).filter(User.username.ilike(username_candidate)).first():
            username_candidate = f"{base_username}{suffix}"
            suffix += 1

        user = User(
            username=username_candidate,
            email=clean_email,
            avatar=default_avatar,
            auth_provider="google",
            skill="intermediate",
            rating=1500,
            title="Club Player",
            wins=15,
            losses=7,
            draws=2,
            puzzles_solved=84,
            player_id=f"CC-GOOG{random.randint(1000, 9999)}",
            is_guest=False,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(subject=user.id)
    return {
        "token": token,
        "user": user.to_dict()
    }

def facebook_auth(
    db: Session,
    email: Optional[str] = "fb_player@facebook.com",
    name: Optional[str] = "Facebook Master",
    avatar: Optional[str] = None
) -> Dict[str, Any]:
    clean_email = (email or "fb_player@facebook.com").strip().lower()
    clean_name = (name or "Facebook Master").strip()
    default_avatar = avatar or "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80"

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        base_username = clean_name.replace(" ", "") or "FacebookMaster"
        username_candidate = base_username
        suffix = 1
        while db.query(User).filter(User.username.ilike(username_candidate)).first():
            username_candidate = f"{base_username}{suffix}"
            suffix += 1

        user = User(
            username=username_candidate,
            email=clean_email,
            avatar=default_avatar,
            auth_provider="facebook",
            skill="intermediate",
            rating=1480,
            title="Challenger",
            wins=20,
            losses=12,
            draws=4,
            puzzles_solved=110,
            player_id=f"CC-FB{random.randint(1000, 9999)}",
            is_guest=False,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Link existing user and update avatar if new avatar provided
        if avatar:
            user.avatar = avatar
            db.commit()
            db.refresh(user)

    token = create_access_token(subject=user.id)
    return {
        "token": token,
        "user": user.to_dict()
    }

def guest_auth(db: Session, username: Optional[str] = None) -> Dict[str, Any]:
    guest_num = random.randint(1000, 9999)
    guest_name = username.strip() if username and username.strip() else f"Guest #{guest_num}"
    guest_email = f"guest_{guest_num}_{random.randint(100, 999)}@chesscure.guest"

    user = User(
        username=guest_name,
        email=guest_email,
        auth_provider="guest",
        skill="beginner",
        rating=1200,
        title="Casual Guest",
        wins=0,
        losses=0,
        draws=0,
        puzzles_solved=0,
        player_id=f"CC-GST{guest_num}",
        is_guest=True,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return {
        "token": token,
        "user": user.to_dict()
    }

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()
