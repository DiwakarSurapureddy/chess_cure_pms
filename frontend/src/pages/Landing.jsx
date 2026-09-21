import React, { useState } from 'react';
import { 
  ArrowRight, 
  ChevronRight, 
  Crown, 
  Users, 
  Puzzle, 
  Bot, 
  MessageSquare, 
  Trophy, 
  Sparkles, 
  Activity, 
  ShieldCheck,
  Swords,
  Brain,
  Zap,
  BookOpen,
  Target
} from 'lucide-react';

export default function Landing({ onSelectMode, onNavigate, onOpenAbout }) {
  const trainingModes = [
    {
      id: 'smothered',
      title: 'Tactics & Smothered Mate',
      desc: 'Execute famous tactical combinations with move-by-move checkmate validation.',
      badge: 'Interactive Puzzle',
      points: '+50 PTS',
      icon: <Brain className="w-6 h-6 text-amber-400" />,
      action: () => onNavigate ? onNavigate('challenge') : null,
      btnText: 'Solve Tactics',
    },
    {
      id: 'endgame',
      title: 'Endgame Mastery Drills',
      desc: 'Practice critical pawn promotion, opposition, and rook endgame techniques.',
      badge: 'Strategic Drills',
      points: '+30 PTS',
      icon: <Target className="w-6 h-6 text-emerald-400" />,
      action: () => onNavigate ? onNavigate('vs-computer') : null,
      btnText: 'Practice Drills',
    },
    {
      id: 'openings',
      title: 'Grandmaster Openings',
      desc: 'Study mainline Sicilian, Ruy Lopez, and Queen’s Gambit repertoires.',
      badge: 'Repertoire',
      points: '+25 PTS',
      icon: <BookOpen className="w-6 h-6 text-blue-400" />,
      action: () => onNavigate ? onNavigate('vs-computer') : null,
      btnText: 'Study Lines',
    },
    {
      id: 'speed',
      title: 'Speed Tactics Sprint',
      desc: 'Test your decision latency and calculate winning moves under 60-second pressure.',
      badge: 'Cognitive Sprint',
      points: '+50 PTS',
      icon: <Zap className="w-6 h-6 text-amber-300" />,
      action: () => onNavigate ? onNavigate('challenge') : null,
      btnText: 'Start Sprint',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden">
      
      {/* 
        Full-Screen Opening / Hero Background:
        Luxury chess-themed background with subtle chessboard elements, glow, blur, and smooth animations
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Artwork Image */}
        <img
          src="/chess_knight_hero.jpg"
          alt="Chess Cure Background Artwork"
          className="w-full h-full object-cover object-center filter blur-md sm:blur-lg opacity-25 scale-105 transition-transform duration-1000 animate-float"
        />
        
        {/* Subtle Perspective Chessboard Overlay */}
        <div className="absolute inset-0 hero-chess-grid opacity-25 pointer-events-none" />

        {/* Concentric Golden Ambient Rings behind Center Hero */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] rounded-full border border-amber-500/15 animate-spin-slow pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] sm:w-[620px] sm:h-[620px] rounded-full border border-amber-500/10 animate-spin-reverse-slow pointer-events-none" />

        {/* Ambient glowing radial orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Layered dark gradients for obsidian ambience */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080c14]/85 via-[#080c14]/75 to-[#080c14]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,12,20,0.85)_100%)]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 w-full flex-1 flex flex-col justify-between space-y-14">
        
        {/* 
          HERO OPENING SECTION:
          1. Center Upper Chess-King/Keyhole visual logo emblem with animated glowing halo
          2. Majestic "CHESS CURE" centered as the main brand heading in premium gold/white style
          3. Tagline "Think Ahead · Move Smart" elegantly beneath
        */}
        <section className="flex flex-col items-center justify-center text-center pt-2 sm:pt-4 space-y-6">
          
          {/* Visual Logo Emblem: Centered, King/Keyhole portion only with luxury gold ambient aura */}
          <div className="relative group animate-fade-in-up">
            <div className="absolute -inset-6 bg-gradient-to-r from-amber-500/30 via-amber-400/35 to-amber-600/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-90" />
            
            <div className="relative rounded-full p-2.5 sm:p-3.5 bg-[#080d19]/90 border border-amber-500/45 shadow-[0_0_50px_rgba(229,169,60,0.4)] backdrop-blur-2xl animate-float-gentle">
              <img
                src="/chess_cure_emblem.png"
                alt="Chess Cure King & Keyhole Official Emblem"
                className="w-36 h-36 xs:w-44 xs:h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 object-contain rounded-full brand-emblem-glow transform transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Centered Main Brand Heading: "CHESS CURE" with premium gold/white chess-themed style */}
          <div className="space-y-4 max-w-4xl mx-auto px-2 animate-fade-in-up">
            
            {/* Cognitive PMS Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cognitive Acuity & Tactical Performance Management System</span>
            </div>

            {/* Central Majestic Brand Heading */}
            <div className="space-y-2">
              <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-wider uppercase brand-title-gold select-none leading-none">
                CHESS CURE
              </h1>
              
              {/* Elegant Tagline Bar */}
              <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-semibold tracking-[0.28em] text-amber-300/90 uppercase pt-1">
                <span className="w-8 sm:w-16 h-[1.5px] bg-gradient-to-r from-transparent to-amber-400/80" />
                <span>Think Ahead · Move Smart</span>
                <span className="w-8 sm:w-16 h-[1.5px] bg-gradient-to-l from-transparent to-amber-400/80" />
              </div>
            </div>

            {/* Subtitle description */}
            <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed pt-1">
              Elevate strategic calculation, spar against Stockfish-calibrated neural bots, challenge friends via Player ID, and unlock encrypted Grandmaster analysis.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
              <button
                onClick={() => onNavigate ? onNavigate('vs-computer') : null}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-extrabold text-sm shadow-[0_0_22px_rgba(229,169,60,0.35)] hover:shadow-[0_0_32px_rgba(229,169,60,0.55)] transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Play vs Computer</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={() => onNavigate ? onNavigate('with-friends') : null}
                className="px-6 py-3.5 rounded-xl bg-slate-900/90 border border-amber-500/50 hover:border-amber-400 text-white font-bold text-sm transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>Play with Friends (ID)</span>
              </button>

              <button
                onClick={() => onNavigate ? onNavigate('challenge') : null}
                className="px-5 py-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Chess Challenge</span>
              </button>
            </div>
          </div>

          {/* Quick Telemetry Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 w-full max-w-3xl">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Puzzles Solved</p>
              <p className="text-lg font-extrabold text-amber-400 mt-0.5">14,800+</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Cognitive Index</p>
              <p className="text-lg font-extrabold text-emerald-400 mt-0.5">96.4%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Active Sparring</p>
              <p className="text-lg font-extrabold text-white mt-0.5">3,240 Online</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">GM Clearance</p>
              <p className="text-lg font-extrabold text-amber-300 mt-0.5">Encrypted</p>
            </div>
          </div>
        </section>

        {/* 
          FEATURED GAMES SECTION:
          1. Play vs Computer (Interactive Board against AI)
          2. Play with Friends (Ludo-style multiplayer Friend ID system)
        */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-400" />
                <span>Featured Game Arenas</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full interactive boards with move validation, engine replies, and live private lobbies
              </p>
            </div>
            <span className="text-xs text-amber-400 font-semibold">2 Arena Types Live</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Play vs Computer */}
            <div 
              onClick={() => onNavigate && onNavigate('vs-computer')}
              className="group relative rounded-3xl p-7 bg-gradient-to-br from-[#0d1628] via-[#101c33] to-[#0d1628] border border-amber-500/35 hover:border-amber-400 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-[0_0_30px_rgba(229,169,60,0.25)] flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Bot className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
                    Adaptive AI Bot
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
                    Play vs Computer
                  </h3>
                  <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                    Interactive 8x8 standard chess match against neural bots. Features legal move indicators, audio piece knock, turn indicator, score counter, resign, and restart options.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Beginner · Intermediate · Master</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigate) onNavigate('vs-computer');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#e5a93c] group-hover:bg-[#f5b94e] text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <span>Launch Match</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Card 2: Play with Friends (Ludo Style) */}
            <div 
              onClick={() => onNavigate && onNavigate('with-friends')}
              className="group relative rounded-3xl p-7 bg-gradient-to-br from-[#0c1527] via-[#0f1a30] to-[#0c1527] border border-blue-500/35 hover:border-blue-400 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Users className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                    Friend ID System
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-white group-hover:text-blue-400 transition-colors">
                    Play with Friends
                  </h3>
                  <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                    Multiplayer lobby similar to Ludo: generate your unique Player ID, challenge friends by ID, accept private room requests, and play private rapid chess matches.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Unique ID (e.g. CC-784291)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigate) onNavigate('with-friends');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-500 group-hover:bg-blue-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <span>Open Lobby</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 
          TRAINING MODES SECTION:
          Tactics, Endgame Mastery, Grandmaster Openings, Speed Tactics Sprint
        */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Brain className="w-5 h-5 text-amber-400" />
                <span>Tactical Training Modes</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted practice modules engineered to sharpen cognitive acuity and pattern recognition
              </p>
            </div>
            <span className="text-xs text-amber-400 font-semibold">4 Practice Modules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trainingModes.map((item) => (
              <div
                key={item.id}
                onClick={item.action}
                className="p-5 rounded-2xl glass-card border border-slate-800 hover:border-amber-500/40 hover:bg-[#0e172a] transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {item.points}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    {item.badge}
                  </span>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>{item.btnText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Challenge Unlock Banner: Connects directly to Challenge or Chat */}
        <section
          onClick={() => onNavigate ? onNavigate('challenge') : null}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b1424] via-[#0f1c33] to-[#0c1525] border border-amber-500/40 px-6 sm:px-8 py-6 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all duration-300 shadow-xl group"
        >
          <div className="flex items-center gap-5 z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-amber-400/80 bg-amber-500/15 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(229,169,60,0.25)] group-hover:scale-105 transition-transform">
              <Crown className="w-8 h-8 text-[#e5a93c]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                  Daily Challenge Active
                </span>
                <span className="text-xs text-emerald-400 font-semibold">+50 PTS</span>
              </div>
              <h4 className="text-white font-bold text-base sm:text-xl tracking-tight mt-1">
                Complete Chess Challenges & Unlock Secure GM Chat
              </h4>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Verify tactical move solutions to earn clearance for real-time Grandmaster review rooms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 z-10">
            <div className="hidden sm:flex items-center gap-1.5 opacity-20 text-slate-300 group-hover:opacity-40 transition-opacity mr-2">
              <MessageSquare className="w-10 h-10 fill-current text-amber-400" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 group-hover:bg-amber-500/30 flex items-center justify-center text-amber-400 transition-colors">
              <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </section>

        {/* Footer / Quote Section */}
        <footer className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10 text-xs text-slate-500 border-t border-slate-900">
          <p className="italic font-light tracking-wide text-slate-400/70">
            "The best move is the one that builds a better you." — Chess Cure PMS
          </p>
          <p className="text-slate-600 mt-2 sm:mt-0">
            Cognitive Acuity & Performance Management System © 2026
          </p>
        </footer>
      </div>
    </div>
  );
}
