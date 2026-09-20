import React, { useState } from 'react';
import ChessPiece from './ChessPiece';

// Simple Web Audio API sound generator for piece moves and captures
function playChessSound(type = 'move') {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'capture') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } else {
      // Normal crisp wood knock
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    }
  } catch (e) {
    // AudioContext not allowed or unsupported
  }
}

export default function ChessBoard({
  boardState, // 8x8 array or map of square string 'e4' => { type, color }
  onMove,
  playerColor = 'w',
  selectedSquare = null,
  onSelectSquare,
  legalMoves = [],
  lastMove = null,
  isLocked = false,
  successHighlight = null,
}) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const getPieceAt = (sq) => {
    if (!boardState) return null;
    return boardState[sq] || null;
  };

  const handleSquareClick = (sq) => {
    if (isLocked) return;

    const piece = getPieceAt(sq);

    // If already selected and clicking a valid legal move destination
    if (selectedSquare && legalMoves.includes(sq)) {
      const isCapture = !!piece;
      playChessSound(isCapture ? 'capture' : 'move');
      if (onMove) {
        onMove(selectedSquare, sq);
      }
      return;
    }

    // If clicking on own piece, select it
    if (piece && piece.color === playerColor) {
      if (onSelectSquare) {
        onSelectSquare(sq === selectedSquare ? null : sq);
      }
      return;
    }

    // Otherwise deselect
    if (onSelectSquare && selectedSquare) {
      onSelectSquare(null);
    }
  };

  return (
    <div className="relative select-none inline-block p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#090d16] border-2 border-[#b45309]/50 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.15)]">
      {/* Outer Rim coordinates */}
      <div className="relative">
        <div className="grid grid-cols-8 gap-0 border-2 border-[#78350f] rounded-lg overflow-hidden shadow-inner">
          {ranks.map((rank, rankIdx) =>
            files.map((file, fileIdx) => {
              const sq = `${file}${rank}`;
              const isLight = (rankIdx + fileIdx) % 2 === 0;
              const piece = getPieceAt(sq);
              const isSelected = selectedSquare === sq;
              const isLegal = legalMoves.includes(sq);
              const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
              const isSuccess = successHighlight === sq;

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  className={`relative w-9 h-9 xs:w-11 xs:h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center cursor-pointer transition-all duration-150 ${
                    isLight ? 'bg-[#c8b495]' : 'bg-[#5c3e21]'
                  } ${isLastMove ? 'ring-inset ring-2 ring-amber-400/60 bg-amber-600/30' : ''} ${
                    isSelected ? '!bg-[#fcd34d] ring-4 ring-amber-500 z-10 scale-105 shadow-lg' : ''
                  } ${isSuccess ? '!bg-emerald-500 ring-4 ring-emerald-300 z-10 animate-bounce' : ''}`}
                >
                  {/* File & Rank Coordinate Labels on edges */}
                  {fileIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-bold ${
                        isLight ? 'text-[#5c3e21]/70' : 'text-[#c8b495]/70'
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {rankIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-bold ${
                        isLight ? 'text-[#5c3e21]/70' : 'text-[#c8b495]/70'
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Destination Legal Move Indicator Dot */}
                  {isLegal && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      {piece ? (
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-4 border-amber-400 bg-amber-400/20 animate-pulse" />
                      ) : (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse" />
                      )}
                    </div>
                  )}

                  {/* Chess Piece Render */}
                  {piece && (
                    <div
                      className={`relative z-10 transition-transform duration-200 transform ${
                        isSelected ? 'scale-115 -translate-y-1' : 'hover:scale-105'
                      }`}
                    >
                      <ChessPiece
                        type={piece.type}
                        color={piece.color}
                        className="w-7 h-7 xs:w-9 xs:h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export { playChessSound };
