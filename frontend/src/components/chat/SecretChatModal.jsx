import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Clock, 
  ShieldCheck, 
  Lock, 
  Bot, 
  User, 
  Swords, 
  Zap, 
  ChevronRight,
  Radio,
  Flame
} from 'lucide-react';
import { useSecretChat } from '../../context/SecretChatContext';

export default function SecretChatModal({ onNavigate }) {
  const { 
    isChatUnlocked, 
    timeRemaining, 
    formattedTime, 
    isChatModalOpen, 
    unlockReason, 
    messages, 
    isTyping,
    closeChatModal, 
    sendMessage,
    unlockSecretChat 
  } = useSecretChat();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    if (isChatModalOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatModalOpen, isTyping]);

  if (!isChatModalOpen) return null;

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputVal.trim()) return;
    sendMessage(inputVal);
    setInputVal('');
  };

  const handleQuickPrompt = (promptText) => {
    sendMessage(promptText);
  };

  const timePercent = Math.max(0, Math.min(100, (timeRemaining / 120) * 100));

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* 
        CHESSBOARD-DIMENSIONED CONTAINER (MATCHES CHESSBOARD PROPORTIONS, SIZED BIGGER)
        Width: max-w-[680px] - max-w-[720px]
        Height: min-h-[580px] - 640px
      */}
      <div 
        className="relative w-full max-w-[680px] md:max-w-[720px] min-h-[580px] md:h-[640px] flex flex-col rounded-3xl bg-gradient-to-b from-[#0e1728] via-[#09101d] to-[#060a13] border-2 border-amber-400/80 shadow-[0_0_60px_rgba(245,158,11,0.3),0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Gold Shimmer Highlight Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* ================= MODAL HEADER ================= */}
        <div className="px-5 py-4 border-b border-slate-800/90 flex items-center justify-between bg-[#0b1322]/80 backdrop-blur-sm relative z-10">
          
          {/* Left Title & Sparkle Icon (Matches User Screenshot) */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border-2 border-amber-400/70 flex items-center justify-center text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.35)] shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight font-sans">
                  Secret Chat Channel
                </h3>
                {isChatUnlocked && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                    <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                    LIVE LINK
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-amber-400/90 font-medium">
                {isChatUnlocked 
                  ? `Unlocked via ${unlockReason || 'Tactical Kill Easter Egg'}`
                  : 'Tactical Grandmaster Clearance Required'
                }
              </p>
            </div>
          </div>

          {/* Right: Live Countdown Timer & Close Button */}
          <div className="flex items-center gap-2.5">
            {isChatUnlocked && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 shadow-inner">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                  Auto-locks in:
                </span>
                <span className="text-xs sm:text-sm font-mono font-black text-amber-300">
                  {formattedTime}
                </span>
              </div>
            )}

            <button
              onClick={closeChatModal}
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Close window (Channel remains active until timer expires)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Timer Progress Bar */}
        {isChatUnlocked && (
          <div className="w-full bg-slate-900 h-1 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-1000 ease-linear"
              style={{ width: `${timePercent}%` }}
            />
          </div>
        )}

        {/* ================= MODAL BODY ================= */}
        {isChatUnlocked ? (
          <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden">
            
            {/* Grandmaster Encrypted Network Banner (Matches Screenshot) */}
            <div className="mb-3.5 p-3 sm:p-3.5 rounded-2xl bg-[#0b1424] border border-amber-500/30 flex items-start gap-3 shadow-md">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-amber-400 uppercase tracking-wide">
                  Grandmaster Encrypted Network
                </p>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-snug mt-0.5">
                  You discovered the hidden move. Secret chat channel is now initialized.
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Opponent piece was eliminated within 5 moves. Secure tactical channel is open for a limited time.
                </p>
              </div>
            </div>

            {/* Scrollable Chat Stream (Spacious, bigger chessboard dimensions) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 p-3.5 rounded-2xl bg-[#070b13] border border-slate-800/90 shadow-inner">
              {messages.map((msg) => {
                if (msg.sender === 'user') {
                  return (
                    <div key={msg.id} className="flex flex-col items-end animate-in fade-in slide-in-from-bottom-2">
                      <div className="max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl rounded-tr-none bg-gradient-to-r from-amber-500/25 via-amber-600/20 to-amber-500/15 border border-amber-500/40 text-amber-100 text-xs sm:text-sm shadow-md">
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono mt-1 mr-1">
                        {msg.timestamp || 'Just now'} · You
                      </span>
                    </div>
                  );
                }

                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="p-3 rounded-xl bg-[#0f192b] border border-slate-800 text-xs text-slate-300 max-w-[90%] sm:max-w-[85%] shadow-sm">
                      <p className="text-[10px] text-amber-400 font-bold mb-0.5 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {msg.author}
                      </p>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2">
                    <div className="max-w-[88%] sm:max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-[#111c30] border border-slate-700/80 text-slate-200 text-xs sm:text-sm shadow-md">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Bot className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-bold text-amber-300">{msg.author}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono mt-1 ml-1">
                      {msg.timestamp || 'Just now'} · Encrypted Node
                    </span>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#111c30] border border-slate-800 w-fit text-xs text-amber-300">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-[11px] font-mono">Grandmaster Node decrypting response...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Tactical Prompt Chips */}
            <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto text-[10px]">
              <span className="text-slate-500 font-bold shrink-0">Tactics:</span>
              <button
                type="button"
                onClick={() => handleQuickPrompt('Give me the best follow-up attack after the early piece capture.')}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 shrink-0 transition-colors"
              >
                ⚡ Follow-up attack
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('How should I exploit the opponent’s exposed center squares?')}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 shrink-0 transition-colors"
              >
                🎯 Exploit center
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('Analyze my knight positioning and outpost potential.')}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 shrink-0 transition-colors"
              >
                ♞ Knight outposts
              </button>
            </div>

            {/* Bottom Input Area (Matches Screenshot) */}
            <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-slate-800/90">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type an encrypted message..."
                className="flex-1 px-4 py-2.5 bg-[#0d1524] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="px-5 py-2.5 bg-[#e5a93c] hover:bg-[#f5b94e] disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          /* ================= LOCKED / REQUIREMENT STATE ================= */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-pulse">
              <Lock className="w-9 h-9" />
            </div>

            <div className="max-w-md space-y-2">
              <h4 className="text-xl sm:text-2xl font-black text-white">
                Encrypted Channel Locked
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                The Secret Grandmaster Chat is an exclusive tactical Easter Egg. 
              </p>
              <div className="p-3.5 rounded-2xl bg-[#091122] border border-amber-500/40 text-left space-y-1.5 mt-3">
                <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  How to unlock:
                </p>
                <p className="text-[11px] text-slate-300">
                  1. Start a match in <strong className="text-white">Play Chess</strong>.
                </p>
                <p className="text-[11px] text-slate-300">
                  2. Within the <strong className="text-amber-300">first 5 moves</strong>, eliminate (capture) an opponent's piece!
                </p>
                <p className="text-[11px] text-slate-300">
                  3. The Secret Chat Channel will immediately appear in the dimensions of the chessboard for a limited time!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  closeChatModal();
                  if (onNavigate) onNavigate('play');
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs uppercase shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                <Swords className="w-4 h-4" />
                <span>Play Chess Now</span>
              </button>

              <button
                onClick={() => unlockSecretChat('Quick Demo Unlock')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-400/40 transition-colors flex items-center gap-1.5"
                title="Instant Preview for testing"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Demo Unlock</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
