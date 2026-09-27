import uuid
from typing import Dict

from app.models.game import Game
from app.services.chess_engine import ChessEngine


class GameService:
    def __init__(self):
        self.games: Dict[str, Game] = {}

    def create_game(
        self,
        player1: str = "player1",
        player2: str = "player2",
    ) -> Game:
        game_id = str(uuid.uuid4())

        game = Game(
            game_id=game_id,
            player1=player1,
            player2=player2,
        )

        self.games[game_id] = game

        return game

    def get_game(self, game_id: str) -> Game | None:
        return self.games.get(game_id)

    def get_all_games(self):
        return list(self.games.values())

    def get_player_games(self, player: str):
        return [
            game
            for game in self.games.values()
            if game.player1 == player or game.player2 == player
        ]

    def make_move(
        self,
        game_id: str,
        from_square: str,
        to_square: str,
    ):
        game = self.get_game(game_id)

        if game is None:
            return None, "Game not found"

        success, message = game.make_move(
            from_square,
            to_square,
        )

        if not success:
            return None, message

        return game, message

    def play_computer_move(
        self,
        game_id: str,
        difficulty: str = "easy",
    ):
        game = self.get_game(game_id)

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
            "from_square": chess_square_name(computer_move.from_square),
            "to_square": chess_square_name(computer_move.to_square),
            "move": computer_move.uci(),
            "fen": game.board.fen(),
        })

        if game.board.is_game_over():
            game.status = "completed"
            game.result = game.board.result()

        return game, computer_move.uci()

    def make_player_move_with_computer(
        self,
        game_id: str,
        from_square: str,
        to_square: str,
        difficulty: str = "easy",
    ):
        game = self.get_game(game_id)

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
            return game, {
                "player_move": from_square + to_square,
                "computer_move": None,
            }

        computer_move = ChessEngine.get_computer_move(
            game.board,
            difficulty,
        )

        if computer_move is None:
            return game, {
                "player_move": from_square + to_square,
                "computer_move": None,
            }

        game.board.push(computer_move)
        game.moves.append(computer_move.uci())

        if game.board.is_game_over():
            game.status = "completed"
            game.result = game.board.result()

        return game, {
            "player_move": from_square + to_square,
            "computer_move": computer_move.uci(),
        }

    def get_history(self, game_id: str):
        game = self.get_game(game_id)

        if game is None:
            return None

        return game.move_history

    def reset_game(self, game_id: str):
        game = self.get_game(game_id)

        if game is None:
            return None, "Game not found"

        game.board.reset()
        game.moves.clear()
        game.move_history.clear()
        game.status = "waiting"
        game.result = None
        game.winner = None

        return game, "Game reset successfully"

    def delete_game(self, game_id: str):
        if game_id not in self.games:
            return False

        del self.games[game_id]

        return True


def chess_square_name(square_index: int) -> str:
    files = "abcdefgh"
    file_name = files[chess.square_file(square_index)]
    rank_name = str(chess.square_rank(square_index) + 1)

    return file_name + rank_name


game_service = GameService()
