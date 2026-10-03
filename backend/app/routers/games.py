from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.game import GameCreateRequest, MoveRequest
from app.services.game_service import game_service
from app.websockets.connection_manager import connection_manager


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
def make_move(
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


@router.websocket("/{game_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    game_id: str,
):
    db = SessionLocal()

    try:
        game = game_service.get_game(
            game_id,
            db,
        )

        if game is None:
            await websocket.close(code=1008)
            return

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