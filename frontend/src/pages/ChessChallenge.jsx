import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Award, Zap, Shuffle, CheckCircle2, HelpCircle, ArrowRight, Trophy, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

const CHALLENGES_DATABASE = {
  easy: [
    {
      id: 'e1',
      title: 'Back-Rank Execution',
      description: 'White to move and deliver an unstoppable checkmate in 1 move.',
      fen: '6k1/5ppp/8/8/8/8/4QPPP/6K1 w - - 0 1',
      solution: { from: 'e2', to: 'e8' },
      hint: 'The opponent king has no escape square on the back rank.',
      reward: '+25 Rating',
    },
    {
      id: 'e2',
      title: 'Hanging Queen Trap',
      description: 'Black left their queen undefended. Take it immediately!',
      fen: 'r1b1k2r/pppp1ppp/8/4q3/1b6/2N1B3/PPP1PPPP/R2QKB1R w KQkq - 0 1',
      solution: { from: 'e3', to: 'd4' },
      hint: 'Attack the queen with your bishop or rook.',
      reward: '+20 Rating',
    },
  ],
  difficult: [
    {
      id: 'd1',
      title: 'Royal Knight Fork',
      description: 'Fork the King and the Rook simultaneously to win decisive material.',
      fen: 'r3k2r/ppp2ppp/2n5/3p4/3Pn3/2N5/PPP1BPPP/R2QK2R w KQkq - 0 1',
      solution: { from: 'c3', to: 'd5' },
      hint: 'Look for knight jumps into the center squares.',
      reward: '+50 Rating',
    },
    {
      id: 'd2',
      title: 'The Absolute Pin',
      description: 'Pin the enemy bishop against their king and crush their defense.',
      fen: 'r2qk2r/ppp2ppp/3b4/8/4B3/8/PPP2PPP/R1BQK2R w KQkq - 0 1',
      solution: { from: 'e4', to: 'b7' },
      hint: 'Exploit the alignment on the long diagonal.',
      reward: '+45 Rating',
    },
  ],
  advance: [
    {
      id: 'a1',
      title: 'Deflection Queen Sacrifice',
      description: 'Sacrifice your heavy piece to deflect the defender from the mating square.',
      fen: '5rk1/5ppp/8/8/1Q6/8/5PPP/4R1K1 w - - 0 1',
      solution: { from: 'b4', to: 'f8' },
      hint: 'Deflect the rook from guarding the back rank.',
      reward: '+90 Rating',
    },
    {
      id: 'a2',
      title: 'Discovered Double Attack',
      description: 'Move the knight to unleash a deadly double check.',
      fen: 'r1bqkb1r/pppp1ppp/2n5/4N3/4n3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
      solution: { from: 'e5', to: 'c6' },
      hint: 'The queen looks directly at the king if the knight jumps away.',
      reward: '+85 Rating',
    },
  ],
  master: [
    {
      id: 'm1',
      title: 'Morphy Opera House Mate',
      description: 'A legendary master tactic: clear lines and deliver checkmate with minor pieces.',
      fen: '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 1',
      solution: { from: 'b3', to: 'b8' },
      hint: 'Decoy the knight with a shocking queen sacrifice on b8!',
      reward: '+150 Rating',
    },
    {
      id: 'm2',
      title: 'Smothered Mate Sequence',
      description: 'Trap the black king inside its own wall of defensive pawns.',
      fen: '6k1/5Npp/8/8/8/8/1Q6/6K1 w - - 0 1',
      solution: { from: 'f7', to: 'h6' },
      hint: 'Double check with knight and queen forces king to the corner.',
      reward: '+180 Rating',
    },
  ],
};

const PIECE_SYMBOLS = {
  p: { w: '♙', b: '♟' },
  r: { w: '♖', b: '♜' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' },
};

export default function ChessChallenge() {
  const { user, recordGameResult } = useAuth();
  const [activeTier, setActiveTier] = useState('easy'); // 'easy' | 'difficult' | 'advance' | 'master'
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [chess, setChess] = useState(() => new Chess(CHALLENGES_DATABASE.easy[0].fen));
  const [board, setBoard] = useState(chess.board());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [isSolved, setIsSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState('');

  const currentTierPuzzles = CHALLENGES_DATABASE[activeTier];
  const currentPuzzle = currentTierPuzzles[puzzleIndex % currentTierPuzzles.length];

  // Load new puzzle
  const loadPuzzle = (tier, idx) => {
    const list = CHALLENGES_DATABASE[tier];
    const puzzle = list[idx % list.length];
    const newChess = new Chess(puzzle.fen);
    setChess(newChess);
    setBoard(newChess.board());
    setSelectedSquare(null);
    setLegalMoves([]);
    setIsSolved(false);
    setShowHint(false);
    setMessage('');
  };

  const handleTierChange = (tier) => {
    setActiveTier(tier);
    setPuzzleIndex(0);
    loadPuzzle(tier, 0);
  };

  const handleRandomChallenge = () => {
    const tiers = ['easy', 'difficult', 'advance', 'master'];
    const randomTier = tiers[Math.floor(Math.random() * tiers.length)];
    const randomIdx = Math.floor(Math.random() * 2);
    setActiveTier(randomTier);
    setPuzzleIndex(randomIdx);
    loadPuzzle(randomTier, randomIdx);
  };

  const handleSquareClick = (rowIndex, colIndex) => {
    if (isSolved) return;

    const file = String.fromCharCode(97 + colIndex);
    const rank = (8 - rowIndex).toString();
    const square = `${file}${rank}`;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Check if move matches puzzle solution
      if (selectedSquare === currentPuzzle.solution.from && square === currentPuzzle.solution.to) {
        chess.move({ from: selectedSquare, to: square, promotion: 'q' });
        setBoard(chess.board());
        setIsSolved(true);
        setMessage('Brilliant! Challenge Solved!');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        recordGameResult({
          id: 'chal_' + Date.now(),
          opponent: `Tactics (${activeTier.toUpperCase()})`,
          mode: 'Challenge Puzzle',
          result: 'Won',
          method: 'Puzzle Solved',
          moves: 1,
          ratingChange: currentPuzzle.reward,
          date: 'Just now',
        });
        return;
      } else {
        setMessage('Incorrect move. Try again or check the hint!');
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square: square, verbose: true });
      setLegalMoves(moves.map((m) => m.to));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Tier Switcher */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            Tactical Challenges
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Test your skills across progressive difficulties to elevate your rating.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRandomChallenge}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>Random Challenge</span>
          </button>
        </div>
      </div>

      {/* Difficulty Tabs: Easy, Difficult, Advance, Master */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'easy', label: 'Easy', badge: '1200 ELO', color: 'emerald' },
          { id: 'difficult', label: 'Difficult', badge: '1600 ELO', color: 'blue' },
          { id: 'advance', label: 'Advance', badge: '1900 ELO', color: 'purple' },
          { id: 'master', label: 'Master', badge: '2300 ELO', color: 'amber' },
        ].map((t) => {
          const isActive = activeTier === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTierChange(t.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-500/10'
                  : 'bg-[#0e1626] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold capitalize ${isActive ? 'text-amber-300' : 'text-white'}`}>
                  {t.label}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {t.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Tactics & Mates</p>
            </button>
          );
        })}
      </div>

      {/* Puzzle Interactive Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Board Column */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="border-4 border-[#1b283f] rounded-2xl overflow-hidden shadow-2xl bg-[#080d17]">
            {board.map((row, rIdx) => (
              <div key={rIdx} className="flex">
                {row.map((piece, cIdx) => {
                  const file = String.fromCharCode(97 + cIdx);
                  const rank = (8 - rIdx).toString();
                  const sq = `${file}${rank}`;
                  const isLight = (rIdx + cIdx) % 2 === 0;
                  const isSelected = selectedSquare === sq;
                  const isLegal = legalMoves.includes(sq);

                  return (
                    <div
                      key={cIdx}
                      onClick={() => handleSquareClick(rIdx, cIdx)}
                      className={`w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center relative cursor-pointer select-none ${
                        isSelected
                          ? 'bg-amber-500/60'
                          : isLight
                          ? 'bg-[#22334d]'
                          : 'bg-[#0e1726]'
                      }`}
                    >
                      {/* Legal Move Dot */}
                      {isLegal && (
                        <div
                          className={`absolute rounded-full pointer-events-none ${
                            piece
                              ? 'w-full h-full border-4 border-amber-400/80'
                              : 'w-3.5 h-3.5 bg-amber-400/80 shadow-[0_0_8px_rgba(229,169,60,0.8)]'
                          }`}
                        />
                      )}

                      {/* Piece */}
                      {piece && (
                        <span
                          className={`text-3xl sm:text-4xl md:text-5xl transition-transform hover:scale-110 ${
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
        </div>

        {/* Puzzle Details Column */}
        <div className="lg:col-span-5 bg-[#0c1424] border border-slate-800 rounded-3xl p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                {activeTier} Tier Challenge
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {currentPuzzle.reward}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">{currentPuzzle.title}</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{currentPuzzle.description}</p>
          </div>

          {/* Feedback message */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                isSolved
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
              }`}
            >
              {isSolved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Zap className="w-4 h-4 text-rose-400" />}
              <span>{message}</span>
            </div>
          )}

          {/* Hint Area */}
          {showHint && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <HelpCircle className="w-4 h-4" />
                <span>Tactical Hint:</span>
              </div>
              <p>{currentPuzzle.hint}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            {!isSolved ? (
              <button
                onClick={() => setShowHint(!showHint)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>{showHint ? 'Hide Hint' : 'Reveal Hint'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const nextIdx = (puzzleIndex + 1) % currentTierPuzzles.length;
                  setPuzzleIndex(nextIdx);
                  loadPuzzle(activeTier, nextIdx);
                }}
                className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <span>Next Challenge</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
