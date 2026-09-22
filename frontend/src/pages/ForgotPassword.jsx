import React, { useState } from 'react';
import { Mail, Phone, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword({ onNavigate }) {
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState('request'); // 'request' | 'otp' | 'success'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleRequestOtp = (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or mobile number');
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (otp.join('').length < 6 || !newPassword) {
      setError('Please enter the 6-digit OTP and your new password');
      return;
    }
    setStep('success');
  };

  return (
    <div className="min-h-[calc(100vh-90px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-[#0c1424]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {step === 'request' && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Reset Password</h2>
              <p className="text-xs text-slate-400">
                Enter your registered email or mobile to receive a recovery OTP.
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email or Mobile Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="grandmaster@chess.com or +91 9876543210"
                className="w-full px-4 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-xs tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Send Recovery Code</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-300 pt-2 block"
            >
              ← Back to Login
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Verify & New Password</h2>
              <p className="text-xs text-slate-400">
                Enter the OTP sent to <span className="text-amber-400">{identifier}</span>
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">6-Digit Code</label>
              <div className="flex justify-between gap-2">
                {otp.map((v, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={v}
                    onChange={(e) => {
                      const copy = [...otp];
                      copy[i] = e.target.value.slice(-1);
                      setOtp(copy);
                    }}
                    className="w-11 h-11 text-center font-bold text-amber-300 bg-[#080d17] border border-slate-700 rounded-xl focus:border-amber-400 focus:outline-none"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 bg-[#080d17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-xs tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99]"
            >
              Update Password
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Password Updated!</h3>
            <p className="text-xs text-slate-400">
              Your password has been changed successfully. You can now login.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] text-black font-bold text-xs uppercase"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
