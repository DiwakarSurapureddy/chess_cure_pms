import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AboutModal from './components/common/AboutModal';
import { X, Trophy, Swords, Brain, Sparkles, Play, Shield, Activity, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'login' | 'signup' | 'stats' | 'settings'
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [modalState, setModalState] = useState(null); // 'computer' | 'online' | 'puzzle' | 'challenge' | null
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const handleSelectMode = (modeId) => {
    setModalState(modeId);
  };

  const handleNavigate = (tab) => {
    if (tab === 'about') {
      setAboutModalOpen(true);
      return;
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (profile) => {
    setIsAuthenticated(true);
    setUserProfile(profile);
    setActiveTab('home');
  };

  const handleRegisterSuccess = (profile) => {
    setIsAuthenticated(true);
    setUserProfile(profile);
    setActiveTab('home');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Responsive Navigation */}
      <Navbar 
        activeTab={activeTab} 
        onTabChange={handleNavigate}
        onOpenAbout={() => setAboutModalOpen(true)}
        isAuthenticated={isAuthenticated}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col justify-center">
        
        {/* Home / Landing Page */}
        {activeTab === 'home' && (
          <Landing 
            onSelectMode={handleSelectMode} 
            onNavigate={handleNavigate}
            onOpenAbout={() => setAboutModalOpen(true)}
          />
        )}

        {/* Login Page */}
        {activeTab === 'login' && (
          <Login 
            onNavigate={handleNavigate} 
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {/* Register / Signup Page */}
        {activeTab === 'signup' && (
          <Signup 
            onNavigate={handleNavigate} 
            onRegisterSuccess={handleRegisterSuccess}
          />
        )}

        {/* Player Statistics View */}
        {activeTab === 'stats' && (
          <div className="max-w-4xl mx-auto px-6 py-12 w-full text-center space-y-8 animate-fade-in">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-block">
                PMS Clinical Acuity & Tactics
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Player Performance Diagnostics</h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto">
                Real-time metrics tracking decision latency, blunder avoidance, and rating trajectory.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="p-6 rounded-2xl glass-card text-left space-y-2 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tactical Rating</p>
                  <Activity className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-4xl font-extrabold text-[#e5a93c]">
                  {userProfile?.rating || '1,540'}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span>+42 points</span>
                  <span className="text-slate-500">this session</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl glass-card text-left space-y-2 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Win Rate</p>
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-4xl font-extrabold text-white">67.4%</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>142 Games logged</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl glass-card text-left space-y-2 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Puzzles Solved</p>
                  <Brain className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-4xl font-extrabold text-amber-400">388</p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span>Top 4% ranking</span>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="pt-4">
              <button
                onClick={() => handleNavigate('home')}
                className="px-6 py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-sm transition-all shadow-[0_0_20px_rgba(229,169,60,0.3)] hover:scale-105"
              >
                Launch New Match
              </button>
            </div>
          </div>
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto px-6 py-12 w-full space-y-6 animate-fade-in">
            <h2 className="text-3xl font-extrabold text-white">Platform Settings</h2>
            <div className="space-y-5 rounded-2xl glass-card p-6 text-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <p className="font-semibold text-white">Board Theme</p>
                  <p className="text-xs text-slate-400">Dark Obsidian & Warm Gold Ambient</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/30">Active</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <p className="font-semibold text-white">Tactical Audio Cues</p>
                  <p className="text-xs text-slate-400">Crisp piece movement and checkmate audio</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">AI Engine Difficulty</p>
                  <p className="text-xs text-slate-400">Dynamic Adaptive (Level 7 / 2100 Elo)</p>
                </div>
                <button className="text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline">
                  Configure
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* About Modal */}
      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Interactive Game Mode Modals */}
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl glass-card p-6 sm:p-7 shadow-2xl space-y-5 animate-fade-in-up">
            <button
              onClick={() => setModalState(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {modalState === 'computer' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(229,169,60,0.25)]">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Play vs Computer</h3>
                  <p className="text-sm text-slate-400 mt-1">Select your difficulty level to start practicing with the engine.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {['Beginner', 'Intermediate', 'Grandmaster'].map((lvl, idx) => (
                    <button
                      key={lvl}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        idx === 1
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setModalState(null)}
                  className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-sm shadow-[0_0_20px_rgba(229,169,60,0.3)] hover:shadow-[0_0_28px_rgba(229,169,60,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Match
                </button>
              </div>
            )}

            {modalState === 'online' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.25)]">
                  <Swords className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Online Matchmaking</h3>
                  <p className="text-sm text-slate-400 mt-1">Quick match with players at your rating level.</p>
                </div>
                <div className="flex items-center justify-center py-6">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <p className="text-xs text-slate-400">Searching global pool (1500-1600)...</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalState(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel Matchmaking
                </button>
              </div>
            )}

            {modalState === 'puzzle' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Daily Tactical Puzzle</h3>
                  <p className="text-sm text-slate-400 mt-1">White to move and find mate in 3.</p>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-amber-300/90 font-mono text-center">
                  Theme: Smothered Mate (#Tactics)
                </div>
                <button
                  onClick={() => setModalState(null)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-sm shadow-[0_0_20px_rgba(229,169,60,0.3)] hover:shadow-[0_0_28px_rgba(229,169,60,0.45)] transition-all cursor-pointer"
                >
                  Solve Now (+15 pts)
                </button>
              </div>
            )}

            {modalState === 'challenge' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(229,169,60,0.25)]">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Grandmaster Chat Challenge</h3>
                  <p className="text-sm text-slate-400 mt-1">Win 3 rated matches today to unlock the exclusive GM analysis room.</p>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <span className="text-amber-400 font-bold">2 / 3 Completed</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 w-2/3 rounded-full" />
                  </div>
                </div>
                <button
                  onClick={() => setModalState(null)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-sm shadow-[0_0_20px_rgba(229,169,60,0.3)] hover:shadow-[0_0_28px_rgba(229,169,60,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Continue Challenge
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
