import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
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
  HelpCircle,
  Clock,
  RotateCcw,
  Mail,
  Lock
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

  // Security mode: 'standard' (with current password) | 'forgot_otp' (Forgot Password via OTP)
  const [securityMode, setSecurityMode] = useState('standard');

  // Forgot Password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotStatus, setForgotStatus] = useState({ error: '', success: '', loading: false, otpSent: false });
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [forgotExpiry, setForgotExpiry] = useState(600);

  const cooldownTimerRef = useRef(null);
  const expiryTimerRef = useRef(null);

  useEffect(() => {
    if (user?.email || user?.mobileNumber) {
      setForgotIdentifier(user?.email || user?.mobileNumber || '');
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
    };
  }, []);

  const startForgotTimers = () => {
    setForgotCooldown(60);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setForgotCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setForgotExpiry(600);
    if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
    expiryTimerRef.current = setInterval(() => {
      setForgotExpiry((prev) => {
        if (prev <= 1) {
          clearInterval(expiryTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ error: 'All fields are required.', success: '', loading: false });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ error: 'New passwords do not match.', success: '', loading: false });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ error: 'Password must be at least 6 characters.', success: '', loading: false });
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordStatus({ error: '', success: 'Password changed successfully.', loading: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus({ error: err.message || 'Failed to update password.', success: '', loading: false });
    }
  };

  // Forgot Password: Send Recovery OTP
  const handleSendRecoveryOtp = async () => {
    if (!forgotIdentifier.trim()) {
      setForgotStatus({ error: 'Please enter your registered email or mobile number.', success: '', loading: false, otpSent: false });
      return;
    }

    setForgotStatus({ error: '', success: '', loading: true, otpSent: false });
    try {
      await api.sendOtp(forgotIdentifier.trim(), 'password_reset');
      startForgotTimers();
      setForgotStatus({
        error: '',
        success: `Recovery code dispatched to ${forgotIdentifier.trim()}. Valid for 10 minutes.`,
        loading: false,
        otpSent: true,
      });
    } catch (err) {
      setForgotStatus({
        error: err.message || 'Failed to send recovery code. Please try again.',
        success: '',
        loading: false,
        otpSent: false,
      });
    }
  };

  // Forgot Password: Submit OTP and Reset
  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    setForgotStatus((prev) => ({ ...prev, error: '', success: '', loading: true }));

    if (!forgotOtp.trim() || forgotOtp.trim().length < 6) {
      setForgotStatus((prev) => ({ ...prev, error: 'Please enter the 6-digit OTP code.', loading: false }));
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotStatus((prev) => ({ ...prev, error: 'New password must be at least 6 characters.', loading: false }));
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotStatus((prev) => ({ ...prev, error: 'New passwords do not match.', loading: false }));
      return;
    }

    try {
      const res = await api.resetPassword({
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
      });

      setForgotStatus({
        error: '',
        success: res.message || 'Password reset successfully! Your new password is now active.',
        loading: false,
        otpSent: false,
      });
      setForgotOtp('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err) {
      setForgotStatus((prev) => ({
        ...prev,
        error: err.message || 'Password reset failed. Please check your verification code.',
        loading: false,
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={() => onNavigate && onNavigate('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Arena</span>
        </button>
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

        {/* Game Instructions Toggle */}
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
          <input
            type="checkbox"
            checked={preferences?.showInstructions ?? true}
            onChange={(e) => handleToggleInstructions(e.target.checked)}
            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {/* Sound Effects Toggle */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-300">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Piece Sound Audio</p>
              <p className="text-xs text-slate-400">Play realistic movement and capture audio</p>
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

      {/* Account Security & Password Section */}
      <div className="rounded-3xl bg-[#0c1424] border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Security & Password
          </h3>

          {/* Mode Switch: Standard Change Password vs Forgot Password (OTP) */}
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setSecurityMode('standard');
                setPasswordStatus({ error: '', success: '', loading: false });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                securityMode === 'standard'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Change Password
            </button>
            <button
              type="button"
              onClick={() => {
                setSecurityMode('forgot_otp');
                setForgotStatus({ error: '', success: '', loading: false, otpSent: false });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                securityMode === 'forgot_otp'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-amber-400/90 hover:text-amber-300'
              }`}
            >
              Forgot Password? (Reset via OTP)
            </button>
          </div>
        </div>

        {securityMode === 'standard' ? (
          /* Standard Change Password (requires current password) */
          <>
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
          </>
        ) : (
          /* Forgot Password via OTP Verification */
          <div className="space-y-5 max-w-lg">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <p className="font-semibold">Reset Password using Secure OTP Verification</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                A 6-digit verification code will be sent to your registered email or phone. The code expires in 10 minutes.
              </p>
            </div>

            {forgotStatus.error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{forgotStatus.error}</span>
              </div>
            )}

            {forgotStatus.success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{forgotStatus.success}</span>
              </div>
            )}

            <form onSubmit={handleForgotResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registered Email Address or Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="player@gmail.com or +91 9876543210"
                      className="w-full bg-slate-900/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendRecoveryOtp}
                    disabled={forgotCooldown > 0 || forgotStatus.loading}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-black font-bold text-xs uppercase cursor-pointer disabled:cursor-not-allowed shrink-0 transition-colors"
                  >
                    {forgotCooldown > 0 ? `Resend (${forgotCooldown}s)` : 'Send OTP'}
                  </button>
                </div>
              </div>

              {forgotStatus.otpSent && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>OTP valid for 10 minutes (expires in {Math.floor(forgotExpiry / 60)}:{(forgotExpiry % 60).toString().padStart(2, '0')})</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  6-Digit Recovery OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-slate-900/80 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 outline-none tracking-widest font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-900/80 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-slate-900/80 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotStatus.loading || forgotOtp.length < 6}
                className="w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-xs uppercase cursor-pointer disabled:opacity-50 shadow-md"
              >
                {forgotStatus.loading ? 'Verifying & Resetting Password...' : 'Verify OTP & Reset Password'}
              </button>
            </form>
          </div>
        )}
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
