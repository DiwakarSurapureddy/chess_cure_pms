from fastapi import FastAPI
from pydantic import BaseModel
import chess
import random

app = FastAPI(
    title="Chess Cure API",
    description="Backend API for Chess Cure",
    version="1.0.0"
)


class MoveRequest(BaseModel):
    from_square: str
    to_square: str


# Create a new chess board
board = chess.Board()


@app.get("/")
def home():
    return {
        "message": "Chess Cure Backend is Running!"
    }


@app.get("/api/health")
def health_check():
    return {
        "success": True,
        "message": "Chess Cure API is healthy"
    }


@app.get("/api/board")
def get_board():
    return {
        "success": True,
        "fen": board.fen(),
        "game_over": board.is_game_over()
    }


@app.post("/api/move")
def make_move(move: MoveRequest):

    global board

    try:
        # Create player's chess move
        player_move = chess.Move.from_uci(
            move.from_square + move.to_square
        )

        # Check whether player's move is legal
        if player_move not in board.legal_moves:
            return {
                "success": False,
                "message": "Illegal chess move",
                "fen": board.fen()
            }

        # Make player's move
        board.push(player_move)

        # Check if game ended after player's move
        if board.is_game_over():
            return {
                "success": True,
                "player_move": player_move.uci(),
                "computer_move": None,
                "fen": board.fen(),
                "game_over": True,
                "result": board.result()
            }

        # Get all legal computer moves
        legal_moves = list(board.legal_moves)

        # Select a random legal computer move
        computer_move = random.choice(legal_moves)

        # Make computer move
        board.push(computer_move)

        return {
            "success": True,
            "player_move": player_move.uci(),
            "computer_move": computer_move.uci(),
            "fen": board.fen(),
            "game_over": board.is_game_over()
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


@app.post("/api/reset")
def reset_game():

    global board

    board = chess.Board()

    return {
        "success": True,
        "message": "Chess game reset successfully",
        "fen": board.fen()
    }