import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SecretChatProvider } from './context/SecretChatContext';
import SecretChatModal from './components/chat/SecretChatModal';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ChessChallenge from './pages/ChessChallenge';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import { Swords, X, Users, User, ArrowRight, Loader2, Sparkles, Trophy, Hash, Search } from 'lucide-react';

const VIEW_STORAGE_KEY = 'cc_active_view';
const VALID_VIEWS = ['home', 'play', 'challenges', 'profile', 'settings', 'login', 'signup', 'forgot-password'];

function getInitialView() {
  try {
    const hash = window.location.hash.replace('#', '').trim();
    if (VALID_VIEWS.includes(hash)) return hash;

    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved && VALID_VIEWS.includes(saved)) {
      return saved;
    }

    const token = localStorage.getItem('cc_auth_token');
    if (token) return 'home';

    return 'login';
  } catch {
    return 'login';
  }
}

function AppContent() {
  const { 
    user, 
    token, 
    friendsList = [],
    sendMatchChallenge,
    checkChallengeStatus,
    setActiveOnlineMatch
  } = useAuth();
  // Persistent active view across page refreshes
  const [currentView, setCurrentView] = useState(getInitialView);
  const [selectedGameMode, setSelectedGameMode] = useState('computer');
  const [onlineModalOpen, setOnlineModalOpen] = useState(false);
  const [modalTargetFriend, setModalTargetFriend] = useState(null);
  const [modalGameIdInput, setModalGameIdInput] = useState('');
  const [modalStatusMsg, setModalStatusMsg] = useState('');
  const modalPollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (modalPollRef.current) clearInterval(modalPollRef.current);
    };
  }, []);

  // Stable navigation function syncing URL hash & localStorage
  const navigateTo = (view) => {
    setCurrentView(view);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
      window.location.hash = view;
    } catch {}
  };

  // Sync state on view changes
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, currentView);
      if (window.location.hash.replace('#', '') !== currentView) {
        window.location.hash = currentView;
      }
    } catch {}
  }, [currentView]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (VALID_VIEWS.includes(hash)) {
        setCurrentView(hash);
        localStorage.setItem(VIEW_STORAGE_KEY, hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // When user is authenticated, redirect away from login/signup views if needed
  useEffect(() => {
    if (token && (currentView === 'login' || currentView === 'signup' || currentView === 'forgot-password')) {
      const savedNonAuth = localStorage.getItem(VIEW_STORAGE_KEY);
      if (savedNonAuth && !['login', 'signup', 'forgot-password'].includes(savedNonAuth)) {
        navigateTo(savedNonAuth);
      } else {
        navigateTo('home');
      }
    }
  }, [token]);

  const handleStartGame = (modeId) => {
    if (modeId === 'online') {
      setOnlineModalOpen(true);
      setModalStatusMsg('');
      setModalTargetFriend(null);
    } else {
      setActiveOnlineMatch(null);
      setSelectedGameMode(modeId);
      navigateTo('play');
    }
  };

  const handleOnlineStart = () => {
    setOnlineModalOpen(false);
    setActiveOnlineMatch({
      gameId: 'quick_' + Date.now(),
      player1: user?.username || 'You',
      player2: 'Grandmaster_Leo',
      playerColor: 'w',
      opponentName: 'Grandmaster_Leo',
    });
    setSelectedGameMode('online');
    navigateTo('play');
  };

  const handleChallengeFriendFromModal = async (friend) => {
    if (!friend?.playerId) return;
    setModalTargetFriend(friend);
    setModalStatusMsg(`Sending match challenge to ${friend.username || friend.name}...`);
    try {
      const res = await sendMatchChallenge(friend.playerId);
      if (res?.success && res.gameId) {
        setModalStatusMsg(`Challenge sent! Waiting for ${friend.username || friend.name} to accept...`);
        if (modalPollRef.current) clearInterval(modalPollRef.current);
        modalPollRef.current = setInterval(async () => {
          try {
            const st = await checkChallengeStatus(res.gameId);
            if (st?.status === 'accepted') {
              clearInterval(modalPollRef.current);
              modalPollRef.current = null;
              setModalStatusMsg('🎉 Challenge Accepted! Loading live match...');
              setActiveOnlineMatch({
                gameId: res.gameId,
                player1: user?.username || 'Player 1',
                player2: friend.username || friend.name,
                playerColor: 'w',
                opponentName: friend.username || friend.name,
              });
              setTimeout(() => {
                setOnlineModalOpen(false);
                setModalTargetFriend(null);
                navigateTo('play');
              }, 1200);
            } else if (st?.status === 'declined') {
              clearInterval(modalPollRef.current);
              modalPollRef.current = null;
              setModalStatusMsg('Challenge was declined by opponent.');
              setTimeout(() => setModalTargetFriend(null), 3000);
            }
          } catch (e) {
            console.warn(e);
          }
        }, 1500);
      } else {
        setModalStatusMsg(res?.message || 'Failed to send challenge.');
      }
    } catch (err) {
      setModalStatusMsg(err.message || 'Error challenging player.');
    }
  };

  const handleDirectGameIdChallenge = async (e) => {
    e.preventDefault();
    if (!modalGameIdInput.trim() || modalGameIdInput.trim().length !== 6) {
      setModalStatusMsg('Please enter a valid 6-digit Game ID (e.g. 100003)');
      return;
    }
    await handleChallengeFriendFromModal({ 
      playerId: modalGameIdInput.trim(), 
      username: `Player #${modalGameIdInput.trim()}` 
    });
  };

  const handleCloseOnlineModal = () => {
    if (modalPollRef.current) {
      clearInterval(modalPollRef.current);
      modalPollRef.current = null;
    }
    setOnlineModalOpen(false);
    setModalTargetFriend(null);
    setModalStatusMsg('');
  };

  const isAuthView = currentView === 'login' || currentView === 'signup' || currentView === 'forgot-password';

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header Navigation */}
      {!isAuthView && (
        <Navbar activeTab={currentView} onTabChange={(tab) => navigateTo(tab)} />
      )}

      {/* Main Page Routing */}
      <main className="flex-1 flex flex-col justify-center">
        {currentView === 'home' && (
          <Landing onStartGame={handleStartGame} onNavigate={(tab) => navigateTo(tab)} />
        )}

        {currentView === 'play' && (
          <Dashboard
            key={selectedGameMode}
            initialMode={selectedGameMode}
            onNavigate={(tab) => navigateTo(tab)}
          />
        )}

        {currentView === 'challenges' && (
          <ChessChallenge onNavigate={(tab) => navigateTo(tab)} />
        )}

        {currentView === 'profile' && (
          <Profile onNavigate={(tab) => navigateTo(tab)} />
        )}

        {currentView === 'login' && (
          <Login onNavigate={(tab) => navigateTo(tab)} onLoginSuccess={() => navigateTo('home')} />
        )}

        {currentView === 'signup' && (
          <Signup onNavigate={(tab) => navigateTo(tab)} />
        )}

        {currentView === 'forgot-password' && (
          <ForgotPassword onNavigate={(tab) => navigateTo(tab)} />
        )}

        {currentView === 'settings' && (
          <Settings onNavigate={(tab) => navigateTo(tab)} />
        )}
      </main>

      {/* Online Matchmaking & Friend Challenge Modal */}
      {onlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0b1322] border-2 border-[#d4af37]/50 p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-5">
            <button
              onClick={handleCloseOnlineModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Swords className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">Online Multiplayer Arena</h3>
              {/* Online Now Active Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>24 Players Online Now • Active</span>
              </div>
            </div>

            {/* If challenging a player: show waiting state */}
            {modalTargetFriend ? (
              <div className="p-5 rounded-2xl bg-[#070c16] border border-slate-800 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center text-lg font-black mx-auto shadow-md shadow-amber-500/30">
                  {modalTargetFriend.username ? modalTargetFriend.username[0].toUpperCase() : 'P'}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    Challenge Sent to {modalTargetFriend.username || modalTargetFriend.name}
                  </h4>
                  <p className="text-xs text-amber-400 font-mono mt-0.5">
                    Game ID: #{modalTargetFriend.playerId}
                  </p>
                </div>

                <div className="py-2 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <p className="text-xs text-slate-300">{modalStatusMsg}</p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseOnlineModal}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  Cancel Challenge
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                {/* Option 1: Quick 1v1 Online Match */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#0e182a] to-[#0e182a] border border-amber-500/40 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span>⚡ Quick 1v1 Match</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                        Instant
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Pair immediately with an active online chess player.
                    </p>
                  </div>
                  <button
                    onClick={handleOnlineStart}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-md shrink-0 cursor-pointer"
                  >
                    Play Now
                  </button>
                </div>

                {/* Option 2: Challenge Active Online Friends */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>Challenge Online Friends ({friendsList.length})</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">● Online & Ready</span>
                  </div>

                  {friendsList.length > 0 ? (
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {friendsList.map((friend) => (
                        <div
                          key={friend.id || friend.playerId}
                          className="p-3 rounded-xl bg-[#070c16] border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                              {friend.username ? friend.username[0].toUpperCase() : 'F'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h5 className="text-xs font-bold text-white">{friend.username}</h5>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">
                                #{friend.playerId} • Elo: {friend.rating || 1200}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleChallengeFriendFromModal(friend)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black font-extrabold text-xs border border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Swords className="w-3 h-3" />
                            <span>Play</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#070c16] border border-slate-800 text-center text-xs text-slate-400">
                      No friends in your list yet. You can challenge any player directly with their 6-digit Game ID below.
                    </div>
                  )}
                </div>

                {/* Option 3: Challenge by 6-digit Game ID directly */}
                <form onSubmit={handleDirectGameIdChallenge} className="pt-2 border-t border-slate-800/80 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Or Challenge by Game ID:
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Hash className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        value={modalGameIdInput}
                        onChange={(e) => setModalGameIdInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit Game ID (e.g. 100003)"
                        className="w-full bg-[#070c16] border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Challenge</span>
                    </button>
                  </div>
                  {modalStatusMsg && (
                    <p className="text-[11px] text-amber-300 text-center">{modalStatusMsg}</p>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SecretChatProvider>
        <AppContent />
        <SecretChatModal />
      </SecretChatProvider>
    </AuthProvider>
  );
}
