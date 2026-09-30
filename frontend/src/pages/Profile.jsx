import React from 'react';
import { useAuth } from '../context/AuthContext';
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
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Swords,
  Flame,
  LogIn,
  Settings,
  LogOut
} from 'lucide-react';

export default function Profile({ onNavigate }) {
  const { user, careerGames = [], logout } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white">Guest / Not Signed In</h2>
        <p className="text-xs text-slate-400">
          Sign in or create an account to track your career game history, clinical metrics, and global ratings.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('login')}
          className="py-2.5 px-6 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-xs uppercase"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const username = user.username || user.name || 'Grandmaster Candidate';
  const email = user.email || user.identifier || 'player@chesscure.com';
  const phone = user.mobileNumber || user.phone || '+91 98765 43210';
  const rating = user.rating || 1540;
  const skill = user.skill || 'Club Player (Intermediate)';
  const initial = username ? username[0].toUpperCase() : 'G';

  const winsCount = user.wins ?? 84;
  const lossesCount = user.losses ?? 41;
  const drawsCount = user.draws ?? 9;
  const totalGames = (user.wins !== undefined && user.losses !== undefined && user.draws !== undefined)
    ? (user.wins + user.losses + user.draws)
    : 134;
  const winRate = totalGames > 0 ? Math.round((winsCount / totalGames) * 100) : 63;
  const lossRate = totalGames > 0 ? Math.round((lossesCount / totalGames) * 100) : 31;
  const drawRate = totalGames > 0 ? Math.round((drawsCount / totalGames) * 100) : 7;

  return (
    <div className="relative min-h-[calc(100vh-80px)] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full animate-fade-in space-y-8">
      {/* Top Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => onNavigate && onNavigate('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span>Back to Arena</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Settings Shortcut Button */}
          <button
            onClick={() => onNavigate && onNavigate('settings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Open Platform Settings"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Settings</span>
          </button>

          {/* Sign Out Shortcut Button */}
          <button
            onClick={() => {
              logout();
              if (onNavigate) onNavigate('login');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
            title="Sign Out of Account"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Active PMS Clinical Account</span>
          </div>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c1524] via-[#0f1b2e] to-[#0d1627] border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar with Golden Aura */}
          <div className="relative group shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={username}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-amber-400 shadow-lg shadow-amber-500/20"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 p-1 shadow-[0_0_25px_rgba(229,169,60,0.35)] flex items-center justify-center">
                <div className="w-full h-full rounded-[22px] bg-[#0c1424] flex items-center justify-center text-amber-300 font-black text-4xl sm:text-5xl">
                  {initial}
                </div>
              </div>
            )}
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
              {user.isGuest && (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-semibold">
                  Guest
                </span>
              )}
            </div>

            <p className="text-slate-400 text-sm max-w-xl">
              Competitive cognitive chess practitioner specializing in tactical pattern recognition, time latency reduction, and end-game calculation.
            </p>

            {/* Contact & Member Chips */}
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

      {/* Career Metrics: Total Games, Wins, Losses, Draws (Replaced Cognitive Index, Tactics Solved, Blunder Avoidance, Record) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Games */}
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-1 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Games</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalGames}</p>
          <p className="text-[11px] text-amber-400 font-medium">{winRate}% overall win rate</p>
        </div>

        {/* 2. Wins */}
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-1 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Wins</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{winsCount}</p>
          <p className="text-[11px] text-emerald-400 font-medium">Ranked & practice victories</p>
        </div>

        {/* 3. Losses / Loosers */}
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-1 hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Losses</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">{lossesCount}</p>
          <p className="text-[11px] text-rose-400/90 font-medium">{lossRate}% defeat rate</p>
        </div>

        {/* 4. Draws */}
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-1 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Draws</span>
            <Award className="w-4 h-4 text-amber-300" />
          </div>
          <p className="text-2xl font-black text-amber-300">{drawsCount}</p>
          <p className="text-[11px] text-slate-400 font-medium">{drawRate}% stalemates</p>
        </div>
      </div>

      {/* Career Game History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Career Game History
          </h2>
          <span className="text-xs text-slate-400">{careerGames.length} matches recorded</span>
        </div>

        {careerGames.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0c1424] border border-slate-800 text-center text-slate-400 text-xs">
            No games played yet. Challenge the engine or players to build your career!
          </div>
        ) : (
          <div className="space-y-2.5">
            {careerGames.map((game) => {
              const isWin = game.result === 'Won';
              const isLoss = game.result === 'Lost';

              return (
                <div
                  key={game.id}
                  className="p-4 rounded-2xl bg-[#0c1424]/80 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-4"
                >
                  {/* Opponent & Mode */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isWin
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isLoss
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-700/20 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {game.result.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{game.opponent}</h4>
                      <p className="text-[11px] text-slate-400">{game.mode} • {game.method}</p>
                    </div>
                  </div>

                  {/* Moves & Date */}
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-slate-300 font-medium">{game.moves} moves</p>
                    <p className="text-[10px] text-slate-500">{game.date}</p>
                  </div>

                  {/* Rating Change */}
                  <div className="text-right">
                    <span
                      className={`text-sm font-extrabold flex items-center justify-end gap-0.5 ${
                        isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {isWin ? <ArrowUpRight className="w-4 h-4" /> : isLoss ? <ArrowDownRight className="w-4 h-4" /> : null}
                      {game.ratingChange}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">Rating</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
