import React from 'react';
import { X, Brain, Shield, Trophy, Activity, Target, Sparkles, ArrowRight } from 'lucide-react';

export default function AboutModal({ isOpen, onClose, onNavigate }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl glass-card p-6 sm:p-8 text-white space-y-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(229,169,60,0.25)]">
            <svg
              className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 22H5a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1zM7 16l-.8-2.4A4.002 4.002 0 0 1 7.2 9H9V7.5a2.5 2.5 0 0 1 4.2-1.83 5.48 5.48 0 0 0 1.94 1.15A3.003 3.003 0 0 1 17 9.64V12a4 4 0 0 1-4 4H7zm3.5-6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Chess<span className="text-[#e5a93c]">Cure</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PMS Platform
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Cognitive Fitness & Tactical Performance Management System
            </p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-sm leading-relaxed text-slate-300">
          <p>
            <strong className="text-white font-semibold">Chess Cure PMS</strong> unites grandmaster-level chess training with neuro-cognitive wellness principles. Whether you're tracking patient cognitive acuity or sharpening your personal decision-making, Chess Cure provides real-time mental workouts designed to build patience, strategic foresight, and peak performance.
          </p>
        </div>

        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#0a1120]/80 border border-slate-800/90 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm">
              <Brain className="w-5 h-5" />
              <span>Cognitive Therapy</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curated tactical puzzles and pattern recognition routines designed to foster mental clarity and neuroplasticity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0a1120]/80 border border-slate-800/90 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2.5 text-blue-400 font-semibold text-sm">
              <Activity className="w-5 h-5" />
              <span>Performance Analytics</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              In-depth PMS tracking with real-time rating adjustments, blunder diagnostics, and longitudinal progress reports.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0a1120]/80 border border-slate-800/90 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm">
              <Target className="w-5 h-5" />
              <span>Adaptive AI Sparring</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Engineered bots that dynamically adjust from gentle practice partners to grandmaster-caliber tactical opponents.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0a1120]/80 border border-slate-800/90 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm">
              <Trophy className="w-5 h-5" />
              <span>Milestone Rewards</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete daily tactical milestones to unlock private Grandmaster chat rooms and collaborative game reviews.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 italic">
            "Every move shapes your mind."
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                if (onNavigate) onNavigate('home');
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Explore Board
            </button>
            <button
              onClick={() => {
                onClose();
                if (onNavigate) onNavigate('signup');
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(229,169,60,0.3)] hover:scale-[1.02] flex items-center justify-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
