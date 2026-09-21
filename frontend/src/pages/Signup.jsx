import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Check, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { CHESS_REGISTER_BG } from '../assets/images/chessImages';
import { useAuth } from '../hooks/useAuth';

export default function Signup({ onNavigate, onRegisterSuccess }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !email.trim() || !mobileNumber.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields (Username, Email ID, Mobile Number, Passwords).');
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid Email ID.');
      return;
    }

    // Basic mobile format check (at least 7-15 digits, allowing optional +)
    const phoneClean = mobileNumber.replace(/[\s\-()]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(phoneClean)) {
      setErrorMessage('Please enter a valid Mobile Number (e.g. +1 555 123 4567 or 10-digit number).');
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

    try {
      const res = await register({
        username: username.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        password,
        skill: skillLevel
      });

      setSuccessMessage('Account created successfully! Redirecting to sign in...');

      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess(res.user);
        }
        // Flow: Register -> Login
        if (onNavigate) onNavigate('login');
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const skillOptions = [
    { id: 'beginner', label: 'Beginner', desc: '< 1000 Rating' },
    { id: 'intermediate', label: 'Club Player', desc: '1000 - 1500' },
    { id: 'advanced', label: 'Advanced', desc: '1500 - 2000' },
    { id: 'master', label: 'Master / GM', desc: '2000+ Rating' },
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* 
        Background Chess Artwork:
        Visibly rich and atmospheric with a balanced luxury dark overlay 
        ensuring the form remains 100% crisp, clear and readable
      */}
      <div className="absolute inset-0 z-0">
        <img
          src={CHESS_REGISTER_BG}
          alt="Macro Golden Chess Pieces Arena"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-110 opacity-35 scale-105 transition-transform duration-1000"
        />
        {/* Subtle perspective chessboard pattern layer */}
        <div className="absolute inset-0 hero-chess-grid opacity-20 pointer-events-none" />
        
        {/* Layered dark gradients providing soft atmospheric vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/75 to-[#080c14]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(8,12,20,0.8)_100%)]" />
      </div>

      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Register Card */}
      <div className="relative z-10 w-full max-w-lg animate-fade-in-up">
        <div className="glass-card rounded-3xl p-6 sm:p-9 shadow-2xl relative overflow-hidden border border-amber-500/30 bg-[#091122]/90 backdrop-blur-2xl">
          
          {/* Subtle top golden light bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Card Header with Cropped King/Keyhole Emblem */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-1 shadow-[0_0_25px_rgba(229,169,60,0.3)] mb-2 group">
              <img
                src="/chess_cure_emblem.png"
                alt="Chess Cure King Emblem"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(229,169,60,0.5)] transition-transform duration-300 group-hover:scale-110"
              />
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
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Username</span>
                <span className="text-[11px] text-amber-400/80 font-normal">Unique player handle</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="magnus_carlsen"
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:text-white"
                  required
                />
              </div>
            </div>

            {/* Email ID Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300">
                Email ID
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

            {/* Mobile Number Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Mobile Number</span>
                <span className="text-[11px] text-slate-400 font-normal">With country code or 10 digits</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+1 (555) 019-2834"
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
              className="text-amber-400 font-semibold hover:text-amber-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
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
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
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
