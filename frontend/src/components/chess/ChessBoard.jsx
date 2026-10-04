import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessPiece from './ChessPiece';
import { 
  RotateCcw, 
  RotateCw, 
  Lightbulb, 
  Undo2, 
  Swords, 
  User, 
  Bot, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Crown, 
  ChevronRight,
  Shield,
  HelpCircle,
  X,
  Trophy,
  Award,
  Flag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { playChessSound } from '../../utils/sound';
import api from '../../services/api';

export { playChessSound };

export default function ChessBoard({
  gameMode = 'computer', // 'computer' | 'two-player' | 'online'
  aiDifficulty = 'intermediate',
  initialPlayerColor = 'w', // 'w' (White) | 'b' (Black)
  player1Name,
  player2Name,
  onSecretMoveDetected,
  onGameOver,
  onNavigate,
}) {
  const { user, preferences } = useAuth();
  const showInstructions = preferences?.showInstructions ?? true;

  const [chess] = useState(() => new Chess());
  const [board, setBoard] = useState(chess.board());
  const [playerColor, setPlayerColor] = useState(initialPlayerColor); // User's chosen side: 'w' or 'b'
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [turn, setTurn] = useState('w');
  const [history, setHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState('In Progress');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [secretDiscovered, setSecretDiscovered] = useState(false);
  const [hintSquare, setHintSquare] = useState(null);
  const [hintCount, setHintCount] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSideModal, setShowSideModal] = useState(false);

  // Winner Game Over Modal State
  const [gameOverModal, setGameOverModal] = useState({
    isOpen: false,
    winner: null,
    winnerName: '',
    title: '',
    subtitle: '',
    method: 'Checkmate',
    isDraw: false,
    isUserWin: false,
    moves: 0,
  });

  const aiTimeoutRef = useRef(null);
  const prevGameModeRef = useRef(gameMode);
  const lastPlayerMoveRef = useRef(null);

  // Update board state & check game over conditions
  const refreshBoard = () => {
    setBoard(chess.board());
    setTurn(chess.turn());
    setHistory(chess.history());

    if (chess.isCheckmate()) {
      // The side whose turn it is has no legal moves and is in check -> the OTHER side won!
      const winningColor = chess.turn() === 'w' ? 'b' : 'w';
      const isWhiteWinner = winningColor === 'w';

      let winnerTitle = '';
      let winnerName = '';
      let winnerSubtitle = '';
      let isUserWin = false;

      if (gameMode === 'computer') {
        const userWon = winningColor === playerColor;
        const currentUserName = user?.username || user?.name || 'You';
        if (userWon) {
          winnerTitle = `${currentUserName.toUpperCase()} WINS!`;
          winnerName = currentUserName;
          winnerSubtitle = `Outstanding Checkmate! ${currentUserName} defeated Computer.`;
          isUserWin = true;
          try {
            confetti({ particleCount: 140, spread: 85, origin: { y: 0.55 } });
          } catch (e) {}
        } else {
          winnerTitle = 'COMPUTER WINS!';
          winnerName = 'Computer';
          winnerSubtitle = 'Checkmate! Computer won this game.';
          isUserWin = false;
        }
      } else {
        // Two-Player / Play vs Friends / Online
        const p1 = player1Name || user?.username || user?.name || 'Player 1 (White)';
        const p2 = player2Name || 'Player 2 (Black)';
        winnerName = isWhiteWinner ? p1 : p2;
        winnerTitle = `${winnerName.toUpperCase()} WINS!`;
        winnerSubtitle = `Checkmate! ${winnerName} claimed glorious victory.`;
        isUserWin = true;
        try {
          confetti({ particleCount: 140, spread: 85, origin: { y: 0.55 } });
        } catch (e) {}
      }

      setGameOverModal({
        isOpen: true,
        winner: winningColor,
        winnerName,
        title: winnerTitle,
        subtitle: winnerSubtitle,
        method: 'Checkmate',
        isDraw: false,
        isUserWin,
        moves: chess.history().length,
      });

      setGameStatus(`Checkmate! ${winnerName} Wins`);

      if (onGameOver) {
        onGameOver({
          result: isUserWin ? 'Won' : 'Lost',
          winnerName,
          method: 'Checkmate',
          moves: chess.history().length,
        });
      }
    } else if (chess.isDraw()) {
      setGameOverModal({
        isOpen: true,
        winner: 'draw',
        winnerName: 'Stalemate / Draw',
        title: 'GAME DRAWN!',
        subtitle: 'Neither side could deliver checkmate. Match drawn.',
        method: 'Stalemate',
        isDraw: true,
        isUserWin: false,
        moves: chess.history().length,
      });
      setGameStatus('Draw (Stalemate / 50-move rule)');
      if (onGameOver) {
        onGameOver({
          result: 'Draw',
          winnerName: 'Draw',
          method: 'Stalemate',
          moves: chess.history().length,
        });
      }
    } else if (chess.inCheck()) {
      setGameStatus('Check!');
    } else {
      setGameStatus('In Progress');
    }
  };

  // Resign match
  const handleResign = () => {
    if (chess.isGameOver()) return;

    let winnerTitle = '';
    let winnerName = '';
    let winnerSubtitle = '';
    let isUserWin = false;

    if (gameMode === 'computer') {
      const currentUserName = user?.username || user?.name || 'You';
      winnerTitle = 'COMPUTER WINS!';
      winnerName = 'Computer';
      winnerSubtitle = `${currentUserName} resigned. Computer won this game.`;
      isUserWin = false;
    } else {
      const opposingColor = chess.turn() === 'w' ? 'b' : 'w';
      const p1 = player1Name || user?.username || user?.name || 'Player 1 (White)';
      const p2 = player2Name || 'Player 2 (Black)';
      winnerName = opposingColor === 'w' ? p1 : p2;
      winnerTitle = `${winnerName.toUpperCase()} WINS!`;
      winnerSubtitle = `Opponent resigned the match.`;
      isUserWin = true;
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 } });
      } catch (e) {}
    }

    setGameOverModal({
      isOpen: true,
      winner: winnerName,
      winnerName,
      title: winnerTitle,
      subtitle: winnerSubtitle,
      method: 'Resignation',
      isDraw: false,
      isUserWin,
      moves: chess.history().length,
    });

    setGameStatus(`Resignation! ${winnerName} Wins`);

    if (onGameOver) {
      onGameOver({
        result: isUserWin ? 'Won' : 'Lost',
        winnerName,
        method: 'Resignation',
        moves: chess.history().length,
      });
    }
  };

  // AI Move logic - integrates with Backend Chess Engine with smooth fallback
  const makeAiMove = async (currentChess = chess) => {
    if (currentChess.isGameOver()) return;
    setIsAiThinking(true);

    let backendReplied = false;

    // 1. Attempt to query Backend Chess Engine (/api/move)
    if (lastPlayerMoveRef.current) {
      try {
        const { from, to } = lastPlayerMoveRef.current;
        const res = await api.makeEngineMove({ from_square: from, to_square: to });
        if (res && res.computer_move && typeof res.computer_move === 'string' && res.computer_move.length >= 4) {
          const cFrom = res.computer_move.slice(0, 2);
          const cTo = res.computer_move.slice(2, 4);
          const cPromotion = res.computer_move.length > 4 ? res.computer_move[4] : 'q';
          const moveRes = currentChess.move({ from: cFrom, to: cTo, promotion: cPromotion });
          if (moveRes) {
            backendReplied = true;
            setLastMove({ from: moveRes.from, to: moveRes.to });
            if (soundEnabled) playChessSound(moveRes.captured ? 'capture' : 'move');
            refreshBoard();
            setIsAiThinking(false);
            return;
          }
        }
      } catch (err) {
        // Fallback to local evaluation smoothly
      }
    }

    // 2. Local AI fallback (instant & reliable)
    if (!backendReplied) {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = setTimeout(() => {
        const moves = currentChess.moves({ verbose: true });
        if (moves.length === 0) {
          setIsAiThinking(false);
          return;
        }

        let chosenMove = moves[Math.floor(Math.random() * moves.length)];
        if (aiDifficulty === 'intermediate' || aiDifficulty === 'master') {
          const captures = moves.filter((m) => m.captured || m.san.includes('+'));
          if (captures.length > 0) {
            chosenMove = captures[Math.floor(Math.random() * captures.length)];
          }
        }

        const moveRes = currentChess.move(chosenMove);
        if (moveRes) {
          setLastMove({ from: moveRes.from, to: moveRes.to });
          if (soundEnabled) playChessSound(moveRes.captured ? 'capture' : 'move');
        }
        refreshBoard();
        setIsAiThinking(false);
      }, 500);
    }
  };

  // Reset Game with specific side
  const resetGame = (newSide = playerColor) => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
    chess.reset();
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setHintSquare(null);
    setIsAiThinking(false);
    setSecretDiscovered(false);
    setGameOverModal((prev) => ({ ...prev, isOpen: false }));
    setPlayerColor(newSide);
    refreshBoard();

    // If user selects Black in vs Computer mode, Computer (White) moves first!
    if (gameMode === 'computer' && newSide === 'b') {
      makeAiMove(chess);
    }
  };

  // Switch Side handler
  const handleSelectSide = (side) => {
    setShowSideModal(false);
    if (side !== playerColor || chess.history().length > 0) {
      resetGame(side);
    }
  };

  // Flip board view orientation
  const handleFlipBoard = () => {
    setPlayerColor((prev) => (prev === 'w' ? 'b' : 'w'));
  };

  // Whenever gameMode changes, reset cleanly
  useEffect(() => {
    if (prevGameModeRef.current !== gameMode) {
      prevGameModeRef.current = gameMode;
      resetGame(playerColor);
    }
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [gameMode]);

  // Undo Move
  const handleUndo = () => {
    if (chess.isGameOver() || isAiThinking) return;
    if (gameMode === 'computer') {
      // Undo both AI move and player move
      chess.undo();
      chess.undo();
    } else {
      chess.undo();
    }
    setSelectedSquare(null);
    setLegalMoves([]);
    setHintSquare(null);
    refreshBoard();
  };

  // Hint generator
  const handleGetHint = () => {
    if (chess.isGameOver() || isAiThinking) return;
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return;

    // Pick top capture or random high-quality move
    const captureMoves = moves.filter((m) => m.captured);
    const recommended = captureMoves.length > 0 ? captureMoves[0] : moves[0];

    setHintSquare({ from: recommended.from, to: recommended.to });
    setHintCount((prev) => Math.max(0, prev - 1));

    // Clear hint after 4 seconds
    setTimeout(() => {
      setHintSquare(null);
    }, 4000);
  };

  // Handle Square Click
  const handleSquareClick = (squareNotation) => {
    // If computer mode and it's not the player's turn, ignore
    if (gameMode === 'computer' && chess.turn() !== playerColor) return;
    if (chess.isGameOver() || isAiThinking) return;

    // If square already selected, attempt move
    if (selectedSquare) {
      if (selectedSquare === squareNotation) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      try {
        const move = chess.move({
          from: selectedSquare,
          to: squareNotation,
          promotion: 'q',
        });

        if (move) {
          if (soundEnabled) playChessSound(move.captured ? 'capture' : 'move');
          setLastMove({ from: move.from, to: move.to });
          setHintSquare(null);
          lastPlayerMoveRef.current = { from: move.from, to: move.to };

          // Secret Move Easter Egg: Knight moves to f3/c3 or f6/c6
          if (!secretDiscovered && move.piece === 'n') {
            if (['f3', 'c3', 'f6', 'c6'].includes(move.to)) {
              setSecretDiscovered(true);
              confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
              if (onSecretMoveDetected) onSecretMoveDetected(move);
            }
          }

          setSelectedSquare(null);
          setLegalMoves([]);
          refreshBoard();

          // If playing vs computer and game not over, trigger AI reply
          if (gameMode === 'computer' && !chess.isGameOver()) {
            makeAiMove();
          }
          return;
        }
      } catch (e) {
        // Illegal move attempt, fall through to re-select
      }
    }

    // Select piece
    const piece = chess.get(squareNotation);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(squareNotation);
      const moves = chess.moves({ square: squareNotation, verbose: true });
      setLegalMoves(moves.map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  // Ranks & Files depending on board orientation (White or Black)
  const isFlipped = playerColor === 'b';
  const ranks = isFlipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 py-4">
      {/* ================= MAIN CHESS ARENA (Matches Image 2) ================= */}
      <div className="flex flex-col items-center">
        
        {/* Top Header / Opponent Info Bar (Matches Image 2 top bar) */}
        <div className="w-full max-w-[500px] sm:max-w-[540px] md:max-w-[580px] mb-3 flex items-center justify-between px-3 py-2.5 rounded-2xl bg-gradient-to-r from-[#172033] via-[#0f172a] to-[#172033] border border-[#d4af37]/40 shadow-lg">
          {/* Left: Opponent Avatar & Level */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#1e293b] border-2 border-amber-400/90 flex items-center justify-center text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)] overflow-hidden">
                {gameMode === 'computer' ? (
                  <Bot className="w-5 h-5 text-amber-400" />
                ) : (
                  <User className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0f172a]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider uppercase font-bold text-amber-400 font-mono">
                  {gameMode === 'computer' ? `LEVEL 6 · ${aiDifficulty.toUpperCase()}` : 'ONLINE PLAYER'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                {gameMode === 'computer' ? 'Computer' : (player2Name || 'Challenger_Pro')}
              </p>
            </div>
          </div>

          {/* Right: Opponent Side Badge & AI Thinking state */}
          <div className="flex items-center gap-2.5">
            {isAiThinking ? (
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 animate-pulse bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Thinking...
              </span>
            ) : (
              <span className="text-[11px] text-slate-300 font-medium px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${playerColor === 'w' ? 'bg-slate-900 border border-slate-600' : 'bg-amber-100'}`} />
                {playerColor === 'w' ? 'Black (Opponent)' : 'White (Opponent)'}
              </span>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dynamic Instruction & Move Guidance Bar (Controlled via Settings: With Instruction / Without Instruction) */}
        {showInstructions && (
          <div className="w-full max-w-[500px] sm:max-w-[540px] md:max-w-[580px] mb-2.5 px-3.5 py-2 rounded-2xl bg-[#0f172a]/95 border border-amber-500/40 text-xs shadow-md animate-fade-in flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 text-slate-200 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <p className="text-[11px] leading-tight truncate sm:whitespace-normal">
                {chess.inCheck() ? (
                  <span className="text-rose-400 font-bold">
                    ⚠️ INSTRUCTION: Your King is in Check! Protect or move your King to safety.
                  </span>
                ) : selectedSquare ? (
                  <span>
                    <strong className="text-amber-300">Selected [{selectedSquare.toUpperCase()}]:</strong> Click any green circle to make a legal move, or click the piece again to cancel.
                  </span>
                ) : turn === playerColor ? (
                  <span>
                    <strong className="text-amber-300">Your Turn:</strong> Click any of your pieces to see highlighted legal moves.
                  </span>
                ) : (
                  <span>
                    <strong className="text-slate-400">Opponent's Turn:</strong> Waiting for opponent to complete their move...
                  </span>
                )}
              </p>
            </div>
            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap flex-shrink-0">
              With Instructions
            </span>
          </div>
        )}

        {/* ================= 8x8 REALISTIC WOODEN / MARBLE CHESSBOARD ================= */}
        <div className="relative p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-br from-[#3b2314] via-[#23150c] to-[#120a06] border-[3px] border-[#8a5d3b] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.2)]">
          {/* Coordinates Top File Labels */}
          <div className="flex justify-between px-3 sm:px-4 pb-1 text-[10px] font-bold text-[#c9a785] tracking-widest font-mono">
            {files.map((f) => (
              <span key={`top-${f}`} className="w-11 sm:w-14 md:w-16 text-center">{f}</span>
            ))}
          </div>

          <div className="relative rounded-lg overflow-hidden border-2 border-[#1c120c] shadow-inner">
            {ranks.map((rank) => (
              <div key={rank} className="flex">
                {files.map((file) => {
                  const square = `${file}${rank}`;
                  const colIdx = file.charCodeAt(0) - 97;
                  const rowIdx = 8 - rank;
                  const isLight = (colIdx + rowIdx) % 2 === 0;

                  const piece = chess.get(square);
                  const isSelected = selectedSquare === square;
                  const isLegalDestination = showInstructions && legalMoves.includes(square);
                  const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
                  const isHint = hintSquare && (hintSquare.from === square || hintSquare.to === square);

                  return (
                    <div
                      key={square}
                      onClick={() => handleSquareClick(square)}
                      className={`w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center relative cursor-pointer select-none transition-all duration-150 ${
                        isSelected
                          ? 'bg-amber-400/60 ring-2 ring-inset ring-amber-300'
                          : isHint
                          ? 'bg-yellow-400/50 animate-pulse ring-2 ring-yellow-400'
                          : isLastMove
                          ? isLight
                            ? 'bg-[#edd998]'
                            : 'bg-[#4a4e32]'
                          : isLight
                          ? 'bg-[#ebd7b6] hover:bg-[#f3dfbf]'
                          : 'bg-[#272b34] hover:bg-[#2e3440]'
                      }`}
                    >
                      {/* Left Rank Coordinate inside square */}
                      {file === files[0] && (
                        <span className={`absolute top-0.5 left-1 text-[9px] font-bold pointer-events-none font-mono ${
                          isLight ? 'text-[#8c7456]' : 'text-[#64748b]'
                        }`}>
                          {rank}
                        </span>
                      )}

                      {/* Bottom File Coordinate inside square */}
                      {rank === ranks[ranks.length - 1] && (
                        <span className={`absolute bottom-0.5 right-1 text-[9px] font-bold pointer-events-none font-mono ${
                          isLight ? 'text-[#8c7456]' : 'text-[#64748b]'
                        }`}>
                          {file}
                        </span>
                      )}

                      {/* Legal Move Marker */}
                      {isLegalDestination && (
                        <div
                          className={`absolute rounded-full pointer-events-none z-20 ${
                            piece
                              ? 'w-full h-full border-4 border-amber-400/80 rounded-none shadow-[inset_0_0_12px_rgba(245,158,11,0.5)]'
                              : 'w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-400/90 shadow-[0_0_10px_rgba(245,158,11,0.9)] ring-2 ring-black/40'
                          }`}
                        />
                      )}

                      {/* 3D Realistic Staunton Piece Component */}
                      {piece && (
                        <div className="w-full h-full p-0.5 sm:p-1 flex items-center justify-center z-10">
                          <ChessPiece
                            type={piece.type}
                            color={piece.color}
                            className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 hover:scale-105"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Coordinates Bottom File Labels */}
          <div className="flex justify-between px-3 sm:px-4 pt-1 text-[10px] font-bold text-[#c9a785] tracking-widest font-mono">
            {files.map((f) => (
              <span key={`bot-${f}`} className="w-11 sm:w-14 md:w-16 text-center">{f}</span>
            ))}
          </div>
        </div>

        {/* User Player Info Bar */}
        <div className="w-full max-w-[500px] sm:max-w-[540px] md:max-w-[580px] mt-3 flex items-center justify-between px-3 py-2 rounded-2xl bg-[#0b1220] border border-slate-800 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">
                {user?.username || user?.name || 'You'} ({playerColor === 'w' ? 'White' : 'Black'})
              </p>
              <p className="text-[10px] text-amber-400/90 font-mono mt-0.5">Rating: {user?.rating || 1200} ELO</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                turn === playerColor
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {turn === playerColor ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Your Turn
                </>
              ) : (
                "Opponent's Turn"
              )}
            </span>
          </div>
        </div>

        {/* ================= 4 CIRCULAR ACTION BUTTONS (Matches Image 2 exactly) ================= */}
        <div className="w-full max-w-[500px] sm:max-w-[540px] md:max-w-[580px] mt-4 flex items-center justify-around gap-2 px-2">
          
          {/* Button 1: RESTART */}
          <button
            onClick={() => resetGame(playerColor)}
            className="flex flex-col items-center gap-1 group focus:outline-none"
            title="Restart Match"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-[#b45309] via-[#78350f] to-[#451a03] p-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#d97706] to-[#92400e] border border-amber-300/60 flex items-center justify-center shadow-inner">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-amber-100 group-hover:rotate-180 transition-transform duration-500" />
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-200">
              Restart
            </span>
          </button>

          {/* Button 2: PIECES / CHOOSE COLOR (White or Black) */}
          <button
            onClick={() => setShowSideModal(true)}
            className="flex flex-col items-center gap-1 group focus:outline-none"
            title="Select Side (White / Black)"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-[#64748b] via-[#334155] to-[#1e293b] p-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#475569] to-[#1e293b] border border-slate-500/60 flex items-center justify-center shadow-inner relative">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-[8px] font-black text-black uppercase">
                  {playerColor === 'w' ? 'W' : 'B'}
                </span>
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-amber-300">
              Pieces
            </span>
          </button>

          {/* Button 3: UNDO */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0 || isAiThinking}
            className={`flex flex-col items-center gap-1 group focus:outline-none ${
              history.length === 0 || isAiThinking ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Undo Move"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-[#64748b] via-[#334155] to-[#1e293b] p-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#475569] to-[#1e293b] border border-slate-500/60 flex items-center justify-center shadow-inner">
                <Undo2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-200 group-hover:-translate-x-0.5 transition-transform" />
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-amber-300">
              Undo
            </span>
          </button>

          {/* Button 4: HINT */}
          <button
            onClick={handleGetHint}
            disabled={isAiThinking || chess.isGameOver()}
            className="flex flex-col items-center gap-1 group focus:outline-none relative"
            title="Tactical Hint"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-[#b45309] via-[#78350f] to-[#451a03] p-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform relative">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#d97706] to-[#92400e] border border-amber-300/60 flex items-center justify-center shadow-inner">
                <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-200 animate-pulse" />
              </div>
              {/* Red Badge matching Image 2 */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[#0f172a] shadow-md">
                {hintCount}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-200">
              Hint
            </span>
          </button>

          {/* Button 5: RESIGN */}
          <button
            onClick={handleResign}
            disabled={isAiThinking || chess.isGameOver()}
            className={`flex flex-col items-center gap-1 group focus:outline-none ${
              isAiThinking || chess.isGameOver() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Resign Match"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-[#881337] via-[#4c0519] to-[#27020d] p-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#be123c] to-[#881337] border border-rose-400/60 flex items-center justify-center shadow-inner">
                <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-rose-100" />
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-rose-300 group-hover:text-rose-200">
              Resign
            </span>
          </button>
        </div>
      </div>

      {/* ================= SIDEBAR: GAME STATUS, SIDE SWITCHER & MOVE LOG ================= */}
      <div className="w-full lg:w-80 bg-[#0c1424] border border-[#d4af37]/35 rounded-3xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Match Center</span>
            </h3>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                gameStatus.includes('Checkmate')
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : gameStatus.includes('Check')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {gameStatus}
            </span>
          </div>

          {/* User Side Selection Widget (Explicit User Request) */}
          <div className="mt-4 p-3.5 rounded-2xl bg-[#070b14] border border-[#d4af37]/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Playing As:</span>
              <button
                onClick={handleFlipBoard}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
              >
                <RotateCw className="w-3 h-3" /> Flip View
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleSelectSide('w')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  playerColor === 'w'
                    ? 'bg-gradient-to-r from-amber-200 to-amber-400 text-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-300'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>♔</span>
                <span>White</span>
              </button>

              <button
                onClick={() => handleSelectSide('b')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  playerColor === 'b'
                    ? 'bg-gradient-to-r from-slate-800 to-slate-950 text-white border border-amber-400 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/80'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>♚</span>
                <span>Black</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-0.5">
              {playerColor === 'w' ? 'You move first (White)' : 'Engine moves first (White), you respond as Black'}
            </p>
          </div>

          {/* Secret Move Alert */}
          {secretDiscovered && (
            <div className="mt-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-400 text-xs text-amber-200 space-y-1 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                Secret Move Unlocked!
              </div>
              <p className="text-[11px] text-slate-300">
                Tactical Knight move registered. Easter Egg chat activated!
              </p>
            </div>
          )}

          {/* Move History List */}
          <div className="mt-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Move History
            </h4>
            <div className="h-44 overflow-y-auto pr-1 space-y-1 text-xs font-mono text-slate-300 scrollbar-thin">
              {history.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4 text-center">
                  Make your move to begin...
                </p>
              ) : (
                history
                  .reduce((rows, move, index) => {
                    if (index % 2 === 0) rows.push([move]);
                    else rows[rows.length - 1].push(move);
                    return rows;
                  }, [])
                  .map((pair, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between py-1 px-2.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                    >
                      <span className="text-slate-500 w-8">{idx + 1}.</span>
                      <span className="text-amber-200 font-bold w-16">{pair[0]}</span>
                      <span className="text-slate-300 w-16">{pair[1] || ''}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Fast Action */}
        <div className="pt-3 border-t border-slate-800/80">
          <button
            onClick={() => resetGame(playerColor)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Position</span>
          </button>
        </div>
      </div>

      {/* ================= MODAL: SELECT SIDE / COLOR (White or Black) ================= */}
      {showSideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0f172a] border-2 border-amber-400/80 p-6 shadow-2xl space-y-5 text-center">
            <button
              onClick={() => setShowSideModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Crown className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Select Your Side</h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose to play as White or Black against Stockfish Engine.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              {/* White Option */}
              <button
                onClick={() => handleSelectSide('w')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all group ${
                  playerColor === 'w'
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                    : 'bg-[#1e293b]/70 border-slate-700 hover:border-amber-400/60'
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <ChessPiece type="k" color="w" className="w-10 h-10" />
                </div>
                <span className="font-extrabold text-sm text-white group-hover:text-amber-300">White</span>
                <span className="text-[10px] text-amber-300 font-semibold">Moves First</span>
              </button>

              {/* Black Option */}
              <button
                onClick={() => handleSelectSide('b')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all group ${
                  playerColor === 'b'
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                    : 'bg-[#1e293b]/70 border-slate-700 hover:border-amber-400/60'
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <ChessPiece type="k" color="b" className="w-10 h-10" />
                </div>
                <span className="font-extrabold text-sm text-white group-hover:text-amber-300">Black</span>
                <span className="text-[10px] text-slate-400 font-semibold">Responds Second</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: GAME OVER WINNER ANNOUNCEMENT ================= */}
      {gameOverModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div
            className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl transition-all ${
              gameOverModal.isDraw
                ? 'bg-gradient-to-b from-[#131b2e] via-[#0f1728] to-[#0a0f1d] border-2 border-slate-600 shadow-[0_0_40px_rgba(148,163,184,0.2)]'
                : gameOverModal.isUserWin || (gameOverModal.winnerName !== 'Computer' && !gameOverModal.winnerName.includes('Stockfish'))
                ? 'bg-gradient-to-b from-[#0e1a30] via-[#0c1527] to-[#080d1a] border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.35)]'
                : 'bg-gradient-to-b from-[#1f1118] via-[#160c13] to-[#0a0508] border-2 border-rose-500/80 shadow-[0_0_50px_rgba(244,63,94,0.3)]'
            }`}
          >
            {/* Top Close Button (Review Board) */}
            <button
              onClick={() => setGameOverModal((prev) => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Close and inspect final board"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Icon */}
            <div className="mx-auto flex items-center justify-center">
              {gameOverModal.isDraw ? (
                <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border-2 border-slate-600 flex items-center justify-center shadow-lg">
                  <Award className="w-10 h-10 text-slate-300" />
                </div>
              ) : gameOverModal.isUserWin || (gameOverModal.winnerName !== 'Computer' && !gameOverModal.winnerName.includes('Stockfish')) ? (
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400/25 to-amber-500/10 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-bounce">
                  <Trophy className="w-10 h-10 text-amber-300 fill-amber-400/30" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500/60 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                  <Bot className="w-10 h-10 text-rose-400" />
                </div>
              )}
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h2
                className={`text-3xl sm:text-4xl font-black uppercase tracking-tight ${
                  gameOverModal.isDraw
                    ? 'text-slate-200'
                    : gameOverModal.isUserWin || (gameOverModal.winnerName !== 'Computer' && !gameOverModal.winnerName.includes('Stockfish'))
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100'
                    : 'text-rose-400'
                }`}
              >
                {gameOverModal.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                {gameOverModal.subtitle}
              </p>
            </div>

            {/* Match Stats Pill Bar */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-black/40 border border-slate-800 text-center">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Winner</span>
                <span className="text-xs font-extrabold text-amber-300 truncate block">
                  {gameOverModal.winnerName}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Method</span>
                <span className="text-xs font-extrabold text-white truncate block">
                  {gameOverModal.method}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Moves</span>
                <span className="text-xs font-extrabold text-emerald-400 block">
                  {gameOverModal.moves}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setGameOverModal((prev) => ({ ...prev, isOpen: false }));
                  resetGame(playerColor);
                }}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#e5a93c] via-[#f5b94e] to-[#e5a93c] hover:opacity-90 text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again / Rematch</span>
              </button>

              <button
                onClick={() => setGameOverModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Review Board Position
              </button>

              {onNavigate && (
                <button
                  onClick={() => {
                    setGameOverModal((prev) => ({ ...prev, isOpen: false }));
                    onNavigate('home');
                  }}
                  className="text-xs text-slate-400 hover:text-amber-300 font-semibold pt-1 transition-colors cursor-pointer block mx-auto"
                >
                  Exit to Arena
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
