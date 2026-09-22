import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Trophy, Award, Flame, Shield, ArrowUpRight, ArrowDownRight, Clock, Swords, LogIn } from 'lucide-react';

export default function Profile({ onNavigate }) {
  const { user, careerGames } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white">Guest / Not Signed In</h2>
        <p className="text-xs text-slate-400">
          Sign in or create an account to track your career game history and global ratings.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="py-2.5 px-6 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-xs uppercase"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const totalGames = (user.wins || 0) + (user.losses || 0) + (user.draws || 0);
  const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c1524] via-[#0f1b2e] to-[#0d1627] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-lg shadow-amber-500/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#14223b] border-2 border-amber-400/80 flex items-center justify-center text-amber-300 text-2xl font-bold shadow-lg shadow-amber-500/10">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
            )}
            {user.isGuest && (
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-semibold">
                Guest
              </span>
            )}
          </div>

          {/* User Details */}
          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {user.username}
              </h1>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {user.title || 'Grandmaster Aspirant'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user.identifier}</p>
          </div>

          {/* Current Rating Pill */}
          <div className="sm:ml-auto text-center sm:text-right">
            <p className="text-xs text-slate-400">Current Rating</p>
            <p className="text-4xl font-extrabold text-[#e5a93c] tracking-tight mt-0.5">
              {user.rating}
            </p>
            <span className="text-[11px] text-emerald-400 font-medium">Rank #412 Global</span>
          </div>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 text-center">
          <p className="text-xs text-slate-400">Total Games</p>
          <p className="text-2xl font-extrabold text-white mt-1">{totalGames || careerGames.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 text-center">
          <p className="text-xs text-slate-400">Win Rate</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{winRate || 64}%</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 text-center">
          <p className="text-xs text-slate-400">Puzzles Solved</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{user.puzzlesSolved || 342}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 text-center">
          <p className="text-xs text-slate-400">Record (W/L/D)</p>
          <p className="text-sm font-bold text-slate-300 mt-2">
            <span className="text-emerald-400">{user.wins || 82}W</span> /{' '}
            <span className="text-rose-400">{user.losses || 42}L</span> /{' '}
            <span className="text-slate-400">{user.draws || 8}D</span>
          </p>
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
