import random
import chess

# Piece base values in centipawns
PIECE_VALUES = {
    chess.PAWN: 100,
    chess.KNIGHT: 320,
    chess.BISHOP: 330,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 20000,
}

# Piece-Square Tables (PST) from White's perspective (a8..h8 down to a1..h1)
PAWN_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
]

KNIGHT_TABLE = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
]

BISHOP_TABLE = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
]

ROOK_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
]

QUEEN_TABLE = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
]

KING_TABLE = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20
]

PST_MAP = {
    chess.PAWN: PAWN_TABLE,
    chess.KNIGHT: KNIGHT_TABLE,
    chess.BISHOP: BISHOP_TABLE,
    chess.ROOK: ROOK_TABLE,
    chess.QUEEN: QUEEN_TABLE,
    chess.KING: KING_TABLE,
}


class ChessEngine:

    @staticmethod
    def get_legal_moves(board: chess.Board):
        return list(board.legal_moves)

    @staticmethod
    def evaluate_board(board: chess.Board) -> int:
        """Calculates static evaluation score from White's perspective (+ White leads, - Black leads)."""
        if board.is_checkmate():
            return -99999 if board.turn == chess.WHITE else 99999
        if board.is_stalemate() or board.is_insufficient_material():
            return 0

        score = 0
        for sq in chess.SQUARES:
            piece = board.piece_at(sq)
            if not piece:
                continue

            val = PIECE_VALUES.get(piece.piece_type, 0)
            pst = PST_MAP.get(piece.piece_type)
            if pst:
                idx = 63 - sq if piece.color == chess.WHITE else sq
                pos_val = pst[idx]
            else:
                pos_val = 0

            piece_score = val + pos_val
            if piece.color == chess.WHITE:
                score += piece_score
            else:
                score -= piece_score

        if board.is_check():
            score += -40 if board.turn == chess.WHITE else 40

        return score

    @staticmethod
    def order_moves(board: chess.Board, moves):
        """Orders moves to prioritize captures and checks for faster alpha-beta pruning."""
        def move_score(move: chess.Move):
            score = 0
            if board.is_capture(move):
                target = board.piece_at(move.to_square)
                attacker = board.piece_at(move.from_square)
                victim_val = PIECE_VALUES.get(target.piece_type, 100) if target else 100
                attacker_val = PIECE_VALUES.get(attacker.piece_type, 100) if attacker else 100
                score += victim_val * 10 - attacker_val
            if move.promotion:
                score += 800
            return score

        return sorted(moves, key=move_score, reverse=True)

    @staticmethod
    def minimax(board: chess.Board, depth: int, alpha: float, beta: float, is_maximizing: bool) -> int:
        if depth == 0 or board.is_game_over():
            return ChessEngine.evaluate_board(board)

        legal_moves = ChessEngine.order_moves(board, list(board.legal_moves))
        if not legal_moves:
            return ChessEngine.evaluate_board(board)

        if is_maximizing:
            max_eval = float("-inf")
            for move in legal_moves:
                board.push(move)
                eval_val = ChessEngine.minimax(board, depth - 1, alpha, beta, False)
                board.pop()
                max_eval = max(max_eval, eval_val)
                alpha = max(alpha, eval_val)
                if beta <= alpha:
                    break
            return int(max_eval)
        else:
            min_eval = float("inf")
            for move in legal_moves:
                board.push(move)
                eval_val = ChessEngine.minimax(board, depth - 1, alpha, beta, True)
                board.pop()
                min_eval = min(min_eval, eval_val)
                beta = min(beta, eval_val)
                if beta <= alpha:
                    break
            return int(min_eval)

    @staticmethod
    def easy_move(board: chess.Board):
        """Beginner level (~1000 Elo): Occasional tactical moves with small blunder chance."""
        legal_moves = ChessEngine.get_legal_moves(board)
        if not legal_moves:
            return None

        # 40% chance of random move to keep it accessible for beginners
        if random.random() < 0.4:
            return random.choice(legal_moves)

        # 1-ply evaluation
        is_white = board.turn == chess.WHITE
        best_score = float("-inf") if is_white else float("inf")
        best_move = legal_moves[0]

        for move in legal_moves:
            board.push(move)
            score = ChessEngine.evaluate_board(board)
            board.pop()
            if is_white and score > best_score:
                best_score = score
                best_move = move
            elif not is_white and score < best_score:
                best_score = score
                best_move = move

        return best_move

    @staticmethod
    def medium_move(board: chess.Board):
        """Intermediate level (~1600 Elo): Depth 2 Minimax with Alpha-Beta pruning & position heuristics."""
        legal_moves = ChessEngine.order_moves(board, ChessEngine.get_legal_moves(board))
        if not legal_moves:
            return None

        is_white = board.turn == chess.WHITE
        best_score = float("-inf") if is_white else float("inf")
        best_move = legal_moves[0]
        depth = 2

        for move in legal_moves:
            board.push(move)
            if board.is_checkmate():
                board.pop()
                return move
            score = ChessEngine.minimax(board, depth - 1, float("-inf"), float("inf"), not is_white)
            board.pop()

            if is_white and score > best_score:
                best_score = score
                best_move = move
            elif not is_white and score < best_score:
                best_score = score
                best_move = move

        return best_move

    @staticmethod
    def hard_move(board: chess.Board):
        """Master level (~2200 Elo): Depth 3 Minimax with Alpha-Beta pruning, aggressive center control & attack."""
        legal_moves = ChessEngine.order_moves(board, ChessEngine.get_legal_moves(board))
        if not legal_moves:
            return None

        is_white = board.turn == chess.WHITE
        best_score = float("-inf") if is_white else float("inf")
        best_move = legal_moves[0]
        depth = 3

        for move in legal_moves:
            board.push(move)
            if board.is_checkmate():
                board.pop()
                return move
            score = ChessEngine.minimax(board, depth - 1, float("-inf"), float("inf"), not is_white)
            board.pop()

            if is_white and score > best_score:
                best_score = score
                best_move = move
            elif not is_white and score < best_score:
                best_score = score
                best_move = move

        return best_move

    @staticmethod
    def get_computer_move(
        board: chess.Board,
        difficulty: str = "intermediate",
    ):
        diff = difficulty.lower().strip()

        if diff in ["easy", "beginner"]:
            return ChessEngine.easy_move(board)

        if diff in ["medium", "intermediate"]:
            return ChessEngine.medium_move(board)

        if diff in ["hard", "master"]:
            return ChessEngine.hard_move(board)

        return ChessEngine.medium_move(board)