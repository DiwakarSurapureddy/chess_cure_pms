from datetime import datetime, UTC
from typing import Optional
import uuid

import chess
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey

from app.database import Base


class CareerGame(Base):
    __tablename__ = "career_games"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    opponent = Column(String(100), nullable=False)
    mode = Column(String(50), default="vs Computer")
    result = Column(String(20), nullable=False)
    method = Column(String(50), default="Checkmate")
    moves = Column(Integer, default=0)
    rating_change = Column(String(10), default="+0")
    played_at = Column(DateTime, default=lambda: datetime.now(UTC))
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    def to_dict(self):
        return {
            "id": self.id,
            "opponent": self.opponent,
            "mode": self.mode,
            "result": self.result,
            "method": self.method,
            "moves": self.moves,
            "ratingChange": self.rating_change,
            "date": self.played_at.strftime("%Y-%m-%d %H:%M") if self.played_at else "Recently",
        }


class GameDB(Base):
    __tablename__ = "games"

    game_id = Column(String, primary_key=True, index=True)
    player1 = Column(String, nullable=False)
    player2 = Column(String, nullable=False)

    fen = Column(Text, nullable=False)
    moves = Column(Text, nullable=False, default="")

    status = Column(String, nullable=False, default="waiting")
    result = Column(String, nullable=True)
    winner = Column(String, nullable=True)

    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)


class Game:
    def __init__(
        self,
        game_id: str,
        player1: str = "player1",
        player2: str = "player2",
    ):
        self.game_id = game_id
        self.player1 = player1
        self.player2 = player2

        self.board = chess.Board()

        self.moves = []
        self.move_history = []

        self.status = "waiting"
        self.result: Optional[str] = None
        self.winner: Optional[str] = None

        self.created_at = datetime.now(UTC)
        self.updated_at = datetime.now(UTC)

    def start_game(self):
        self.status = "active"
        self.updated_at = datetime.now(UTC)

    def cancel_game(self, reason: str = "Match cancelled"):
        self.status = "cancelled"
        self.result = "cancelled"
        self.updated_at = datetime.now(UTC)

    def make_move(
        self,
        from_square: str,
        to_square: str,
    ):
        if self.status == "waiting":
            self.start_game()

        if self.status == "completed":
            return False, "Game is already completed"

        uci_str = from_square + to_square
        try:
            move = chess.Move.from_uci(uci_str)
        except ValueError:
            try:
                move = chess.Move.from_uci(uci_str + "q")
            except ValueError:
                return False, "Invalid chess square"

        if move not in self.board.legal_moves:
            return False, "Illegal chess move"

        player = (
            self.player1
            if self.board.turn == chess.WHITE
            else self.player2
        )

        move_number = self.board.fullmove_number

        self.board.push(move)

        move_data = {
            "move_number": move_number,
            "player": player,
            "from_square": from_square,
            "to_square": to_square,
            "move": move.uci(),
            "fen": self.board.fen(),
            "timestamp": datetime.now(UTC).isoformat(),
        }

        self.moves.append(move.uci())
        self.move_history.append(move_data)

        self.updated_at = datetime.now(UTC)

        if self.board.is_game_over():
            self.status = "completed"
            self.result = self.board.result()

            if self.result == "1-0":
                self.winner = self.player1
            elif self.result == "0-1":
                self.winner = self.player2
            else:
                self.winner = None

        return True, "Move played successfully"

    def get_state(self):
        return {
            "game_id": self.game_id,
            "player1": self.player1,
            "player2": self.player2,
            "fen": self.board.fen(),
            "moves": self.moves,
            "move_history": self.move_history,
            "status": self.status,
            "result": self.result,
            "winner": self.winner,
            "turn": (
                "white"
                if self.board.turn == chess.WHITE
                else "black"
            ),
            "game_over": self.board.is_game_over(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class GameCreateRequest(BaseModel):
    player1: str = Field(default="player1")
    player2: str = Field(default="player2")


class MoveRequest(BaseModel):
    from_square: str
    to_square: str
