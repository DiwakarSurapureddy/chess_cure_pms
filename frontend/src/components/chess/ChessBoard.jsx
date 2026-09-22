import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { RotateCcw, Award, Sparkles, Volume2, Flag, User, Bot, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// Unicode piece symbols or clean SVG representation
const PIECE_SYMBOLS = {
  p: { w: '♙', b: '♟' },
  r: { w: '♖', b: '♜' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' },
};

export default function ChessBoard({
  gameMode = 'computer', // 'computer' | 'two-player' | 'online'
  aiDifficulty = 'intermediate',
  onSecretMoveDetected,
  onGameOver,
}) {
  const [chess] = useState(() => new Chess());
  const [board, setBoard] = useState(chess.board());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [turn, setTurn] = useState('w');
  const [history, setHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState('In Progress');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [secretDiscovered, setSecretDiscovered] = useState(false);

  // Update board state
  const refreshBoard = () => {
    setBoard(chess.board());
    setTurn(chess.turn());
    setHistory(chess.history());

    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'Black' : 'White';
      setGameStatus(`Checkmate! ${winner} Wins`);
      if (onGameOver) onGameOver({ result: winner === 'White' ? 'Won' : 'Lost', method: 'Checkmate', moves: chess.history().length });
    } else if (chess.isDraw()) {
      setGameStatus('Draw (Stalemate / 50-move rule)');
      if (onGameOver) onGameOver({ result: 'Draw', method: 'Stalemate', moves: chess.history().length });
    } else if (chess.inCheck()) {
      setGameStatus('Check!');
    } else {
      setGameStatus('In Progress');
    }
  };

  // Reset Game
  const resetGame = () => {
    chess.reset();
    setSelectedSquare(null);
    setLegalMoves([]);
    setSecretDiscovered(false);
    refreshBoard();
  };

  // AI Move logic
  const makeAiMove = () => {
    if (chess.isGameOver()) return;
    setIsAiThinking(true);

    setTimeout(() => {
      const moves = chess.moves({ verbose: true });
      if (moves.length === 0) {
        setIsAiThinking(false);
        return;
      }

      // Choose move: evaluate captures first or random
      let chosenMove = moves[Math.floor(Math.random() * moves.length)];
      if (aiDifficulty === 'intermediate' || aiDifficulty === 'master') {
        const captures = moves.filter((m) => m.captured);
        if (captures.length > 0) {
          chosenMove = captures[Math.floor(Math.random() * captures.length)];
        }
      }

      chess.move(chosenMove);
      refreshBoard();
      setIsAiThinking(false);
    }, 500);
  };

  // Handle Square Click
  const handleSquareClick = (rowIndex, colIndex) => {
    if (gameMode === 'computer' && chess.turn() !== 'w') return;
    if (chess.isGameOver()) return;

    const file = String.fromCharCode(97 + colIndex);
    const rank = (8 - rowIndex).toString();
    const squareNotation = `${file}${rank}`;

    // If square already selected, try to move
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
          promotion: 'q', // auto queen promotion for simplicity
        });

        if (move) {
          // Check for the "Secret Move" Easter Egg!
          // Condition: When white knight moves to f3 or c3 on an early turn
          if (!secretDiscovered && move.piece === 'n' && (move.to === 'f3' || move.to === 'c3')) {
            setSecretDiscovered(true);
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            if (onSecretMoveDetected) onSecretMoveDetected(move);
          }

          setSelectedSquare(null);
          setLegalMoves([]);
          refreshBoard();

          // If playing vs computer, trigger AI response
          if (gameMode === 'computer' && !chess.isGameOver()) {
            makeAiMove();
          }
          return;
        }
      } catch (e) {
        // Not a legal move, re-select
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

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row items-center lg:items-start gap-8 py-6">
      {/* Board Container */}
      <div className="flex flex-col items-center">
        {/* Opponent Info Bar */}
        <div className="w-full flex items-center justify-between pb-3 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              {gameMode === 'computer' ? <Bot className="w-4 h-4 text-amber-400" /> : <User className="w-4 h-4 text-blue-400" />}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">
                {gameMode === 'computer' ? `Stockfish AI (${aiDifficulty.toUpperCase()})` : 'Player 2 (Black)'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Rating: 1550</p>
            </div>
          </div>
          {isAiThinking && (
            <span className="text-[11px] text-amber-400 animate-pulse font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Engine thinking...
            </span>
          )}
        </div>

        {/* 8x8 Chessboard */}
        <div className="relative border-4 border-[#1b283f] rounded-2xl overflow-hidden shadow-2xl bg-[#080d17]">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((piece, colIndex) => {
                const file = String.fromCharCode(97 + colIndex);
                const rank = (8 - rowIndex).toString();
                const square = `${file}${rank}`;
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isSelected = selectedSquare === square;
                const isLegalDestination = legalMoves.includes(square);

                return (
                  <div
                    key={colIndex}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    className={`w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center relative cursor-pointer select-none transition-colors duration-150 ${
                      isSelected
                        ? 'bg-amber-500/50'
                        : isLight
                        ? 'bg-[#22334d]'
                        : 'bg-[#0e1726]'
                    }`}
                  >
                    {/* Rank / File Coordinate Labels */}
                    {colIndex === 0 && (
                      <span className="absolute top-1 left-1 text-[9px] font-semibold text-slate-500/60 pointer-events-none">
                        {rank}
                      </span>
                    )}
                    {rowIndex === 7 && (
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-semibold text-slate-500/60 pointer-events-none">
                        {file}
                      </span>
                    )}

                    {/* Legal Move Destination Indicator */}
                    {isLegalDestination && (
                      <div
                        className={`absolute rounded-full pointer-events-none ${
                          piece
                            ? 'w-full h-full border-4 border-amber-400/80 rounded-none'
                            : 'w-3.5 h-3.5 bg-amber-400/80 shadow-[0_0_8px_rgba(229,169,60,0.8)]'
                        }`}
                      />
                    )}

                    {/* Piece Display */}
                    {piece && (
                      <span
                        className={`text-3xl sm:text-4xl md:text-5xl transform transition-transform hover:scale-110 ${
                          piece.color === 'w'
                            ? 'text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                            : 'text-slate-900 drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]'
                        }`}
                      >
                        {PIECE_SYMBOLS[piece.type]?.[piece.color]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Player Info Bar */}
        <div className="w-full flex items-center justify-between pt-3 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">You (White)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Rating: 1540</p>
            </div>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              turn === 'w'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {turn === 'w' ? 'Your Turn' : "Opponent's Turn"}
          </span>
        </div>
      </div>

      {/* Game Control & Move Log Sidebar */}
      <div className="w-full lg:w-72 bg-[#0c1424] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
        <div>
          {/* Game Status Banner */}
          <div className="p-3 rounded-xl bg-[#101b2e] border border-slate-700/80 mb-4 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Status</span>
            <span
              className={`text-xs font-bold ${
                gameStatus.includes('Checkmate')
                  ? 'text-rose-400'
                  : gameStatus.includes('Check')
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {gameStatus}
            </span>
          </div>

          {/* Secret Move Trigger Alert Card */}
          {secretDiscovered && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/80 shadow-[0_0_15px_rgba(229,169,60,0.2)] mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Secret Move Triggered!</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                You played the perfect tactical move! Secret portal unlocked.
              </p>
            </div>
          )}

          {/* Move History List */}
          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Move History</h4>
          <div className="h-44 overflow-y-auto pr-1 space-y-1 text-xs font-mono text-slate-300 scrollbar-thin">
            {history.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-2">Make a move to start...</p>
            ) : (
              history.reduce((rows, move, index) => {
                if (index % 2 === 0) rows.push([move]);
                else rows[rows.length - 1].push(move);
                return rows;
              }, []).map((pair, idx) => (
                <div key={idx} className="flex justify-between py-0.5 px-2 rounded hover:bg-slate-800/50">
                  <span className="text-slate-500 w-8">{idx + 1}.</span>
                  <span className="text-amber-200 w-16">{pair[0]}</span>
                  <span className="text-slate-400 w-16">{pair[1] || ''}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <button
            onClick={resetGame}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Restart Game</span>
          </button>
        </div>
      </div>
    </div>
  );
}
