import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { CHESS_LOGIN_BG } from '../assets/images/chessImages';

export default function Login({ onNavigate, onLoginSuccess, initialEmail = '' }) {
  const { login, loginWithGoogle, loginWithFacebook, continueAsGuest } = useAuth();
  const [identifier, setIdentifier] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    initialEmail ? 'Registration complete! Please enter your password to sign in.' : ''
  );

  useEffect(() => {
    if (initialEmail) {
      setIdentifier(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!identifier.trim() || !password) {
      setError('Please enter your email or username and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(identifier.trim(), password, rememberMe);
      setSuccessMessage('Welcome back! Loading your profile...');
      setTimeout(() => {
        if (onLoginSuccess && res?.user) {
          onLoginSuccess(res.user);
        }
        if (onNavigate) {
          onNavigate('home');
        }
      }, 600);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setIdentifier('grandmaster@chesscure.com');
    setPassword('Checkmate2026!');
    setError('');
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
    if (onNavigate) onNavigate('home');
  };

  const handleFacebookLogin = () => {
    loginWithFacebook();
    if (onNavigate) onNavigate('home');
  };

  const handleGuestLogin = () => {
    continueAsGuest();
    if (onNavigate) onNavigate('home');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 sm:py-12 overflow-x-hidden">
      {/* ChessCure Logo fixed at TOP-LEFT corner */}
      <div 
        onClick={() => onNavigate && onNavigate('home')}
        className="fixed top-6 left-6 sm:top-8 sm:left-8 z-50 flex items-center gap-3 cursor-pointer select-none group"
      >
        <img
          src="/chess_cure_logo.jpg"
          alt="ChessCure Logo"
          className="h-12 w-12 sm:h-14 sm:w-14 aspect-square object-contain rounded-2xl shadow-xl border border-amber-500/20 group-hover:border-amber-400/50 transition-all duration-300 drop-shadow-[0_0_15px_rgba(229,169,60,0.25)]"
        />
        <div className="text-2xl font-bold tracking-tight text-white flex items-center">
          Chess<span className="text-[#e5a93c]">Cure</span>
        </div>
      </div>
      {/* Background artwork */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {CHESS_LOGIN_BG && (
          <img
            src={CHESS_LOGIN_BG}
            alt="Chess Background"
            className="w-full h-full object-cover object-center filter brightness-50 opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/85 to-[#080d1a]" />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0c1424]/95 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Top glowing line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Header */}
        <div className="text-center space-y-2 mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1 shadow-lg shadow-amber-500/10">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 22H5a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1zM7 16l-.8-2.4A4.002 4.002 0 0 1 7.2 9H9V7.5a2.5 2.5 0 0 1 4.2-1.83 5.48 5.48 0 0 0 1.94 1.15A3.003 3.003 0 0 1 17 9.64V12a4 4 0 0 1-4 4H7zm3.5-6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400">Sign in to your ChessCure account to track your career</p>
        </div>

        {/* Social Logins */}
        <div className="space-y-2.5 mb-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-[#111c30] hover:bg-[#16243d] border border-slate-700/80 text-white text-xs font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.99] shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleFacebookLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-[#111c30] hover:bg-[#16243d] border border-slate-700/80 text-white text-xs font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.99] shadow-sm"
          >
            <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Continue with Facebook</span>
          </button>

          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Play Instantly as Guest</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-[#0c1424] px-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            or with credentials
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center animate-fade-in">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Email or Mobile Number
              </label>
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 underline font-normal cursor-pointer"
              >
                Demo Fill
              </button>
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="grandmaster@chess.com or phone"
                className="w-full pl-10 pr-4 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('forgot-password')}
                className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-amber-500 accent-amber-500"
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] hover:brightness-105 text-black font-bold text-xs tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 disabled:opacity-70 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate && onNavigate('signup')}
            className="text-amber-400 hover:underline font-semibold"
          >
            Sign up now
          </button>
        </p>
      </div>
    </div>
  );
}
