import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, ArrowRight, ShieldCheck, CheckCircle2, RotateCw } from 'lucide-react';

export default function Signup({ onNavigate }) {
  const { signup, loginWithGoogle, loginWithFacebook, continueAsGuest } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    identifier: '', // email or mobile
    password: '',
  });

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(45);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.identifier.trim() || !formData.password) {
      setError('Please fill in all the required fields');
      return;
    }
    setStep('otp');
    setCountdown(45);
  };

  const handleOtpInput = (index, value) => {
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

  const handleVerifyAndComplete = () => {
    const fullOtp = otpValues.join('');
    if (fullOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }
    // Complete signup
    signup(formData);
    onNavigate('home');
  };

  return (
    <div className="min-h-[calc(100vh-90px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-[#0c1424]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {step === 'form' ? (
          <>
            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 22H5a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1zM7 16l-.8-2.4A4.002 4.002 0 0 1 7.2 9H9V7.5a2.5 2.5 0 0 1 4.2-1.83 5.48 5.48 0 0 0 1.94 1.15A3.003 3.003 0 0 1 17 9.64V12a4 4 0 0 1-4 4H7zm3.5-6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Account</h2>
              <p className="text-xs text-slate-400">Join the ChessCure realm and start your career</p>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              <button
                type="button"
                onClick={() => { loginWithGoogle(); onNavigate('home'); }}
                className="py-2.5 px-3 rounded-xl bg-[#111c30] hover:bg-[#16243d] border border-slate-700/80 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => { loginWithFacebook(); onNavigate('home'); }}
                className="py-2.5 px-3 rounded-xl bg-[#111c30] hover:bg-[#16243d] border border-slate-700/80 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#0c1424] px-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                or manual signup
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="e.g. MasterGambit"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email or Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    placeholder="grandmaster@chess.com or +91 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Choose a strong password"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-xs tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
              >
                <span>Send Verification OTP</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-amber-400 hover:underline font-semibold"
              >
                Log in
              </button>
            </p>
          </>
        ) : (
          /* Step 2: OTP Verification */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Enter OTP</h2>
              <p className="text-xs text-slate-400">
                We sent a 6-digit code to <span className="text-amber-400 font-semibold">{formData.identifier}</span>
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
                {error}
              </div>
            )}

            {/* 6 Digit OTP Input Boxes */}
            <div className="flex justify-between gap-2">
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpInput(idx, e.target.value)}
                  className="w-11 h-12 text-center text-lg font-bold bg-[#080d17] border border-slate-700 rounded-xl text-amber-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              ))}
            </div>

            <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <span>Didn't receive code?</span>
              <button
                type="button"
                onClick={() => setCountdown(45)}
                className="text-amber-400 hover:underline font-medium"
              >
                Resend in {countdown}s
              </button>
            </div>

            <button
              type="button"
              onClick={handleVerifyAndComplete}
              className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-xs tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify & Create Account</span>
            </button>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-400"
            >
              ← Edit details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
