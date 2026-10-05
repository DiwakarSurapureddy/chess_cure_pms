import React, { useState, useEffect } from 'react';
import ChessBoard from '../components/chess/ChessBoard';
import { useAuth } from '../context/AuthContext';
import { Bot, User, Users, Swords, Gamepad2, Sparkles, MessageSquare, X, Crown } from 'lucide-react';

export default function Dashboard({ initialMode = 'computer', onNavigate }) {
  const { user, recordGameResult, activeOnlineMatch, setActiveOnlineMatch, cancelActiveOnlineMatch } = useAuth();
  const [mode, setMode] = useState(activeOnlineMatch ? 'online' : initialMode);
  const [aiLevel, setAiLevel] = useState('intermediate');
  const [selectedSide, setSelectedSide] = useState(activeOnlineMatch?.playerColor || 'w'); // 'w' | 'b'
  const [friendName, setFriendName] = useState(activeOnlineMatch?.opponentName || 'Friend');
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [cancelPrompt, setCancelPrompt] = useState(null); // { targetMode, title, message }

  useEffect(() => {
    if (activeOnlineMatch) {
      setMode('online');
      setSelectedSide(activeOnlineMatch.playerColor || 'w');
      setFriendName(activeOnlineMatch.opponentName || 'Online Opponent');
    } else if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode, activeOnlineMatch]);

  const handleRequestModeChange = (targetMode) => {
    // If currently playing online with an active match, warn that board change cancels the match
    if (mode === 'online' && activeOnlineMatch && targetMode !== 'online') {
      const modeLabel = targetMode === 'computer' ? 'vs Computer' : 'Play vs Friends';
      setCancelPrompt({
        targetMode,
        title: 'Cancel Active Online Match?',
        message: `Changing the board to "${modeLabel}" will immediately cancel your online match vs ${activeOnlineMatch.opponentName}. Are you sure you want to cancel the match and switch boards?`
      });
      return;
    }
    setMode(targetMode);
    if (targetMode === 'computer') setSelectedSide('w');
  };

  const handleConfirmCancelMatch = async () => {
    const target = cancelPrompt?.targetMode || 'computer';
    setCancelPrompt(null);
    if (cancelActiveOnlineMatch) {
      await cancelActiveOnlineMatch('board_changed');
    } else {
      setActiveOnlineMatch(null);
    }
    setMode(target);
    if (target === 'computer') setSelectedSide('w');
  };

  const handleExitLiveMatch = async () => {
    setCancelPrompt({
      targetMode: 'computer',
      title: 'Exit Live Online Match?',
      message: `Leaving the live match against ${activeOnlineMatch?.opponentName || 'opponent'} will cancel the game. Are you sure you want to exit?`
    });
  };

  const handleOnlineMatchCancelled = () => {
    if (cancelActiveOnlineMatch) {
      cancelActiveOnlineMatch('remote_cancelled');
    } else {
      setActiveOnlineMatch(null);
    }
  };

  const handleSwitchToComputer = () => handleRequestModeChange('computer');
  const handleSwitchToTwoPlayer = () => handleRequestModeChange('two-player');
  const handleSwitchToOnline = () => handleRequestModeChange('online');

  const handleSecretMove = (move) => {
    setSecretUnlocked(true);
    setShowSecretModal(true);
  };

  const handleGameOver = (resultData) => {
    const oppName = mode === 'computer'
      ? 'Computer'
      : (activeOnlineMatch?.opponentName || friendName || 'Friend (Player 2)');

    recordGameResult({
      id: 'match_' + Date.now(),
      opponent: oppName,
      mode: mode === 'computer' ? 'vs Computer' : mode === 'online' ? 'Online 1v1 Match' : 'Play vs Friends',
      result: resultData.result,
      method: resultData.method,
      moves: resultData.moves,
      ratingChange: resultData.result === 'Won' ? '+15' : resultData.result === 'Lost' ? '-10' : '+0',
      date: 'Just now',
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-4">
      {/* Active Online Match Alert Banner (When an online match is active) */}
      {mode === 'online' && activeOnlineMatch && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#0e182c] to-[#0e182c] border border-amber-500/50 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Swords className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">
                  Live Match vs {activeOnlineMatch.opponentName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Online
                </span>
              </div>
              <p className="text-[11px] text-amber-400/90 font-mono">
                You play: {activeOnlineMatch.playerColor === 'w' ? 'White (♔) - Moves First' : 'Black (♚) - Moves Second'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSwitchToComputer}
            className="py-1.5 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Exit Live Match
          </button>
        </div>
      )}

      {/* Top Game Controls Bar: ALWAYS keeps all 3 Mode buttons visible! */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-[#0c1424] border border-[#d4af37]/35 shadow-xl">
        
        {/* Left: The 3 Main Game Modes (Always visible!) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Button 1: vs Computer */}
          <button
            onClick={handleSwitchToComputer}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              mode === 'computer'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>vs Computer</span>
          </button>

          {/* Button 2: Play vs Friends (Pass & Play on same screen) */}
          <button
            onClick={handleSwitchToTwoPlayer}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              mode === 'two-player'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Play vs Friends</span>
          </button>

          {/* Button 3: Play Online */}
          <button
            onClick={handleSwitchToOnline}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              mode === 'online'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Play Online</span>
          </button>
        </div>

        {/* Center: White or Black Side Selector (User Request) */}
        <div className="flex items-center gap-1.5 bg-[#070b14] p-1.5 rounded-2xl border border-[#d4af37]/30 shadow-inner">
          <span className="text-[11px] text-amber-300/80 font-bold px-2">Play As:</span>
          
          <button
            onClick={() => setSelectedSide('w')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
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

        {/* Right: AI Difficulty Selector (when vs Computer) or Friend Name (when vs Friend) */}
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

        {mode === 'two-player' && (
          <div className="flex items-center gap-2 bg-[#070b14] px-3 py-1.5 rounded-2xl border border-slate-800 text-xs">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 font-semibold">Friend:</span>
            <input
              type="text"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="Friend's Name"
              className="bg-slate-900 border border-slate-700 focus:border-amber-400 text-amber-200 text-xs px-2.5 py-1 rounded-xl outline-none max-w-[130px]"
            />
          </div>
        )}

        {mode === 'online' && activeOnlineMatch && (
          <button
            onClick={handleExitLiveMatch}
            className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Exit Live Match
          </button>
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

      {/* Main Playable Chessboard with selected side and mode */}
      <ChessBoard
        key={`${mode}-${selectedSide}-${friendName}-${activeOnlineMatch?.gameId || 'offline'}`}
        gameMode={mode}
        aiDifficulty={aiLevel}
        initialPlayerColor={selectedSide}
        player1Name={activeOnlineMatch ? (activeOnlineMatch.playerColor === 'w' ? user?.username : activeOnlineMatch.opponentName) : (user?.username || user?.name || 'Player 1')}
        player2Name={activeOnlineMatch ? (activeOnlineMatch.playerColor === 'w' ? activeOnlineMatch.opponentName : user?.username) : (friendName || 'Friend (Player 2)')}
        onlineGameId={activeOnlineMatch?.gameId}
        onSecretMoveDetected={handleSecretMove}
        onGameOver={handleGameOver}
        onNavigate={onNavigate}
        onOnlineMatchCancelled={handleOnlineMatchCancelled}
      />

      {/* Cancel Match Confirmation Modal on Board Change */}
      {cancelPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b1322] border-2 border-amber-500/60 p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Swords className="w-6 h-6 animate-pulse" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-white">{cancelPrompt.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {cancelPrompt.message}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelPrompt(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Stay in Match
              </button>

              <button
                type="button"
                onClick={handleConfirmCancelMatch}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-xs transition-colors shadow-md shadow-rose-500/30 cursor-pointer"
              >
                Cancel & Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secret Chat Modal */}
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
