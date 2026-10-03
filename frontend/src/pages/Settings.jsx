import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Palette,
  Volume2,
  Shield,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sliders,
  LogOut,
  Trash2,
  BookOpen,
  HelpCircle
} from 'lucide-react';

export default function Settings({ onNavigate }) {
  const {
    user,
    preferences,
    updatePreferences,
    changePassword,
    logout,
  } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ error: '', success: '', loading: false });

  const handleTogglePieceAudio = (checked) => {
    updatePreferences({ pieceAudio: checked });
  };

  const handleToggleNotifications = (checked) => {
    updatePreferences({ secretMoveNotifications: checked });
  };

  const handleToggleInstructions = (checked) => {
    updatePreferences({ showInstructions: checked });
  };

  const handleThemeChange = (themeName) => {
    updatePreferences({ boardTheme: themeName });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ error: '', success: '', loading: true });

    if (!currentPassword || !newPassword) {
      setPasswordStatus({ error: 'Please enter both current and new password.', success: '', loading: false });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ error: 'New password must be at least 6 characters long.', success: '', loading: false });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ error: 'New password and confirmation do not match.', success: '', loading: false });
      return;
    }

    try {
      const res = await changePassword(currentPassword, newPassword);
      setPasswordStatus({
        error: '',
        success: res.message || 'Password updated successfully!',
        loading: false,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus({
        error: err.message || 'Failed to update password.',
        success: '',
        loading: false,
      });
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in space-y-8">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate && onNavigate('profile')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span>Back to Profile</span>
        </button>
        <span className="text-xs text-amber-400 font-semibold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
          Preferences & Security
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-white">Platform Settings</h1>
        <p className="text-xs text-slate-400">
          Manage your game preferences, sound configuration, and account security.
        </p>
      </div>

      {/* Game & Board Preferences */}
      <div className="rounded-3xl bg-[#0c1424] border border-slate-800 p-6 space-y-6 shadow-xl">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          Gameplay Preferences
        </h3>

        {/* Board Theme */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Board Theme</p>
              <p className="text-xs text-slate-400">Select active board aesthetic</p>
            </div>
          </div>
          <select
            value={preferences?.boardTheme || 'Dark Obsidian & Warm Gold Accent'}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="Dark Obsidian & Warm Gold Accent">Dark Obsidian & Warm Gold</option>
            <option value="Classic Walnut & Maple">Classic Walnut & Maple</option>
            <option value="Midnight Emerald & Frost">Midnight Emerald & Frost</option>
          </select>
        </div>

        {/* Game Instructions Toggle (With Instruction / Without Instruction) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white text-sm">Game Instructions & Move Guidance</p>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    preferences?.showInstructions ?? true
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {preferences?.showInstructions ?? true ? 'With Instruction' : 'Without Instruction'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {preferences?.showInstructions ?? true
                  ? 'Tick active: Shows step-by-step move advice, legal dots, and dynamic guidance on the board'
                  : 'Unticked: Pro board without instructions or helper overlays'}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer self-start sm:self-center select-none">
            <input
              type="checkbox"
              checked={preferences?.showInstructions ?? true}
              onChange={(e) => handleToggleInstructions(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-amber-300">
              {preferences?.showInstructions ?? true ? 'With Instruction' : 'Without Instruction'}
            </span>
          </label>
        </div>

        {/* Audio Effects Toggle */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-300">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Piece Audio Effects</p>
              <p className="text-xs text-slate-400">Play realistic sound on piece movements and captures</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences?.pieceAudio ?? true}
            onChange={(e) => handleTogglePieceAudio(e.target.checked)}
            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {/* Move Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-300">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Tactical Move Notifications</p>
              <p className="text-xs text-slate-400">Display visual effects and confetti upon brilliant moves</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences?.secretMoveNotifications ?? true}
            onChange={(e) => handleToggleNotifications(e.target.checked)}
            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Account Security (Password Change) */}
      <div className="rounded-3xl bg-[#0c1424] border border-slate-800 p-6 space-y-6 shadow-xl">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4" />
          Security & Password
        </h3>

        {passwordStatus.error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{passwordStatus.error}</span>
          </div>
        )}

        {passwordStatus.success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{passwordStatus.success}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-slate-900/80 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-slate-900/80 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordStatus.loading}
            className="py-2.5 px-5 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
          >
            {passwordStatus.loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Session Management */}
      <div className="rounded-3xl bg-[#0c1424] border border-slate-800 p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <p className="text-sm font-bold text-white">Active Session</p>
          <p className="text-xs text-slate-400">
            Signed in as <span className="text-amber-400">{user?.email || user?.username}</span>
          </p>
        </div>

        <button
          onClick={() => {
            logout();
            if (onNavigate) onNavigate('login');
          }}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-bold uppercase transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
