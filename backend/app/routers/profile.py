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
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """[GET] Retrieves authenticated user profile with real-time synchronized stats."""
    user_games = db.query(CareerGame).filter(CareerGame.user_id == current_user.id).all()
    real_wins = sum(1 for g in user_games if g.result.lower() == "won")
    real_losses = sum(1 for g in user_games if g.result.lower() == "lost")
    real_draws = sum(1 for g in user_games if g.result.lower() in ["draw", "stalemate"])
    if (current_user.wins != real_wins or current_user.losses != real_losses or current_user.draws != real_draws):
        current_user.wins = real_wins
        current_user.losses = real_losses
        current_user.draws = real_draws
        db.commit()
        db.refresh(current_user)

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
    """[GET] Returns real-time aggregated game statistics strictly backed by database CareerGame records."""
    user_games = db.query(CareerGame).filter(CareerGame.user_id == current_user.id).all()
    
    wins = sum(1 for g in user_games if g.result.lower() == "won")
    losses = sum(1 for g in user_games if g.result.lower() == "lost")
    draws = sum(1 for g in user_games if g.result.lower() in ["draw", "stalemate"])
    total_games = len(user_games)

    win_rate = round((wins / total_games * 100)) if total_games > 0 else 0
    loss_rate = round((losses / total_games * 100)) if total_games > 0 else 0
    draw_rate = round((draws / total_games * 100)) if total_games > 0 else 0

    if (current_user.wins != wins or current_user.losses != losses or current_user.draws != draws):
        current_user.wins = wins
        current_user.losses = losses
        current_user.draws = draws
        db.commit()
        db.refresh(current_user)

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
        "title": current_user.title or "Tactical Aspirant",
        "playerId": current_user.player_id or "100001"
    }

@router.get("/player/{game_id}")
def get_player_by_game_id(game_id: str, db: Session = Depends(get_db)):
    """[GET] Look up a player by their 6-digit Game ID to add as friend or challenge."""
    clean_id = game_id.strip()
    target_user = db.query(User).filter(User.player_id == clean_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player with Game ID #{clean_id} not found."
        )
    return {
        "success": True,
        "player": {
            "id": target_user.id,
            "username": target_user.username,
            "playerId": target_user.player_id,
            "rating": target_user.rating or 1200,
            "title": target_user.title or "Chess Player",
            "skill": target_user.skill or "intermediate",
            "wins": target_user.wins or 0,
            "losses": target_user.losses or 0,
            "draws": target_user.draws or 0,
        }
    }

@router.get("/games", response_model=List[GameResponse])
def get_game_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """[GET] Retrieves history of games played by the user (latest 10 games)."""
    games = (
        db.query(CareerGame)
        .filter(CareerGame.user_id == current_user.id)
        .order_by(desc(CareerGame.played_at))
        .limit(10)
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
    db.flush()

    # Recalculate User summary stats directly from database records
    user_games = db.query(CareerGame).filter(CareerGame.user_id == current_user.id).all()
    current_user.wins = sum(1 for g in user_games if g.result.lower() == "won")
    current_user.losses = sum(1 for g in user_games if g.result.lower() == "lost")
    current_user.draws = sum(1 for g in user_games if g.result.lower() in ["draw", "stalemate"])

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
