
import json
import uuid
from datetime import datetime, UTC, timezone
from typing import Dict, Optional

import chess
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.game import Game, GameDB
from app.models.chat import ChatUnlockSession
from app.models.friend import FriendRequest
from app.models.user import User
from app.services.chess_engine import ChessEngine


class GameService:
    def __init__(self):
        self.games: Dict[str, Game] = {}

    def create_game(
        self,
        player1: str = "player1",
        player2: str = "player2",
        db: Session = None,
    ) -> Game:
        game_id = str(uuid.uuid4())

        game = Game(
            game_id=game_id,
            player1=player1,
            player2=player2,
        )

        self.games[game_id] = game

        if db:
            db_game = GameDB(
                game_id=game.game_id,
                player1=game.player1,
                player2=game.player2,
                fen=game.board.fen(),
                moves=json.dumps(game.moves),
                status=game.status,
                result=game.result,
                winner=game.winner,
                created_at=game.created_at,
                updated_at=game.updated_at,
            )
            db.add(db_game)
            db.commit()

        return game

    def _restore_secret_chat_state(
        self,
        game: Game,
        db: Session,
    ) -> None:
        """Restore the persisted shared chat timer after a game reload."""

        player1 = db.query(User).filter(
            User.username == game.player1
        ).first()

        player2 = db.query(User).filter(
            User.username == game.player2
        ).first()

        if not player1 or not player2:
            game.chat_unlocked = False
            game.chat_unlock_reason = None
            game.chat_expires_at = None
            return

        friendship = db.query(FriendRequest).filter(
            FriendRequest.status == "accepted",
            or_(
                and_(
                    FriendRequest.sender_id == player1.id,
                    FriendRequest.receiver_id == player2.id,
                ),
                and_(
                    FriendRequest.sender_id == player2.id,
                    FriendRequest.receiver_id == player1.id,
                ),
            ),
        ).first()

        if friendship is None:
            game.chat_unlocked = False
            game.chat_unlock_reason = None
            game.chat_expires_at = None
            return

        session = db.query(ChatUnlockSession).filter(
            or_(
                and_(
                    ChatUnlockSession.user1_id == player1.id,
                    ChatUnlockSession.user2_id == player2.id,
                ),
                and_(
                    ChatUnlockSession.user1_id == player2.id,
                    ChatUnlockSession.user2_id == player1.id,
                ),
            )
        ).first()

        if session is None:
            game.chat_unlocked = False
            game.chat_unlock_reason = None
            game.chat_expires_at = None
            return

        # Check the existing expiry; never create a fresh timer on reload.
        was_unlocked = session.is_unlocked
        is_active = session.check_and_update_expiry()

        if was_unlocked and not is_active:
            db.commit()

        expiry = session.expires_at

        if expiry is not None and expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

        game.chat_unlocked = is_active
        game.chat_unlock_reason = (
            session.unlock_reason if is_active else None
        )
        game.chat_expires_at = expiry if is_active else None

    def get_game(
        self,
        game_id: str,
        db: Session = None,
    ) -> Optional[Game]:
        if game_id in self.games:
            return self.games[game_id]

        if not db:
            return None

        db_game = (
            db.query(GameDB)
            .filter(GameDB.game_id == game_id)
            .first()
        )

        if not db_game:
            return None

        game = Game(
            game_id=db_game.game_id,
            player1=db_game.player1,
            player2=db_game.player2,
        )

        game.board = chess.Board(db_game.fen)
        game.moves = json.loads(db_game.moves) if db_game.moves else []

        # Restore move counts from the saved sequence.
        total_moves = len(game.moves)
        game.player1_move_count = (total_moves + 1) // 2
        game.player2_move_count = total_moves // 2

        game.status = db_game.status
        game.result = db_game.result
        game.winner = db_game.winner
        game.created_at = db_game.created_at
        game.updated_at = db_game.updated_at

        # Restore the existing shared session instead of starting a new timer.
        self._restore_secret_chat_state(game, db)

        self.games[game_id] = game
        return game

    def save_game(
        self,
        game: Game,
        db: Session,
    ):
        db_game = (
            db.query(GameDB)
            .filter(GameDB.game_id == game.game_id)
            .first()
        )

        if db_game is None:
            db_game = GameDB(
                game_id=game.game_id,
                player1=game.player1,
                player2=game.player2,
                created_at=game.created_at,
            )
            db.add(db_game)

        db_game.fen = game.board.fen()
        db_game.moves = json.dumps(game.moves)
        db_game.status = game.status
        db_game.result = game.result
        db_game.winner = game.winner
        db_game.updated_at = game.updated_at

        db.commit()

    def get_all_games(self, db: Session = None):
        if not db:
            return list(self.games.values())

        db_games = db.query(GameDB).all()
        result = []

        for db_game in db_games:
            game = self.get_game(db_game.game_id, db)
            if game:
                result.append(game)

        return result

    def get_player_games(
        self,
        player: str,
        db: Session = None,
    ):
        return [
            game
            for game in self.get_all_games(db)
            if game.player1 == player or game.player2 == player
        ]

    def make_move(
        self,
        game_id: str,
        from_square: str,
        to_square: str,
        db: Session = None,
    ):
        game = self.get_game(game_id, db)

        if game is None:
            return None, "Game not found"

        success, message = game.make_move(from_square, to_square)

        if not success:
            return None, message

        if db:
            self.save_game(game, db)

        return game, message

    def _play_computer_move_on_game(
        self,
        game: Game,
        difficulty: str,
    ):
        if game.status == "completed":
            return None, "Game is already completed"

        computer_move = ChessEngine.get_computer_move(
            game.board,
            difficulty,
        )

        if computer_move is None:
            return None, "No legal computer move available"

        is_white_turn = game.board.turn == chess.WHITE
        player_name = game.player1 if is_white_turn else game.player2
        move_number = game.board.fullmove_number

        is_capture = game.board.is_capture(computer_move)
        captured_symbol = None

        if is_capture:
            if game.board.is_en_passant(computer_move):
                captured_symbol = "p"
            else:
                target_piece = game.board.piece_at(computer_move.to_square)
                captured_symbol = (
                    target_piece.symbol().lower()
                    if target_piece
                    else "p"
                )

            side = "white" if is_white_turn else "black"
            game.captured_pieces[side].append(captured_symbol)

        from_square = chess.square_name(computer_move.from_square)
        to_square = chess.square_name(computer_move.to_square)

        game.board.push(computer_move)
        game.moves.append(computer_move.uci())

        if is_white_turn:
            game.player1_move_count += 1
        else:
            game.player2_move_count += 1

        game.move_history.append({
            "move_number": move_number,
            "player": player_name,
            "from_square": from_square,
            "to_square": to_square,
            "move": computer_move.uci(),
            "captured": captured_symbol,
            "fen": game.board.fen(),
        })

        game.updated_at = datetime.now(UTC)
        game.unlock_chat_if_eligible()

        if game.board.is_game_over():
            game.status = "completed"

            if game.board.is_checkmate():
                game.result = "checkmate"
                game.winner = (
                    game.player2
                    if game.board.turn == chess.WHITE
                    else game.player1
                )
            elif game.board.is_stalemate():
                game.result = "stalemate"
                game.winner = None
            else:
                game.result = game.board.result()

                if game.result == "1-0":
                    game.winner = game.player1
                elif game.result == "0-1":
                    game.winner = game.player2
                else:
                    game.winner = None

        return computer_move.uci(), None

    def play_computer_move(
        self,
        game_id: str,
        difficulty: str = "easy",
        db: Session = None,
    ):
        game = self.get_game(game_id, db)

        if game is None:
            return None, "Game not found"

        move, error = self._play_computer_move_on_game(game, difficulty)

        if error:
            return None, error

        if db:
            self.save_game(game, db)

        return game, move

    def make_player_move_with_computer(
        self,
        game_id: str,
        from_square: str,
        to_square: str,
        difficulty: str = "easy",
        db: Session = None,
    ):
        game = self.get_game(game_id, db)

        if game is None:
            return None, "Game not found"

        if game.status == "completed":
            return None, "Game is already completed"

        success, message = game.make_move(from_square, to_square)

        if not success:
            return None, message

        player_move = game.moves[-1]

        if game.status == "completed":
            if db:
                self.save_game(game, db)

            return game, {
                "player_move": player_move,
                "computer_move": None,
            }

        computer_move, error = self._play_computer_move_on_game(
            game,
            difficulty,
        )

        if error:
            if db:
                self.save_game(game, db)

            return game, {
                "player_move": player_move,
                "computer_move": None,
            }

        if db:
            self.save_game(game, db)

        return game, {
            "player_move": player_move,
            "computer_move": computer_move,
        }

    def get_history(
        self,
        game_id: str,
        db: Session = None,
    ):
        game = self.get_game(game_id, db)
        return None if game is None else game.move_history

    def reset_game(
        self,
        game_id: str,
        db: Session = None,
    ):
        game = self.get_game(game_id, db)

        if game is None:
            return None, "Game not found"

        game.board.reset()
        game.moves.clear()
        game.move_history.clear()
        game.captured_pieces = {"white": [], "black": []}

        game.player1_move_count = 0
        game.player2_move_count = 0

        game.chat_unlocked = False
        game.chat_unlock_reason = None
        game.chat_expires_at = None

        game.status = "waiting"
        game.result = None
        game.winner = None
        game.updated_at = datetime.now(UTC)

        if db:
            self.save_game(game, db)

        return game, "Game reset successfully"

    def delete_game(
        self,
        game_id: str,
        db: Session = None,
    ):
        if db:
            db_game = (
                db.query(GameDB)
                .filter(GameDB.game_id == game_id)
                .first()
            )

            if db_game is None:
                return False

            db.delete(db_game)
            db.commit()

        self.games.pop(game_id, None)
        return True


game_service = GameService()

