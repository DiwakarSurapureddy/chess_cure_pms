
from datetime import datetime, UTC, timedelta
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

        self.captured_pieces = {"white": [], "black": []}

        # Successful individual moves by each side
        self.player1_move_count = 0
        self.player2_move_count = 0

        # Secret chat state
        self.chat_unlocked = False
        self.chat_unlock_reason: Optional[str] = None
        self.chat_expires_at: Optional[str] = None

        self.created_at = datetime.now(UTC)
        self.updated_at = datetime.now(UTC)

    def start_game(self):
        self.status = "active"
        self.updated_at = datetime.now(UTC)

    def cancel_game(self, reason: str = "Match cancelled"):
        self.status = "cancelled"
        self.result = "cancelled"
        self.updated_at = datetime.now(UTC)

    def unlock_chat_if_eligible(self):
        """
        Unlock once both sides have made 5 legal moves.
        The timer starts only when both counts reach 5.
        """
        if (
            self.player1_move_count >= 5
            and self.player2_move_count >= 5
            and self.chat_unlock_reason is None
        ):
            now = datetime.now(UTC)
            self.chat_unlocked = True
            self.chat_unlock_reason = (
                "Both players completed 5 successful moves"
            )
            self.chat_expires_at = (
                now + timedelta(minutes=5)
            ).isoformat()

    def extend_chat(self, minutes: int = 5):
        self.chat_unlocked = True
        now = datetime.now(UTC)

        if self.chat_expires_at:
            try:
                current_expiry = datetime.fromisoformat(
                    self.chat_expires_at.replace("Z", "+00:00")
                )
                if current_expiry > now:
                    self.chat_expires_at = (
                        current_expiry + timedelta(minutes=minutes)
                    ).isoformat()
                else:
                    self.chat_expires_at = (
                        now + timedelta(minutes=minutes)
                    ).isoformat()
            except (ValueError, TypeError):
                self.chat_expires_at = (
                    now + timedelta(minutes=minutes)
                ).isoformat()
        else:
            self.chat_expires_at = (
                now + timedelta(minutes=minutes)
            ).isoformat()

        self.updated_at = now

    def make_move(self, from_square: str, to_square: str):
        if self.status == "completed":
            return False, "Game is already completed"

        if self.status == "cancelled":
            return False, "Game has been cancelled"

        uci_str = (from_square + to_square).lower()
        move = None

        try:
            candidate = chess.Move.from_uci(uci_str)
            if candidate in self.board.legal_moves:
                move = candidate
        except ValueError:
            pass

        # Handle pawn promotion when the client omits the promotion piece.
        if move is None and len(uci_str) == 4:
            try:
                candidate = chess.Move.from_uci(uci_str + "q")
                if candidate in self.board.legal_moves:
                    move = candidate
            except ValueError:
                pass

        # Illegal moves never increment either player's count.
        if move is None or move not in self.board.legal_moves:
            return False, "Illegal chess move"

        is_white_turn = self.board.turn == chess.WHITE
        player = self.player1 if is_white_turn else self.player2
        move_number = self.board.fullmove_number

        # Record captures for game statistics only.
        is_capture = self.board.is_capture(move)
        captured_symbol = None

        if is_capture:
            if self.board.is_en_passant(move):
                captured_symbol = "p"
            else:
                target_piece = self.board.piece_at(move.to_square)
                captured_symbol = (
                    target_piece.symbol().lower()
                    if target_piece
                    else "p"
                )

            side = "white" if is_white_turn else "black"
            self.captured_pieces[side].append(captured_symbol)

        # Apply the legal move.
        self.board.push(move)
        self.moves.append(move.uci())

        # Count one successful move for the side that just moved.
        if is_white_turn:
            self.player1_move_count += 1
        else:
            self.player2_move_count += 1

        self.move_history.append({
            "move_number": move_number,
            "player": player,
            "from_square": from_square,
            "to_square": to_square,
            "move": move.uci(),
            "captured": captured_symbol,
            "fen": self.board.fen(),
            "timestamp": datetime.now(UTC).isoformat(),
        })

        self.updated_at = datetime.now(UTC)

        # Check the chat rule after every successful move.
        self.unlock_chat_if_eligible()

        if self.board.is_game_over():
            self.status = "completed"

            if self.board.is_checkmate():
                self.result = "checkmate"
                self.winner = (
                    self.player2
                    if self.board.turn == chess.WHITE
                    else self.player1
                )
            elif self.board.is_stalemate():
                self.result = "stalemate"
                self.winner = None
            else:
                self.result = self.board.result()

                if self.result == "1-0":
                    self.winner = self.player1
                elif self.result == "0-1":
                    self.winner = self.player2
                else:
                    self.winner = None

        else:
            self.status = "active"

        return True, "Move played successfully"

    def get_state(self):
        time_remaining = 0

        if self.chat_unlocked and self.chat_expires_at:
            try:
                expiry = datetime.fromisoformat(
                    self.chat_expires_at.replace("Z", "+00:00")
                )
                now = datetime.now(UTC)
                time_remaining = max(
                    0, int((expiry - now).total_seconds())
                )

                if time_remaining == 0:
                    self.chat_unlocked = False

            except (ValueError, TypeError):
                self.chat_unlocked = False
                time_remaining = 0

        is_check = self.board.is_check()
        check_square = None

        if is_check:
            king_square = self.board.king(self.board.turn)
            if king_square is not None:
                check_square = chess.square_name(king_square)

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
            "turn": "white" if self.board.turn == chess.WHITE else "black",
            "game_over": self.board.is_game_over(),
            "is_game_over": self.board.is_game_over(),
            "is_check": is_check,
            "is_checkmate": self.board.is_checkmate(),
            "is_stalemate": self.board.is_stalemate(),
            "check_square": check_square,
            "captured_pieces": self.captured_pieces,
            "player1_move_count": self.player1_move_count,
            "player2_move_count": self.player2_move_count,
            "chat_unlocked": self.chat_unlocked and time_remaining > 0,
            "chat_unlock_reason": self.chat_unlock_reason,
            "chat_expires_at": self.chat_expires_at,
            "chat_time_remaining": time_remaining,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class GameCreateRequest(BaseModel):
    player1: str = Field(default="player1")
    player2: str = Field(default="player2")


class MoveRequest(BaseModel):
    from_square: str
    to_square: str

