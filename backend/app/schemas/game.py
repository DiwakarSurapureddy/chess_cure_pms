from fastapi import APIRouter, HTTPException

from app.models.game import GameCreateRequest, MoveRequest
from app.services.game_service import game_service


router = APIRouter(
    prefix="/api/games",
    tags=["Games"],
)


@router.post("")
def create_game(request: GameCreateRequest):
    game = game_service.create_game(
        player1=request.player1,
        player2=request.player2,
    )

    return {
        "success": True,
        "message": "Chess game created successfully",
        "game": game.get_state(),
    }


@router.get("")
def get_all_games():
    games = game_service.get_all_games()

    return {
        "success": True,
        "count": len(games),
        "games": [game.get_state() for game in games],
    }


@router.get("/{game_id}")
def get_game(game_id: str):
    game = game_service.get_game(game_id)

    if game is None:
        raise HTTPException(
            status_code=404,
            detail="Game not found",
        )

    return {
        "success": True,
        "game": game.get_state(),
    }


@router.post("/{game_id}/move")
def make_move(game_id: str, request: MoveRequest):
    game, message = game_service.make_move(
        game_id=game_id,
        from_square=request.from_square,
        to_square=request.to_square,
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


@router.post("/{game_id}/reset")
def reset_game(game_id: str):
    game, message = game_service.reset_game(game_id)

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
def delete_game(game_id: str):
    deleted = game_service.delete_game(game_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Game not found",
        )

    return {
        "success": True,
        "message": "Game deleted successfully",
    }