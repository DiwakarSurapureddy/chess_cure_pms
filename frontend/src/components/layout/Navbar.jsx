import React, { useState } from 'react';
import { Home, BarChart2, Settings, ChevronDown, User, LogOut, Shield, Award, Trophy, Play, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ activeTab = 'home', onTabChange }) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="w-full max-w-7xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between relative z-50">
      {/* Brand Logo */}
      <div 
        onClick={() => onTabChange('home')}
        className="flex items-center gap-3 cursor-pointer group select-none"
      >
        <div className="relative flex items-center justify-center">
          <svg
            className="w-9 h-9 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-transform duration-300 group-hover:scale-105"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19 22H5a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1zM7 16l-.8-2.4A4.002 4.002 0 0 1 7.2 9H9V7.5a2.5 2.5 0 0 1 4.2-1.83 5.48 5.48 0 0 0 1.94 1.15A3.003 3.003 0 0 1 17 9.64V12a4 4 0 0 1-4 4H7zm3.5-6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
          </svg>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white flex items-center">
          Chess<span className="text-[#e5a93c]">Cure</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-7">
        <button
          onClick={() => onTabChange('home')}
          className={`flex items-center gap-2 text-sm font-medium transition-colors relative py-2 ${
            activeTab === 'home' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
          {activeTab === 'home' && (
            <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#e5a93c] rounded-full shadow-[0_0_8px_rgba(229,169,60,0.8)]" />
          )}
        </button>

        <button
          onClick={() => onTabChange('play')}
          className={`flex items-center gap-2 text-sm font-medium transition-colors relative py-2 ${
            activeTab === 'play' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Play Chess</span>
          {activeTab === 'play' && (
            <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#e5a93c] rounded-full shadow-[0_0_8px_rgba(229,169,60,0.8)]" />
          )}
        </button>

        <button
          onClick={() => onTabChange('challenges')}
          className={`flex items-center gap-2 text-sm font-medium transition-colors relative py-2 ${
            activeTab === 'challenges' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Challenges</span>
          {activeTab === 'challenges' && (
            <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#e5a93c] rounded-full shadow-[0_0_8px_rgba(229,169,60,0.8)]" />
          )}
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className={`flex items-center gap-2 text-sm font-medium transition-colors relative py-2 ${
            activeTab === 'profile' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Career</span>
          {activeTab === 'profile' && (
            <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#e5a93c] rounded-full shadow-[0_0_8px_rgba(229,169,60,0.8)]" />
          )}
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`flex items-center gap-2 text-sm font-medium transition-colors relative py-2 ${
            activeTab === 'settings' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
          {activeTab === 'settings' && (
            <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#e5a93c] rounded-full shadow-[0_0_8px_rgba(229,169,60,0.8)]" />
          )}
        </button>
      </nav>

      {/* Right User Profile / Auth State */}
      <div className="relative">
        {user ? (
          <div>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#101928]/90 border border-slate-700/80 hover:border-slate-600 transition-all text-slate-300 hover:text-white focus:outline-none shadow-md"
            >
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/40">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-semibold max-w-[100px] truncate">{user.username}</span>
              <span className="text-[11px] text-amber-400 font-mono hidden sm:inline">({user.rating})</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0f1828] border border-slate-700/80 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-[11px] text-slate-400">Signed in as</p>
                  <p className="text-xs font-bold text-white truncate">{user.username}</p>
                  {user.isGuest && (
                    <span className="inline-block mt-1 text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full">
                      Guest Account
                    </span>
                  )}
                </div>

                <button
                  onClick={() => { onTabChange('profile'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white text-left"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Career & Profile
                </button>

                <button
                  onClick={() => { onTabChange('settings'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Preferences
                </button>

                <div className="border-t border-slate-800 my-1"></div>

                <button
                  onClick={() => { logout(); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTabChange('login')}
              className="py-1.5 px-4 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
