import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Smile, 
  MoreVertical, 
  Lock, 
  Unlock, 
  Clock, 
  User, 
  UserPlus,
  Users,
  X, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Radio, 
  Zap, 
  CreditCard, 
  QrCode, 
  Building,
  Swords, 
  Trophy, 
  Flame, 
  Copy,
  Check,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CHESS_EMOJIS = ['♟️', '♞', '♝', '♜', '♛', '♚', '⚔️', '👑', '🔥', '🏆', '💯', '👍', '👏', '🎯', '💡', '🧠'];

const QUICK_PROMPTS = [
  '⚔️ Ready for a match!',
  '♞ Analyze opening moves',
  '🛡️ Defend king tactics',
  '🎯 Great game earlier!',
  '🏆 Good luck in your matches!',
];

export default function Chat({ onNavigate }) {
  const { 
    user, 
    token, 
    friendsList = [], 
    friendNotifications = [],
    sendFriendRequest,
    respondFriendRequest,
    sendMatchChallenge,
    fetchFriendsAndNotifications,
    setActiveOnlineMatch
  } = useAuth();

  // Selected Friend in Chat
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  // Add Friend Input State (Requirement 3)
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [addFriendFeedback, setAddFriendFeedback] = useState(null); // { type: 'success'|'error', message }
  const [copiedMyId, setCopiedMyId] = useState(false);

  // Active Chat Status & Messages State from Backend
  const [chatMessages, setChatMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState({
    isUnlocked: false,
    timeRemainingSeconds: 0,
    expiresAt: null,
    unlockReason: '',
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [sendError, setSendError] = useState('');

  // DEMO Payment Modal State (Requirement 9 & 10)
  const [demoPaymentModal, setDemoPaymentModal] = useState({
    isOpen: false,
    step: 'select_method', // 'select_method' | 'processing' | 'success' | 'failure'
    method: 'upi',
    upiId: 'demo_player@okaxis',
    amount: 10,
    error: '',
  });

  const messagesEndRef = useRef(null);
  const chatPollRef = useRef(null);
  const timerCountdownRef = useRef(null);

  // Auto-select first accepted friend if none selected
  useEffect(() => {
    if (friendsList.length > 0 && !selectedFriendId) {
      setSelectedFriendId(friendsList[0].id || friendsList[0].playerId);
    } else if (friendsList.length === 0) {
      setSelectedFriendId(null);
      setChatMessages([]);
      setChatStatus({ isUnlocked: false, timeRemainingSeconds: 0, expiresAt: null });
    }
  }, [friendsList, selectedFriendId]);

  const activeFriend = friendsList.find(
    (f) => f.id === selectedFriendId || f.playerId === selectedFriendId
  ) || null;

  // Fetch status and messages for active friend
  const syncActiveChat = async () => {
    if (!activeFriend || !token) return;
    const friendParam = activeFriend.id || activeFriend.playerId;
    try {
      const [statusRes, msgRes] = await Promise.all([
        api.getChatStatus(token, friendParam).catch(() => null),
        api.getChatMessages(token, friendParam).catch(() => null),
      ]);

      if (statusRes && statusRes.success) {
        setChatStatus({
          isUnlocked: Boolean(statusRes.isUnlocked),
          timeRemainingSeconds: statusRes.timeRemainingSeconds || 0,
          expiresAt: statusRes.expiresAt,
          unlockReason: statusRes.unlockReason || '',
        });
      }

      if (msgRes && msgRes.success && Array.isArray(msgRes.messages)) {
        setChatMessages(msgRes.messages);
      }
    } catch (e) {
      console.warn('Chat sync warning:', e);
    }
  };

  // Poll chat status & messages when an active friend is selected
  useEffect(() => {
    if (!activeFriend) return;
    syncActiveChat();

    if (chatPollRef.current) clearInterval(chatPollRef.current);
    chatPollRef.current = setInterval(syncActiveChat, 2500);

    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [activeFriend?.id, activeFriend?.playerId, token]);

  // Local live countdown timer every second based on expiresAt
  useEffect(() => {
    if (chatStatus.isUnlocked && chatStatus.expiresAt) {
      if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);
      timerCountdownRef.current = setInterval(() => {
        const expTime = new Date(chatStatus.expiresAt).getTime();
        const now = Date.now();
        const diffSecs = Math.max(0, Math.floor((expTime - now) / 1000));
        setChatStatus((prev) => ({
          ...prev,
          timeRemainingSeconds: diffSecs,
          isUnlocked: diffSecs > 0,
        }));
        if (diffSecs <= 0 && timerCountdownRef.current) {
          clearInterval(timerCountdownRef.current);
        }
      }, 1000);
    }

    return () => {
      if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);
    };
  }, [chatStatus.isUnlocked, chatStatus.expiresAt]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSendingMessage]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const s = Math.max(0, secs || 0);
    const m = Math.floor(s / 60);
    const remaining = s % 60;
    return `${m.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // 1. ADD FRIEND HANDLER (Requirement 3)
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

  // 2. ACCEPT / REJECT FRIEND REQUEST (Requirement 4)
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

  // 3. SEND MESSAGE HANDLER (Requirement 5)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim() || !activeFriend || !token) return;
    if (!chatStatus.isUnlocked) {
      setSendError('Chat is locked. Unlock in a match or via DEMO payment.');
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
        setChatMessages((prev) => [...prev, res.message]);
      }
    } catch (err) {
      setSendError(err.message || 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // 4. DEMO PAYMENT HANDLER (Requirement 9 & 10)
  const handleStartDemoPayment = () => {
    setDemoPaymentModal({
      isOpen: true,
      step: 'select_method',
      method: 'upi',
      upiId: 'grandmaster@okchess',
      amount: 10,
      error: '',
    });
  };

  const handleConfirmDemoPayment = async () => {
    setDemoPaymentModal((prev) => ({ ...prev, step: 'processing' }));
    try {
      const friendParam = activeFriend.id || activeFriend.playerId;
      const res = await api.payDemoExtendChat(token, friendParam, {
        amount: 10,
        payment_method: demoPaymentModal.method || 'demo_upi',
      });

      if (res?.success) {
        setDemoPaymentModal((prev) => ({ ...prev, step: 'success' }));
        setChatStatus({
          isUnlocked: true,
          timeRemainingSeconds: res.timeRemainingSeconds || 300,
          expiresAt: res.expiresAt,
          unlockReason: 'Extended via ₹10 DEMO Payment',
        });
        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
        } catch (e) {}
        setTimeout(() => {
          setDemoPaymentModal((prev) => ({ ...prev, isOpen: false }));
        }, 1500);
      } else {
        setDemoPaymentModal((prev) => ({
          ...prev,
          step: 'failure',
          error: res?.message || 'Payment simulation failed.',
        }));
      }
    } catch (err) {
      setDemoPaymentModal((prev) => ({
        ...prev,
        step: 'failure',
        error: err.message || 'Payment request failed.',
      }));
    }
  };

  // 5. CHALLENGE FRIEND TO CHESS MATCH
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

  // Copy User's Own Game ID
  const handleCopyMyId = () => {
    if (user?.playerId) {
      navigator.clipboard.writeText(user.playerId);
      setCopiedMyId(true);
      setTimeout(() => setCopiedMyId(false), 2000);
    }
  };

  // Pending Friend Requests (Requirement 4)
  const pendingRequests = friendNotifications.filter(
    (n) => n.type === 'friend_request' && n.status === 'pending'
  );

  // Filtered friends
  const filteredFriends = friendsList.filter((f) => {
    const nameMatch = (f.username || f.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const idMatch = (f.playerId || '').includes(searchQuery);
    return nameMatch || idMatch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 md:py-6 h-[calc(100vh-80px)] min-h-[640px] flex flex-col font-sans">
      
      {/* ================= TOP NOTIFICATION BAR: INCOMING FRIEND REQUESTS ================= */}
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
                  Accept to add each player to your Chat list.
                </p>
              </div>
            </div>

            {/* List of Incoming Requests */}
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
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                    title="Accept Friend Request"
                  >
                    <Check className="w-3 h-3" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleRespondRequest(req.id, 'reject')}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                    title="Reject Friend Request"
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

      {/* ================= MAIN TWO-PANE CHAT CONTAINER ================= */}
      <div className="flex-1 flex overflow-hidden rounded-3xl bg-[#090e18] border border-amber-500/30 shadow-2xl relative">
        
        {/* ================= LEFT PANE: FRIENDS LIST & ADD FRIEND ================= */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-[#070b14] ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Header & User Game ID Display */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Friends & Chat</span>
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                {friendsList.length} Friends
              </span>
            </div>

            {/* User's 6-digit Game ID Badge */}
            <div 
              onClick={handleCopyMyId}
              className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-all group"
              title="Click to copy your 6-digit Game ID to share with friends"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Game ID:</span>
                <span className="text-xs sm:text-sm font-black font-mono text-amber-300">
                  #{user?.playerId || '100001'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold group-hover:text-amber-300">
                {copiedMyId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy ID</span>
                  </>
                )}
              </div>
            </div>

            {/* ADD FRIEND FORM (Requirement 3) */}
            <form onSubmit={handleAddFriend} className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={10}
                  value={addFriendInput}
                  onChange={(e) => setAddFriendInput(e.target.value)}
                  placeholder="Enter 6-digit Game ID (e.g. 100002)"
                  className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-amber-400 text-xs text-white placeholder-slate-500 px-3 py-2 rounded-xl outline-none transition-colors font-mono"
                />
                <button
                  type="submit"
                  disabled={addFriendLoading || !addFriendInput.trim()}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-black font-extrabold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{addFriendLoading ? 'Adding...' : 'Add Friend'}</span>
                </button>
              </div>

              {/* Feedback Alert for Add Friend */}
              {addFriendFeedback && (
                <div className={`p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 ${
                  addFriendFeedback.type === 'success' 
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                }`}>
                  {addFriendFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{addFriendFeedback.message}</span>
                </div>
              )}
            </form>

            {/* Search Friends Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accepted friends..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-slate-600 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Friends List Container (Requirement 2: ONLY accepted friends!) */}
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
                        ? 'bg-amber-500/15 border border-amber-500/50 shadow-md'
                        : 'bg-[#0a1120]/60 hover:bg-[#0e172a] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-black text-sm shadow-md">
                          {friend.username ? friend.username[0].toUpperCase() : 'P'}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#070b14]" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                            {friend.username || friend.name}
                          </h4>
                          <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                            #{friend.playerId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          ELO {friend.rating || 1200} · {friend.title || 'Player'}
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
              /* EMPTY FRIENDS STATE (Requirement 2) */
              <div className="p-6 text-center space-y-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                  <UserPlus className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No Friends Added Yet</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Enter a player's 6-digit Game ID above to send a request. Once accepted, they will appear here!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANE: ACTIVE CHAT VIEW ================= */}
        <div className={`flex-1 flex flex-col bg-[#080d19] ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}>
          {activeFriend ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="p-3 sm:p-4 border-b border-slate-800 bg-[#070b14] flex items-center justify-between gap-3">
                
                {/* Left: Friend details & Back button on mobile */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                    {activeFriend.username ? activeFriend.username[0].toUpperCase() : 'P'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                        {activeFriend.username || activeFriend.name}
                      </h3>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">
                        #{activeFriend.playerId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      ELO {activeFriend.rating || 1200} · Accepted Friend
                    </p>
                  </div>
                </div>

                {/* Right: SYNCHRONIZED TIMER & UNLOCK STATUS (Requirement 8 & 9) */}
                <div className="flex items-center gap-2 shrink-0">
                  {chatStatus.isUnlocked ? (
                    <div className="flex items-center gap-2">
                      {/* Live 5-minute countdown badge */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-inner">
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                        <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                          Time Left:
                        </span>
                        <span className="text-xs sm:text-sm font-black font-mono">
                          {formatTime(chatStatus.timeRemainingSeconds)}
                        </span>
                      </div>

                      {/* Add +5m Button */}
                      <button
                        onClick={handleStartDemoPayment}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Extend 5 minutes for ₹10 (DEMO Payment)"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">+5m (₹10 DEMO)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Chat Locked</span>
                      </span>

                      <button
                        onClick={handleStartDemoPayment}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                        title="Unlock Chat for ₹10 (DEMO Payment)"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Unlock for ₹10</span>
                      </button>
                    </div>
                  )}

                  {/* Challenge Button */}
                  <button
                    onClick={handleChallengeFriend}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer"
                    title="Challenge this friend to an online chess match"
                  >
                    <Swords className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Unlock Status Alert Banner */}
                {chatStatus.isUnlocked ? (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        ⚡ <strong>Chat Channel Unlocked!</strong> {chatStatus.unlockReason || 'Piece captured within first 5 moves.'} Messaging expires in {formatTime(chatStatus.timeRemainingSeconds)}.
                      </span>
                    </div>
                    <button
                      onClick={handleStartDemoPayment}
                      className="text-[11px] underline font-bold hover:text-white shrink-0"
                    >
                      Extend +5m
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#0e172a] border border-slate-800 text-center space-y-2.5 my-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Chat Session Locked</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Messaging is locked. Automatically unlock by capturing at least one opponent piece within the first 5 moves in a chess match, or extend for +5 minutes for ₹10.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button
                        onClick={handleChallengeFriend}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>Play Match to Unlock</span>
                      </button>
                      <button
                        onClick={handleStartDemoPayment}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Pay ₹10 (DEMO Test)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Message History Render */}
                {chatMessages.length > 0 ? (
                  chatMessages.map((msg) => {
                    const isMe = msg.senderId === user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                            isMe
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium rounded-br-none'
                              : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                          }`}
                        >
                          <p>{msg.text || msg.message}</p>
                          <span
                            className={`block text-[9px] mt-1 text-right font-mono ${
                              isMe ? 'text-black/70' : 'text-slate-400'
                            }`}
                          >
                            {msg.timestamp || 'Recently'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-xs text-slate-500 py-8 italic">
                    No messages exchanged yet with {activeFriend.username || activeFriend.name}.
                  </p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Bar */}
              <div className="px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-t border-slate-800/60 bg-[#070b14]/50">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    disabled={!chatStatus.isUnlocked}
                    onClick={() => setInputVal(prompt)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-[11px] whitespace-nowrap transition-colors cursor-pointer border border-slate-700/50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Message Input Form */}
              <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#070b14]">
                {sendError && (
                  <p className="text-[11px] text-rose-400 mb-2 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{sendError}</span>
                  </p>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      disabled={!chatStatus.isUnlocked || isSendingMessage}
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      placeholder={
                        chatStatus.isUnlocked
                          ? 'Type your message...'
                          : '🔒 Chat is locked. Unlock in a match or via ₹10 DEMO payment.'
                      }
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 disabled:opacity-50 text-xs sm:text-sm text-white placeholder-slate-500 px-4 py-2.5 rounded-2xl outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!chatStatus.isUnlocked || !inputVal.trim() || isSendingMessage}
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-black font-extrabold transition-all cursor-pointer shadow-md shadow-amber-500/20"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* NO ACTIVE FRIEND SELECTED */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400">
                <Users className="w-8 h-8" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-lg font-bold text-white">Select a Friend to Chat</h3>
                <p className="text-xs text-slate-400">
                  Choose a friend from the left panel or enter a 6-digit Game ID above to add new players.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= DEMO PAYMENT MODAL (Requirement 9 & 10) ================= */}
      {demoPaymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0c1424] border-2 border-amber-400/80 p-6 shadow-2xl space-y-5">
            <button
              onClick={() => setDemoPaymentModal((prev) => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">
                Extend Chat Timer (+5 Minutes)
              </h3>
              {/* CLEARLY LABELLED DEMO PAYMENT BADGE (Requirement 9 & 10) */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>DEMO TEST MODE · ₹10 (Simulated)</span>
              </div>
            </div>

            {/* Step: Select Method */}
            {demoPaymentModal.step === 'select_method' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 text-center leading-relaxed">
                  This is a simulated demo payment. No real money will be charged. Successful verification extends your live chat by <strong className="text-amber-300">+5:00 minutes</strong>.
                </p>

                {/* Price Display */}
                <div className="p-3.5 rounded-2xl bg-[#070b14] border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Total Amount:</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">₹10.00</span>
                </div>

                {/* Simulated Payment Methods */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 block uppercase">
                    Select Simulated Method:
                  </label>
                  {['UPI (GPay / PhonePe / Paytm)', 'Simulated Card (Visa / MC)', 'Net Banking'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-between hover:border-amber-400 transition-colors"
                    >
                      <span>{m}</span>
                      <span className="text-emerald-400 text-[10px] uppercase font-bold">Demo OK</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleConfirmDemoPayment}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
                >
                  Pay ₹10 (Simulate Success)
                </button>
              </div>
            )}

            {/* Step: Processing */}
            {demoPaymentModal.step === 'processing' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-bold">Verifying simulated DEMO transaction...</p>
              </div>
            )}

            {/* Step: Success */}
            {demoPaymentModal.step === 'success' && (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-extrabold text-white">Payment Verified!</h4>
                <p className="text-xs text-slate-300">
                  Chat session extended by +5 minutes. Messaging is now active!
                </p>
              </div>
            )}

            {/* Step: Failure */}
            {demoPaymentModal.step === 'failure' && (
              <div className="py-4 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                <p className="text-xs text-rose-300 font-bold">{demoPaymentModal.error || 'Payment failed'}</p>
                <button
                  onClick={() => setDemoPaymentModal((prev) => ({ ...prev, step: 'select_method' }))}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
                >
                  Retry Payment
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
