import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Smile, 
  Lock, 
  Clock, 
  User, 
  UserPlus,
  Users,
  X, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard, 
  Swords, 
  Check, 
  ChevronRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useSecretChat } from '../context/SecretChatContext';
import api from '../services/api';

const CHESS_EMOJIS = ['♟️', '♞', '♝', '♜', '♛', '♚', '⚔️', '👑', '🔥', '🏆', '💯', '👍', '👏', '🎯', '💡', '🧠', '😊', '😎', '🤝', '🙌'];

const QUICK_PROMPTS = [
  '⚔️ Ready for a match!',
  '♞ Analyze opening moves',
  '🛡️ Defend king tactics',
  '🎯 Great game earlier!',
  '🏆 Good luck in your matches!',
];

const EMPTY_FRIENDS = [];

export default function Chat({
  onNavigate,
  embedded = false,
  inPlaceFriend = null,
  onCloseInPlace = null,
}) {
  const { 
    user, 
    token, 
    friendsList = EMPTY_FRIENDS,
    friendNotifications = [],
    sendFriendRequest,
    respondFriendRequest,
    sendMatchChallenge,
    fetchFriendsAndNotifications,
    setActiveOnlineMatch
  } = useAuth();

  const { isChatUnlocked: contextUnlocked, timeRemaining: contextRemaining, formattedTime: contextFormattedTime, unlockSecretChat } = useSecretChat ? (useSecretChat() || {}) : {};

  // Selected Friend in Chat
  const [selectedFriendId, setSelectedFriendId] = useState(() => {
    if (inPlaceFriend) return inPlaceFriend.id || inPlaceFriend.playerId;
    try {
      const pending = JSON.parse(localStorage.getItem('cc_selected_chat_opponent') || 'null');
      if (pending?.id || pending?.playerId) return pending.id || pending.playerId;
    } catch {}
    return null;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  // Add Friend Input State
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [addFriendFeedback, setAddFriendFeedback] = useState(null);
  const [copiedMyId, setCopiedMyId] = useState(false);

  // Active Chat Status & Messages State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState({
    isUnlocked: false,
    timeRemainingSeconds: 0,
    expiresAt: null,
    unlockReason: '',
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [sendError, setSendError] = useState('');

  // Premium ₹5 Payment Modal State
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi_gpay');
  const [paymentUpiId, setPaymentUpiId] = useState('');
  const [paymentStatusMessage, setPaymentStatusMessage] = useState('');

  const messagesEndRef = useRef(null);
  const chatPollRef = useRef(null);
  const timerCountdownRef = useRef(null);
  const chatSyncInFlightRef = useRef(null);
  const chatStatusRequestVersionRef = useRef(0);

  // If embedded in-place friend is passed, synchronize selection
  useEffect(() => {
    if (inPlaceFriend) {
      const fid = inPlaceFriend.id || inPlaceFriend.playerId;
      setSelectedFriendId(fid);
      setMobileView('chat');
    }
  }, [inPlaceFriend]);

  // Initial selection of friend
  useEffect(() => {
    if (inPlaceFriend) return;
    if (!friendsList.length) {
      if (!selectedFriendId) {
        setChatMessages([]);
        setChatStatus({ isUnlocked: false, timeRemainingSeconds: 0, expiresAt: null, unlockReason: '' });
      }
      return;
    }

    if (selectedFriendId && friendsList.some((friend) =>
      friend.id === selectedFriendId || friend.playerId === selectedFriendId
    )) return;

    let pending = null;
    try { pending = JSON.parse(localStorage.getItem('cc_selected_chat_opponent') || 'null'); } catch {}

    const preferredFriend = friendsList.find((friend) =>
      [friend.id, friend.playerId].some((id) => String(id) === String(pending?.id || pending?.playerId))
    );

    if (preferredFriend) {
      setSelectedFriendId(preferredFriend.id || preferredFriend.playerId);
      setMobileView('chat');
    } else if (friendsList[0]) {
      setSelectedFriendId(friendsList[0].id || friendsList[0].playerId);
    }
  }, [friendsList, selectedFriendId, inPlaceFriend]);

  // Resolve active friend
  const activeFriend = inPlaceFriend || friendsList.find(
    (f) => f.id === selectedFriendId || f.playerId === selectedFriendId
  ) || (selectedFriendId ? {
    id: selectedFriendId,
    playerId: selectedFriendId,
    name: 'Friend',
    username: 'Friend',
  } : null);

  const activeFriendParam = activeFriend?.id || activeFriend?.playerId;

  // Sync status and messages for active friend
  const syncActiveChat = async () => {
    if (!activeFriendParam || !token || chatSyncInFlightRef.current === activeFriendParam) return;
    chatSyncInFlightRef.current = activeFriendParam;
    const currentVersion = chatStatusRequestVersionRef.current;

    try {
      const [statusRes, msgRes] = await Promise.all([
        api.getChatStatus(token, activeFriendParam).catch(() => null),
        api.getChatMessages(token, activeFriendParam).catch(() => null),
      ]);

      if (currentVersion !== chatStatusRequestVersionRef.current) return;

      if (statusRes && statusRes.success) {
        const nextUnlocked = Boolean(statusRes.isUnlocked);
        const expiresAt = statusRes.expiresAt;
        const diffSeconds = expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : (statusRes.timeRemainingSeconds || 0);

        setChatStatus((prev) => {
          // Keep local countdown smooth without jumping back and forth
          const isSameSession = prev.isUnlocked && nextUnlocked && prev.expiresAt === expiresAt;
          return {
            isUnlocked: nextUnlocked,
            timeRemainingSeconds: isSameSession ? prev.timeRemainingSeconds : diffSeconds,
            expiresAt: expiresAt,
            unlockReason: statusRes.unlockReason || prev.unlockReason,
          };
        });
      }

      if (msgRes && msgRes.success && Array.isArray(msgRes.messages)) {
        setChatMessages((prev) => {
          if (prev.length === msgRes.messages.length &&
              prev.every((m, idx) => m.id === msgRes.messages[idx]?.id)) {
            return prev;
          }
          return msgRes.messages;
        });
      }
    } catch (e) {
      console.warn('Chat sync error:', e);
    } finally {
      if (chatSyncInFlightRef.current === activeFriendParam) {
        chatSyncInFlightRef.current = null;
      }
    }
  };

  // Poll status & messages when active friend changes
  useEffect(() => {
    chatStatusRequestVersionRef.current += 1;
    setInputVal('');
    setSendError('');

    // Check localStorage for immediate unlock session
    try {
      const pending = JSON.parse(localStorage.getItem('cc_selected_chat_opponent') || 'null');
      if (pending && (pending.id === activeFriendParam || pending.playerId === activeFriendParam) && pending.expiresAt) {
        const remaining = Math.max(0, Math.floor((new Date(pending.expiresAt).getTime() - Date.now()) / 1000));
        if (remaining > 0) {
          setChatStatus({
            isUnlocked: true,
            timeRemainingSeconds: remaining,
            expiresAt: pending.expiresAt,
            unlockReason: pending.unlockReason || 'Opponent piece captured within 5 moves',
          });
        }
      }
    } catch {}

    if (!activeFriendParam) return;
    syncActiveChat();

    if (chatPollRef.current) clearInterval(chatPollRef.current);
    chatPollRef.current = setInterval(syncActiveChat, 2500);

    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [activeFriendParam, token]);

  // Single monotonic 1-second countdown timer based strictly on expiresAt
  useEffect(() => {
    if (chatStatus.isUnlocked && chatStatus.expiresAt) {
      if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);

      const tick = () => {
        const expTime = new Date(chatStatus.expiresAt).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expTime - now) / 1000));

        if (diff <= 0) {
          if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);
          setChatStatus((prev) => ({
            ...prev,
            isUnlocked: false,
            timeRemainingSeconds: 0,
          }));
        } else {
          setChatStatus((prev) => (prev.timeRemainingSeconds === diff ? prev : { ...prev, timeRemainingSeconds: diff }));
        }
      };

      tick();
      timerCountdownRef.current = setInterval(tick, 1000);
    } else {
      if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);
    }

    return () => {
      if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);
    };
  }, [chatStatus.isUnlocked, chatStatus.expiresAt]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSendingMessage]);

  const formatTime = (secs) => {
    const s = Math.max(0, secs || 0);
    const m = Math.floor(s / 60);
    const remaining = s % 60;
    return `${m.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Add friend handler
  const handleAddFriend = async (e) => {
    e?.preventDefault();
    setAddFriendFeedback(null);
    const idClean = addFriendInput.trim();

    if (!idClean) {
      setAddFriendFeedback({ type: 'error', message: "Please enter a friend's 6-digit Game ID." });
      return;
    }

    if (idClean === user?.playerId) {
      setAddFriendFeedback({ type: 'error', message: 'You cannot send a friend request to yourself.' });
      return;
    }

    setAddFriendLoading(true);
    try {
      const res = await sendFriendRequest(idClean);
      if (res?.success) {
        setAddFriendFeedback({
          type: 'success',
          message: res.message || `Friend request sent to #${idClean}!`,
        });
        setAddFriendInput('');
        await fetchFriendsAndNotifications();
      } else {
        setAddFriendFeedback({ type: 'error', message: res?.message || 'Failed to send friend request.' });
      }
    } catch (err) {
      setAddFriendFeedback({ type: 'error', message: err.message || 'Error sending friend request.' });
    } finally {
      setAddFriendLoading(false);
    }
  };

  // Respond friend request
  const handleRespondRequest = async (requestId, action) => {
    try {
      await respondFriendRequest(requestId, action);
      await fetchFriendsAndNotifications();
      if (action === 'accept') {
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}
      }
    } catch (err) {
      alert(err.message || `Failed to ${action} friend request.`);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim() || !activeFriend || !token) return;
    if (!chatStatus.isUnlocked) {
      setSendError('Chat session is locked. Capture a piece within 5 moves or extend for ₹5.');
      return;
    }

    const textToSend = inputVal.trim();
    setInputVal('');
    setSendError('');
    setIsSendingMessage(true);

    try {
      const friendParam = activeFriend.id || activeFriend.playerId;
      const res = await api.sendChatMessage(token, friendParam, { text: textToSend });
      if (res?.success && res.message) {
        setChatMessages((prev) => (
          prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]
        ));
      }
    } catch (err) {
      setSendError(err.message || 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Challenge friend to online chess match
  const handleChallengeFriend = async () => {
    if (!activeFriend) return;
    try {
      const friendId = activeFriend.playerId || activeFriend.id;
      const res = await sendMatchChallenge(friendId);
      if (res?.success && res.gameId) {
        setActiveOnlineMatch({
          gameId: res.gameId,
          player1: user?.username || 'You',
          player2: activeFriend.username || activeFriend.name,
          playerColor: 'w',
          opponentName: activeFriend.username || activeFriend.name,
          opponentPlayerId: activeFriend.playerId,
        });
        if (onNavigate) onNavigate('play');
      }
    } catch (e) {
      alert(e.message || 'Failed to challenge friend.');
    }
  };

  // Copy own player ID
  const handleCopyMyId = () => {
    if (user?.playerId) {
      navigator.clipboard.writeText(user.playerId);
      setCopiedMyId(true);
      setTimeout(() => setCopiedMyId(false), 2000);
    }
  };

  // Filter messages by search query
  const visibleMessages = chatMessages.filter((msg) => {
    if (!messageSearchQuery.trim()) return true;
    const query = messageSearchQuery.toLowerCase();
    const text = (msg.text || msg.message || '').toLowerCase();
    return text.includes(query);
  });

  // Filter friends list
  const filteredFriends = friendsList.filter((f) => {
    const nameMatch = (f.username || f.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const idMatch = (f.playerId || '').includes(searchQuery);
    return nameMatch || idMatch;
  });

  const pendingRequests = friendNotifications.filter(
    (n) => n.type === 'friend_request' && n.status === 'pending'
  );

  // CONVERSATION BODY (WhatsApp Style)
  const renderConversation = () => (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] text-[#e9edef] relative overflow-hidden">
      {/* WhatsApp Header */}
      <div className="px-4 py-3 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between gap-3 shadow-md z-10">
        <div className="flex items-center gap-3 min-w-0">
          {(!embedded && mobileView === 'chat') && (
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden p-1.5 rounded-full hover:bg-[#374248] text-[#aebac1] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {embedded && onCloseInPlace && (
            <button
              onClick={onCloseInPlace}
              className="px-2.5 py-1 rounded-xl bg-[#2a3942] hover:bg-[#374248] text-[#aebac1] hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Return to chessboard"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Board</span>
            </button>
          )}

          {/* Profile Picture */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-black text-sm shadow-md overflow-hidden ring-2 ring-amber-500/50">
              {(activeFriend?.profilePicture || activeFriend?.profile_picture || activeFriend?.avatar) ? (
                <img src={activeFriend.profilePicture || activeFriend.profile_picture || activeFriend.avatar} alt="" className="w-full h-full object-cover" />
              ) : (activeFriend?.username || activeFriend?.name || 'F')[0].toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#202c33]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#e9edef] truncate">
                {activeFriend?.username || activeFriend?.name || 'Friend'}
              </h3>
              <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-400/15 px-1.5 py-0.5 rounded">
                #{activeFriend?.playerId || '100002'}
              </span>
            </div>
            <p className="text-[11px] text-[#8696a0] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Online • Accepted Friend</span>
            </p>
          </div>
        </div>

        {/* Right Header Actions: Search, Timer Badge, Swords */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Message Search Button */}
          <button
            onClick={() => setShowMessageSearch((prev) => !prev)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${showMessageSearch ? 'bg-amber-400 text-black' : 'text-[#aebac1] hover:bg-[#374248] hover:text-white'}`}
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* 5-Minute Timer / Lock Badge */}
          {chatStatus.isUnlocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-xs font-mono font-bold tracking-wider">
                {formatTime(chatStatus.timeRemainingSeconds)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setPremiumModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Session expired. Extend for ₹5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Extend · ₹5</span>
            </button>
          )}

          {/* Challenge Friend */}
          <button
            onClick={handleChallengeFriend}
            className="p-2 rounded-full text-[#aebac1] hover:bg-[#374248] hover:text-amber-400 transition-colors cursor-pointer"
            title="Challenge this friend to a live chess match"
          >
            <Swords className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Search Bar (WhatsApp Style) */}
      {showMessageSearch && (
        <div className="p-2.5 bg-[#111b21] border-b border-[#222d34] flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696a0]" />
            <input
              type="text"
              autoFocus
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              placeholder="Search messages in conversation..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-[#202c33] text-xs text-[#e9edef] placeholder-[#8696a0] border border-transparent focus:border-amber-400 outline-none"
            />
            {messageSearchQuery && (
              <button
                onClick={() => setMessageSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-[#8696a0] whitespace-nowrap">
            {visibleMessages.length} found
          </span>
        </div>
      )}

      {/* WhatsApp Chat Messages Canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] bg-opacity-95" style={{
        backgroundImage: `radial-gradient(#202c33 0.75px, transparent 0.75px)`,
        backgroundSize: '16px 16px'
      }}>
        {/* Day separator pill */}
        <div className="flex justify-center my-2">
          <span className="px-3 py-1 rounded-lg bg-[#182229] border border-[#222d34] text-[11px] text-[#8696a0] shadow-sm font-medium uppercase tracking-wider">
            Today
          </span>
        </div>

        {/* Tactical Unlock Announcement Banner */}
        {chatStatus.isUnlocked ? (
          <div className="max-w-md mx-auto p-3 rounded-xl bg-[#182229] border border-amber-400/40 text-xs text-amber-300 text-center space-y-1 shadow-md">
            <div className="flex items-center justify-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Chat Unlocked for 5:00 Minutes!</span>
            </div>
            <p className="text-[11px] text-[#8696a0]">
              {chatStatus.unlockReason || 'Piece captured within first 5 moves verified.'} Session closes in {formatTime(chatStatus.timeRemainingSeconds)}.
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto p-4 rounded-xl bg-[#182229] border border-amber-500/40 text-center space-y-2.5 shadow-md">
            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">5-Minute Chat Session Expired</h4>
              <p className="text-[11px] text-[#8696a0] mt-0.5 leading-relaxed">
                Unlock 5 more minutes by capturing an opponent piece within 5 moves, or extend with Premium for ₹5.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleChallengeFriend}
                className="px-3 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors border border-[#2a3942] cursor-pointer"
              >
                <Swords className="w-3 h-3" />
                <span>Play to Unlock</span>
              </button>
              <button
                onClick={() => setPremiumModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-md"
              >
                <CreditCard className="w-3 h-3" />
                <span>Extend · ₹5</span>
              </button>
            </div>
          </div>
        )}

        {/* Message Bubbles (WhatsApp Style) */}
        {visibleMessages.length > 0 ? (
          visibleMessages.map((msg) => {
            const isMe = msg.senderId === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[65%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md relative ${
                    isMe
                      ? 'bg-amber-700 text-[#e9edef] rounded-tr-none'
                      : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-[#2a3942]/50'
                  }`}
                >
                  <p className="break-words select-text">{msg.text || msg.message}</p>
                  
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#8696a0] select-none">
                    <span>{msg.timestamp || 'Recently'}</span>
                    {isMe && (
                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-xs text-[#8696a0] py-10 italic">
            {messageSearchQuery ? 'No messages matching search query.' : `No messages exchanged yet with ${activeFriend?.username || activeFriend?.name || 'this friend'}.`}
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-t border-[#222d34] bg-[#111b21]">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            disabled={!chatStatus.isUnlocked}
            onClick={() => setInputVal(prompt)}
            className="px-2.5 py-1 rounded-lg bg-[#202c33] hover:bg-[#2a3942] disabled:opacity-30 text-[#aebac1] text-[11px] whitespace-nowrap transition-colors cursor-pointer border border-[#2a3942]/50 shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="p-2.5 bg-[#202c33] border-t border-[#2a3942] flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 duration-150">
          {CHESS_EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputVal((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-base p-1.5 hover:bg-[#374248] rounded-lg transition-colors cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* WhatsApp Message Input Bar */}
      <div className="p-2.5 sm:p-3 bg-[#202c33] border-t border-[#2a3942]">
        {sendError && (
          <p className="text-[11px] text-rose-400 mb-2 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{sendError}</span>
          </p>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={!chatStatus.isUnlocked}
            className="p-2 text-[#aebac1] hover:text-white disabled:opacity-40 transition-colors"
            title="Emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          <input
            type="text"
            disabled={!chatStatus.isUnlocked || isSendingMessage}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              chatStatus.isUnlocked
                ? 'Type a message...'
                : '🔒 Chat is locked. Capture piece within 5 moves or extend for ₹5.'
            }
            className="flex-1 bg-[#2a3942] border border-transparent focus:border-amber-400 disabled:opacity-50 text-xs sm:text-sm text-[#e9edef] placeholder-[#8696a0] px-4 py-2.5 rounded-xl outline-none transition-colors"
          />

          <button
            type="submit"
            disabled={!chatStatus.isUnlocked || !inputVal.trim() || isSendingMessage}
            className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
            title="Send"
          >
            <Send className="w-4 h-4 text-black ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );

  // If rendered in-place inside Dashboard in place of chessboard
  if (embedded) {
    return (
      <div className="w-full h-[620px] max-h-[75vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-[#2a3942]">
        {renderConversation()}

        {/* Premium ₹5 Modal */}
        {renderPremiumModal()}
      </div>
    );
  }

  // Helper for Premium ₹5 Modal
  function renderPremiumModal() {
    if (!premiumModalOpen) return null;

    const handleInitiatePayment = () => {
      // Prepared frontend payment gateway integration (Razorpay / UPI / Cards).
      // Per instructions: "Do not simulate successful payments or unlock premium chat without valid payment confirmation."
      // "If no payment gateway exists, prepare the frontend for payment integration."
      if (typeof window !== 'undefined' && window.Razorpay) {
        // Razorpay SDK is detected: prepare checkout
        setPaymentStatusMessage('Connecting to Razorpay payment gateway...');
      } else {
        setPaymentStatusMessage(
          '⚠️ Payment Gateway Integration Ready: Server-side payment gateway credentials (Razorpay/Cashfree API keys) are required for live ₹5 transactions. In accordance with strict payment rules, chat session cannot be unlocked without verified payment gateway confirmation.'
        );
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
        <div className="relative w-full max-w-md rounded-3xl bg-[#0c1424] border-2 border-amber-400/80 p-6 shadow-2xl space-y-4">
          <button
            onClick={() => {
              setPremiumModalOpen(false);
              setPaymentStatusMessage('');
            }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl"
            aria-label="Close premium modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-md">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Extend Chat Session (+5 Minutes)</h3>
            <p className="text-xs text-slate-300">
              Continue messaging with <strong className="text-amber-300">{activeFriend?.username || activeFriend?.name || 'Friend'}</strong>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#070b14] border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Premium Extension:</span>
            <span className="text-lg font-black text-amber-400 font-mono">₹5.00</span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 block uppercase">
              Select Payment Gateway Method:
            </label>
            {[
              { id: 'upi_gpay', label: 'Google Pay (UPI)', icon: 'G' },
              { id: 'upi_phonepe', label: 'PhonePe', icon: 'पे' },
              { id: 'upi_paytm', label: 'Paytm UPI', icon: 'P' },
              { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
              { id: 'upi_custom', label: 'Enter UPI ID', icon: '@' },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPaymentMethod(id)}
                className={`w-full p-2.5 rounded-xl bg-slate-900 border text-xs font-bold text-slate-200 flex items-center justify-between transition-colors ${
                  paymentMethod === id ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-amber-300 grid place-items-center text-[10px]">
                    {icon}
                  </span>
                  <span>{label}</span>
                </span>
                <span className="text-[10px] text-amber-400 uppercase font-mono">₹5</span>
              </button>
            ))}
          </div>

          {paymentMethod === 'upi_custom' && (
            <input
              type="text"
              value={paymentUpiId}
              onChange={(e) => setPaymentUpiId(e.target.value)}
              placeholder="username@bank (e.g. user@okhdfcbank)"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
            />
          )}

          {paymentStatusMessage && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
              {paymentStatusMessage}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setPremiumModalOpen(false);
                setPaymentStatusMessage('');
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInitiatePayment}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-md"
            >
              Pay ₹5 · Proceed
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full 2-Pane WhatsApp Layout for Chat Page View
  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 md:py-6 h-[calc(100vh-80px)] min-h-[640px] flex flex-col font-sans">
      
      {/* Top Notification Bar: Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-3 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#0e182a] to-[#0e182a] border border-amber-500/50 shadow-lg animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Users className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>Incoming Friend Requests</span>
                  <span className="px-2 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black">
                    {pendingRequests.length}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300">
                  Accept to chat with accepted friends.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070b14] border border-amber-500/40 text-xs"
                >
                  <span className="font-bold text-white">
                    {req.senderUsername} <span className="text-amber-400 font-mono">(#{req.senderPlayerId})</span>
                  </span>
                  <button
                    onClick={() => handleRespondRequest(req.id, 'accept')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleRespondRequest(req.id, 'reject')}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Reject</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Pane WhatsApp Container */}
      <div className="flex-1 flex overflow-hidden rounded-3xl bg-[#090e18] border border-amber-500/30 shadow-2xl relative">
        
        {/* Left Sidebar: Friends List & Add Friend */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-[#222d34] flex flex-col bg-[#111b21] ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}>
          
          <div className="p-4 border-b border-[#222d34] space-y-3 bg-[#202c33]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Friends</span>
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#111b21] text-amber-400 font-mono font-bold">
                {friendsList.length} Friends
              </span>
            </div>

            {/* User's Own ID Badge */}
            <div 
              onClick={handleCopyMyId}
              className="p-2.5 rounded-xl bg-[#111b21] border border-[#2a3942] flex items-center justify-between cursor-pointer hover:bg-[#182229] transition-all group"
              title="Click to copy your Game ID"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Game ID:</span>
                <span className="text-xs sm:text-sm font-black font-mono text-amber-400">
                  #{user?.playerId || '100001'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                {copiedMyId ? 'Copied!' : 'Copy ID'}
              </div>
            </div>

            {/* Add Friend Form */}
            <form onSubmit={handleAddFriend} className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={10}
                  value={addFriendInput}
                  onChange={(e) => setAddFriendInput(e.target.value)}
                  placeholder="Enter 6-digit Game ID..."
                  className="flex-1 bg-[#111b21] border border-[#2a3942] focus:border-amber-400 text-xs text-white placeholder-slate-500 px-3 py-2 rounded-xl outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={addFriendLoading || !addFriendInput.trim()}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-md"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{addFriendLoading ? '...' : 'Add'}</span>
                </button>
              </div>

              {addFriendFeedback && (
                <div className={`p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 ${
                  addFriendFeedback.type === 'success' 
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                    : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                }`}>
                  <span>{addFriendFeedback.message}</span>
                </div>
              )}
            </form>

            {/* Filter Friends Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats or start new..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#111b21] border border-[#2a3942] focus:border-amber-400 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Friends List Container */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => {
                const friendId = friend.id || friend.playerId;
                const isSelected = selectedFriendId === friendId;

                return (
                  <div
                    key={friendId}
                    onClick={() => {
                      setSelectedFriendId(friendId);
                      setMobileView('chat');
                    }}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#2a3942] border border-amber-400/40 shadow-md'
                        : 'bg-[#111b21]/60 hover:bg-[#202c33] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-black text-sm shadow-md overflow-hidden">
                          {(friend.profilePicture || friend.profile_picture || friend.avatar) ? (
                            <img src={friend.profilePicture || friend.profile_picture || friend.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (friend.username || friend.name || 'P')[0].toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#111b21]" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                            {friend.username || friend.name}
                          </h4>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">
                            #{friend.playerId}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8696a0] truncate">
                          ELO {friend.rating || 1200} • Chat Available
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-600'
                    }`} />
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center space-y-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400 mx-auto">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No Friends Yet</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Enter a player's 6-digit Game ID above to send a request.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Active Conversation Pane */}
        <div className={`flex-1 flex flex-col bg-[#0b141a] ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}>
          {activeFriend ? (
            renderConversation()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#202c33] border border-[#2a3942] flex items-center justify-center text-amber-400">
                <Users className="w-8 h-8" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-lg font-bold text-white">Select a Friend to Chat</h3>
                <p className="text-xs text-slate-400">
                  Pick a friend from the left sidebar to start messaging.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium ₹5 Modal */}
      {renderPremiumModal()}
    </div>
  );
}
