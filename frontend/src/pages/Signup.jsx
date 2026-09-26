import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, RotateCw, Sparkles, Award } from 'lucide-react';
import { CHESS_REGISTER_BG } from '../assets/images/chessImages';

export default function Signup({ onNavigate }) {
  const { register, loginWithGoogle, loginWithFacebook, continueAsGuest } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobileNumber: '',
    skillLevel: 'intermediate',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

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

  const handleProceedToOtp = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in username, email, and password.');
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

    setStep('otp');
    setCountdown(45);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    const fullOtp = otpValues.join('');
    if (fullOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP');
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
      });

      setSuccessMessage('Account created successfully! Entering ChessCure...');
      setTimeout(() => {
        if (onNavigate) onNavigate('home');
      }, 700);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
        <div className="relative flex items-center justify-center">
          <img
            src="/chess_cure_logo.jpg"
            alt="ChessCure Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl shadow-md border border-amber-500/30 group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.35)]"
          />
        </div>
        <div className="text-2xl font-bold tracking-tight text-white flex items-center">
          Chess<span className="text-[#e5a93c]">Cure</span>
        </div>
      </div>
      {/* Background artwork */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {CHESS_REGISTER_BG && (
          <img
            src={CHESS_REGISTER_BG}
            alt="Chess Register Background"
            className="w-full h-full object-cover object-center filter brightness-50 opacity-20"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/85 to-[#080d1a]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#0c1424]/95 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1 shadow-lg shadow-amber-500/10">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 22H5a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1zM7 16l-.8-2.4A4.002 4.002 0 0 1 7.2 9H9V7.5a2.5 2.5 0 0 1 4.2-1.83 5.48 5.48 0 0 0 1.94 1.15A3.003 3.003 0 0 1 17 9.64V12a4 4 0 0 1-4 4H7zm3.5-6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-400">Join thousands of chess strategists & master tactical vision</p>
        </div>

        {/* Quick Social Starts (only on initial form) */}
        {step === 'form' && (
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              type="button"
              onClick={() => { loginWithGoogle(); if (onNavigate) onNavigate('home'); }}
              className="py-2 px-3 rounded-xl bg-[#111c30] hover:bg-[#16243d] border border-slate-700/80 text-white text-[11px] font-semibold flex items-center justify-center gap-2"
            >
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => { continueAsGuest(); if (onNavigate) onNavigate('home'); }}
              className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Guest Mode</span>
            </button>
          </div>
        )}

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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-xs tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            >
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        ) : (
          /* OTP Verification Step */
          <form onSubmit={handleVerifyAndRegister} className="space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800 text-left space-y-1">
              <p className="text-xs text-slate-400">Verification code sent to:</p>
              <p className="text-sm font-bold text-amber-400 truncate">{formData.email}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-3">
                Enter 6-Digit Security Code
              </label>
              <div className="flex justify-between gap-2">
                {otpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 rounded-xl bg-[#080d17] border border-slate-700 text-center text-lg font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Time remaining: <strong className="text-amber-400">{countdown}s</strong></span>
              <button
                type="button"
                disabled={countdown > 0}
                onClick={() => setCountdown(45)}
                className="text-amber-400 hover:text-amber-300 disabled:opacity-40 flex items-center gap-1 font-semibold"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Resend</span>
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-xs uppercase tracking-wide transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full py-2 text-xs text-slate-400 hover:text-white"
              >
                ← Back to Edit Details
              </button>
            </div>
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
