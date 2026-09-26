import uuid

from app.services.chess_engine import ChessEngine


class GameService:
    def __init__(self):
        self.games = {}

    def create_game(self, player_name: str):
        game_id = str(uuid.uuid4())

        game = {
            "game_id": game_id,
            "player_name": player_name,
            "engine": ChessEngine()
        }

        self.games[game_id] = game

        return game

    def get_game(self, game_id: str):
        return self.games.get(game_id)

    def make_move(self, game_id: str, move: str):
        game = self.get_game(game_id)

        if game is None:
            return {
                "success": False,
                "message": "Game not found."
            }

        result = game["engine"].make_move(move)

        return result

    def reset_game(self, game_id: str):
        game = self.get_game(game_id)

        if game is None:
            return {
                "success": False,
                "message": "Game not found."
            }

        return game["engine"].reset()


game_service = GameService()