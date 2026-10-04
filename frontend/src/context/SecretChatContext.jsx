import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const SecretChatContext = createContext(null);

const DEFAULT_MESSAGES = [
  {
    id: 1,
    sender: 'network',
    author: 'Grandmaster Encrypted Network',
    text: 'You discovered the hidden move. Secret chat channel is now initialized.',
    isSystem: true,
    timestamp: 'Just now',
  },
  {
    id: 2,
    sender: 'system',
    author: 'Tactical Node #7',
    text: 'Ready to send secure real-time messages.',
    isSystem: false,
    timestamp: 'Just now',
  },
];

// Contextual intelligent responses from the encrypted Grandmaster network
const GM_RESPONSES = [
  "Encrypted Transmission: Superb tactical kill in the opening! Notice how the center squares (e4, d4, e5, d5) are now vulnerable for invasion.",
  "Grandmaster Node Alpha: Your piece capture within the first 5 moves disrupted your opponent's development tempo by +1.4 evaluation.",
  "Tactical Advisory: Look to deploy your knights to forward outposts. A knight anchored on the 5th or 6th rank is worth a rook.",
  "Encrypted Network: Transmission received. Stockfish evaluates your king safety as optimal. Keep vigilance over potential back-rank tactics.",
  "Grandmaster Leo: Excellent initiative. Whenever you gain material advantage early, simplify into a winning endgame or press the kingside attack!",
  "Tactical Node #7: Secure link confirmed. We recommend preparing a rook lift along the 3rd rank for maximum offensive firepower.",
  "Encrypted GM Dispatch: Hidden line detected: Sacrifice the bishop on h7 only if your queen and knight can coordinate immediately.",
];

export function SecretChatProvider({ children }) {
  const [isChatUnlocked, setIsChatUnlocked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120); // 120 seconds default session duration
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState('Opponent piece captured within 5 moves');
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [expiredNotice, setExpiredNotice] = useState(false);

  const timerRef = useRef(null);

  // Countdown timer effect
  useEffect(() => {
    if (isChatUnlocked && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsChatUnlocked(false);
            setIsChatModalOpen(false);
            setExpiredNotice(true);
            setTimeout(() => setExpiredNotice(false), 5000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isChatUnlocked, timeRemaining]);

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Unlock function
  const unlockSecretChat = (reason = 'Opponent piece captured within 5 moves') => {
    setUnlockReason(reason);
    setTimeRemaining(120); // 2 minutes limited time
    setIsChatUnlocked(true);
    setIsChatModalOpen(true);
    setExpiredNotice(false);

    // Blast celebratory confetti
    try {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#fbbf24', '#d97706', '#ffffff', '#10b981'],
      });
    } catch (e) {
      // ignore
    }

    // Append unlock announcement
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'network',
        author: 'Grandmaster Encrypted Network',
        text: `⚡ Tactical Trigger Verified: ${reason}. Secure communication channel active for 2 minutes.`,
        isSystem: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const openChatModal = () => {
    setIsChatModalOpen(true);
  };

  const closeChatModal = () => {
    setIsChatModalOpen(false);
  };

  const lockSecretChat = () => {
    setIsChatUnlocked(false);
    setIsChatModalOpen(false);
    setTimeRemaining(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Send message
  const sendMessage = (text) => {
    if (!text || !text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      author: 'You (Grandmaster)',
      text: text.trim(),
      isSystem: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Generate GM reply after short realistic delay
    setTimeout(() => {
      const randomResponse = GM_RESPONSES[Math.floor(Math.random() * GM_RESPONSES.length)];
      const gmMsg = {
        id: Date.now() + 1,
        sender: 'agent',
        author: 'Grandmaster Encrypted Network',
        text: randomResponse,
        isSystem: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, gmMsg]);
      setIsTyping(false);
    }, 700);
  };

  const value = {
    isChatUnlocked,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isChatModalOpen,
    unlockReason,
    messages,
    isTyping,
    expiredNotice,
    unlockSecretChat,
    openChatModal,
    closeChatModal,
    lockSecretChat,
    sendMessage,
    formatTime,
  };

  return (
    <SecretChatContext.Provider value={value}>
      {children}
    </SecretChatContext.Provider>
  );
}

export function useSecretChat() {
  const context = useContext(SecretChatContext);
  if (!context) {
    throw new Error('useSecretChat must be used within a SecretChatProvider');
  }
  return context;
}

export default SecretChatContext;
