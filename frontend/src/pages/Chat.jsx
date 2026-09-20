import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  MessageSquare, 
  KeyRound, 
  ArrowRight, 
  Trophy,
  CheckCircle2
} from 'lucide-react';

export default function Chat({ 
  chatUnlocked = false, 
  onUnlockChat, 
  onNavigate, 
  userProfile, 
  userPoints = 150 
}) {
  const [activeChannel, setActiveChannel] = useState('gm-tactics');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'gm',
      author: 'GM Magnus Advisor',
      role: 'Grandmaster Bot',
      avatar: 'GM',
      text: 'Welcome to the Chess Cure Secure Room. Congratulations on completing your cognitive challenge! Your move calculation shows high precision. What tactical concept or game state would you like to examine?',
      timestamp: '10:42 AM',
    },
    {
      id: 2,
      sender: 'pms',
      author: 'Dr. Aris Thorne',
      role: 'PMS Cognitive Lead',
      avatar: 'AT',
      text: 'Your decision latency telemetry indicates strong focus stability. Remember that deep calculation in tactical positions builds long-term neuroplasticity.',
      timestamp: '10:43 AM',
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatUnlocked) {
      scrollToBottom();
    }
  }, [messages, chatUnlocked]);

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      author: userProfile?.name || 'You',
      role: 'Player',
      avatar: userProfile?.name ? userProfile.name[0].toUpperCase() : 'U',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Simulate intelligent Grandmaster reply
    setTimeout(() => {
      let replyText = "That is a hallmark question in competitive chess. When calculating candidate moves, prioritize forcing moves first: Checks, Captures, and Threats (CCT). This prevents blunder impulses under time pressure.";
      
      const lower = query.toLowerCase();
      if (lower.includes('smothered') || lower.includes('mate')) {
        replyText = "In smothered mate positions, notice how the defending King is paralyzed by its own friendly pieces. A Queen sacrifice on g8 is typical to divert the defender and allow the Knight to land on f7 with unblockable checkmate!";
      } else if (lower.includes('blunder') || lower.includes('time') || lower.includes('pressure')) {
        replyText = "Blunders often occur due to premature execution. In our PMS cognitive protocol, we recommend the 'Sit On Hands' pause: take 2 deep breaths and verify your opponent's immediate responses before committing.";
      } else if (lower.includes('opening') || lower.includes('strategy')) {
        replyText = "Control the center, develop knights before bishops, and secure your King early. A solid structure gives you cognitive comfort to spot sharp tactical opportunities later.";
      }

      const gmReply = {
        id: Date.now() + 1,
        sender: 'gm',
        author: 'GM Magnus Advisor',
        role: 'Grandmaster Bot',
        avatar: 'GM',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, gmReply]);
      setIsTyping(false);
    }, 800);
  };

  const samplePrompts = [
    "How do I calculate candidate moves faster?",
    "Explain the smothered mate key principles",
    "Tips for avoiding blunders under time pressure",
  ];

  // If chat is locked, render luxury security clearance screen
  if (!chatUnlocked) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 animate-fade-in">
        <div className="max-w-lg w-full glass-card rounded-3xl p-8 sm:p-10 border-amber-500/30 text-center space-y-6 relative overflow-hidden shadow-2xl">
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(229,169,60,0.25)]">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block">
              256-Bit Encrypted GM Clearance
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Grandmaster Messaging Locked
            </h1>
            <p className="text-slate-300 text-sm max-w-sm mx-auto leading-relaxed">
              Complete at least 1 tactical Chess Challenge or achieve 200+ points to unlock direct, encrypted messaging with our Grandmaster coaches and PMS analysts.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Your Current Points</span>
              <span className="text-amber-400 font-bold">{userPoints} / 200 PTS</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((userPoints / 200) * 100))}%` }}
              />
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate && onNavigate('challenge')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-sm shadow-[0_0_20px_rgba(229,169,60,0.3)] hover:shadow-[0_0_28px_rgba(229,169,60,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Solve Chess Challenge to Unlock</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (onUnlockChat) onUnlockChat();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Quick Demo Instant Unlock</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Unlocked State: Full Secure Messaging Interface
  return (
    <div className="min-h-[calc(100vh-80px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in flex flex-col">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Grandmaster Secure Messaging
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Encrypted
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              256-bit PMS encrypted channel • Grandmaster Bot & Cognitive Advisor Online
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Session</span>
        </div>
      </div>

      {/* Main Messaging Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 flex-1 items-stretch">
        
        {/* Left: Channels Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Encrypted Channels
            </p>
            <div className="space-y-1.5">
              {[
                { id: 'gm-tactics', name: '#gm-tactics-review', desc: 'Tactical analysis & candidate moves' },
                { id: 'cognitive-pms', name: '#cognitive-wellness', desc: 'Decision fatigue & focus recovery' },
                { id: 'sparring', name: '#grandmaster-sparring', desc: 'Match strategy & tournament prep' },
              ].map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all text-xs flex flex-col ${
                    activeChannel === ch.id
                      ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                      : 'hover:bg-slate-900/60 border border-transparent text-slate-400'
                  }`}
                >
                  <span className="font-bold text-amber-300">{ch.name}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">{ch.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Coach Profile Card */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Assigned Mentors
            </p>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                GM
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-bold text-white truncate">GM Magnus Advisor</p>
                <p className="text-emerald-400 text-[10px]">Online • Ready to analyze</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                AT
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-bold text-white truncate">Dr. Aris Thorne</p>
                <p className="text-slate-400 text-[10px]">Cognitive Acuity Lead</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Message Window (8 cols) */}
        <div className="lg:col-span-8 flex flex-col rounded-3xl glass-card border-amber-500/20 overflow-hidden min-h-[500px]">
          
          {/* Channel Bar */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white font-bold">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>#{activeChannel}</span>
            </div>
            <span className="text-slate-400">End-to-End Encrypted</span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[460px]">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                      {m.avatar}
                    </div>
                  )}

                  <div className={`max-w-md space-y-1 ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
                    <div className="flex items-center gap-2 px-1">
                      <span className="font-bold text-slate-300">{m.author}</span>
                      <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed text-sm ${
                        isUser
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium shadow-md'
                          : 'bg-[#101a2d] border border-slate-800 text-slate-200'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold shrink-0">
                      {m.avatar}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-3 text-xs justify-start items-center animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  GM
                </div>
                <div className="p-3 rounded-2xl bg-[#101a2d] border border-slate-800 text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce delay-200" />
                  <span className="text-xs ml-1 text-slate-400">GM Magnus is analyzing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Strip */}
          <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] text-slate-500 shrink-0 font-medium">Quick Prompts:</span>
            {samplePrompts.map((sp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sp)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/30 text-[11px] transition-colors"
              >
                {sp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 sm:p-4 bg-slate-900/60 border-t border-slate-800 flex items-center gap-3"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask GM Magnus a tactical or cognitive chess question..."
              className="flex-1 bg-[#090e1c] border border-slate-700/80 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="px-5 py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b94e] disabled:opacity-50 text-black font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
