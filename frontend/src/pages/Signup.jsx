import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Sparkles, KeyRound, Clock, RotateCcw } from 'lucide-react';
import { CHESS_REGISTER_BG } from '../assets/images/chessImages';

export default function Signup({ onNavigate }) {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobileNumber: '',
    skillLevel: 'intermediate',
    password: '',
    confirmPassword: '',
  });

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 10-minute OTP expiry countdown (600 seconds)
  const [expirySeconds, setExpirySeconds] = useState(600);
  // 60-second resend cooldown
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

  const expiryTimerRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const startTimers = () => {
    // 10 minutes expiry timer
    setExpirySeconds(600);
    if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
    expiryTimerRef.current = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(expiryTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 60 seconds cooldown timer
    setCooldownSeconds(60);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabels = ['Empty', 'Weak', 'Moderate', 'Strong', 'Grandmaster Level'];
  const strengthColors = ['bg-slate-700', 'bg-rose-500', 'bg-amber-500', 'bg-blue-400', 'bg-emerald-400'];

  const getTargetIdentifier = () => {
    return formData.email.trim() || formData.mobileNumber.trim();
  };

  // Step 1: Send OTP to provided email or mobile number
  const handleProceedToOtp = async (e) => {
    e.preventDefault();
    setError('');

    const target = getTargetIdentifier();
    if (!formData.username.trim() || !target || !formData.password) {
      setError('Please provide username, password, and at least an email or mobile number.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept terms of service to continue.');
      return;
    }

    setIsLoading(true);
    try {
      await api.sendOtp(target, 'registration');
      setStep('otp');
      startTimers();
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code. Please check your identifier.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler with 60-second cooldown enforcement
  const handleResendOtp = async () => {
    if (cooldownSeconds > 0) return;
    setError('');
    setIsLoading(true);
    try {
      const target = getTargetIdentifier();
      await api.sendOtp(target, 'registration');
      startTimers();
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Complete registration with verified OTP
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (expirySeconds <= 0) {
      setError('Verification code has expired. Please request a new code.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        password: formData.password,
        skill: formData.skillLevel,
        otp: otpCode.trim(),
      });

      setSuccessMessage('Account verified & created successfully! Entering ChessCure...');
      setTimeout(() => {
        if (onNavigate) onNavigate('home');
      }, 700);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 sm:py-12 overflow-x-hidden">
      {/* ChessCure Logo fixed at TOP-LEFT corner */}
      <div
        onClick={() => onNavigate && onNavigate('login')}
        className="fixed top-6 left-6 sm:top-8 sm:left-8 z-50 flex items-center gap-3 select-none cursor-pointer group"
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
        {CHESS_REGISTER_BG && (
          <img
            src={CHESS_REGISTER_BG}
            alt="Chess Registration Background"
            className="w-full h-full object-cover object-center filter brightness-40 opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/85 to-[#080d1a]" />
      </div>

      {/* Ambient glow effects */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Registration Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0c1424]/95 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Top glowing line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1 shadow-lg shadow-amber-500/10">
            {step === 'form' ? (
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h18z"/>
              </svg>
            ) : (
              <KeyRound className="w-7 h-7 text-amber-400" />
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {step === 'form' ? 'Join ChessCure' : 'Verify Your Identity'}
          </h2>
          <p className="text-xs text-slate-400">
            {step === 'form'
              ? 'Create your account to start playing and climbing the leaderboard.'
              : `Enter the 6-digit code sent to ${getTargetIdentifier()}`}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 'form' ? (
          /* Step 1: Account Information Form */
          <form onSubmit={handleProceedToOtp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="MagnusCarlsenJr"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="player@gmail.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mobile (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Skill Tier</label>
              <select
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="beginner">Beginner (Under 1000)</option>
                <option value="intermediate">Club Player (1000 - 1600)</option>
                <option value="advanced">Grandmaster Aspirant (1600+)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <span className={`text-[10px] font-semibold ${strength > 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {strengthLabels[strength]}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              <div className="grid grid-cols-4 gap-1 mt-1.5">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`h-1 rounded-full transition-all ${
                      strength >= bar ? strengthColors[strength] : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-400 pt-1">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-amber-500 accent-amber-500"
              />
              <span>I agree to the Terms of Service & Privacy Policy</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-xs tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-3 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Verify with OTP & Register</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: 6-Digit OTP Verification Form */
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div className="p-3 rounded-2xl bg-[#080d17] border border-slate-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Code Expires In:</span>
                <span className={`font-mono font-bold ${expirySeconds < 120 ? 'text-rose-400' : 'text-amber-400'}`}>
                  {formatTimer(expirySeconds)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Valid for 10 minutes from request</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full py-3 text-center tracking-[0.4em] font-mono font-bold text-lg bg-[#080d17] border border-slate-700/80 rounded-xl text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                autoFocus
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Edit Details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldownSeconds > 0 || isLoading}
                className="text-amber-400 hover:text-amber-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                {cooldownSeconds > 0 ? `Resend Code (${cooldownSeconds}s)` : 'Resend Code'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length < 6 || expirySeconds <= 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-xs tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-3 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>Verifying & Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Already registered?{' '}
          <button
            onClick={() => onNavigate && onNavigate('login')}
            className="text-amber-400 hover:underline font-semibold"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
