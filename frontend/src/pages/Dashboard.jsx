import React, { useState } from 'react';
import ChessBoard from '../components/chess/ChessBoard';
import { useAuth } from '../context/AuthContext';
import { Bot, User, Users, Swords, Gamepad2, Sparkles, MessageSquare, X } from 'lucide-react';

export default function Dashboard({ initialMode = 'computer', onNavigate }) {
  const { recordGameResult } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [aiLevel, setAiLevel] = useState('intermediate');
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);

  const handleSecretMove = (move) => {
    setSecretUnlocked(true);
    setShowSecretModal(true);
  };

  const handleGameOver = (resultData) => {
    recordGameResult({
      id: 'match_' + Date.now(),
      opponent: mode === 'computer' ? `Stockfish AI (${aiLevel})` : 'Player 2',
      mode: mode === 'computer' ? 'vs Computer' : 'Two Players',
      result: resultData.result,
      method: resultData.method,
      moves: resultData.moves,
      ratingChange: resultData.result === 'Won' ? '+15' : resultData.result === 'Lost' ? '-10' : '+0',
      date: 'Just now',
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Game Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c1424] border border-slate-800 shadow-lg">
        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('computer')}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              mode === 'computer'
                ? 'bg-[#e5a93c] text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>vs Computer</span>
          </button>

          <button
            onClick={() => setMode('two-player')}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              mode === 'two-player'
                ? 'bg-[#e5a93c] text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Two Players</span>
          </button>
        </div>

        {/* AI Difficulty Selector (when vs Computer) */}
        {mode === 'computer' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Difficulty:</span>
            {['beginner', 'intermediate', 'master'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setAiLevel(lvl)}
                className={`py-1.5 px-3 rounded-lg text-[11px] font-bold capitalize transition-colors ${
                  aiLevel === lvl
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        )}

        {/* Secret Chat Indicator Badge */}
        {secretUnlocked && (
          <button
            onClick={() => setShowSecretModal(true)}
            className="py-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-bounce shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Secret Chat</span>
          </button>
        )}
      </div>

      {/* Main Playable Chessboard */}
      <ChessBoard
        gameMode={mode}
        aiDifficulty={aiLevel}
        onSecretMoveDetected={handleSecretMove}
        onGameOver={handleGameOver}
      />

      {/* Secret Chat Modal / Teaser */}
      {showSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0e1728] border border-amber-400/80 p-6 shadow-[0_0_40px_rgba(229,169,60,0.25)] space-y-4">
            <button
              onClick={() => setShowSecretModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Secret Chat Channel</h3>
                <p className="text-xs text-amber-400">Unlocked via Tactical Knight Easter Egg</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#080d17] border border-slate-800 space-y-3 min-h-[160px] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#111c30] text-xs text-slate-300 max-w-[80%]">
                  <p className="text-[10px] text-amber-400 font-bold mb-0.5">Grandmaster Encrypted Network</p>
                  You discovered the hidden move. Secret chat channel is now initialized.
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 max-w-[80%] ml-auto">
                  Ready to send secure real-time messages.
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                <input
                  type="text"
                  placeholder="Type an encrypted message..."
                  className="flex-1 px-3 py-2 bg-[#0d1524] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
                <button className="px-4 py-2 bg-[#e5a93c] text-black font-bold text-xs rounded-xl hover:bg-[#f5b94e]">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
