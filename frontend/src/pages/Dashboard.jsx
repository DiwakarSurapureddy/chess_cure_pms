import React, { useState, useEffect } from 'react';
import ChessBoard from '../components/chess/ChessBoard';
import { useAuth } from '../context/AuthContext';
import { useSecretChat } from '../context/SecretChatContext';
import { Bot, User, Users, Swords, Gamepad2, Sparkles, MessageSquare, X, Crown, Clock } from 'lucide-react';

export default function Dashboard({ initialMode = 'computer', onNavigate }) {
  const { recordGameResult } = useAuth();
  const { isChatUnlocked, formattedTime, openChatModal, unlockSecretChat } = useSecretChat();
  const [mode, setMode] = useState(initialMode);
  const [aiLevel, setAiLevel] = useState('intermediate');
  const [selectedSide, setSelectedSide] = useState('w'); // 'w' | 'b'

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const handleSecretMove = (move) => {
    unlockSecretChat(move?.reason || 'Opponent piece captured within 5 moves');
  };

  const handleGameOver = (resultData) => {
    recordGameResult({
      id: 'match_' + Date.now(),
      opponent: mode === 'computer' ? `Stockfish AI (${aiLevel})` : 'Friend (Player 2)',
      mode: mode === 'computer' ? 'vs Computer' : 'Play vs Friends',
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
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-[#0c1424] border border-[#d4af37]/35 shadow-xl">
        
        {/* Left: Mode Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('computer')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              mode === 'computer'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>vs Computer</span>
          </button>

          <button
            onClick={() => setMode('two-player')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              mode === 'two-player'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Play vs Friends</span>
          </button>
        </div>

        {/* Center: White or Black Side Selector (User Request) */}
        <div className="flex items-center gap-1.5 bg-[#070b14] p-1.5 rounded-2xl border border-[#d4af37]/30 shadow-inner">
          <span className="text-[11px] text-amber-300/80 font-bold px-2">Play As:</span>
          
          <button
            onClick={() => setSelectedSide('w')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              selectedSide === 'w'
                ? 'bg-gradient-to-r from-amber-200 to-amber-400 text-black shadow-lg shadow-amber-500/30 ring-1 ring-amber-200'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Play as White (You move first)"
          >
            <span>♔</span>
            <span>White</span>
          </button>

          <button
            onClick={() => setSelectedSide('b')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              selectedSide === 'b'
                ? 'bg-gradient-to-r from-slate-800 to-slate-950 text-white border border-amber-400 shadow-lg shadow-amber-500/30 ring-1 ring-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Play as Black (Engine moves first, board flipped)"
          >
            <span>♚</span>
            <span>Black</span>
          </button>
        </div>

        {/* Right: AI Difficulty Selector (when vs Computer) */}
        {mode === 'computer' && (
          <div className="flex items-center gap-1.5 bg-[#070b14] p-1.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold px-1.5">AI Level:</span>
            {['beginner', 'intermediate', 'master'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setAiLevel(lvl)}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-bold capitalize transition-colors ${
                  aiLevel === lvl
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        )}

        {/* Secret Chat Indicator Badge with Live Countdown */}
        {isChatUnlocked && (
          <button
            onClick={openChatModal}
            className="py-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-bounce shadow-lg hover:bg-amber-500/30 transition-all"
            title={`Secret Chat Active (${formattedTime} remaining)`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Open Secret Chat ({formattedTime})</span>
          </button>
        )}
      </div>

      {/* Main Playable Chessboard with selected side and mode */}
      <ChessBoard
        key={`${mode}-${selectedSide}`}
        gameMode={mode}
        aiDifficulty={aiLevel}
        initialPlayerColor={selectedSide}
        onSecretMoveDetected={handleSecretMove}
        onGameOver={handleGameOver}
      />
    </div>
  );
}
