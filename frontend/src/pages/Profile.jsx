import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Trophy, 
  Activity, 
  Brain, 
  Sparkles, 
  Award, 
  Calendar, 
  CheckCircle2, 
  ArrowLeft, 
  Swords, 
  Flame 
} from 'lucide-react';

export default function Profile({ userProfile, onNavigate }) {
  const username = userProfile?.username || userProfile?.name || 'Grandmaster';
  const email = userProfile?.email || 'player@chesscure.com';
  const phone = userProfile?.mobileNumber || userProfile?.phone || '+1 (555) 019-2834';
  const rating = userProfile?.rating || 1540;
  const skill = userProfile?.skill || 'Club Player (Intermediate)';
  const initial = username ? username[0].toUpperCase() : 'G';

  return (
    <div className="relative min-h-[calc(100vh-80px)] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full animate-fade-in space-y-8">
      
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate && onNavigate('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span>Back to Arena</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Active PMS Clinical Account</span>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 border border-amber-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          
          {/* Avatar with Golden Aura */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 p-1 shadow-[0_0_25px_rgba(229,169,60,0.35)] flex items-center justify-center">
              <div className="w-full h-full rounded-[22px] bg-[#0c1424] flex items-center justify-center text-amber-300 font-black text-4xl sm:text-5xl">
                {initial}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg border-2 border-[#0c1424]">
              <Trophy className="w-4 h-4 fill-current" />
            </div>
          </div>

          {/* User Primary Info */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {username}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
                {typeof skill === 'string' ? skill : 'Club Player'}
              </span>
            </div>

            <p className="text-slate-400 text-sm max-w-xl">
              Competitive cognitive chess practitioner specializing in tactical pattern recognition, time latency reduction, and end-game calculation.
            </p>

            {/* Quick Contact & Verified Chips */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Member since 2026</span>
              </div>
            </div>
          </div>

          {/* Rating Badge Card */}
          <div className="shrink-0 p-4 rounded-2xl bg-[#09101d]/90 border border-amber-500/30 text-center min-w-[140px] shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Tactical Elo
            </span>
            <span className="text-3xl font-black text-[#e5a93c] block mt-0.5">
              {rating}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" />
              <span>Top 5% Acuity</span>
            </span>
          </div>
        </div>
      </div>

      {/* Diagnostics / Performance Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Cognitive Index</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">96.8%</p>
          <p className="text-[11px] text-emerald-400 font-medium">+3.2% latency speed</p>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tactics Solved</span>
            <Brain className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">388</p>
          <p className="text-[11px] text-slate-400">14 solved this week</p>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Win Ratio</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">67.4%</p>
          <p className="text-[11px] text-slate-400">142 rated games</p>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Daily Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300">12 Days</p>
          <p className="text-[11px] text-emerald-400">Personal Best</p>
        </div>
      </div>

      {/* Account Details & Security Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Account Credentials Summary */}
        <div className="rounded-2xl glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <span>Player Credentials</span>
            </h3>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified</span>
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400 font-medium">Username</span>
              <span className="text-white font-bold">{username}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400 font-medium">Email ID</span>
              <span className="text-white font-mono">{email}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400 font-medium">Mobile Number</span>
              <span className="text-white font-mono">{phone}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400 font-medium">Clearance Level</span>
              <span className="text-amber-400 font-bold">Grandmaster Clinical PMS</span>
            </div>
          </div>
        </div>

        {/* Quick Launch & Arena Access */}
        <div className="rounded-2xl glass-card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-400" />
                <span>Tactical Training Arena</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              Select an active training module or test your decision speed against adaptive bots calibrated to your rating.
            </p>
          </div>

          <div className="space-y-2.5 pt-4">
            <button
              onClick={() => onNavigate && onNavigate('home')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-xs shadow-[0_0_20px_rgba(229,169,60,0.3)] hover:shadow-[0_0_28px_rgba(229,169,60,0.45)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" />
              <span>Launch Next Sparring Match</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('stats')}
              className="w-full py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Full Diagnostic Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
