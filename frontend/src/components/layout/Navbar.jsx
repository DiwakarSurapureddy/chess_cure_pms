import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Info, 
  BarChart2, 
  LogIn, 
  UserPlus, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Sparkles,
  Phone
} from 'lucide-react';

export default function Navbar({ 
  activeTab = 'home', 
  onTabChange, 
  onOpenAbout,
  isAuthenticated = false,
  userProfile = null,
  onLogout 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdownOpen]);

  const handleNav = (tab) => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    if (tab === 'about') {
      if (onOpenAbout) onOpenAbout();
      return;
    }
    if (onTabChange) onTabChange(tab);
  };

  const displayName = userProfile?.username || userProfile?.name || 'Grandmaster';
  const initial = displayName ? displayName[0].toUpperCase() : 'G';
  const displayEmail = userProfile?.email || 'player@chesscure.com';
  const displayPhone = userProfile?.mobileNumber || userProfile?.phone || null;
  const displayRating = userProfile?.rating || 1540;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#080c14]/85 border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo with Cropped Upper King/Keyhole Emblem */}
        <div 
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/35 p-1 shadow-[0_0_15px_rgba(229,169,60,0.25)] group-hover:shadow-[0_0_24px_rgba(229,169,60,0.45)] group-hover:border-amber-400/60 transition-all duration-300">
            <img
              src="/chess_cure_emblem.png"
              alt="Chess Cure Emblem"
              className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(229,169,60,0.5)] transition-transform duration-300 group-hover:scale-110"
            />
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
            className={`flex items-center gap-2 text-sm font-semibold transition-all relative py-2 cursor-pointer ${
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
            className="flex items-center gap-2 text-sm font-semibold transition-all relative py-2 text-slate-300 hover:text-white cursor-pointer"
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>

          <button
            onClick={() => handleNav('stats')}
            className={`flex items-center gap-2 text-sm font-semibold transition-all relative py-2 cursor-pointer ${
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

        {/* Desktop Auth Action Area / Modern Profile Dropdown */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              {/* Profile Pill Trigger Button */}
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                  profileDropdownOpen 
                    ? 'bg-[#152238] border-amber-400/80 shadow-[0_0_15px_rgba(229,169,60,0.25)] text-white' 
                    : 'bg-[#0f172a]/90 hover:bg-[#142036] border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white'
                }`}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500/30 to-amber-400/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs shadow-inner">
                  {initial}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-100 max-w-[130px] truncate leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-medium leading-tight">
                    {displayRating} ELO
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
              </button>

              {/* Modern Browser-Style Floating Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-72 rounded-2xl profile-dropdown-menu p-2 z-50 animate-fade-in-up border border-amber-500/30 shadow-2xl">
                  
                  {/* Dropdown Header: User Info Card */}
                  <div className="p-3 rounded-xl bg-gradient-to-b from-[#131d33] to-[#0d1627] border border-slate-700/60 mb-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(229,169,60,0.4)]">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
                      </div>
                    </div>

                    {/* Additional User Details (Phone & Rating) */}
                    <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                        Rating: {displayRating}
                      </span>
                      {displayPhone && (
                        <span className="text-slate-400 truncate max-w-[120px] flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-500" />
                          <span>{displayPhone}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Navigation Links */}
                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => handleNav('profile')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === 'profile'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <User className="w-4 h-4 text-amber-400" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => handleNav('stats')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === 'stats'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <BarChart2 className="w-4 h-4 text-amber-400" />
                      <span>Tactics & Statistics</span>
                    </button>

                    <button
                      onClick={() => handleNav('settings')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === 'settings'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>Settings & Preferences</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="my-1 border-t border-slate-800" />

                  {/* Logout Action (replaces the standalone red button) */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Login Button */}
              <button
                onClick={() => handleNav('login')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
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
                className="relative group overflow-hidden flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black text-sm font-bold shadow-[0_0_20px_rgba(229,169,60,0.35)] hover:shadow-[0_0_28px_rgba(229,169,60,0.5)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
          {!isAuthenticated ? (
            <button
              onClick={() => handleNav('login')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-amber-400 mr-1"
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => handleNav('profile')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-white"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                {initial}
              </div>
              <span className="max-w-[70px] truncate">{displayName}</span>
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white focus:outline-none cursor-pointer"
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
              className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
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
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4" />
                <span>About ChessCure PMS</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => handleNav('stats')}
              className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
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

            {isAuthenticated && (
              <button
                onClick={() => handleNav('profile')}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>My Profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>

          {/* Mobile Auth Buttons */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
                    {displayPhone && (
                      <p className="text-[11px] text-slate-500 truncate">{displayPhone}</p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                    {displayRating}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleNav('login')}
                  className="w-full py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Login to Your Account</span>
                </button>

                <button
                  onClick={() => handleNav('signup')}
                  className="w-full py-3 rounded-xl bg-[#e5a93c] text-black text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,169,60,0.3)] hover:bg-[#f5b94e] cursor-pointer"
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
