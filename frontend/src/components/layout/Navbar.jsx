import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Swords, 
  Trophy, 
  BarChart2, 
  Settings, 
  Bell, 
  User, 
  LogOut, 
  LogIn,
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Mail, 
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSecretChat } from '../../context/SecretChatContext';

export default function Navbar({ activeTab = 'home', onTabChange }) {
  const { 
    user, 
    logout, 
    friendNotifications = [], 
    respondFriendRequest,
    respondMatchChallenge,
    setActiveOnlineMatch
  } = useAuth();
  const { isChatUnlocked, formattedTime, openChatModal } = useSecretChat ? (useSecretChat() || {}) : {};
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (tab) => {
    if (tab === 'chat') {
      openChatModal();
      if (onTabChange) onTabChange('chat');
      setMobileMenuOpen(false);
      setNotifOpen(false);
      setProfileOpen(false);
      return;
    }
    if (onTabChange) {
      onTabChange(tab);
    }
    setMobileMenuOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  };

  const notificationsList = [
    {
      id: 1,
      title: 'Match Challenge Received',
      desc: 'Grandmaster_Leo invited you to a 5-minute Blitz duel.',
      time: '10m ago',
      unread: true,
      action: true,
    },
    {
      id: 2,
      title: 'Tactical Puzzle Streak',
      desc: '7-day consecutive streak achieved! Rating +15 ELO.',
      time: '2h ago',
      unread: false,
      action: false,
    },
    {
      id: 3,
      title: 'Think Ahead, Move Smart',
      desc: 'Master the Queen’s Gambit in our featured tactical challenges.',
      time: '1d ago',
      unread: false,
      action: false,
    },
  ];

  return (
    <header className="w-full max-w-7xl mx-auto px-2 sm:px-4 pt-5 pb-3 relative z-50">
      {/* Outer Grand Banner Wrapper */}
      <div className="relative overflow-visible">
        
        {/* Top Center Royal Crown Ornament (Matches Image 1) */}
        <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
          <img
            src="/nav_crown_ornament.png"
            alt="Royal Crown Crest"
            className="w-24 sm:w-32 md:w-36 h-auto object-contain drop-shadow-[0_4px_16px_rgba(245,158,11,0.65)] hover:scale-105 transition-transform"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Decorative Golden Metallic Beveled Background (Positioned behind content so it NEVER clips dropdowns!) */}
        <div className="absolute inset-0 nav-gold-gradient-border nav-gold-chamfer-outer p-[2.5px] rounded-2xl pointer-events-none shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.25)]">
          <div className="w-full h-full nav-gold-chamfer-inner bg-gradient-to-b from-[#111c2e] via-[#09101d] to-[#050811] rounded-[14px]">
            {/* Ambient Gold Shimmer Lighting Highlights */}
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.22)_0%,transparent_70%)]" />
          </div>
        </div>

        {/* Interactive Content Container - UNCLIPPED with overflow-visible */}
        <div className="relative z-20 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between overflow-visible">
          
          {/* ================= LEFT SECTION: BRAND & MAIN KING PROJECT LOGO ================= */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none relative z-10 shrink-0"
            title="ChessCure - Home"
          >
            {/* 3D Golden King Project Logo (Replaced left horse logo) */}
            <div className="relative -ml-1 sm:-ml-2 flex items-center justify-center">
              <img
                src="/nav_king_piece.png"
                alt="Chess Cure King Logo"
                className="w-11 h-14 sm:w-14 sm:h-16 md:w-16 md:h-18 object-contain object-bottom drop-shadow-[0_4px_16px_rgba(245,158,11,0.75)] group-hover:scale-105 group-hover:drop-shadow-[0_4px_22px_rgba(245,158,11,0.95)] transition-all duration-300"
                onError={(e) => {
                  e.target.src = '/chess_cure_logo.jpg';
                  e.target.className = 'w-10 h-10 object-contain rounded-xl border border-amber-500/50 shadow-md';
                }}
              />
            </div>

            {/* Brand Typography */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-white drop-shadow font-sans">
                  Chess
                </span>
                <div className="relative flex items-center">
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-pulse" />
                  <span className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight bg-gradient-to-b from-[#ffe58f] via-[#f59e0b] to-[#d97706] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(245,158,11,0.45)]">
                    Cure
                  </span>
                </div>
              </div>
              {/* Subtitle with diamond ornaments */}
              <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] md:text-[10px] font-extrabold tracking-[0.22em] uppercase text-[#d4af37]">
                <span className="text-amber-500 text-[7px]">◆</span>
                <span>THINK AHEAD. MOVE SMART.</span>
                <span className="text-amber-500 text-[7px]">◆</span>
              </div>
            </div>
          </div>

          {/* ================= CENTER SECTION: NAVIGATION TABS ================= */}
          <nav className="hidden lg:flex items-center justify-center gap-1 sm:gap-2 px-3 py-1 rounded-xl bg-[#080d19]/85 border border-[#d4af37]/40 shadow-inner relative z-10 mx-2">
            
            {/* 1. Home Tab */}
            {activeTab === 'home' ? (
              <button
                onClick={() => handleNavClick('home')}
                className="relative px-4 py-1 flex flex-col items-center justify-center group"
              >
                <div className="nav-hex-border p-[1.5px] rounded-lg">
                  <div className="nav-hex-badge px-3 py-1.5 flex items-center justify-center shadow-lg">
                    <Home className="w-4 h-4 text-black fill-black" />
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-amber-300 mt-0.5 tracking-wide">
                  Home
                </span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('home')}
                className="px-3.5 py-1.5 flex flex-col items-center justify-center text-slate-400 hover:text-white transition-all group relative"
              >
                <Home className="w-4 h-4 text-slate-400 group-hover:text-amber-300 group-hover:scale-110 transition-all" />
                <span className="text-[11px] font-medium tracking-wide mt-1">Home</span>
              </button>
            )}

            {/* 2. Play Chess Tab */}
            <button
              onClick={() => handleNavClick('play')}
              className={`px-3.5 py-1.5 flex flex-col items-center justify-center transition-all group relative ${
                activeTab === 'play' ? 'text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords className={`w-4 h-4 group-hover:scale-110 transition-all ${
                activeTab === 'play' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'
              }`} />
              <span className="text-[11px] font-medium tracking-wide mt-1">Play Chess</span>
              {activeTab === 'play' && (
                <span className="w-5 h-[2px] nav-active-glow-dash rounded-full mt-1" />
              )}
            </button>

            {/* 3. Chat Tab (Available limited amount of time when unlocked, along with Home, Play Chess) */}
            <button
              onClick={() => handleNavClick('chat')}
              className={`px-3.5 py-1.5 flex flex-col items-center justify-center transition-all group relative ${
                activeTab === 'chat' || isChatUnlocked ? 'text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title={isChatUnlocked ? `Secret Chat Channel (${formattedTime} remaining)` : 'Secret Chat Channel (Capture opponent piece within 5 moves to unlock)'}
            >
              <div className="relative">
                <MessageSquare className={`w-4 h-4 group-hover:scale-110 transition-all ${
                  isChatUnlocked 
                    ? 'text-amber-400 animate-bounce' 
                    : activeTab === 'chat' 
                    ? 'text-amber-400' 
                    : 'text-slate-400 group-hover:text-amber-300'
                }`} />
                {isChatUnlocked && (
                  <span className="absolute -top-1 -right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[11px] font-medium tracking-wide">Chat</span>
                {isChatUnlocked && (
                  <span className="text-[9px] px-1 py-0.2 rounded-full bg-amber-500/25 text-amber-300 font-mono font-black border border-amber-500/40">
                    {formattedTime}
                  </span>
                )}
              </div>
              {(activeTab === 'chat' || isChatUnlocked) && (
                <span className="w-5 h-[2px] nav-active-glow-dash rounded-full mt-1" />
              )}
            </button>

            {/* 3. Challenges Tab */}
            <button
              onClick={() => handleNavClick('challenges')}
              className={`px-3.5 py-1.5 flex flex-col items-center justify-center transition-all group relative ${
                activeTab === 'challenges' ? 'text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className={`w-4 h-4 group-hover:scale-110 transition-all ${
                activeTab === 'challenges' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'
              }`} />
              <span className="text-[11px] font-medium tracking-wide mt-1">Challenges</span>
              {activeTab === 'challenges' && (
                <span className="w-5 h-[2px] nav-active-glow-dash rounded-full mt-1" />
              )}
            </button>

            {/* 4. Career Tab */}
            <button
              onClick={() => handleNavClick('profile')}
              className={`px-3.5 py-1.5 flex flex-col items-center justify-center transition-all group relative ${
                activeTab === 'profile' ? 'text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className={`w-4 h-4 group-hover:scale-110 transition-all ${
                activeTab === 'profile' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'
              }`} />
              <span className="text-[11px] font-medium tracking-wide mt-1">Career</span>
              {activeTab === 'profile' && (
                <span className="w-5 h-[2px] nav-active-glow-dash rounded-full mt-1" />
              )}
            </button>

            {/* 5. Settings Tab */}
            <button
              onClick={() => handleNavClick('settings')}
              className={`px-3.5 py-1.5 flex flex-col items-center justify-center transition-all group relative ${
                activeTab === 'settings' ? 'text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className={`w-4 h-4 group-hover:rotate-45 transition-all ${
                activeTab === 'settings' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'
              }`} />
              <span className="text-[11px] font-medium tracking-wide mt-1">Settings</span>
              {activeTab === 'settings' && (
                <span className="w-5 h-[2px] nav-active-glow-dash rounded-full mt-1" />
              )}
            </button>
          </nav>

          {/* ================= RIGHT SECTION: (SEARCH REMOVED), BELL, PROFILE / SIGN IN, MENU ================= */}
          <div className="flex items-center gap-2 sm:gap-2.5 relative z-30 shrink-0">
            
            {/* 1. Notification Bell Action Button */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="nav-round-action-btn w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-amber-300 relative group focus:outline-none cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
                {friendNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-[0_0_8px_#f43f5e] ring-2 ring-[#0a1120] animate-pulse">
                    {friendNotifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-72 sm:w-84 rounded-2xl bg-[#091122] border-2 border-[#d4af37]/60 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(245,158,11,0.3)] py-2.5 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Notifications</span>
                    </div>
                    {friendNotifications.length > 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold">
                        {friendNotifications.length} New Request{friendNotifications.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">All caught up</span>
                    )}
                  </div>
                  
                  <div className="divide-y divide-slate-800/70 max-h-72 overflow-y-auto">
                    {friendNotifications.length > 0 ? (
                      friendNotifications.map((notif) => {
                        const isMatch = notif.type === 'match_challenge';
                        return (
                          <div key={notif.id} className="p-3.5 hover:bg-slate-800/50 transition-colors space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isMatch ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping`} />
                                {isMatch ? '⚔️ Match Challenge' : '🤝 Friend Request'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">Just now</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-snug">
                              <strong className="text-amber-400 font-bold">{notif.senderUsername}</strong>{' '}
                              <span className="text-amber-300/80 font-mono text-[11px]">#{notif.senderPlayerId}</span>{' '}
                              {isMatch ? 'challenged you to a Live Online Match!' : 'sent you a friend invitation!'} (Elo: <strong className="text-white">{notif.senderRating}</strong>)
                            </p>
                            
                            <div className="flex items-center gap-2 pt-1">
                              {isMatch ? (
                                <>
                                  <button
                                    onClick={async () => {
                                      const res = await respondMatchChallenge(notif.id, 'accept');
                                      if (res?.success) {
                                        setActiveOnlineMatch({
                                          gameId: res.gameId,
                                          player1: res.player1,
                                          player2: res.player2,
                                          playerColor: 'b',
                                          opponentName: res.player1,
                                        });
                                        handleNavClick('play');
                                      }
                                    }}
                                    className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1 cursor-pointer transition-all"
                                  >
                                    <Swords className="w-3 h-3" />
                                    <span>Accept & Play</span>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await respondMatchChallenge(notif.id, 'decline');
                                    }}
                                    className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-[10px] font-bold border border-slate-700 cursor-pointer transition-colors"
                                  >
                                    <span>✕ Decline</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={async () => {
                                      await respondFriendRequest(notif.id, 'accept');
                                    }}
                                    className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <span>✓ Accept</span>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await respondFriendRequest(notif.id, 'decline');
                                    }}
                                    className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-[10px] font-bold border border-slate-700 cursor-pointer transition-colors"
                                  >
                                    <span>✕ Decline</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                        <Bell className="w-6 h-6 text-slate-600 mx-auto mb-1.5 opacity-60" />
                        <p className="font-semibold text-slate-300">No new notifications</p>
                        <p className="text-[10px] text-slate-500">Incoming friend requests will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Profile / Sign In Button (Matches Image 1: Gold Pill button with logging dropdown) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="nav-btn-gold-pill px-3.5 sm:px-4 py-1.5 rounded-full flex items-center gap-1.5 text-black font-black text-xs tracking-wider uppercase shadow-md active:scale-95 group focus:outline-none"
                title="Account & Logging Options"
              >
                <User className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span className="font-extrabold max-w-[90px] sm:max-w-[120px] truncate">
                  {user ? user.username : 'Sign In'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-black stroke-[2.5] transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* ================= LOGGING / ACCOUNT DROPDOWN ================= */}
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 rounded-2xl bg-[#091122] border-2 border-[#d4af37]/60 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(245,158,11,0.3)] py-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
                  
                  {/* User Profile Header with Username, Email ID & Badges */}
                  <div className="px-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Player Account
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(245,158,11,0.5)] shrink-0 border border-amber-300">
                        {user ? user.username.slice(0, 1).toUpperCase() : 'G'}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-extrabold text-white truncate leading-tight">
                            {user ? user.username : 'Grandmaster'}
                          </p>
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-amber-300 font-mono truncate mt-0.5">
                          <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate" title={user?.email || 'grandmaster@chesscure.com'}>
                            {user?.email || 'grandmaster@chesscure.com'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Relatable stats & badges */}
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-300 font-bold font-mono flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        {user?.rating || 1540} ELO
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-medium">
                        {user?.skill || user?.title || 'Club Player'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-[10px] text-slate-400 font-mono">
                        {(user?.wins || 84) + (user?.losses || 41) + (user?.draws || 9)} Games
                      </span>
                    </div>
                  </div>

                  {/* Menu Options Group: Profile, Settings, Sign Out */}
                  <div className="py-1">
                    
                    {/* Option 1: Profile (Career / Profile view) */}
                    <button
                      onClick={() => {
                        handleNavClick('profile');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-amber-500/15 hover:text-white transition-colors text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <p className="leading-tight font-bold">Profile</p>
                        <p className="text-[10px] text-slate-400 font-normal">View career rating, games & stats</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Option 2: Settings (Platform preferences) */}
                    <button
                      onClick={() => {
                        handleNavClick('settings');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-amber-500/15 hover:text-white transition-colors text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-black transition-colors shrink-0">
                        <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
                      </div>
                      <div className="flex-1">
                        <p className="leading-tight font-bold">Settings</p>
                        <p className="text-[10px] text-slate-400 font-normal">Sound, board themes & alerts</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Divider */}
                    <div className="border-t border-slate-800 my-1.5 mx-2" />

                    {/* Option 3: Sign Out */}
                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                        if (onTabChange) onTabChange('login');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors shrink-0">
                        <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      </div>
                      <div className="flex-1">
                        <p className="leading-tight font-bold">Sign Out</p>
                        <p className="text-[10px] text-rose-300/70 font-normal">Exit current player session</p>
                      </div>
                    </button>

                    {/* Option 4: Switch Account / Sign In */}
                    {(!user || user.isGuest) && (
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          if (onTabChange) onTabChange('login');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left"
                      >
                        <LogIn className="w-4 h-4 text-emerald-400" />
                        <span>Sign In / Switch Account</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden nav-round-action-btn w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-amber-300 group focus:outline-none"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-amber-400" />
              ) : (
                <Menu className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>
        </div>

        {/* ================= MOBILE / RESPONSIVE NAVIGATION DRAWER ================= */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 p-3 rounded-2xl bg-[#091122] border-2 border-[#d4af37]/50 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-3 duration-200">
            <button
              onClick={() => handleNavClick('home')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>Home</span>
            </button>

            <button
              onClick={() => handleNavClick('play')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'play'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Play Chess</span>
            </button>

            {/* Mobile Chat Tab */}
            <button
              onClick={() => handleNavClick('chat')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'chat' || isChatUnlocked
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Chat</span>
              </div>
              {isChatUnlocked ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40 animate-pulse">
                  ⏱ {formattedTime}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">Secret</span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('challenges')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'challenges'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Challenges</span>
            </button>

            <button
              onClick={() => handleNavClick('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Career / Profile</span>
            </button>

            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Settings</span>
            </button>

            <div className="border-t border-slate-800 pt-2 mt-2">
              <div className="p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/40">
                    {user ? user.username.slice(0, 1).toUpperCase() : 'G'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{user?.username || 'Grandmaster'}</p>
                    <p className="text-[11px] text-amber-400/90 font-mono">{user?.email || 'grandmaster@chesscure.com'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    if (onTabChange) onTabChange('login');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/25 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
