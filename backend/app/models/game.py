from datetime import datetime, UTC, timedelta
from typing import Optional
import uuid

import chess
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Boolean

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

    chat_unlocked = Column(Boolean, default=False)
    chat_unlock_count = Column(Integer, default=0)
    chat_expires_at = Column(String, nullable=True)
    chat_unlock_reason = Column(String, nullable=True)
    round1_unlock_ply = Column(Integer, nullable=True)
    round2_window_start_ply = Column(Integer, nullable=True)

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
        self.chat_unlocked = False
        self.chat_unlock_count = 0  # Maximum 2 times per game
        self.round1_unlock_ply: Optional[int] = None
        self.round2_window_start_ply: Optional[int] = None
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

    def notify_round1_resumed(self):
        """Called when chat expires or players resume board after round 1."""
        if self.chat_unlock_count == 1 and self.round2_window_start_ply is None:
            self.round2_window_start_ply = len(self.moves) + 1

    def extend_chat(self, minutes: int = 5):
        self.chat_unlocked = True
        now = datetime.now(UTC)
        if self.chat_expires_at:
            try:
                cur_exp = datetime.fromisoformat(self.chat_expires_at.replace("Z", "+00:00"))
                if cur_exp > now:
                    self.chat_expires_at = (cur_exp + timedelta(minutes=minutes)).isoformat()
                else:
                    self.chat_expires_at = (now + timedelta(minutes=minutes)).isoformat()
            except Exception:
                self.chat_expires_at = (now + timedelta(minutes=minutes)).isoformat()
        else:
            self.chat_expires_at = (now + timedelta(minutes=minutes)).isoformat()
        self.updated_at = now

    def make_move(
        self,
        from_square: str,
        to_square: str,
    ):
        if self.status == "waiting":
            self.start_game()

        if self.status == "completed":
            return False, "Game is already completed"

        uci_str = (from_square + to_square).lower()
        move = None

        try:
            m = chess.Move.from_uci(uci_str)
            if m in self.board.legal_moves:
                move = m
        except ValueError:
            pass

        if move is None and len(uci_str) == 4:
            try:
                m = chess.Move.from_uci(uci_str + "q")
                if m in self.board.legal_moves:
                    move = m
            except ValueError:
                pass

        if move is None or move not in self.board.legal_moves:
            return False, "Illegal chess move"

        player = (
            self.player1
            if self.board.turn == chess.WHITE
            else self.player2
        )
        is_white_turn = (self.board.turn == chess.WHITE)
        move_number = self.board.fullmove_number

        # Capture validation with chess engine
        is_capture = self.board.is_capture(move)
        captured_symbol = None
        if is_capture:
            if self.board.is_en_passant(move):
                captured_symbol = "p"
            else:
                target_p = self.board.piece_at(move.to_square)
                captured_symbol = target_p.symbol().lower() if target_p else "p"

            if is_white_turn:
                self.captured_pieces["white"].append(captured_symbol)
            else:
                self.captured_pieces["black"].append(captured_symbol)

        self.board.push(move)

        move_data = {
            "move_number": move_number,
            "player": player,
            "from_square": from_square,
            "to_square": to_square,
            "move": move.uci(),
            "captured": captured_symbol,
            "fen": self.board.fen(),
            "timestamp": datetime.now(UTC).isoformat(),
        }

        self.moves.append(move.uci())
        self.move_history.append(move_data)
        # Chat unlock evaluation (max 2 free unlocks per game)
        total_plies = len(self.moves)
        p1_moves = total_plies // 2 + (total_plies % 2)
        p2_moves = total_plies // 2
        now_utc = datetime.now(UTC)

        is_active = False
        if self.chat_unlocked and self.chat_expires_at:
            try:
                exp = datetime.fromisoformat(self.chat_expires_at.replace("Z", "+00:00"))
                if exp > now_utc:
                    is_active = True
                else:
                    self.chat_unlocked = False
            except Exception:
                self.chat_unlocked = False

        # Round 1: Play Online Chat Unlock Logic
        # Each player gets a 5-move window.
        # Chat must unlock ONLY when a capture happens on the 4th or 5th move of either player within that window.
        # Moves 1, 2, 3: Captures must NOT unlock chat.
        # Move 4: If either player captures, unlock chat immediately.
        # Move 5: If no capture happened on move 4, capture on move 5 unlocks chat.
        # If neither player captures on moves 4 or 5, chat remains locked.
        # Captures on all other moves (moves 1-3, 6+) must NOT unlock chat.
        if self.chat_unlock_count == 0:
            if is_capture and move_number in (4, 5):
                self.chat_unlocked = True
                self.chat_unlock_count = 1
                self.round1_unlock_ply = total_plies
                self.chat_expires_at = (now_utc + timedelta(minutes=5)).isoformat()
                cap_sym = captured_symbol.upper() if captured_symbol else "PIECE"
                self.chat_unlock_reason = f"{player} captured opponent piece ({cap_sym}) on move {move_number} (Chat 1 of 2)"

        # Round 2: After returning to board, capture in window 2 (next 5 moves / 10 plies) unlocks Round 2
        elif self.chat_unlock_count == 1 and not is_active:
            if self.round2_window_start_ply is None:
                self.round2_window_start_ply = total_plies
            plies_in_w2 = total_plies - self.round2_window_start_ply + 1
            if is_capture and plies_in_w2 <= 10:
                self.chat_unlocked = True
                self.chat_unlock_count = 2
                self.chat_expires_at = (now_utc + timedelta(minutes=5)).isoformat()
                cap_sym = captured_symbol.upper() if captured_symbol else "PIECE"
                self.chat_unlock_reason = f"{player} captured opponent piece ({cap_sym}) in second 5-move window (Chat 2 of 2)"

        self.updated_at = datetime.now(UTC)

        if self.board.is_game_over():
            self.status = "completed"
            if self.board.is_checkmate():
                self.result = "checkmate"
                self.winner = self.player2 if self.board.turn == chess.WHITE else self.player1
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

        return True, "Move played successfully"

    def get_state(self):
        time_remaining = 0
        if self.chat_unlocked and self.chat_expires_at:
            try:
                exp = datetime.fromisoformat(self.chat_expires_at.replace("Z", "+00:00"))
                now = datetime.now(UTC)
                time_remaining = max(0, int((exp - now).total_seconds()))
                if time_remaining == 0:
                    self.chat_unlocked = False
            except Exception:
                time_remaining = 0

        is_check = self.board.is_check()
        check_square = None
        if is_check:
            king_sq = self.board.king(self.board.turn)
            if king_sq is not None:
                check_square = chess.square_name(king_sq)

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
            "is_game_over": self.board.is_game_over(),
            "is_check": is_check,
            "is_checkmate": self.board.is_checkmate(),
            "is_stalemate": self.board.is_stalemate(),
            "check_square": check_square,
            "captured_pieces": self.captured_pieces,
            "chat_unlocked": self.chat_unlocked and time_remaining > 0,
            "chat_unlock_count": self.chat_unlock_count,
            "chat_unlock_reason": self.chat_unlock_reason,
            "chat_expires_at": self.chat_expires_at,
            "chat_time_remaining": time_remaining,
            "round1_unlock_ply": self.round1_unlock_ply,
            "round2_window_start_ply": self.round2_window_start_ply,
            "max_free_unlocks": 2,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class GameCreateRequest(BaseModel):
    player1: str = Field(default="player1")
    player2: str = Field(default="player2")
    game_id: Optional[str] = None


class MoveRequest(BaseModel):
    from_square: str
    to_square: str
    session_id: Optional[str] = None
