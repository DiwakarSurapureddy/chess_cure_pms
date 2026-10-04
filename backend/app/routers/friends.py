import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.friend import FriendRequest, MatchChallenge
from app.services.game_service import game_service

router = APIRouter(tags=["Friends & Notifications"])

class FriendRequestCreate(BaseModel):
    target_player_id: Optional[str] = None
    target_username: Optional[str] = None

class FriendResponseAction(BaseModel):
    request_id: str
    action: str  # "accept" or "decline"

class MatchChallengeCreate(BaseModel):
    target_player_id: Optional[str] = None
    target_username: Optional[str] = None

class MatchChallengeResponse(BaseModel):
    challenge_id: str
    action: str  # "accept" or "decline"

@router.post("/request")
def send_friend_request(
    payload: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sends a friend request to another player by 6-digit Game ID or username."""
    target_user = None
    if payload.target_player_id:
        clean_id = payload.target_player_id.strip()
        target_user = db.query(User).filter(User.player_id == clean_id).first()
    elif payload.target_username:
        clean_name = payload.target_username.strip()
        target_user = db.query(User).filter(User.username.ilike(clean_name)).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target player not found. Please verify the Game ID."
        )

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot send a friend request to yourself."
        )

    # Check if already friends
    existing_accepted = db.query(FriendRequest).filter(
        or_(
            and_(FriendRequest.sender_id == current_user.id, FriendRequest.receiver_id == target_user.id, FriendRequest.status == "accepted"),
            and_(FriendRequest.sender_id == target_user.id, FriendRequest.receiver_id == current_user.id, FriendRequest.status == "accepted")
        )
    ).first()
    if existing_accepted:
        return {"success": True, "message": f"You and {target_user.username} are already friends!", "status": "accepted"}

    # Check if reverse pending request exists -> auto-accept
    reverse_pending = db.query(FriendRequest).filter(
        FriendRequest.sender_id == target_user.id,
        FriendRequest.receiver_id == current_user.id,
        FriendRequest.status == "pending"
    ).first()
    if reverse_pending:
        reverse_pending.status = "accepted"
        db.commit()
        return {"success": True, "message": f"Friend request from {target_user.username} accepted! You are now friends.", "status": "accepted"}

    # Check if already sent pending request
    already_sent = db.query(FriendRequest).filter(
        FriendRequest.sender_id == current_user.id,
        FriendRequest.receiver_id == target_user.id,
        FriendRequest.status == "pending"
    ).first()
    if already_sent:
        return {"success": True, "message": "Friend request already sent. Waiting for response.", "status": "pending"}

    # Create new friend request
    new_req = FriendRequest(
        sender_id=current_user.id,
        receiver_id=target_user.id,
        status="pending"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    return {
        "success": True,
        "message": f"Friend request sent to {target_user.username} (#{target_user.player_id}) successfully!",
        "status": "pending",
        "requestId": new_req.id
    }

@router.get("/notifications")
def get_friend_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all pending friend requests and match challenges directed to current user."""
    pending_friends = (
        db.query(FriendRequest)
        .filter(
            FriendRequest.receiver_id == current_user.id,
            FriendRequest.status == "pending"
        )
        .order_by(desc(FriendRequest.created_at))
        .all()
    )

    pending_challenges = (
        db.query(MatchChallenge)
        .filter(
            MatchChallenge.receiver_id == current_user.id,
            MatchChallenge.status == "pending"
        )
        .order_by(desc(MatchChallenge.created_at))
        .all()
    )

    all_notifications = [r.to_dict() for r in pending_friends] + [c.to_dict() for c in pending_challenges]
    all_notifications.sort(key=lambda x: x.get("createdAt") or "", reverse=True)

    return {
        "success": True,
        "count": len(all_notifications),
        "notifications": all_notifications
    }

@router.post("/respond")
def respond_friend_request(
    payload: FriendResponseAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept or decline an incoming friend request."""
    req = db.query(FriendRequest).filter(
        FriendRequest.id == payload.request_id,
        FriendRequest.receiver_id == current_user.id,
        FriendRequest.status == "pending"
    ).first()

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend request not found or already processed."
        )

    action_clean = payload.action.strip().lower()
    if action_clean == "accept":
        req.status = "accepted"
        db.commit()
        return {
            "success": True,
            "message": f"Friend request accepted! {req.sender.username} is now your friend.",
            "status": "accepted"
        }
    elif action_clean == "decline":
        req.status = "declined"
        db.commit()
        return {
            "success": True,
            "message": "Friend request declined.",
            "status": "declined"
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'accept' or 'decline'.")

@router.get("/list")
def get_friends_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all accepted friends for the current user (Friend Name, Game ID, Elo Rating)."""
    accepted = db.query(FriendRequest).filter(
        and_(
            FriendRequest.status == "accepted",
            or_(
                FriendRequest.sender_id == current_user.id,
                FriendRequest.receiver_id == current_user.id
            )
        )
    ).all()

    friends_data = []
    seen_ids = set()

    for r in accepted:
        friend_user = r.receiver if r.sender_id == current_user.id else r.sender
        if friend_user and friend_user.id not in seen_ids and friend_user.id != current_user.id:
            seen_ids.add(friend_user.id)
            friends_data.append({
                "id": friend_user.id,
                "username": friend_user.username,
                "name": friend_user.username,
                "playerId": friend_user.player_id or "100001",
                "rating": friend_user.rating or 1200,
                "title": friend_user.title or "Chess Player",
                "skill": friend_user.skill or "intermediate",
                "wins": friend_user.wins or 0,
                "losses": friend_user.losses or 0,
            })

    return {
        "success": True,
        "count": len(friends_data),
        "friends": friends_data
    }

# ================= MATCH CHALLENGE ENDPOINTS =================

@router.post("/challenge")
def send_match_challenge(
    payload: MatchChallengeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sends an online match challenge to a friend."""
    target_user = None
    if payload.target_player_id:
        clean_id = payload.target_player_id.strip()
        target_user = db.query(User).filter(User.player_id == clean_id).first()
    elif payload.target_username:
        clean_name = payload.target_username.strip()
        target_user = db.query(User).filter(User.username.ilike(clean_name)).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target player not found."
        )

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot challenge yourself to a match."
        )

    # Create Game in game_service
    game = game_service.create_game(
        player1=current_user.username,
        player2=target_user.username,
        db=db,
    )
    game_id = game.game_id

    # Create challenge invitation record
    challenge = MatchChallenge(
        sender_id=current_user.id,
        receiver_id=target_user.id,
        game_id=game_id,
        status="pending"
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    return {
        "success": True,
        "message": f"Match challenge sent to {target_user.username}!",
        "gameId": game_id,
        "challengeId": challenge.id,
        "opponent": {
            "username": target_user.username,
            "playerId": target_user.player_id,
            "rating": target_user.rating,
        }
    }

@router.post("/challenge/respond")
def respond_match_challenge(
    payload: MatchChallengeResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept or decline an incoming match challenge."""
    challenge = db.query(MatchChallenge).filter(
        MatchChallenge.id == payload.challenge_id,
        MatchChallenge.receiver_id == current_user.id,
        MatchChallenge.status == "pending"
    ).first()

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match challenge not found or already processed."
        )

    action_clean = payload.action.strip().lower()
    if action_clean == "accept":
        challenge.status = "accepted"
        db.commit()

        # Start game in game_service if needed
        game = game_service.get_game(challenge.game_id, db)
        if game:
            game.start_game()
            game_service.save_game(game, db)

        return {
            "success": True,
            "message": f"Challenge accepted! Entering live match with {challenge.sender.username}...",
            "status": "accepted",
            "gameId": challenge.game_id,
            "player1": challenge.sender.username,
            "player2": current_user.username,
        }
    elif action_clean == "decline":
        challenge.status = "declined"
        db.commit()
        return {
            "success": True,
            "message": "Challenge declined.",
            "status": "declined",
            "gameId": challenge.game_id
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'accept' or 'decline'.")

@router.get("/challenge/status/{game_id}")
def get_challenge_status(
    game_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Checks the status of a match challenge for the challenger."""
    challenge = db.query(MatchChallenge).filter(
        MatchChallenge.game_id == game_id
    ).first()

    if not challenge:
        return {"success": False, "status": "not_found"}

    return {
        "success": True,
        "status": challenge.status,
        "gameId": challenge.game_id,
        "player1": challenge.sender.username if challenge.sender else "Player 1",
        "player2": challenge.receiver.username if challenge.receiver else "Player 2",
    }
