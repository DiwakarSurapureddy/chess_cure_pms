import React, { useState } from 'react';
import { Home, BarChart2, Settings, ChevronDown, User, LogOut, Shield, Award } from 'lucide-react';

export default function Navbar({ activeTab = 'home', onTabChange }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="w-full max-w-7xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between relative z-50">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 cursor-pointer group select-none">
        <div className="relative flex items-center justify-center">
          {/* Glowing Knight Icon SVG */}
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

      {/* Center Navigation Links */}
      <nav className="flex items-center gap-8">
        <button
          onClick={() => onTabChange && onTabChange('home')}
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
          onClick={() => onTabChange && onTabChange('stats')}
          className={`flex items-center gap-2 text-sm font-medium transition-colors relative py-2 ${
            activeTab === 'stats' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Stats</span>
          {activeTab === 'stats' && (
            <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#e5a93c] rounded-full shadow-[0_0_8px_rgba(229,169,60,0.8)]" />
          )}
        </button>

        <button
          onClick={() => onTabChange && onTabChange('settings')}
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

      {/* Right User Profile */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#101928]/80 border border-slate-700/60 hover:border-slate-600 transition-all text-slate-300 hover:text-white focus:outline-none"
        >
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Profile</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Profile Dropdown */}
        {profileOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0f1828] border border-slate-700/80 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-2 border-b border-slate-800">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-white truncate">Grandmaster #412</p>
            </div>
            <a href="#profile" className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white">
              <User className="w-3.5 h-3.5 text-amber-400" />
              My Profile
            </a>
            <a href="#achievements" className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Achievements
            </a>
            <div className="border-t border-slate-800 my-1"></div>
            <button className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
