import React from 'react';
import { 
  Trophy, 
  Brain, 
  Activity, 
  Flame, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Swords, 
  Bot, 
  Puzzle, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Sparkles 
} from 'lucide-react';

export default function Dashboard({ 
  userProfile, 
  userPoints = 150, 
  chatUnlocked = false, 
  onNavigate,
  onSelectMode 
}) {
  const profileName = userProfile?.username || userProfile?.name || 'Grandmaster Candidate';
  const profileEmail = userProfile?.email || 'player@chesscure.com';
  const rating = userProfile?.rating || 1540;

  const recentMatches = [
    {
      id: 1,
      opponent: 'Adaptive AI (Level 6)',
      result: 'Victory',
      accuracy: '94.2%',
      points: '+50 pts',
      time: '2 hours ago',
      isWin: true,
    },
    {
      id: 2,
      opponent: 'Smothered Mate Tactic',
      result: 'Solved',
      accuracy: '100%',
      points: '+50 pts',
      time: '5 hours ago',
      isWin: true,
    },
    {
      id: 3,
      opponent: 'Online Match (1580 Elo)',
      result: 'Draw',
      accuracy: '88.5%',
      points: '+15 pts',
      time: 'Yesterday',
      isWin: false,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Top Welcome & PMS Acuity Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-r from-[#0d1628] via-[#101c33] to-[#0d1628] border border-amber-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-[0_0_25px_rgba(229,169,60,0.3)]">
              <div className="w-full h-full rounded-[14px] bg-[#090d16] flex items-center justify-center text-amber-400 font-extrabold text-2xl sm:text-3xl">
                {profileName.charAt(0).toUpperCase()}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PMS Tier 1 Player
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Telemetry
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {profileName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">{profileEmail}</p>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex-1 sm:flex-none p-3.5 rounded-2xl bg-[#080d1a]/80 border border-slate-800 text-center min-w-[100px]">
              <p className="text-[10px] uppercase font-bold text-slate-400">Elo Rating</p>
              <p className="text-xl font-extrabold text-[#e5a93c]">{rating}</p>
            </div>

            <div className="flex-1 sm:flex-none p-3.5 rounded-2xl bg-[#080d1a]/80 border border-slate-800 text-center min-w-[100px]">
              <p className="text-[10px] uppercase font-bold text-slate-400">Points</p>
              <p className="text-xl font-extrabold text-amber-400">{userPoints} pts</p>
            </div>

            <div className="flex-1 sm:flex-none p-3.5 rounded-2xl bg-[#080d1a]/80 border border-slate-800 text-center min-w-[100px]">
              <p className="text-[10px] uppercase font-bold text-slate-400">Acuity Index</p>
              <p className="text-xl font-extrabold text-emerald-400">96.4%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Training Launchers & Chat Unlock Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Quick Action Hub (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Play & Training Hub */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Tactical Training Hub
                </h2>
                <p className="text-xs text-slate-400">
                  Select an engine exercise or launch live interactive challenge
                </p>
              </div>
              <span className="text-xs text-amber-400 font-semibold">4 Modes Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {/* Chess Challenge Button */}
              <div 
                onClick={() => onNavigate && onNavigate('challenge')}
                className="p-4 rounded-2xl bg-gradient-to-br from-[#132038] to-[#0c1527] border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer group shadow-[0_0_20px_rgba(229,169,60,0.15)]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    +50 PTS
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-3 group-hover:text-amber-400 transition-colors">
                  Chess Challenge
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Solve tactical positions with correct-move validation.
                </p>
              </div>

              {/* Secure Chat Button */}
              <div 
                onClick={() => onNavigate && onNavigate('chat')}
                className="p-4 rounded-2xl bg-[#0e172a]/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    chatUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    chatUnlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {chatUnlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-3 group-hover:text-amber-400 transition-colors">
                  Secure Messaging
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect with Grandmaster coaching and cognitive review.
                </p>
              </div>

              {/* Bot Sparring */}
              <div 
                onClick={() => onNavigate && onNavigate('vs-computer')}
                className="p-4 rounded-2xl bg-[#0e172a]/90 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300">
                    ENGINE
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-3 group-hover:text-amber-400 transition-colors">
                  AI Bot Sparring
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Train against adaptive AI on a full interactive chess board.
                </p>
              </div>

              {/* Online Matchmaking / Play with Friends */}
              <div 
                onClick={() => onNavigate && onNavigate('with-friends')}
                className="p-4 rounded-2xl bg-[#0e172a]/90 border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Swords className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300">
                    FRIEND ID
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-3 group-hover:text-blue-400 transition-colors">
                  Play with Friends
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect via unique Player ID and launch private chess matches.
                </p>
              </div>
            </div>
          </div>

          {/* PMS Clinical Cognitive Diagnostics Strip */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">PMS Cognitive Acuity Telemetry</h2>
              <span className="text-xs text-emerald-400 font-medium">Updated Real-Time</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-[#090e1c] border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Blunder Avoidance</p>
                <p className="text-xl font-extrabold text-white mt-1">92.8%</p>
                <p className="text-[10px] text-emerald-400 mt-0.5">+3.1% this week</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#090e1c] border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Decision Latency</p>
                <p className="text-xl font-extrabold text-[#e5a93c] mt-1">3.4s</p>
                <p className="text-[10px] text-emerald-400 mt-0.5">Optimal pace</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#090e1c] border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Tactical Vision</p>
                <p className="text-xl font-extrabold text-white mt-1">89%</p>
                <p className="text-[10px] text-emerald-400 mt-0.5">Top 8th percentile</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#090e1c] border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Focus Stability</p>
                <p className="text-xl font-extrabold text-emerald-400 mt-1">98/100</p>
                <p className="text-[10px] text-slate-400 mt-0.5">High resilience</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Unlock Meter & Recent Activity (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Chat Unlock Progress Card */}
          <div className="glass-card rounded-3xl p-6 space-y-4 border-amber-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  chatUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {chatUnlocked ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-white text-sm">GM Chat Clearance</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                chatUnlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {chatUnlocked ? 'CLEARED' : 'TIER 1'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {chatUnlocked 
                ? 'Your cognitive clearance is verified. You have full access to GM coaching and secure encrypted channels.'
                : 'Solve chess challenges or reach 200+ points to unlock direct communication with Grandmaster mentors.'}
            </p>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Unlock Progress</span>
                <span className="font-bold text-amber-400">
                  {chatUnlocked ? '100% Complete' : `${Math.min(100, Math.round((userPoints / 200) * 100))}%`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500" 
                  style={{ width: chatUnlocked ? '100%' : `${Math.min(100, Math.round((userPoints / 200) * 100))}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => onNavigate && onNavigate(chatUnlocked ? 'chat' : 'challenge')}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                chatUnlocked
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black shadow-lg shadow-amber-500/20'
              }`}
            >
              <span>{chatUnlocked ? 'Open Secure Messaging' : 'Solve Challenge to Unlock'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Match Activity */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-sm">Recent Activity Log</h3>
            <div className="space-y-3">
              {recentMatches.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{m.opponent}</p>
                    <p className="text-[11px] text-slate-500">{m.time} • Accuracy {m.accuracy}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400">{m.points}</span>
                    <p className="text-[10px] text-slate-400 font-medium">{m.result}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
