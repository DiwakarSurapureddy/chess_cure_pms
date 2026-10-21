import React, { useState, useEffect, useRef } from 'react';
import ChessBoard from '../components/chess/ChessBoard';
import Chat from './Chat';
import { useAuth } from '../context/AuthContext';
import { useSecretChat } from '../context/SecretChatContext';
import { Bot, User, Users, Swords, Gamepad2, Sparkles, MessageSquare, X, Crown, ArrowLeft, Flag } from 'lucide-react';

export default function Dashboard({ initialMode = 'computer', onNavigate, onGameOver }) {
  const { user, token, recordGameResult, activeOnlineMatch, setActiveOnlineMatch, cancelActiveOnlineMatch } = useAuth();
  const [mode, setMode] = useState(activeOnlineMatch ? 'online' : initialMode);
  const [aiLevel, setAiLevel] = useState('intermediate');
  const [selectedSide, setSelectedSide] = useState(activeOnlineMatch?.playerColor || 'w'); // 'w' | 'b'
  const [friendName, setFriendName] = useState(activeOnlineMatch?.opponentName || 'Friend');
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [cancelPrompt, setCancelPrompt] = useState(null); // { targetMode, title, message }
  const [inPlaceChatFriend, setInPlaceChatFriend] = useState(null);
  const [activeBoardView, setActiveBoardView] = useState('board'); // 'board' | 'chat'
  const hasUserClosedInPlaceRef = useRef(false);
  const chatAutoReturnTimerRef = useRef(null);
  const chessBoardRef = useRef(null);

  // Secret chat countdown timer from context (5-minute countdown continues everywhere)
  const { isChatUnlocked, timeRemaining, formattedTime } = useSecretChat ? useSecretChat() : { isChatUnlocked: false, timeRemaining: 0, formattedTime: '00:00' };

  // Clean up auto-return timer on unmount
  useEffect(() => {
    return () => {
      if (chatAutoReturnTimerRef.current) {
        clearTimeout(chatAutoReturnTimerRef.current);
      }
    };
  }, []);

  // When 5-minute session ends, automatically switch back to chessboard view
  useEffect(() => {
    if (!isChatUnlocked && activeBoardView === 'chat') {
      setActiveBoardView('board');
      try { localStorage.removeItem('cc_chat_expires_at'); } catch {}
    }
  }, [isChatUnlocked, activeBoardView]);

  // Check if an existing 5-minute session is already running (e.g. across page refresh)
  useEffect(() => {
    try {
      const storedExpiry = localStorage.getItem('cc_chat_expires_at');
      if (storedExpiry) {
        const exp = parseInt(storedExpiry, 10);
        const rem = exp - Date.now();
        if (rem > 0) {
          if (chatAutoReturnTimerRef.current) clearTimeout(chatAutoReturnTimerRef.current);
          chatAutoReturnTimerRef.current = setTimeout(() => {
            setActiveBoardView('board');
            hasUserClosedInPlaceRef.current = true;
            try { localStorage.removeItem('cc_chat_expires_at'); } catch {}
          }, rem);
        } else {
          try { localStorage.removeItem('cc_chat_expires_at'); } catch {}
        }
      }
    } catch {}
  }, []);

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

  const performExitLiveMatch = async () => {
    setCancelPrompt(null);
    const gId = activeOnlineMatch?.gameId;
    if (gId) {
      api.cancelGame(gId, 'player_exited').catch(() => {});
      const curToken = token || localStorage.getItem('chess_access_token');
      if (curToken && curToken !== 'guest_local_token') {
        api.cancelMatchChallenge(curToken, { gameId: gId, reason: 'player_exited' }).catch(() => {});
      }
    }
    if (cancelActiveOnlineMatch) {
      await cancelActiveOnlineMatch('player_exited');
    } else {
      setActiveOnlineMatch(null);
    }
    setInPlaceChatFriend(null);
    setActiveBoardView('board');
    if (chatAutoReturnTimerRef.current) {
      clearTimeout(chatAutoReturnTimerRef.current);
      chatAutoReturnTimerRef.current = null;
    }
    try { localStorage.removeItem('cc_chat_expires_at'); } catch {}
    try { localStorage.removeItem('cc_selected_chat_opponent'); } catch {}
    setMode('computer');
    setSelectedSide('w');
  };

  const handleConfirmCancelMatch = async () => {
    const target = cancelPrompt?.targetMode || 'computer';
    setCancelPrompt(null);
    if (cancelActiveOnlineMatch) {
      await cancelActiveOnlineMatch('board_changed');
    } else {
      setActiveOnlineMatch(null);
    }
    setInPlaceChatFriend(null);
    setActiveBoardView('board');
    if (chatAutoReturnTimerRef.current) {
      clearTimeout(chatAutoReturnTimerRef.current);
      chatAutoReturnTimerRef.current = null;
    }
    try { localStorage.removeItem('cc_chat_expires_at'); } catch {}
    try { localStorage.removeItem('cc_selected_chat_opponent'); } catch {}
    setMode(target);
    if (target === 'computer') setSelectedSide('w');
  };

  const handleExitMatch = () => {
    if (chessBoardRef.current?.handleResign) {
      chessBoardRef.current.handleResign();
    } else {
      performExitLiveMatch();
    }
  };

  const handleExitLiveMatch = handleExitMatch;

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
  };

  const handleReturnToChessboard = () => {
    hasUserClosedInPlaceRef.current = true;
    setActiveBoardView('board');
  };

  const handleChatUnlockInPlace = (targetFriend) => {
    setInPlaceChatFriend(targetFriend);
    hasUserClosedInPlaceRef.current = false;
    setActiveBoardView('chat');

    // 5-minute (300 seconds) countdown strictly synchronized with server expiresAt:
    if (chatAutoReturnTimerRef.current) {
      clearTimeout(chatAutoReturnTimerRef.current);
    }
    const remMs = targetFriend?.timeRemaining
      ? targetFriend.timeRemaining * 1000
      : (targetFriend?.expiresAt ? Math.max(0, new Date(targetFriend.expiresAt).getTime() - Date.now()) : 300 * 1000);
    const expiresAt = targetFriend?.expiresAt
      ? new Date(targetFriend.expiresAt).getTime()
      : Date.now() + remMs;
    try {
      localStorage.setItem('cc_chat_expires_at', expiresAt.toString());
    } catch {}

    chatAutoReturnTimerRef.current = setTimeout(() => {
      // 5 Minutes Complete: Automatically return to chessboard
      setActiveBoardView('board');
      hasUserClosedInPlaceRef.current = true;
      try { localStorage.removeItem('cc_chat_expires_at'); } catch {}
    }, remMs);
  };

  const handleGameOver = (resultData) => {
    const oppName = mode === 'computer'
      ? 'Computer'
      : (activeOnlineMatch?.opponentName || friendName || 'Friend (Player 2)');

    const ratingDelta = resultData.ratingChange || (resultData.result === 'Won' ? '+25' : resultData.result === 'Lost' ? '-25' : '+0');

    recordGameResult({
      id: 'match_' + Date.now(),
      opponent: oppName,
      mode: mode === 'computer' ? 'vs Computer' : mode === 'online' ? 'Online 1v1 Match' : 'Play vs Friends',
      result: resultData.result,
      method: resultData.method,
      moves: resultData.moves,
      ratingChange: ratingDelta,
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
            type="button"
            onClick={handleExitMatch}
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

        {(mode === 'online' || mode === 'two-player') && (
          <button
            type="button"
            onClick={handleExitMatch}
            className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-rose-600/30 to-red-600/30 hover:from-rose-600/45 hover:to-red-600/45 border border-rose-500/60 text-rose-200 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md hover:shadow-rose-900/40 hover:scale-105 active:scale-95 cursor-pointer"
            title={mode === 'online' ? 'Exit live online match and forfeit' : 'Exit two-player match and forfeit to opponent'}
          >
            <Flag className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>{mode === 'online' ? 'Exit Live Match' : 'Exit Match'}</span>
          </button>
        )}

        {/* In-Place Chat Toggle Button (when chat has been unlocked for a friend) */}
        {inPlaceChatFriend && (
          <button
            onClick={() => {
              if (activeBoardView === 'chat') {
                handleReturnToChessboard();
              } else {
                hasUserClosedInPlaceRef.current = false;
                setActiveBoardView('chat');
              }
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              activeBoardView === 'chat'
                ? 'bg-amber-500 text-black border border-amber-400'
                : 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 animate-pulse'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              {activeBoardView === 'chat'
                ? `View Chessboard ${isChatUnlocked ? `(${formattedTime})` : ''}`
                : `Chat with ${inPlaceChatFriend.name || inPlaceChatFriend.username || 'Friend'} ${isChatUnlocked ? `(${formattedTime})` : ''}`}
            </span>
          </button>
        )}

        {/* Secret Chat Indicator Badge */}
        {secretUnlocked && !inPlaceChatFriend && (
          <button
            onClick={() => onNavigate && onNavigate('chat')}
            className="py-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-bounce shadow-lg cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Chat {isChatUnlocked ? `(${formattedTime})` : ''}</span>
          </button>
        )}
      </div>

      {/* Main Content Area: Renders in-place WhatsApp Friend Chat or ChessBoard without unmounting */}
      {inPlaceChatFriend && (
        <div className={`w-full rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-[#090e18] animate-in fade-in ${activeBoardView === 'chat' ? 'block' : 'hidden'}`}>
          <div className="px-4 py-2.5 bg-[#0b1424] border-b border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReturnToChessboard}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Return to Chessboard</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-white">
                Chat with {inPlaceChatFriend.name || inPlaceChatFriend.username} (In Place of Board)
              </span>
              {isChatUnlocked && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  ⏱️ {formattedTime}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('chat')}
              className="text-xs text-amber-400/90 hover:text-amber-300 font-bold hidden sm:flex items-center gap-1 transition-colors"
            >
              <span>Full Page</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </button>
          </div>
          <Chat
            embedded={true}
            inPlaceFriend={inPlaceChatFriend}
            onCloseInPlace={handleReturnToChessboard}
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* ChessBoard Container: Stays mounted continuously so WebSocket never reconnects or resets! */}
      <div className={activeBoardView === 'board' ? 'w-full' : 'hidden'}>
        <ChessBoard
          ref={chessBoardRef}
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
          onChatUnlockInPlace={handleChatUnlockInPlace}
        />
      </div>

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

    </div>
  );
}
