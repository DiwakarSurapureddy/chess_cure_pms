import React, { useState } from 'react';
import { Home, Info, BarChart2, LogIn, UserPlus, Menu, X, ChevronRight, User } from 'lucide-react';

export default function Navbar({ 
  activeTab = 'home', 
  onTabChange, 
  onOpenAbout,
  isAuthenticated = false,
  userProfile = null,
  onLogout 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (tab) => {
    setMobileMenuOpen(false);
    if (tab === 'about') {
      if (onOpenAbout) onOpenAbout();
      return;
    }
    if (onTabChange) onTabChange(tab);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#080c14]/80 border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 shadow-[0_0_15px_rgba(229,169,60,0.2)] group-hover:shadow-[0_0_22px_rgba(229,169,60,0.35)] group-hover:border-amber-400/50 transition-all duration-300">
            {/* Glowing Knight Icon SVG */}
            <svg
              className="w-7 h-7 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-transform duration-300 group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 22H5a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1zM7 16l-.8-2.4A4.002 4.002 0 0 1 7.2 9H9V7.5a2.5 2.5 0 0 1 4.2-1.83 5.48 5.48 0 0 0 1.94 1.15A3.003 3.003 0 0 1 17 9.64V12a4 4 0 0 1-4 4H7zm3.5-6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span>Chess</span>
              <span className="text-[#e5a93c]">Cure</span>
              <span className="ml-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                PMS
              </span>
            </div>
            <span className="text-[10px] text-slate-400 tracking-wider hidden sm:block">
              Cognitive Chess Platform
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => handleNav('home')}
            className={`flex items-center gap-2 text-sm font-semibold transition-all relative py-2 ${
              activeTab === 'home' ? 'text-amber-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
            {activeTab === 'home' && (
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#e5a93c] rounded-full shadow-[0_0_8px_rgba(229,169,60,0.8)]" />
            )}
          </button>

          <button
            onClick={() => handleNav('about')}
            className="flex items-center gap-2 text-sm font-semibold transition-all relative py-2 text-slate-300 hover:text-white"
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>

          <button
            onClick={() => handleNav('stats')}
            className={`flex items-center gap-2 text-sm font-semibold transition-all relative py-2 ${
              activeTab === 'stats' ? 'text-amber-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Stats</span>
            {activeTab === 'stats' && (
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#e5a93c] rounded-full shadow-[0_0_8px_rgba(229,169,60,0.8)]" />
            )}
          </button>
        </nav>

        {/* Desktop Auth Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleNav('stats')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#101928] border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  {userProfile?.name ? userProfile.name[0].toUpperCase() : 'GM'}
                </div>
                <span>{userProfile?.name || 'Grandmaster'}</span>
              </button>
              <button
                onClick={onLogout}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1"
              >
                Log Out
              </button>
            </div>
          ) : (
            <>
              {/* Login Button */}
              <button
                onClick={() => handleNav('login')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'login'
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(229,169,60,0.15)]'
                    : 'text-slate-200 hover:text-white bg-slate-900/60 border border-slate-700/80 hover:border-slate-600 hover:bg-slate-850'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>

              {/* Register Button */}
              <button
                onClick={() => handleNav('signup')}
                className="relative group overflow-hidden flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black text-sm font-bold shadow-[0_0_20px_rgba(229,169,60,0.35)] hover:shadow-[0_0_28px_rgba(229,169,60,0.5)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Register</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          {!isAuthenticated && (
            <button
              onClick={() => handleNav('login')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-amber-400 mr-1"
            >
              Login
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-[#0a1120]/95 backdrop-blur-2xl px-6 py-5 space-y-4 animate-fade-in shadow-2xl">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleNav('home')}
              className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'home'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => handleNav('about')}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4" />
                <span>About ChessCure PMS</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => handleNav('stats')}
              className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'stats'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart2 className="w-4 h-4" />
                <span>Stats & Analytics</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Mobile Auth Buttons */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    {userProfile?.name ? userProfile.name[0].toUpperCase() : 'GM'}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{userProfile?.name || 'Grandmaster'}</p>
                    <p className="text-xs text-slate-400">{userProfile?.email || 'player@chesscure.com'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleNav('login')}
                  className="w-full py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-800"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Login to Your Account</span>
                </button>

                <button
                  onClick={() => handleNav('signup')}
                  className="w-full py-3 rounded-xl bg-[#e5a93c] text-black text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,169,60,0.3)] hover:bg-[#f5b94e]"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Register Free Account</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
