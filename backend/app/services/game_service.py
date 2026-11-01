import json
import uuid
from typing import Dict, List, Optional

import chess
from sqlalchemy.orm import Session

from app.models.game import Game, GameDB
from app.models.user import User
from app.models.friend import FriendRequest
from app.models.chat import ChatUnlockSession
from app.services.chess_engine import ChessEngine


class GameService:
    def __init__(self):
        self.games: Dict[str, Game] = {}

    def create_game(
        self,
        player1: str = "player1",
        player2: str = "player2",
        db: Session = None,
        game_id: Optional[str] = None,
    ) -> Game:

        target_id = game_id or str(uuid.uuid4())

        game = Game(
            game_id=target_id,
            player1=player1,
            player2=player2,
        )

        self.games[target_id] = game

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

    def get_game(
        self,
        game_id: str,
        db: Session = None,
    ) -> Game | None:

        if game_id in self.games:
            game = self.games[game_id]
            if db:
                self._restore_secret_chat_state(game, db)
            return game

        if db:
            db_game = (
                db.query(GameDB)
                .filter(GameDB.game_id == game_id)
                .first()
            )

            if db_game:
                game = Game(
                    game_id=db_game.game_id,
                    player1=db_game.player1,
                    player2=db_game.player2,
                )

                game.board = chess.Board(db_game.fen)

                if db_game.moves:
                    game.moves = json.loads(db_game.moves)
                else:
                    game.moves = []

                game.status = db_game.status
                game.result = db_game.result
                game.winner = db_game.winner
                game.created_at = db_game.created_at
                game.updated_at = db_game.updated_at
                game.chat_unlocked = getattr(db_game, "chat_unlocked", False)
                game.chat_unlock_count = getattr(db_game, "chat_unlock_count", 0)
                game.chat_expires_at = getattr(db_game, "chat_expires_at", None)
                game.chat_unlock_reason = getattr(db_game, "chat_unlock_reason", None)
                game.round1_unlock_ply = getattr(db_game, "round1_unlock_ply", None)
                game.round2_window_start_ply = getattr(db_game, "round2_window_start_ply", None)

                self._restore_secret_chat_state(game, db)

                self.games[game_id] = game

                return game

        return None

    def _restore_secret_chat_state(self, game, db: Session = None):
        if not db or not game:
            return

        p1 = getattr(game, "player1", None)
        p2 = getattr(game, "player2", None)
        if not p1 or not p2:
            return

        u1 = db.query(User).filter(User.username == p1).first()
        u2 = db.query(User).filter(User.username == p2).first()
        if not u1 or not u2:
            return

        friendship = db.query(FriendRequest).filter(
            (
                (FriendRequest.sender_id == u1.id) & (FriendRequest.receiver_id == u2.id)
            ) | (
                (FriendRequest.sender_id == u2.id) & (FriendRequest.receiver_id == u1.id)
            ),
            FriendRequest.status == "accepted",
        ).first()

        if not friendship:
            return

        session = db.query(ChatUnlockSession).filter(
            (
                (ChatUnlockSession.user1_id == u1.id) & (ChatUnlockSession.user2_id == u2.id)
            ) | (
                (ChatUnlockSession.user1_id == u2.id) & (ChatUnlockSession.user2_id == u1.id)
            )
        ).first()

        if session:
            is_valid = session.check_and_update_expiry() if hasattr(session, "check_and_update_expiry") else getattr(session, "is_unlocked", False)
            if is_valid:
                game.chat_unlocked = True
                game.chat_unlock_reason = getattr(session, "unlock_reason", None)
                if getattr(session, "expires_at", None):
                    exp = session.expires_at
                    game.chat_expires_at = exp.isoformat() if hasattr(exp, "isoformat") else str(exp)
                else:
                    game.chat_expires_at = None
            else:
                game.chat_unlocked = False
            if hasattr(session, "unlock_count") and session.unlock_count:
                game.chat_unlock_count = max(getattr(game, "chat_unlock_count", 0), session.unlock_count)

    def _restore_secret_chat_states_batch(self, games: List[Game], db: Session = None):
        if not db or not games:
            return

        usernames = set()
        for g in games:
            p1 = getattr(g, "player1", None)
            p2 = getattr(g, "player2", None)
            if p1:
                usernames.add(p1)
            if p2:
                usernames.add(p2)

        users = db.query(User).filter(User.username.in_(usernames)).all()
        user_by_name = {u.username: u for u in users}
        user_ids = [u.id for u in users]

        friendships = db.query(FriendRequest).filter(
            FriendRequest.sender_id.in_(user_ids),
            FriendRequest.receiver_id.in_(user_ids),
            FriendRequest.status == "accepted",
        ).all()

        friend_pairs = set()
        for f in friendships:
            friend_pairs.add((f.sender_id, f.receiver_id))
            friend_pairs.add((f.receiver_id, f.sender_id))

        sessions = db.query(ChatUnlockSession).filter(
            ChatUnlockSession.user1_id.in_(user_ids),
            ChatUnlockSession.user2_id.in_(user_ids),
        ).all()

        session_map = {}
        for s in sessions:
            session_map[(s.user1_id, s.user2_id)] = s
            session_map[(s.user2_id, s.user1_id)] = s

        for g in games:
            u1 = user_by_name.get(getattr(g, "player1", None))
            u2 = user_by_name.get(getattr(g, "player2", None))
            if not u1 or not u2:
                continue

            if (u1.id, u2.id) not in friend_pairs:
                continue

            session = session_map.get((u1.id, u2.id))
            if session:
                is_valid = session.check_and_update_expiry() if hasattr(session, "check_and_update_expiry") else getattr(session, "is_unlocked", False)
                if is_valid:
                    g.chat_unlocked = True
                    g.chat_unlock_reason = getattr(session, "unlock_reason", None)
                    if getattr(session, "expires_at", None):
                        exp = session.expires_at
                        g.chat_expires_at = exp.isoformat() if hasattr(exp, "isoformat") else str(exp)
                    else:
                        g.chat_expires_at = None
                else:
                    g.chat_unlocked = False
                if hasattr(session, "unlock_count") and session.unlock_count:
                    g.chat_unlock_count = max(getattr(g, "chat_unlock_count", 0), session.unlock_count)

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
        db_game.chat_unlocked = getattr(game, "chat_unlocked", False)
        db_game.chat_unlock_count = getattr(game, "chat_unlock_count", 0)
        db_game.chat_expires_at = getattr(game, "chat_expires_at", None)
        db_game.chat_unlock_reason = getattr(game, "chat_unlock_reason", None)
        db_game.round1_unlock_ply = getattr(game, "round1_unlock_ply", None)
        db_game.round2_window_start_ply = getattr(game, "round2_window_start_ply", None)

        db.commit()

    def get_all_games(
        self,
        db: Session = None,
    ):
        if db:
            db_games = db.query(GameDB).all()

            result = []

            for db_game in db_games:
                game = self.get_game(
                    db_game.game_id,
                    db,
                )

                if game:
                    result.append(game)

            return result

        return list(self.games.values())

    def get_player_games(
        self,
        player: str,
        db: Session = None,
    ):
        games = self.get_all_games(db)

        return [
            game
            for game in games
            if game.player1 == player
            or game.player2 == player
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

        success, message = game.make_move(
            from_square,
            to_square,
        )

        if not success:
            return None, message

        if db:
            self.save_game(game, db)

        return game, message

    def play_computer_move(
        self,
        game_id: str,
        difficulty: str = "easy",
        db: Session = None,
    ):
        game = self.get_game(game_id, db)

        if game is None:
            return None, "Game not found"

        if game.status == "completed":
            return None, "Game is already completed"

        computer_move = ChessEngine.get_computer_move(
            game.board,
            difficulty,
        )

        if computer_move is None:
            return None, "No legal computer move available"

        is_capture = game.board.is_capture(computer_move)
        captured_symbol = None
        if is_capture:
            if game.board.is_en_passant(computer_move):
                captured_symbol = "p"
            else:
                tp = game.board.piece_at(computer_move.to_square)
                captured_symbol = tp.symbol().lower() if tp else "p"

            from datetime import datetime, UTC, timedelta
            now_utc = datetime.now(UTC)
            is_active = False
            if game.chat_unlocked and game.chat_expires_at:
                try:
                    exp = datetime.fromisoformat(game.chat_expires_at.replace("Z", "+00:00"))
                    if exp > now_utc:
                        is_active = True
                    else:
                        game.chat_unlocked = False
                except Exception:
                    game.chat_unlocked = False

            cur_ply = len(game.moves) + 1
            can_unlock = False
            reason = None

            if getattr(game, "chat_unlock_count", 0) == 0:
                if game.board.fullmove_number <= 5 or cur_ply <= 10:
                    can_unlock = True
                    game.chat_unlock_count = 1
                    game.round1_unlock_ply = cur_ply
                    reason = f"Computer captured opponent piece ({captured_symbol.upper()}) on move {game.board.fullmove_number} (Chat 1 of 2)"
            elif getattr(game, "chat_unlock_count", 0) == 1 and not is_active:
                if getattr(game, "round2_window_start_ply", None) is None:
                    game.round2_window_start_ply = cur_ply
                plies_in_window2 = cur_ply - game.round2_window_start_ply + 1
                if plies_in_window2 <= 10:
                    can_unlock = True
                    game.chat_unlock_count = 2
                    reason = f"Computer captured opponent piece ({captured_symbol.upper()}) in second 5-move window (Chat 2 of 2)"

            if can_unlock:
                game.chat_unlocked = True
                game.chat_unlock_reason = reason
                game.chat_expires_at = (now_utc + timedelta(minutes=5)).isoformat()

        game.board.push(computer_move)

        game.moves.append(computer_move.uci())

        game.move_history.append({
            "move_number": game.board.fullmove_number,
            "player": game.player2,
            "from_square": chess_square_name(
                computer_move.from_square
            ),
            "to_square": chess_square_name(
                computer_move.to_square
            ),
            "move": computer_move.uci(),
            "captured": captured_symbol,
            "fen": game.board.fen(),
        })

        if game.board.is_game_over():
            game.status = "completed"
            if game.board.is_checkmate():
                game.result = "checkmate"
                game.winner = game.player2 if game.board.turn == chess.WHITE else game.player1
            elif game.board.is_stalemate():
                game.result = "stalemate"
                game.winner = None
            else:
                game.result = game.board.result()

        if db:
            self.save_game(game, db)

        return game, computer_move.uci()

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

        success, message = game.make_move(
            from_square,
            to_square,
        )

        if not success:
            return None, message

        if game.status == "completed":
            if db:
                self.save_game(game, db)

            return game, {
                "player_move": from_square + to_square,
                "computer_move": None,
            }

        computer_move = ChessEngine.get_computer_move(
            game.board,
            difficulty,
        )

        if computer_move is None:
            if db:
                self.save_game(game, db)

            return game, {
                "player_move": from_square + to_square,
                "computer_move": None,
            }

        game.board.push(computer_move)
        game.moves.append(computer_move.uci())

        if game.board.is_game_over():
            game.status = "completed"
            game.result = game.board.result()

        if db:
            self.save_game(game, db)

        return game, {
            "player_move": from_square + to_square,
            "computer_move": computer_move.uci(),
        }

    def get_history(
        self,
        game_id: str,
        db: Session = None,
    ):
        game = self.get_game(game_id, db)

        if game is None:
            return None

        return game.move_history

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

        game.status = "waiting"
        game.result = None
        game.winner = None

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

        if game_id in self.games:
            del self.games[game_id]

        return True


def chess_square_name(square_index: int) -> str:
    files = "abcdefgh"

    file_name = files[
        chess.square_file(square_index)
    ]

    rank_name = str(
        chess.square_rank(square_index) + 1
    )

    return file_name + rank_name


game_service = GameService()