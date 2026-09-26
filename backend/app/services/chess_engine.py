import chess


class ChessEngine:
    def __init__(self):
        self.board = chess.Board()

    def get_fen(self):
        return self.board.fen()

    def get_turn(self):
        return "white" if self.board.turn == chess.WHITE else "black"

    def is_game_over(self):
        return self.board.is_game_over()

    def make_move(self, move_text: str):
        try:
            move = chess.Move.from_uci(move_text)
        except ValueError:
            return {
                "success": False,
                "message": "Invalid move format. Use format like e2e4."
            }

        if move not in self.board.legal_moves:
            return {
                "success": False,
                "message": "Illegal chess move."
            }

        self.board.push(move)

        return {
            "success": True,
            "message": "Move accepted.",
            "move": move_text,
            "fen": self.get_fen(),
            "turn": self.get_turn(),
            "game_over": self.is_game_over()
        }

    def reset(self):
        self.board.reset()

        return {
            "success": True,
            "message": "Game reset.",
            "fen": self.get_fen(),
            "turn": self.get_turn(),
            "game_over": self.is_game_over()
        }