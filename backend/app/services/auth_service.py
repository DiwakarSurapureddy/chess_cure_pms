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

def generate_sequential_game_id(db: Session) -> str:
    """Generates the next sequential 6-digit Game ID starting from 100001."""
    all_player_ids = db.query(User.player_id).filter(User.player_id != None).all()
    max_id = 100000
    for (pid,) in all_player_ids:
        if pid:
            digits = "".join(ch for ch in str(pid) if ch.isdigit())
            if digits:
                try:
                    num = int(digits)
                    if 100000 <= num <= 999999 and num > max_id:
                        max_id = num
                except ValueError:
                    pass
    return str(max_id + 1)

def seed_default_users(db: Session):
    """Ensure primary accounts have correct Game IDs configured securely via settings (.env)."""
    # 1. Primary admin account (Game ID: 100001)
    admin_email = (getattr(settings, "SEED_ADMIN_EMAIL", None) or "admin@chesscure.local").strip().lower()
    admin_username = getattr(settings, "SEED_ADMIN_USERNAME", None) or "admin_player"
    admin_mobile = getattr(settings, "SEED_ADMIN_MOBILE", None) or "+1 555-0199"
    admin_password = getattr(settings, "SEED_ADMIN_PASSWORD", None) or "Chess@2026Secure"
    benspidy_oauth_id = getattr(settings, "SEED_BENSPIDY_ID", None) or "benspidy_oauth"

    existing_admin = db.query(User).filter((User.email == admin_email) | (User.username == admin_username)).first()
    if not existing_admin:
        admin_user = User(
            username=admin_username,
            email=admin_email,
            mobile_number=admin_mobile,
            hashed_password=get_password_hash(admin_password),
            auth_provider="local",
            skill="intermediate",
            rating=1450,
            title="Tactical Strategist",
            wins=3,
            losses=1,
            draws=1,
            puzzles_solved=68,
            player_id="100001",
            is_guest=False,
            is_active=True
        )
        db.add(admin_user)
    else:
        existing_admin.player_id = "100001"

    # 2. BenSpidy account (Game ID: 100002)
    benspidy_user = db.query(User).filter(
        (User.username.ilike("BenSpidy")) | (User.email.like(f"%{benspidy_oauth_id}%"))
    ).first()
    if benspidy_user:
        benspidy_user.player_id = "100002"

    # 3. ram account (Game ID: 100003)
    ram_user = db.query(User).filter(
        (User.username.ilike("ram")) | (User.email.ilike("ram%@gmail.com"))
    ).first()
    if ram_user:
        ram_user.player_id = "100003"

    db.commit()

    from app.models.game import CareerGame

    # Seed played games for primary account if empty
    target_admin = db.query(User).filter(User.email == admin_email).first()
    if target_admin and db.query(CareerGame).filter(CareerGame.user_id == target_admin.id).count() == 0:
        admin_games = [
            CareerGame(user_id=target_admin.id, opponent="Computer (Stockfish Easy)", mode="vs Computer", result="Won", method="Checkmate", moves=28, rating_change="+15"),
            CareerGame(user_id=target_admin.id, opponent="Computer (Stockfish Medium)", mode="vs Computer", result="Won", method="Checkmate", moves=36, rating_change="+18"),
            CareerGame(user_id=target_admin.id, opponent="MasterStrategist", mode="Online Match", result="Lost", method="Resignation", moves=42, rating_change="-12"),
            CareerGame(user_id=target_admin.id, opponent="GrandmasterMaster", mode="Online Match", result="Draw", method="Stalemate", moves=51, rating_change="+3"),
            CareerGame(user_id=target_admin.id, opponent="ClubPlayer", mode="Two Players", result="Won", method="Checkmate", moves=22, rating_change="+14")
        ]
        db.add_all(admin_games)
        db.commit()

    # Ensure all users have their summary stats 100% synchronized with actual CareerGame count
    for user_item in db.query(User).all():
        u_games = db.query(CareerGame).filter(CareerGame.user_id == user_item.id).all()
        user_item.wins = sum(1 for g in u_games if g.result.lower() == "won")
        user_item.losses = sum(1 for g in u_games if g.result.lower() == "lost")
        user_item.draws = sum(1 for g in u_games if g.result.lower() in ["draw", "stalemate"])
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
    player_id = generate_sequential_game_id(db)

    new_user = User(
        username=clean_username,
        email=clean_email,
        mobile_number=clean_mobile,
        hashed_password=get_password_hash(password),
        auth_provider="local",
        skill=skill,
        rating=rating,
        title=title,
        wins=0,
        losses=0,
        draws=0,
        puzzles_solved=0,
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

    # Fast indexed lookup first (B-tree index on email and username)
    user = db.query(User).filter(
        (User.email == clean_ident) |
        (User.username == identifier.strip()) |
        (User.username == clean_ident)
    ).first()

    # Fallback to case-insensitive or phone search if direct match was not found
    if not user:
        user = db.query(User).filter(
            (User.username.ilike(clean_ident)) |
            (User.mobile_number == identifier.strip()) |
            (User.mobile_number == clean_phone)
        ).first()

    if not user:
        raise ValueError("Invalid email, username, or password.")

    if not user.hashed_password or not verify_password(password, user.hashed_password):
        raise ValueError("Invalid email, username, or password.")

    # Ensure existing user has a 6-digit sequential game ID starting from 100001
    if not user.player_id or not user.player_id.isdigit() or len(user.player_id) != 6:
        admin_email = (getattr(settings, "SEED_ADMIN_EMAIL", None) or "admin@chesscure.local").strip().lower()
        admin_username = (getattr(settings, "SEED_ADMIN_USERNAME", None) or "admin_player").strip().lower()
        benspidy_oauth_id = getattr(settings, "SEED_BENSPIDY_ID", None) or "benspidy_oauth"

        u_email = (user.email or "").strip().lower()
        u_name = (user.username or "").strip().lower()

        if u_email == admin_email or u_name == admin_username:
            user.player_id = "100001"
        elif "benspidy" in u_name or benspidy_oauth_id in u_email:
            user.player_id = "100002"
        elif u_name == "ram" or "ram" in u_email:
            user.player_id = "100003"
        else:
            user.player_id = generate_sequential_game_id(db)
        db.commit()
        db.refresh(user)

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
            rating=1200,
            title="Club Player",
            wins=0,
            losses=0,
            draws=0,
            puzzles_solved=0,
            player_id=generate_sequential_game_id(db),
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
            rating=1200,
            title="Challenger",
            wins=0,
            losses=0,
            draws=0,
            puzzles_solved=0,
            player_id=generate_sequential_game_id(db),
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
