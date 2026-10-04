import json
import uuid
from typing import Dict

import chess
from sqlalchemy.orm import Session

from app.models.game import Game, GameDB
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

    def get_game(
        self,
        game_id: str,
        db: Session = None,
    ) -> Game | None:

        if game_id in self.games:
            return self.games[game_id]

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

                self.games[game_id] = game

                return game

        return None

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
            "fen": game.board.fen(),
        })

        if game.board.is_game_over():
            game.status = "completed"
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