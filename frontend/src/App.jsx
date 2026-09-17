import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import { X, Trophy, Swords, Brain, Sparkles, Play } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [modalState, setModalState] = useState(null); // 'computer' | 'online' | 'puzzle' | 'challenge' | null

  const handleSelectMode = (modeId) => {
    setModalState(modeId);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

      {/* Main View */}
      <main className="flex-1 flex flex-col justify-center">
        {activeTab === 'home' && (
          <Landing onSelectMode={handleSelectMode} />
        )}

        {activeTab === 'stats' && (
          <div className="max-w-4xl mx-auto px-6 py-12 w-full text-center space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-bold text-white">Player Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              <div className="p-6 rounded-2xl bg-[#0e1626] border border-[#1b283f]">
                <p className="text-slate-400 text-sm">Rating</p>
                <p className="text-3xl font-extrabold text-[#e5a93c] mt-2">1,540</p>
                <span className="text-xs text-emerald-400 font-medium">+35 this week</span>
              </div>
              <div className="p-6 rounded-2xl bg-[#0e1626] border border-[#1b283f]">
                <p className="text-slate-400 text-sm">Win Rate</p>
                <p className="text-3xl font-extrabold text-white mt-2">64.8%</p>
                <span className="text-xs text-slate-400">128 Games played</span>
              </div>
              <div className="p-6 rounded-2xl bg-[#0e1626] border border-[#1b283f]">
                <p className="text-slate-400 text-sm">Puzzles Solved</p>
                <p className="text-3xl font-extrabold text-amber-400 mt-2">342</p>
                <span className="text-xs text-emerald-400 font-medium">Top 5% rank</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto px-6 py-12 w-full space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-bold text-white">Settings</h2>
            <div className="space-y-4 rounded-2xl bg-[#0e1626] border border-[#1b283f] p-6 text-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <p className="font-semibold text-white">Board Theme</p>
                  <p className="text-xs text-slate-400">Dark Obsidian & Warm Gold</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/30">Active</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <p className="font-semibold text-white">Sound Effects</p>
                  <p className="text-xs text-slate-400">Realistic piece clicks and move notifications</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">AI Difficulty</p>
                  <p className="text-xs text-slate-400">Grandmaster Adaptive (Level 7)</p>
                </div>
                <button className="text-xs text-amber-400 hover:underline">Change</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Interactive Modal when clicking any card */}
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0e1828] border border-slate-700 p-6 shadow-2xl space-y-5">
            <button
              onClick={() => setModalState(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {modalState === 'computer' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
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
                  className="w-full mt-4 py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Match
                </button>
              </div>
            )}

            {modalState === 'online' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Swords className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Online Matchmaking</h3>
                  <p className="text-sm text-slate-400 mt-1">Quick match with players at your rating level.</p>
                </div>
                <div className="flex items-center justify-center py-6">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <p className="text-xs text-slate-400">Searching for opponent (1500-1600)...</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalState(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel Matchmaking
                </button>
              </div>
            )}

            {modalState === 'puzzle' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Daily Puzzle</h3>
                  <p className="text-sm text-slate-400 mt-1">White to move and find mate in 3.</p>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-amber-300/90 font-mono text-center">
                  Theme: Smothered Mate (#Tactics)
                </div>
                <button
                  onClick={() => setModalState(null)}
                  className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-sm transition-transform active:scale-[0.98]"
                >
                  Solve Now (+15 pts)
                </button>
              </div>
            )}

            {modalState === 'challenge' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
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
                  className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
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
