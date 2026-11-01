from datetime import datetime, UTC, timezone
from typing import Optional
from pydantic import BaseModel
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.game import GameCreateRequest, MoveRequest
from app.models.friend import MatchChallenge
from app.models.user import User
from app.services.game_service import game_service
from app.services.chat_service import chat_service
from app.websockets.connection_manager import connection_manager


def sync_secret_chat(game, db: Session):
    if not db or not game or not getattr(game, "chat_unlocked", False):
        return

    p1 = getattr(game, "player1", None)
    p2 = getattr(game, "player2", None)
    if not p1 or not p2:
        return

    from app.routers.chat import resolve_friend_user
    u1, u2 = None, None
    try:
        u1 = resolve_friend_user(db, p1)
    except Exception:
        pass
    try:
        u2 = resolve_friend_user(db, p2)
    except Exception:
        pass

    if not u1 or not u2:
        return

    game_id = getattr(game, "game_id", None)
    if game_id:
        try:
            session = chat_service.get_or_create_unlock_session(db, u1.id, u2.id, game_id=game_id)
        except TypeError:
            session = chat_service.get_or_create_unlock_session(db, u1.id, u2.id)
    else:
        session = chat_service.get_or_create_unlock_session(db, u1.id, u2.id)

    is_active = False
    if hasattr(session, "check_and_update_expiry"):
        is_active = session.check_and_update_expiry()
    elif hasattr(session, "is_unlocked"):
        is_active = bool(session.is_unlocked)

    if not is_active:
        if getattr(session, "unlocked_at", None) is not None:
            return
        reason = getattr(game, "chat_unlock_reason", None) or "Both players completed 5 legal moves each"
        unlock_kwargs = {
            "db": db,
            "user1_id": u1.id,
            "user2_id": u2.id,
            "reason": reason,
            "minutes": 5,
        }
        if game_id:
            unlock_kwargs["game_id"] = game_id
        try:
            session = chat_service.unlock_chat(**unlock_kwargs)
        except TypeError:
            unlock_kwargs.pop("game_id", None)
            session = chat_service.unlock_chat(**unlock_kwargs)

        if hasattr(session, "expires_at") and session.expires_at:
            exp = session.expires_at
            if hasattr(exp, "tzinfo") and exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            game.chat_expires_at = exp.isoformat() if hasattr(exp, "isoformat") else str(exp)
        if hasattr(session, "unlock_reason") and session.unlock_reason:
            game.chat_unlock_reason = session.unlock_reason


router = APIRouter(
    prefix="/api/games",
    tags=["Games"],
)


@router.post("")
def create_game(
    request: GameCreateRequest,
    db: Session = Depends(get_db),
):
    game = game_service.create_game(
        player1=request.player1,
        player2=request.player2,
        db=db,
        game_id=getattr(request, "game_id", None),
    )

    return {
        "success": True,
        "message": "Chess game created successfully",
        "game": game.get_state(),
    }


@router.get("")
def get_all_games(
    db: Session = Depends(get_db),
):
    games = game_service.get_all_games(db)

    return {
        "success": True,
        "count": len(games),
        "games": [game.get_state() for game in games],
    }


@router.get("/{game_id}")
def get_game(
    game_id: str,
    db: Session = Depends(get_db),
):
    game = game_service.get_game(game_id, db)

    if game is None:
        raise HTTPException(
            status_code=404,
            detail="Game not found",
        )

    return {
        "success": True,
        "game": game.get_state(),
    }


@router.post("/{game_id}/start")
def start_game(
    game_id: str,
    db: Session = Depends(get_db),
):
    game = game_service.get_game(game_id, db)

    if game is None:
        raise HTTPException(
            status_code=404,
            detail="Game not found",
        )

    game.start_game()
    game_service.save_game(game, db)

    return {
        "success": True,
        "message": "Chess game started successfully",
        "game": game.get_state(),
    }


@router.post("/{game_id}/move")
async def make_move(
    game_id: str,
    request: MoveRequest,
    db: Session = Depends(get_db),
):
    game, message = game_service.make_move(
        game_id=game_id,
        from_square=request.from_square,
        to_square=request.to_square,
        db=db,
    )

    if game is None:
        raise HTTPException(
            status_code=400,
            detail=message,
        )

    if game.chat_unlocked:
        try:
            sync_secret_chat(game, db)
        except Exception:
            pass

    # Broadcast to live connected clients so opponents see move instantly
    await connection_manager.send_to_game(
        game_id,
        {
            "type": "move",
            "success": True,
            "message": message,
            "game": game.get_state(),
        },
    )

    return {
        "success": True,
        "message": message,
        "game": game.get_state(),
    }


@router.get("/{game_id}/history")
def get_game_history(
    game_id: str,
    db: Session = Depends(get_db),
):
    history = game_service.get_history(
        game_id,
        db,
    )

    if history is None:
        raise HTTPException(
            status_code=404,
            detail="Game not found",
        )

    return {
        "success": True,
        "game_id": game_id,
        "move_count": len(history),
        "history": history,
    }


@router.post("/{game_id}/computer-move")
def computer_move(
    game_id: str,
    difficulty: str = "easy",
    db: Session = Depends(get_db),
):
    if difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be easy, medium, or hard",
        )

    game, move = game_service.play_computer_move(
        game_id,
        difficulty,
        db,
    )

    if game is None:
        raise HTTPException(
            status_code=400,
            detail=move,
        )

    return {
        "success": True,
        "message": "Computer move played successfully",
        "computer_move": move,
        "game": game.get_state(),
    }


@router.post("/{game_id}/play-computer")
def play_with_computer(
    game_id: str,
    request: MoveRequest,
    difficulty: str = "easy",
    db: Session = Depends(get_db),
):
    if difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be easy, medium, or hard",
        )

    game, result = game_service.make_player_move_with_computer(
        game_id=game_id,
        from_square=request.from_square,
        to_square=request.to_square,
        difficulty=difficulty,
        db=db,
    )

    if game is None:
        raise HTTPException(
            status_code=400,
            detail=result,
        )

    return {
        "success": True,
        "message": "Player and computer moves completed",
        "moves": result,
        "game": game.get_state(),
    }


@router.post("/{game_id}/reset")
def reset_game(
    game_id: str,
    db: Session = Depends(get_db),
):
    game, message = game_service.reset_game(
        game_id,
        db,
    )

    if game is None:
        raise HTTPException(
            status_code=404,
            detail=message,
        )

    return {
        "success": True,
        "message": message,
        "game": game.get_state(),
    }


@router.delete("/{game_id}")
def delete_game(
    game_id: str,
    db: Session = Depends(get_db),
):
    deleted = game_service.delete_game(
        game_id,
        db,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Game not found",
        )

    return {
        "success": True,
        "message": "Game deleted successfully",
    }


class ResignRequest(BaseModel):
    player: Optional[str] = "w"


class CancelGameRequest(BaseModel):
    reason: Optional[str] = "player_cancelled"


@router.post("/{game_id}/resign")
async def http_resign_game(
    game_id: str,
    payload: ResignRequest,
    db: Session = Depends(get_db),
):
    current_game = game_service.get_game(game_id, db)
    if not current_game:
        return {"success": True, "message": "Game already concluded or not found."}

    resigning_player = payload.player or "w"
    current_game.status = "completed"
    current_game.result = "resignation"
    winner_name = current_game.player2 if resigning_player == "w" else current_game.player1
    current_game.winner = winner_name
    game_service.save_game(current_game, db)

    await connection_manager.send_to_game(
        game_id,
        {
            "type": "resignation",
            "resigning_player": resigning_player,
            "winner": winner_name,
            "message": f"Player ({'White' if resigning_player == 'w' else 'Black'}) resigned the match.",
        }
    )
    return {"success": True, "winner": winner_name, "message": "Resignation recorded."}


@router.post("/{game_id}/cancel")
async def http_cancel_game(
    game_id: str,
    payload: CancelGameRequest,
    db: Session = Depends(get_db),
):
    current_game = game_service.get_game(game_id, db)
    if current_game:
        current_game.status = "cancelled"
        current_game.result = "cancelled"
        game_service.save_game(current_game, db)

    await connection_manager.send_to_game(
        game_id,
        {
            "type": "cancelled",
            "reason": payload.reason or "player_cancelled",
            "message": "The online match was cancelled.",
        }
    )
    return {"success": True, "message": "Game cancelled."}


@router.websocket("/{game_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    game_id: str,
):
    try:
        await websocket.accept()
    except RuntimeError:
        pass

    db = SessionLocal()

    try:
        game = game_service.get_game(
            game_id,
            db,
        )

        if game is None:
            # Check if there is an active or pending challenge for this game_id
            challenge = db.query(MatchChallenge).filter(MatchChallenge.game_id == game_id).first()
            if challenge:
                sender_name = challenge.sender.username if challenge.sender else "Player 1"
                receiver_name = challenge.receiver.username if challenge.receiver else "Player 2"
                game = game_service.create_game(player1=sender_name, player2=receiver_name, db=db, game_id=game_id)
            else:
                # Auto-initialize game instance so any online match (UUID, quick, etc.) connects reliably
                game = game_service.create_game(player1="Player 1", player2="Player 2", db=db, game_id=game_id)

        await connection_manager.connect(
            game_id,
            websocket,
        )

        await connection_manager.send_to_game(
            game_id,
            {
                "type": "connected",
                "message": "Player connected to the chess game",
                "game": game.get_state(),
            },
        )

        while True:
            data = await websocket.receive_json()

            action = data.get("action")

            if action == "move":
                from_square = data.get("from_square")
                to_square = data.get("to_square")

                if not from_square or not to_square:
                    await websocket.send_json(
                        {
                            "success": False,
                            "message": (
                                "from_square and to_square "
                                "are required"
                            ),
                        }
                    )
                    continue

                updated_game, message = game_service.make_move(
                    game_id=game_id,
                    from_square=from_square,
                    to_square=to_square,
                    db=db,
                )

                if updated_game is None:
                    await websocket.send_json(
                        {
                            "success": False,
                            "message": message,
                        }
                    )
                    continue

                if updated_game.chat_unlocked:
                    try:
                        sync_secret_chat(updated_game, db)
                    except Exception:
                        pass

                await connection_manager.send_to_game(
                    game_id,
                    {
                        "type": "move",
                        "success": True,
                        "message": message,
                        "game": updated_game.get_state(),
                    },
                )

            elif action == "state":
                current_game = game_service.get_game(
                    game_id,
                    db,
                )

                if current_game is None:
                    await websocket.send_json(
                        {
                            "success": False,
                            "message": "Game not found",
                        }
                    )
                    continue

                await websocket.send_json(
                    {
                        "type": "state",
                        "success": True,
                        "game": current_game.get_state(),
                    }
                )

            elif action in ["chat", "chat_message"]:
                text = data.get("text", "").strip()
                sender = data.get("sender", "Player")
                current_game = game_service.get_game(game_id, db)
                if not current_game:
                    await websocket.send_json({"success": False, "message": "Game not found"})
                    continue

                state = current_game.get_state()
                if not state.get("chat_unlocked"):
                    await websocket.send_json({
                        "type": "error",
                        "success": False,
                        "message": "Chat is locked. Legally capture an opponent piece within first 5 moves to unlock!"
                    })
                    continue

                # Persist message to database chat_messages table
                try:
                    p1_user = db.query(User).filter(or_(User.username == current_game.player1, User.id == current_game.player1)).first()
                    p2_user = db.query(User).filter(or_(User.username == current_game.player2, User.id == current_game.player2)).first()
                    if p1_user and p2_user:
                        sender_user = p1_user if (sender == p1_user.username or sender == p1_user.id) else p2_user
                        receiver_user = p2_user if sender_user == p1_user else p1_user
                        chat_service.send_message(
                            db=db,
                            sender_id=sender_user.id,
                            receiver_id=receiver_user.id,
                            text=text,
                            game_id=game_id,
                        )
                except Exception:
                    pass

                now_ts = datetime.now(UTC).strftime("%I:%M %p")
                await connection_manager.send_to_game(
                    game_id,
                    {
                        "type": "chat_message",
                        "sender": sender,
                        "text": text,
                        "timestamp": now_ts,
                        "time_remaining": state.get("chat_time_remaining", 300),
                    }
                )

            elif action == "resume_board":
                current_game = game_service.get_game(game_id, db)
                if current_game:
                    if hasattr(current_game, "notify_round1_resumed"):
                        current_game.notify_round1_resumed()
                    if db:
                        game_service.save_game(current_game, db)
                    await connection_manager.send_to_game(
                        game_id,
                        {
                            "type": "state",
                            "success": True,
                            "game": current_game.get_state(),
                        },
                    )

            elif action in ["extend_chat", "pay_demo"]:
                current_game = game_service.get_game(game_id, db)
                if current_game:
                    current_game.extend_chat(5)
                    game_service.save_game(current_game, db)
                    try:
                        u1 = db.query(User).filter(User.username == current_game.player1).first()
                        u2 = db.query(User).filter(User.username == current_game.player2).first()
                        if u1 and u2:
                            chat_service.extend_chat(db, u1.id, u2.id, amount=10, payment_method="demo_upi", game_id=game_id)
                    except Exception:
                        pass

                    await connection_manager.send_to_game(
                        game_id,
                        {
                            "type": "chat_extended",
                            "message": "Chat extended by +5 minutes through ₹10 DEMO payment!",
                            "game": current_game.get_state(),
                        }
                    )

            elif action in ["cancel", "leave", "abort"]:
                reason = data.get("reason", "board_changed")
                current_game = game_service.get_game(game_id, db)
                if current_game:
                    if hasattr(current_game, "cancel_game"):
                        current_game.cancel_game(reason)
                    else:
                        current_game.status = "cancelled"
                    game_service.save_game(current_game, db)

                try:
                    challenge = db.query(MatchChallenge).filter(MatchChallenge.game_id == game_id).first()
                    if challenge:
                        challenge.status = "cancelled"
                        db.commit()
                except Exception:
                    pass

                await connection_manager.send_to_game(
                    game_id,
                    {
                        "type": "cancelled",
                        "reason": reason,
                        "message": "The online match was cancelled because a player changed the board or left the arena.",
                    }
                )

            elif action == "resign":
                resigning_player = data.get("player", "unknown")
                current_game = game_service.get_game(game_id, db)
                winner_name = None
                if current_game:
                    current_game.status = "completed"
                    current_game.result = "resignation"
                    winner_name = current_game.player2 if resigning_player == "w" else current_game.player1
                    current_game.winner = winner_name
                    game_service.save_game(current_game, db)

                await connection_manager.send_to_game(
                    game_id,
                    {
                        "type": "resignation",
                        "resigning_player": resigning_player,
                        "winner": winner_name,
                        "message": f"Player ({'White' if resigning_player == 'w' else 'Black'}) resigned the match.",
                    }
                )

            elif action == "ping":
                await websocket.send_json({"type": "pong"})

            else:
                await websocket.send_json(
                    {
                        "success": False,
                        "message": "Unknown action",
                    }
                )

    except WebSocketDisconnect:
        connection_manager.disconnect(
            game_id,
            websocket,
        )

        await connection_manager.send_to_game(
            game_id,
            {
                "type": "disconnected",
                "message": (
                    "A player disconnected from the chess game"
                ),
            },
        )

    finally:
        db.close()