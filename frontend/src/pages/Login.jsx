import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { CHESS_LOGIN_BG } from '../assets/images/chessImages';
import { useAuth } from '../hooks/useAuth';

export default function Login({ onNavigate, onLoginSuccess, initialEmail = '' }) {
  const { login } = useAuth();
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    initialEmail ? 'Registration complete! Please enter your password to enter Dashboard.' : ''
  );
  const [forgotModal, setForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Sync if initialEmail changes
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setSuccessMessage('Registration complete! Please enter your password to enter Dashboard.');
    }
  }, [initialEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(email.trim(), password, rememberMe);
      setSuccessMessage('Authentication successful! Loading your dashboard...');
      
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
        // Flow: Login -> Dashboard
        if (onNavigate) onNavigate('dashboard');
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(`Connected with ${provider}! Redirecting to dashboard...`);
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess({
            name: `${provider} Chess Master`,
            username: `${provider.toLowerCase()}_master`,
            email: `player@${provider.toLowerCase()}.com`,
            playerId: 'CC-' + Math.floor(100000 + Math.random() * 900000),
            rating: 1620
          });
        }
        // Flow: Login -> Dashboard
        if (onNavigate) onNavigate('dashboard');
      }, 800);
    }, 800);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSent(true);
    setTimeout(() => {
      setForgotModal(false);
      setResetSent(false);
      setResetEmail('');
    }, 2000);
  };

  const handleDemoFill = () => {
    setEmail('master@chesscure.com');
    setPassword('Checkmate2026!');
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* 
        Background Chess Artwork:
        Richly visible with subtle chessboard grid overlay and a dark vignette
        ensuring the form remains 100% crisp and readable
      */}
      <div className="absolute inset-0 z-0">
        <img
          src={CHESS_LOGIN_BG}
          alt="Chess Board with Glowing Golden King & Queen"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-110 opacity-35 scale-105 transition-transform duration-1000"
        />
        {/* Subtle perspective chessboard pattern layer */}
        <div className="absolute inset-0 hero-chess-grid opacity-20 pointer-events-none" />
        
        {/* Layered dark gradients to frame the central card */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/75 to-[#080c14]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(8,12,20,0.8)_100%)]" />
      </div>

      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="glass-card rounded-3xl p-6 sm:p-9 shadow-2xl relative overflow-hidden border border-amber-500/30 bg-[#091122]/90 backdrop-blur-2xl">
          
          {/* Subtle top golden light line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Card Header with Cropped King/Keyhole Emblem */}
          <div className="text-center space-y-2 mb-7">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-1 shadow-[0_0_25px_rgba(229,169,60,0.3)] mb-2 group">
              <img
                src="/chess_cure_emblem.png"
                alt="Chess Cure King Emblem"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(229,169,60,0.5)] transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
              Sign in to resume your cognitive training and tactical challenges.
            </p>
          </div>

          {/* Status Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email ID Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Email ID</span>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="text-[11px] text-amber-400/80 hover:text-amber-300 underline font-normal cursor-pointer"
                >
                  Quick Demo Fill
                </button>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:text-white"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="text-[11px] text-amber-400/80 hover:text-amber-300 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="glass-input w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 accent-amber-500 focus:ring-amber-500/20"
                />
                <span>Remember this device for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-sm shadow-[0_0_20px_rgba(229,169,60,0.3)] hover:shadow-[0_0_30px_rgba(229,169,60,0.45)] transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to ChessCure</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#0d1628] text-slate-400 rounded-full font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialLogin('Google')}
              className="py-2.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"/>
                <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.4-.4-2.2s.2-1.5.4-2.2L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 16C3.5 20.4 7.4 23 12 23z"/>
              </svg>
              <span>Google</span>
            </button>

            {/* Chess.com */}
            <button
              type="button"
              onClick={() => handleSocialLogin('Chess.com')}
              className="py-2.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
            >
              <span className="text-emerald-400 font-black text-sm">♟</span>
              <span>Chess.com</span>
            </button>

            {/* GitHub */}
            <button
              type="button"
              onClick={() => handleSocialLogin('GitHub')}
              className="py-2.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 fill-current text-slate-300" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          {/* Switch to Register */}
          <div className="mt-7 text-center text-xs text-slate-400">
            <span>Don't have an account yet? </span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('signup')}
              className="text-amber-400 font-semibold hover:text-amber-300 hover:underline inline-flex items-center gap-1"
            >
              <span>Register for free</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Back to Home Button */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to ChessCure Home</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-700 animate-fade-in-up">
            <h3 className="text-lg font-bold text-white">Reset Your Password</h3>
            <p className="text-xs text-slate-400">
              Enter your registered email address and we'll send you an instant reset link.
            </p>
            {resetSent ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium">
                ✓ Reset link dispatched! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs text-white placeholder-slate-500"
                  required
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModal(false)}
                    className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#e5a93c] hover:bg-[#f5b94e] text-black"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
