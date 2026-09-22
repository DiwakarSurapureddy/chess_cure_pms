import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ChessChallenge from './pages/ChessChallenge';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import { Swords, X, Volume2, Moon, Shield, Palette } from 'lucide-react';

function AppContent() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'play' | 'challenges' | 'profile' | 'settings' | 'login' | 'signup' | 'forgot-password'
  const [selectedGameMode, setSelectedGameMode] = useState('computer');
  const [onlineModalOpen, setOnlineModalOpen] = useState(false);

  const handleStartGame = (modeId) => {
    if (modeId === 'online') {
      setOnlineModalOpen(true);
    } else {
      setSelectedGameMode(modeId);
      setCurrentView('play');
    }
  };

  const handleOnlineStart = () => {
    setOnlineModalOpen(false);
    setSelectedGameMode('two-player');
    setCurrentView('play');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header Navigation */}
      <Navbar activeTab={currentView} onTabChange={(tab) => setCurrentView(tab)} />

      {/* Main Page Routing */}
      <main className="flex-1 flex flex-col justify-center">
        {currentView === 'home' && (
          <Landing onStartGame={handleStartGame} onNavigate={(tab) => setCurrentView(tab)} />
        )}

        {currentView === 'play' && (
          <Dashboard initialMode={selectedGameMode} />
        )}

        {currentView === 'challenges' && (
          <ChessChallenge />
        )}

        {currentView === 'profile' && (
          <Profile onNavigate={(tab) => setCurrentView(tab)} />
        )}

        {currentView === 'login' && (
          <Login onNavigate={(tab) => setCurrentView(tab)} />
        )}

        {currentView === 'signup' && (
          <Signup onNavigate={(tab) => setCurrentView(tab)} />
        )}

        {currentView === 'forgot-password' && (
          <ForgotPassword onNavigate={(tab) => setCurrentView(tab)} />
        )}

        {currentView === 'settings' && (
          <div className="max-w-2xl mx-auto px-6 py-12 w-full space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-extrabold text-white">Platform Settings</h2>
            <div className="space-y-4 rounded-3xl bg-[#0c1424] border border-slate-800 p-6 text-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="font-semibold text-white">Board Theme</p>
                    <p className="text-xs text-slate-400">Dark Obsidian & Warm Gold Accent</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/30 font-semibold">
                  Default Active
                </span>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-semibold text-white">Piece Audio Effects</p>
                    <p className="text-xs text-slate-400">Play realistic sounds on piece moves and captures</p>
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500 rounded cursor-pointer" />
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-semibold text-white">Secret Move Notification</p>
                    <p className="text-xs text-slate-400">Visual confetti and trigger indicator on perfect moves</p>
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500 rounded cursor-pointer" />
              </div>
            </div>
          </div>
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
