import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Check, CheckCircle2, Shield, Award, Sparkles } from 'lucide-react';
import { CHESS_REGISTER_BG } from '../assets/images/chessImages';

export default function Signup({ onNavigate, onRegisterSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score; // 0 to 4
  };

  const passwordStrength = getPasswordStrength();

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 0: return { label: 'Empty', color: 'bg-slate-700' };
      case 1: return { label: 'Weak', color: 'bg-rose-500' };
      case 2: return { label: 'Moderate', color: 'bg-amber-500' };
      case 3: return { label: 'Good', color: 'bg-blue-400' };
      case 4: return { label: 'Grandmaster Level', color: 'bg-emerald-400' };
      default: return { label: '', color: 'bg-slate-700' };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Account created successfully! Preparing your tactical arena...');

      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess({
            name: fullName,
            email: email,
            skill: skillLevel,
            rating: skillLevel === 'beginner' ? 800 : skillLevel === 'intermediate' ? 1200 : skillLevel === 'advanced' ? 1600 : 2100
          });
        }
        if (onNavigate) onNavigate('home');
      }, 1000);
    }, 1100);
  };

  const skillOptions = [
    { id: 'beginner', label: 'Beginner', desc: '< 1000 Rating' },
    { id: 'intermediate', label: 'Club Player', desc: '1000 - 1500' },
    { id: 'advanced', label: 'Advanced', desc: '1500 - 2000' },
    { id: 'master', label: 'Master / GM', desc: '2000+ Rating' },
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background Chess Artwork with Dark Dramatic Gradient Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={CHESS_REGISTER_BG}
          alt="Macro Golden Chess Pieces Arena"
          className="w-full h-full object-cover object-center filter brightness-60 scale-105 transition-transform duration-1000"
        />
        {/* Layered dark gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/80 to-[#080c14]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,12,20,0.85)_100%)]" />
      </div>

      {/* Ambient glowing orbs */}
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Register Card */}
      <div className="relative z-10 w-full max-w-lg animate-fade-in-up">
        <div className="glass-card rounded-3xl p-6 sm:p-9 shadow-2xl relative overflow-hidden">
          
          {/* Subtle top golden light bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Card Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(229,169,60,0.25)] mb-2 group">
              <svg
                className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 22H5a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1zM7 16l-.8-2.4A4.002 4.002 0 0 1 7.2 9H9V7.5a2.5 2.5 0 0 1 4.2-1.83 5.48 5.48 0 0 0 1.94 1.15A3.003 3.003 0 0 1 17 9.64V12a4 4 0 0 1-4 4H7zm3.5-6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
              </svg>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Create Your Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              Join the Chess Cure PMS arena to sharpen focus and elevate your tactical rating.
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

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300">
                Full Name / Player Handle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Magnus Carlsen"
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:text-white"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="magnus@chesscure.com"
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:text-white"
                  required
                />
              </div>
            </div>

            {/* Chess Experience Level Selector */}
            <div className="space-y-2 text-left pt-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Select Your Chess Level</span>
                <span className="text-[11px] text-amber-400 font-normal">Calibrates AI bot engine</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {skillOptions.map((opt) => {
                  const isSelected = skillLevel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSkillLevel(opt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_12px_rgba(229,169,60,0.2)]'
                          : 'border-slate-800 bg-[#09101d] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password & Confirm Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Password */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="glass-input w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Strength Meter */}
            {password && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Password Security</span>
                  <span className="font-semibold text-slate-300">{getStrengthLabel().label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= step ? getStrengthLabel().color : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Terms and Conditions Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 accent-amber-500 focus:ring-amber-500/20"
                />
                <span className="leading-relaxed">
                  I agree to the <span className="text-amber-400 hover:underline">Terms of Service</span> and <span className="text-amber-400 hover:underline">Privacy Policy</span>.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-sm shadow-[0_0_20px_rgba(229,169,60,0.3)] hover:shadow-[0_0_30px_rgba(229,169,60,0.45)] transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>Configuring Your Profile...</span>
                </>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 text-center text-xs text-slate-400">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('login')}
              className="text-amber-400 font-semibold hover:text-amber-300 hover:underline inline-flex items-center gap-1"
            >
              <span>Sign In</span>
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
    </div>
  );
}
