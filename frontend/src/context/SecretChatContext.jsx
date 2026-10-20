import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const SecretChatContext = createContext(null);

const STORAGE_SESSION_KEY = 'cc_chat_unlock_session';

const formatTime = (secs) => {
  const safeSecs = Math.max(0, Math.floor(secs || 0));
  const m = Math.floor(safeSecs / 60);
  const s = safeSecs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function SecretChatProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.expiresAt) {
          const remaining = Math.max(0, Math.floor((new Date(parsed.expiresAt).getTime() - Date.now()) / 1000));
          if (remaining > 0) {
            return {
              isUnlocked: true,
              timeRemaining: remaining,
              expiresAt: parsed.expiresAt,
              unlockReason: parsed.unlockReason || 'Opponent piece captured within 5 moves',
              friendId: parsed.friendId || null,
            };
          }
        }
      }
    } catch {}
    return {
      isUnlocked: false,
      timeRemaining: 0,
      expiresAt: null,
      unlockReason: '',
      friendId: null,
    };
  });

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const timerRef = useRef(null);

  // Single monotonic countdown timer effect based strictly on expiresAt
  useEffect(() => {
    if (session.isUnlocked && session.expiresAt) {
      if (timerRef.current) clearInterval(timerRef.current);

      const tick = () => {
        const expTime = new Date(session.expiresAt).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expTime - now) / 1000));

        if (diff <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setSession((prev) => ({
            ...prev,
            isUnlocked: false,
            timeRemaining: 0,
          }));
          try {
            localStorage.removeItem(STORAGE_SESSION_KEY);
            localStorage.removeItem('cc_selected_chat_opponent');
          } catch {}
        } else {
          setSession((prev) => (prev.timeRemaining === diff ? prev : { ...prev, timeRemaining: diff }));
        }
      };

      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session.isUnlocked, session.expiresAt]);

  // Unlock secret chat session for 5 minutes (300 seconds)
  const unlockSecretChat = (params = 'Opponent piece captured within 5 moves') => {
    let reason = typeof params === 'string' ? params : (params?.reason || 'Opponent piece captured within 5 moves');
    let friendId = typeof params === 'object' ? params?.friendId : null;
    let durationSeconds = typeof params === 'object' && params?.durationSeconds ? params.durationSeconds : 300;
    
    const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();

    const newSession = {
      isUnlocked: true,
      timeRemaining: durationSeconds,
      expiresAt,
      unlockReason: reason,
      friendId,
    };

    setSession(newSession);
    setIsChatModalOpen(false);

    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newSession));
    } catch {}

    // Celebratory confetti
    try {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#fbbf24', '#d97706', '#ffffff', '#10b981'],
      });
    } catch {}
  };

  const lockSecretChat = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSession({
      isUnlocked: false,
      timeRemaining: 0,
      expiresAt: null,
      unlockReason: '',
      friendId: null,
    });
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {}
  };

  const openChatModal = () => setIsChatModalOpen(false);
  const closeChatModal = () => setIsChatModalOpen(false);

  const value = {
    isChatUnlocked: session.isUnlocked,
    timeRemaining: session.timeRemaining,
    formattedTime: formatTime(session.timeRemaining),
    expiresAt: session.expiresAt,
    unlockReason: session.unlockReason,
    unlockedFriendId: session.friendId,
    isChatModalOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    unlockSecretChat,
    lockSecretChat,
    openChatModal,
    closeChatModal,
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
    return {
      isChatUnlocked: false,
      timeRemaining: 0,
      formattedTime: '00:00',
      expiresAt: null,
      unlockReason: '',
      unlockedFriendId: null,
      isChatModalOpen: false,
      isPaymentModalOpen: false,
      setIsPaymentModalOpen: () => {},
      unlockSecretChat: () => {},
      lockSecretChat: () => {},
      openChatModal: () => {},
      closeChatModal: () => {},
      formatTime: () => '00:00',
    };
  }
  return context;
}

export default SecretChatContext;

