from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.game import CareerGame
from app.schemas.auth import UpdateProfileRequest
from app.schemas.profile import (
    GameCreateRequest,
    GameResponse,
    GameStatsResponse,
)

router = APIRouter(tags=["Profile"])

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user)):
    """[GET] Retrieves authenticated user profile."""
    return {
        "success": True,
        "user": current_user.to_dict()
    }

@router.put("/me")
def update_my_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """[PUT] Updates current user profile details."""
    if payload.username is not None and payload.username.strip():
        # Check if username is already taken by another user
        existing = db.query(User).filter(User.username == payload.username.strip(), User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already in use by another player.")
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

@router.get("/stats", response_model=GameStatsResponse)
def get_user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """[GET] Returns aggregated game statistics backed by database records."""
    # Count games in database for this user
    user_games = db.query(CareerGame).filter(CareerGame.user_id == current_user.id).all()
    
    # Calculate counts either from games table or user profile defaults
    if len(user_games) > 0:
        wins = sum(1 for g in user_games if g.result.lower() == "won")
        losses = sum(1 for g in user_games if g.result.lower() == "lost")
        draws = sum(1 for g in user_games if g.result.lower() in ["draw", "stalemate"])
        total_games = len(user_games)
    else:
        wins = current_user.wins or 0
        losses = current_user.losses or 0
        draws = current_user.draws or 0
        total_games = wins + losses + draws

    win_rate = round((wins / total_games * 100)) if total_games > 0 else 0
    loss_rate = round((losses / total_games * 100)) if total_games > 0 else 0
    draw_rate = round((draws / total_games * 100)) if total_games > 0 else 0

    return {
        "totalGames": total_games,
        "wins": wins,
        "losses": losses,
        "draws": draws,
        "winRate": win_rate,
        "lossRate": loss_rate,
        "drawRate": draw_rate,
        "rating": current_user.rating or 1200,
        "puzzlesSolved": current_user.puzzles_solved or 0,
        "skill": current_user.skill or "intermediate",
        "title": current_user.title or "Tactical Aspirant"
    }

@router.get("/games", response_model=List[GameResponse])
def get_game_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """[GET] Retrieves history of games played by the user."""
    games = (
        db.query(CareerGame)
        .filter(CareerGame.user_id == current_user.id)
        .order_by(desc(CareerGame.played_at))
        .limit(50)
        .all()
    )
    return [g.to_dict() for g in games]

@router.post("/games", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
def record_game(
    payload: GameCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """[POST] Saves a completed game into database and updates user stats."""
    game = CareerGame(
        user_id=current_user.id,
        opponent=payload.opponent,
        mode=payload.mode or "vs Computer",
        result=payload.result,
        method=payload.method or "Checkmate",
        moves=payload.moves or 0,
        rating_change=payload.ratingChange or "+0"
    )
    db.add(game)

    # Update User summary stats
    result_lower = payload.result.lower()
    if result_lower == "won":
        current_user.wins = (current_user.wins or 0) + 1
    elif result_lower == "lost":
        current_user.losses = (current_user.losses or 0) + 1
    else:
        current_user.draws = (current_user.draws or 0) + 1

    # Parse rating change
    try:
        clean_delta = payload.ratingChange.replace("+", "").strip() if payload.ratingChange else "0"
        diff = int(clean_delta)
        current_user.rating = max(800, (current_user.rating or 1200) + diff)
    except Exception:
        pass

    db.commit()
    db.refresh(game)
    db.refresh(current_user)

    return game.to_dict()
