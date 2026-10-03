import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ChessChallenge from './pages/ChessChallenge';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import { Swords, X } from 'lucide-react';

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
  const { user, token } = useAuth();
  // Persistent active view across page refreshes
  const [currentView, setCurrentView] = useState(getInitialView);
  const [selectedGameMode, setSelectedGameMode] = useState('computer');
  const [onlineModalOpen, setOnlineModalOpen] = useState(false);

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
    } else {
      setSelectedGameMode(modeId);
      navigateTo('play');
    }
  };

  const handleOnlineStart = () => {
    setOnlineModalOpen(false);
    setSelectedGameMode('two-player');
    navigateTo('play');
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

      {/* Online Matchmaking Modal */}
      {onlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0e1728] border border-slate-700 p-6 shadow-2xl space-y-5 text-center">
            <button
              onClick={() => setOnlineModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <Swords className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Online Matchmaking</h3>
              <p className="text-xs text-slate-400 mt-1">
                Searching for chess players in rating bracket 1500 - 1600 ELO...
              </p>
            </div>

            <div className="py-4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-3 border-amber-400 border-t-transparent animate-spin mb-3" />
              <p className="text-xs text-amber-300/90 font-mono">Opponent Found: Grandmaster_Leo</p>
            </div>

            <button
              onClick={handleOnlineStart}
              className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-xs uppercase shadow-lg shadow-amber-500/20"
            >
              Enter Match Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
