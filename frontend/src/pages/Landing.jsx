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
  ShieldCheck 
} from 'lucide-react';

export default function Landing({ onSelectMode, onNavigate, onOpenAbout }) {
  const [activeCard, setActiveCard] = useState('computer');

  const modes = [
    {
      id: 'computer',
      title: 'Play vs Computer',
      desc: 'Challenge dynamic AI bots and improve your strategic calculation.',
      icon: (
        <div className="relative">
          <Bot className="w-8 h-8 text-[#e5a93c]" />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400/20 rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
        </div>
      ),
    },
    {
      id: 'online',
      title: 'Play Online',
      desc: 'Compete against rated chess players globally in real-time.',
      icon: <Users className="w-8 h-8 text-[#7e91ab]" />,
    },
    {
      id: 'puzzle',
      title: 'Tactics & Challenge',
      desc: 'Interactive 8x8 challenge with move validation and score rewards.',
      icon: <Puzzle className="w-8 h-8 text-[#7e91ab]" />,
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden">
      
      {/* 
        Full-Screen Opening / Hero Background:
        Dark, premium chess-themed background with subtle blur overlay and smooth animations
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/chess_knight_hero.jpg"
          alt="Chess Cure Background Artwork"
          className="w-full h-full object-cover object-center filter blur-md sm:blur-lg opacity-20 scale-105 transition-transform duration-1000 animate-float"
        />
        {/* Layered dark gradients for luxury obsidian ambience */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080c14]/90 via-[#080c14]/80 to-[#080c14]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,12,20,0.85)_100%)]" />
        
        {/* Ambient glowing radial orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 w-full flex-1 flex flex-col justify-between space-y-12">
        
        {/* 
          HERO OPENING SECTION:
          1. Complete Chess Cure Logo displayed prominently in the center without cropping
          2. Tagline "Think Ahead, Move Smart" clearly below the main logo
        */}
        <section className="flex flex-col items-center justify-center text-center pt-2 sm:pt-4 space-y-6">
          
          {/* Complete Chess Cure Logo Image: Centered, Uncropped, Fully Visible with Gold Glow */}
          <div className="relative group animate-fade-in-up">
            <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-amber-600/25 rounded-[32px] blur-xl group-hover:blur-2xl transition-all duration-700 opacity-80" />
            
            <div className="relative rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 bg-[#0b1220]/90 border border-amber-500/40 shadow-[0_0_40px_rgba(229,169,60,0.3)] backdrop-blur-xl">
              <img
                src="/chess_knight_hero.jpg"
                alt="Chess Cure Official Emblem"
                className="w-auto h-44 xs:h-52 sm:h-64 md:h-72 lg:h-80 object-contain rounded-xl sm:rounded-2xl transform transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* Tagline & Headline placed clearly BELOW the main Chess Cure logo */}
          <div className="space-y-4 max-w-3xl mx-auto px-2 animate-fade-in-up">
            
            {/* Cognitive PMS Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cognitive Acuity & Performance Management Platform</span>
            </div>

            {/* Main Tagline */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.12]">
              Think Ahead,{' '}
              <span className="text-[#e5a93c] drop-shadow-[0_0_25px_rgba(229,169,60,0.4)]">
                Move Smart.
              </span>
            </h1>

            {/* Subtitle description */}
            <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
              Sharpen your mind with interactive chess challenges, track clinical cognitive acuity, and unlock exclusive Grandmaster secure messaging.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <button
                onClick={() => onNavigate ? onNavigate('challenge') : (onSelectMode && onSelectMode('puzzle'))}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-sm shadow-[0_0_20px_rgba(229,169,60,0.35)] hover:shadow-[0_0_30px_rgba(229,169,60,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Play Chess Challenge</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={() => onNavigate ? onNavigate('dashboard') : (onSelectMode && onSelectMode('computer'))}
                className="px-5 py-3 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-amber-500/40 text-slate-200 hover:text-white font-semibold text-sm transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Open Dashboard</span>
              </button>

              <button
                onClick={() => onOpenAbout && onOpenAbout()}
                className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                About Platform
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

        {/* 3 Game Mode Cards Row */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Featured Game & Training Modes
            </h2>
            <span className="text-xs text-amber-400 font-medium">Select a mode to begin</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {modes.map((mode) => {
              const isSelected = activeCard === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => {
                    setActiveCard(mode.id);
                    if (mode.id === 'puzzle') {
                      if (onNavigate) onNavigate('challenge');
                    } else {
                      if (onSelectMode) onSelectMode(mode.id);
                    }
                  }}
                  className={`group relative rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 sm:h-52 ${
                    isSelected
                      ? 'bg-[#0d1626]/90 border-[1.5px] border-[#e5a93c] shadow-[0_0_25px_-5px_rgba(229,169,60,0.3)]'
                      : 'bg-[#0c1424]/70 border border-[#1a263d]/80 hover:border-slate-600 hover:bg-[#0f192c]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl flex items-center">
                      {mode.icon}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                        {mode.title}
                      </h3>
                      <p className="text-slate-400 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed">
                        {mode.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isSelected
                          ? 'bg-[#e5a93c] text-black shadow-md shadow-amber-500/20 group-hover:bg-[#f5b94e] group-hover:scale-110'
                          : 'bg-[#1b273c] text-slate-400 group-hover:text-white group-hover:bg-[#24344e]'
                      }`}
                    >
                      <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${isSelected ? 'stroke-[2.5]' : ''}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Challenge Unlock Banner: Connects directly to Challenge or Chat */}
        <section
          onClick={() => onNavigate ? onNavigate('challenge') : (onSelectMode && onSelectMode('challenge'))}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b1424] via-[#0f1c33] to-[#0c1525] border border-amber-500/30 px-6 py-6 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all duration-300 shadow-xl group"
        >
          <div className="flex items-center gap-5 z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-amber-400/80 bg-amber-500/15 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(229,169,60,0.25)]">
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
