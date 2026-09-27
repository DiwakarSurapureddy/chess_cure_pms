from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import chess

from app.routers import games
from app.routers import challenges
from app.services.chess_engine import ChessEngine


app = FastAPI(
    title="Chess Cure API",
    description="Chess Cure Backend API",
    version="1.0.0",
)


# Chess game routers
app.include_router(games.router)
app.include_router(challenges.router)


# Simple chess board
board = chess.Board()


class MoveRequest(BaseModel):
    from_square: str
    to_square: str


@app.get("/")
def root():
    return {
        "success": True,
        "message": "Chess Cure Backend is Running!",
        "version": "1.0.0",
    }


@app.get("/api/health")
def health_check():
    return {
        "success": True,
        "message": "Chess Cure API is healthy",
    }


@app.get("/api/board")
def get_board():
    return {
        "success": True,
        "fen": board.fen(),
        "turn": (
            "white"
            if board.turn == chess.WHITE
            else "black"
        ),
        "game_over": board.is_game_over(),
    }


@app.post("/api/move")
def make_simple_move(request: MoveRequest):

    try:
        move = chess.Move.from_uci(
            request.from_square + request.to_square
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid chess move format",
        )

    if move not in board.legal_moves:
        raise HTTPException(
            status_code=400,
            detail="Illegal chess move",
        )

    player_move = move.uci()

    board.push(move)

    computer_move = None

    if not board.is_game_over():

        computer_move = ChessEngine.get_computer_move(
            board,
            "easy",
        )

        if computer_move is not None:
            board.push(computer_move)
            computer_move = computer_move.uci()

    return {
        "success": True,
        "player_move": player_move,
        "computer_move": computer_move,
        "fen": board.fen(),
        "game_over": board.is_game_over(),
    }


@app.post("/api/reset")
def reset_board():

    board.reset()

    return {
        "success": True,
        "message": "Chess board reset successfully",
        "fen": board.fen(),
    }
