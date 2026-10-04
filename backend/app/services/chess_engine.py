import random

import chess


class ChessEngine:

    @staticmethod
    def get_legal_moves(board: chess.Board):
        return list(board.legal_moves)

    @staticmethod
    def easy_move(board: chess.Board):
        legal_moves = ChessEngine.get_legal_moves(board)

        if not legal_moves:
            return None

        return random.choice(legal_moves)

    @staticmethod
    def medium_move(board: chess.Board):
        legal_moves = ChessEngine.get_legal_moves(board)

        if not legal_moves:
            return None

        capture_moves = [
            move
            for move in legal_moves
            if board.is_capture(move)
        ]

        if capture_moves:
            return random.choice(capture_moves)

        return random.choice(legal_moves)

    @staticmethod
    def evaluate_board(board: chess.Board):
        piece_values = {
            chess.PAWN: 1,
            chess.KNIGHT: 3,
            chess.BISHOP: 3,
            chess.ROOK: 5,
            chess.QUEEN: 9,
            chess.KING: 100,
        }

        score = 0

        for piece_type, value in piece_values.items():
            score += (
                len(board.pieces(piece_type, chess.WHITE))
                * value
            )

            score -= (
                len(board.pieces(piece_type, chess.BLACK))
                * value
            )

        return score

    @staticmethod
    def hard_move(board: chess.Board):
        legal_moves = ChessEngine.get_legal_moves(board)

        if not legal_moves:
            return None

        best_move = None

        if board.turn == chess.WHITE:
            best_score = float("-inf")

            for move in legal_moves:
                board.push(move)

                score = ChessEngine.evaluate_board(board)

                board.pop()

                if score > best_score:
                    best_score = score
                    best_move = move

        else:
            best_score = float("inf")

            for move in legal_moves:
                board.push(move)

                score = ChessEngine.evaluate_board(board)

                board.pop()

                if score < best_score:
                    best_score = score
                    best_move = move

        return best_move

    @staticmethod
    def get_computer_move(
        board: chess.Board,
        difficulty: str = "easy",
    ):
        difficulty = difficulty.lower()

        if difficulty == "easy":
            return ChessEngine.easy_move(board)

        if difficulty == "medium":
            return ChessEngine.medium_move(board)

        if difficulty == "hard":
            return ChessEngine.hard_move(board)

        raise ValueError(
            "Difficulty must be easy, medium, or hard"
        )