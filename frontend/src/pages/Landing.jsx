import React, { useState } from 'react';
import { ArrowRight, ChevronRight, Crown, Users, Bot, Gamepad2, Trophy, Sparkles } from 'lucide-react';

export default function Landing({ onStartGame, onNavigate }) {
  const [activeCard, setActiveCard] = useState('computer');

  const modes = [
    {
      id: 'computer',
      title: 'Play with Computer',
      desc: 'Challenge the AI engine and test your strategic depth.',
      icon: (
        <div className="relative">
          <Bot className="w-8 h-8 text-[#e5a93c]" />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400/20 rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
        </div>
      ),
      isFeatured: true,
    },
    {
      id: 'online',
      title: 'Play Online',
      desc: 'Compete with real chess players around the world in rated matches.',
      icon: <Users className="w-8 h-8 text-[#7e91ab]" />,
      isFeatured: false,
    },
    {
      id: 'two-player',
      title: 'Two Players',
      desc: 'Local Pass & Play mode. Challenge a friend on the same device.',
      icon: <Gamepad2 className="w-8 h-8 text-[#7e91ab]" />,
      isFeatured: false,
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between max-w-7xl mx-auto px-6 pt-4 pb-12 overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center space-y-10 z-10">
        
        {/* Top Hero Section: Headline + 3D Knight Graphic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 pt-2">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-4 pr-4">
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.1] text-white">
              Think Ahead.
              <span className="block text-[#e5a93c] mt-1 font-extrabold">Move Smart.</span>
            </h1>
            <p className="text-slate-300/80 text-base sm:text-lg max-w-md font-normal leading-relaxed pt-1">
              Sharpen your mind with chess challenges and unlock meaningful conversations.
            </p>
          </div>

          {/* Right Hero Visual Column: 3D Chess Knight with warm gold rim light */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end relative">
            <div className="relative w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden flex items-center justify-center group">
              <img
                src="/chess_knight_hero.jpg"
                alt="ChessCure 3D Golden Rim-lit Knight"
                className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-transparent to-transparent opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080c14] via-transparent to-transparent opacity-40 lg:opacity-60" />
            </div>
          </div>
        </div>

        {/* 3 Game Mode Cards Row: Play with Computer, Play Online, Two Players */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {modes.map((mode) => {
            const isSelected = activeCard === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => {
                  setActiveCard(mode.id);
                  onStartGame(mode.id);
                }}
                className={`group relative rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 sm:h-52 ${
                  isSelected
                    ? 'bg-[#0d1626]/90 border-[1.5px] border-[#e5a93c] shadow-[0_0_25px_-5px_rgba(229,169,60,0.3)]'
                    : 'bg-[#0c1424]/70 border border-[#1a263d]/80 hover:border-slate-600 hover:bg-[#0f192c]'
                }`}
              >
                {/* Top Icon and Content */}
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl flex items-center">
                    {mode.icon}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {mode.title}
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed">
                      {mode.desc}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Button Arrow */}
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

        {/* Tactical Challenges Banner */}
        <div 
          onClick={() => onNavigate('challenges')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b1424] via-[#0e192c] to-[#0c1525] border border-[#1b283f] px-6 py-5 flex items-center justify-between cursor-pointer hover:border-amber-500/50 transition-all duration-300 shadow-xl group"
        >
          {/* Left section: Crown + Text */}
          <div className="flex items-center gap-5 z-10">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border-[1.5px] border-amber-400/80 bg-amber-500/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(229,169,60,0.2)]">
              <Crown className="w-7 h-7 text-[#e5a93c] stroke-[2]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white font-bold text-base sm:text-lg tracking-tight">
                  Complete challenges
                </h4>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase">
                  Easy to Master
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Solve tactical puzzles and unlock special chat privileges
              </p>
            </div>
          </div>

          {/* Right section: Chevron */}
          <div className="flex items-center gap-4 z-10">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
              <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Quote Section */}
      <footer className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10 text-xs text-slate-500">
        <p className="italic font-light tracking-wide text-slate-400/70">
          "The best move is the one that builds a better you."
        </p>

        {/* Decorative subtle checkered board texture at bottom right */}
        <div className="absolute -bottom-6 -right-6 w-52 h-28 opacity-15 pointer-events-none chess-board-pattern mask-radial" />
      </footer>
    </div>
  );
}
