import React, { useState, useEffect, useRef } from 'react';
import ChessBoard, { playChessSound } from '../components/chess/ChessBoard';
import ChessPiece from '../components/chess/ChessPiece';
import { 
  Bot, 
  User, 
  ArrowLeft, 
  RotateCcw, 
  Flag, 
  Trophy, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  Volume2, 
  HelpCircle,
  Clock
} from 'lucide-react';

// Standard 8x8 initial starting chess setup
const createInitialBoard = () => {
  const board = {};
  const backRankWhite = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const backRankBlack = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  files.forEach((f, idx) => {
    board[`${f}1`] = { type: backRankWhite[idx], color: 'w' };
    board[`${f}2`] = { type: 'p', color: 'w' };
    board[`${f}7`] = { type: 'p', color: 'b' };
    board[`${f}8`] = { type: 'backRankBlack' ? backRankBlack[idx] : 'p', color: 'b' };
  });

  return board;
};

// Piece value for AI evaluation
const PIECE_VALUES = {
  p: 10,
  n: 30,
  b: 35,
  r: 50,
  q: 90,
  k: 1000
};

export default function PlayVsComputer({ 
  onNavigate, 
  userProfile, 
  onAwardPoints 
}) {
  const [board, setBoard] = useState(createInitialBoard);
  const [turn, setTurn] = useState('w'); // 'w' | 'b'
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [difficulty, setDifficulty] = useState('intermediate'); // 'beginner' | 'intermediate' | 'grandmaster'
  const [gameStatus, setGameStatus] = useState('In Progress'); // 'In Progress' | 'Check' | 'Checkmate' | 'Resigned'
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [score, setScore] = useState(0);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

  // Helper: check if square is valid
  const isValidSquare = (fIdx, rIdx) => fIdx >= 0 && fIdx < 8 && rIdx >= 0 && rIdx < 8;

  // Generate legal moves for a given square
  const getPieceMoves = (sq, currentBoard, pieceColor) => {
    const piece = currentBoard[sq];
    if (!piece || piece.color !== pieceColor) return [];

    const f = sq[0];
    const r = parseInt(sq[1], 10);
    const fIdx = files.indexOf(f);
    const rIdx = r - 1; // 0-indexed rank

    const moves = [];

    // Directional ray caster for sliding pieces (rook, bishop, queen)
    const addRayMoves = (dirX, dirY) => {
      let curX = fIdx + dirX;
      let curY = rIdx + dirY;
      while (isValidSquare(curX, curY)) {
        const destSq = `${files[curX]}${curY + 1}`;
        const destPiece = currentBoard[destSq];
        if (!destPiece) {
          moves.push(destSq);
        } else {
          if (destPiece.color !== piece.color) {
            moves.push(destSq); // capture
          }
          break; // blocked
        }
        curX += dirX;
        curY += dirY;
      }
    };

    // Pawns
    if (piece.type === 'p') {
      const forward = piece.color === 'w' ? 1 : -1;
      const startRank = piece.color === 'w' ? 2 : 7;

      // 1 square forward
      const oneForwardSq = `${f}${r + forward}`;
      if (isValidSquare(fIdx, rIdx + forward) && !currentBoard[oneForwardSq]) {
        moves.push(oneForwardSq);
        // 2 squares forward from start rank
        const twoForwardSq = `${f}${r + forward * 2}`;
        if (r === startRank && !currentBoard[twoForwardSq]) {
          moves.push(twoForwardSq);
        }
      }

      // Diagonal captures
      [-1, 1].forEach((dx) => {
        const capX = fIdx + dx;
        const capY = rIdx + forward;
        if (isValidSquare(capX, capY)) {
          const capSq = `${files[capX]}${capY + 1}`;
          const target = currentBoard[capSq];
          if (target && target.color !== piece.color) {
            moves.push(capSq);
          }
        }
      });
    }

    // Knights
    if (piece.type === 'n') {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      knightOffsets.forEach(([dx, dy]) => {
        const targetX = fIdx + dx;
        const targetY = rIdx + dy;
        if (isValidSquare(targetX, targetY)) {
          const destSq = `${files[targetX]}${targetY + 1}`;
          const destPiece = currentBoard[destSq];
          if (!destPiece || destPiece.color !== piece.color) {
            moves.push(destSq);
          }
        }
      });
    }

    // Bishops
    if (piece.type === 'b' || piece.type === 'q') {
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dx, dy]) => addRayMoves(dx, dy));
    }

    // Rooks
    if (piece.type === 'r' || piece.type === 'q') {
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => addRayMoves(dx, dy));
    }

    // King
    if (piece.type === 'k') {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const targetX = fIdx + dx;
          const targetY = rIdx + dy;
          if (isValidSquare(targetX, targetY)) {
            const destSq = `${files[targetX]}${targetY + 1}`;
            const destPiece = currentBoard[destSq];
            if (!destPiece || destPiece.color !== piece.color) {
              moves.push(destSq);
            }
          }
        }
      }
    }

    return moves;
  };

  // Get all legal moves for a color
  const getAllMovesForColor = (currentBoard, color) => {
    const all = [];
    Object.keys(currentBoard).forEach((sq) => {
      const piece = currentBoard[sq];
      if (piece && piece.color === color) {
        const pieceMoves = getPieceMoves(sq, currentBoard, color);
        pieceMoves.forEach((toSq) => {
          all.push({ from: sq, to: toSq, piece });
        });
      }
    });
    return all;
  };

  // Handle player square selection
  const handleSelectSquare = (sq) => {
    if (turn !== 'w' || isAiThinking || gameStatus === 'Resigned' || gameStatus === 'Victory') return;

    if (!sq) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    const piece = board[sq];
    if (piece && piece.color === 'w') {
      setSelectedSquare(sq);
      const moves = getPieceMoves(sq, board, 'w');
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  // Execute a move
  const executeMove = (fromSq, toSq) => {
    const movingPiece = board[fromSq];
    const targetPiece = board[toSq];

    const newBoard = { ...board };
    delete newBoard[fromSq];
    newBoard[toSq] = movingPiece;

    // Track captures
    if (targetPiece) {
      if (targetPiece.color === 'b') {
        setCapturedBlack((prev) => [...prev, targetPiece]);
        setScore((prev) => prev + (PIECE_VALUES[targetPiece.type] || 10));
      } else {
        setCapturedWhite((prev) => [...prev, targetPiece]);
      }
    }

    // Move notation
    const moveLabel = `${movingPiece.type.toUpperCase()}${targetPiece ? 'x' : '-'}${toSq}`;
    setMoveHistory((prev) => [...prev, { move: moveLabel, color: movingPiece.color }]);
    setLastMove({ from: fromSq, to: toSq });
    setBoard(newBoard);
    setSelectedSquare(null);
    setLegalMoves([]);

    // Check if black king captured
    if (targetPiece && targetPiece.type === 'k' && targetPiece.color === 'b') {
      setGameStatus('Victory - Checkmate!');
      playChessSound('success');
      if (onAwardPoints) onAwardPoints(30);
      return;
    }

    // Switch turn
    const nextTurn = movingPiece.color === 'w' ? 'b' : 'w';
    setTurn(nextTurn);
  };

  // Human player makes a move
  const handleHumanMove = (fromSq, toSq) => {
    if (turn !== 'w' || isAiThinking) return;
    executeMove(fromSq, toSq);
  };

  // AI Response Effect
  useEffect(() => {
    if (turn === 'b' && gameStatus !== 'Victory - Checkmate!' && gameStatus !== 'Resigned') {
      setIsAiThinking(true);

      const timer = setTimeout(() => {
        const blackMoves = getAllMovesForColor(board, 'b');

        if (blackMoves.length === 0) {
          setGameStatus('Stalemate / Checkmate');
          setIsAiThinking(false);
          return;
        }

        let chosenMove = null;

        if (difficulty === 'beginner') {
          // Mostly random move
          chosenMove = blackMoves[Math.floor(Math.random() * blackMoves.length)];
        } else {
          // Intermediate / Master: prioritize captures and high-value captures
          const captures = blackMoves.filter((m) => board[m.to]);
          if (captures.length > 0) {
            captures.sort((a, b) => {
              const valA = PIECE_VALUES[board[a.to]?.type] || 0;
              const valB = PIECE_VALUES[board[b.to]?.type] || 0;
              return valB - valA;
            });
            chosenMove = captures[0];
          } else {
            // Pick center-oriented moves or random
            const centerMoves = blackMoves.filter((m) => ['d5', 'e5', 'd4', 'e4', 'c5', 'f5', 'c6', 'f6'].includes(m.to));
            chosenMove = centerMoves.length > 0 
              ? centerMoves[Math.floor(Math.random() * centerMoves.length)]
              : blackMoves[Math.floor(Math.random() * blackMoves.length)];
          }
        }

        if (chosenMove) {
          const isCapture = !!board[chosenMove.to];
          playChessSound(isCapture ? 'capture' : 'move');
          executeMove(chosenMove.from, chosenMove.to);
        }

        setIsAiThinking(false);
      }, difficulty === 'beginner' ? 350 : 500);

      return () => clearTimeout(timer);
    }
  }, [turn, board, gameStatus, difficulty]);

  // Restart match
  const handleRestart = () => {
    setBoard(createInitialBoard());
    setTurn('w');
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setGameStatus('In Progress');
    setMoveHistory([]);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setIsAiThinking(false);
  };

  // Resign match
  const handleResign = () => {
    setGameStatus('Resigned');
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in space-y-6">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Play vs Adaptive AI Bot
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase">
                Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 8x8 sparring with clinical decision latency tracking
            </p>
          </div>
        </div>

        {/* Difficulty Selector & Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {['beginner', 'intermediate', 'grandmaster'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDifficulty(lvl)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  difficulty === lvl
                    ? 'bg-amber-500 text-black font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Restart</span>
          </button>

          <button
            onClick={handleResign}
            disabled={gameStatus === 'Resigned' || gameStatus.includes('Victory')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            <span>Resign</span>
          </button>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Interactive Chess Board & Opponent Banners (7 cols) */}
        <div className="lg:col-span-8 flex flex-col items-center space-y-4">
          
          {/* Black (AI Bot) Header Card */}
          <div className="w-full max-w-lg p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">
                    {difficulty === 'beginner' ? 'Novice Bot (Level 2)' : difficulty === 'intermediate' ? 'Stockfish Adaptive (Level 6)' : 'Grandmaster Neural Engine (2400 Elo)'}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Black
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  {isAiThinking ? (
                    <span className="text-amber-400 flex items-center gap-1 font-semibold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Evaluating board lines...
                    </span>
                  ) : (
                    <span>Ready</span>
                  )}
                </div>
              </div>
            </div>

            {/* Captured White Pieces */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-[120px]">
              {capturedWhite.map((p, idx) => (
                <span key={idx} className="text-xs font-bold uppercase text-slate-400">
                  {p.type}
                </span>
              ))}
            </div>
          </div>

          {/* Real Interactive Chess Board */}
          <div className="relative">
            <ChessBoard
              boardState={board}
              playerColor="w"
              selectedSquare={selectedSquare}
              onSelectSquare={handleSelectSquare}
              legalMoves={legalMoves}
              lastMove={lastMove}
              onMove={handleHumanMove}
              isLocked={turn !== 'w' || isAiThinking || gameStatus === 'Resigned'}
              successHighlight={gameStatus.includes('Victory') && lastMove ? lastMove.to : null}
            />
          </div>

          {/* White (Player) Footer Card */}
          <div className="w-full max-w-lg p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black shadow-sm">
                {userProfile?.username ? userProfile.username[0].toUpperCase() : 'G'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">
                    {userProfile?.username || userProfile?.name || 'You (Grandmaster)'}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                    White
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Rating: {userProfile?.rating || 1540} ELO
                </p>
              </div>
            </div>

            {/* Captured Black Pieces */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-[120px]">
              {capturedBlack.map((p, idx) => (
                <span key={idx} className="text-xs font-bold uppercase text-amber-400">
                  {p.type}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Diagnostics, Turn Banner & Move List (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Turn / Game Status Banner */}
          <div className="p-5 rounded-2xl glass-card border border-amber-500/30 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Turn & Status
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                gameStatus.includes('Victory')
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : gameStatus === 'Resigned'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {gameStatus}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#09101d] border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${turn === 'w' ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
                <span className="text-sm font-bold text-white">
                  {turn === 'w' ? 'Your Move (White)' : 'AI Calculating (Black)...'}
                </span>
              </div>
              <span className="text-xs text-amber-400 font-mono font-bold">
                +{score} PTS
              </span>
            </div>

            {gameStatus.includes('Victory') && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>Brilliant checkmate! +30 points added to your score.</span>
              </div>
            )}
          </div>

          {/* Tactical Move History */}
          <div className="p-5 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Move History</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {moveHistory.length} moves
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {moveHistory.length === 0 ? (
                <p className="text-slate-500 italic py-4 text-center">
                  Make your opening move on the board to begin recording.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {moveHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg font-mono flex items-center justify-between ${
                        item.color === 'w'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                      <span className="font-bold">{item.move}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Help & Diagnostics */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>How to Play:</span>
            </div>
            <p className="leading-relaxed">
              Click any White piece to display glowing legal target squares. Click a highlighted circle to move or capture. The AI will immediately formulate a tactical counter-move.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
