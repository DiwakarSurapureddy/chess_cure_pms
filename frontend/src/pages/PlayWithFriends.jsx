import React, { useState, useEffect } from 'react';
import ChessBoard, { playChessSound } from '../components/chess/ChessBoard';
import { 
  Users, 
  Copy, 
  Check, 
  Send, 
  ArrowLeft, 
  ShieldCheck, 
  Swords, 
  UserPlus, 
  Clock, 
  RotateCcw, 
  Flag, 
  Trophy, 
  Sparkles,
  MessageCircle
} from 'lucide-react';

const createInitialBoard = () => {
  const board = {};
  const backRankWhite = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const backRankBlack = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  files.forEach((f, idx) => {
    board[`${f}1`] = { type: backRankWhite[idx], color: 'w' };
    board[`${f}2`] = { type: 'p', color: 'w' };
    board[`${f}7`] = { type: 'p', color: 'b' };
    board[`${f}8`] = { type: backRankBlack[idx], color: 'b' };
  });

  return board;
};

export default function PlayWithFriends({ onNavigate, userProfile }) {
  // Generate a player ID if not exists
  const myPlayerId = userProfile?.playerId || 'CC-784291';
  const username = userProfile?.username || userProfile?.name || 'Grandmaster';
  const rating = userProfile?.rating || 1540;

  const [copied, setCopied] = useState(false);
  const [friendInputId, setFriendInputId] = useState('');
  const [activeTab, setActiveTab] = useState('lobby'); // 'lobby' | 'game'
  const [activeFriend, setActiveFriend] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null); // { type: 'sent' | 'received' | 'accepted', fromId, toId, name }

  // Private match board state
  const [board, setBoard] = useState(createInitialBoard);
  const [turn, setTurn] = useState('w'); // 'w' | 'b'
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [gameStatus, setGameStatus] = useState('Active Private Match');
  const [moveCount, setMoveCount] = useState(0);

  // Online Mock Friends Pool
  const onlineFriends = [
    { id: 'CC-471092', name: 'GM Alexandra', rating: 1720, status: 'Online · Waiting for Match' },
    { id: 'CC-839120', name: 'Master Arjun', rating: 1650, status: 'Online · In Training' },
    { id: 'CC-194830', name: 'Elena Tactician', rating: 1510, status: 'Online · Free to Play' },
  ];

  const handleCopyId = () => {
    navigator.clipboard.writeText(myPlayerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (targetId, targetName) => {
    const idToSend = targetId || friendInputId.trim().toUpperCase();
    if (!idToSend) return;

    const name = targetName || `Player (${idToSend})`;
    setRequestStatus({
      type: 'sent',
      toId: idToSend,
      name: name,
    });

    // Simulate friend accepting invite after 1.5 seconds
    setTimeout(() => {
      setRequestStatus({
        type: 'accepted',
        toId: idToSend,
        name: name,
      });
      setActiveFriend({ id: idToSend, name: name });
    }, 1500);
  };

  const handleAcceptInvite = (req) => {
    setActiveFriend({ id: req.fromId, name: req.name });
    setRequestStatus(null);
    setActiveTab('game');
  };

  const startPrivateMatch = () => {
    setBoard(createInitialBoard());
    setTurn('w');
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setGameStatus('Active Match');
    setMoveCount(0);
    setActiveTab('game');
  };

  // Helper legal move generator for 2-player private match
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const isValidSquare = (fIdx, rIdx) => fIdx >= 0 && fIdx < 8 && rIdx >= 0 && rIdx < 8;

  const getMoves = (sq, currentBoard, color) => {
    const piece = currentBoard[sq];
    if (!piece || piece.color !== color) return [];

    const f = sq[0];
    const r = parseInt(sq[1], 10);
    const fIdx = files.indexOf(f);
    const rIdx = r - 1;
    const moves = [];

    const addRayMoves = (dirX, dirY) => {
      let curX = fIdx + dirX;
      let curY = rIdx + dirY;
      while (isValidSquare(curX, curY)) {
        const destSq = `${files[curX]}${curY + 1}`;
        const destPiece = currentBoard[destSq];
        if (!destPiece) {
          moves.push(destSq);
        } else {
          if (destPiece.color !== piece.color) moves.push(destSq);
          break;
        }
        curX += dirX;
        curY += dirY;
      }
    };

    if (piece.type === 'p') {
      const forward = piece.color === 'w' ? 1 : -1;
      const startRank = piece.color === 'w' ? 2 : 7;
      const oneForwardSq = `${f}${r + forward}`;
      if (isValidSquare(fIdx, rIdx + forward) && !currentBoard[oneForwardSq]) {
        moves.push(oneForwardSq);
        const twoForwardSq = `${f}${r + forward * 2}`;
        if (r === startRank && !currentBoard[twoForwardSq]) {
          moves.push(twoForwardSq);
        }
      }
      [-1, 1].forEach((dx) => {
        const capX = fIdx + dx;
        const capY = rIdx + forward;
        if (isValidSquare(capX, capY)) {
          const capSq = `${files[capX]}${capY + 1}`;
          const target = currentBoard[capSq];
          if (target && target.color !== piece.color) moves.push(capSq);
        }
      });
    }

    if (piece.type === 'n') {
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dx, dy]) => {
        const tx = fIdx + dx;
        const ty = rIdx + dy;
        if (isValidSquare(tx, ty)) {
          const destSq = `${files[tx]}${ty + 1}`;
          const destPiece = currentBoard[destSq];
          if (!destPiece || destPiece.color !== piece.color) moves.push(destSq);
        }
      });
    }

    if (piece.type === 'b' || piece.type === 'q') {
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dx, dy]) => addRayMoves(dx, dy));
    }
    if (piece.type === 'r' || piece.type === 'q') {
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => addRayMoves(dx, dy));
    }
    if (piece.type === 'k') {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const tx = fIdx + dx;
          const ty = rIdx + dy;
          if (isValidSquare(tx, ty)) {
            const destSq = `${files[tx]}${ty + 1}`;
            const destPiece = currentBoard[destSq];
            if (!destPiece || destPiece.color !== piece.color) moves.push(destSq);
          }
        }
      }
    }
    return moves;
  };

  const handleSelectSquare = (sq) => {
    if (!sq) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }
    const piece = board[sq];
    if (piece && piece.color === turn) {
      setSelectedSquare(sq);
      setLegalMoves(getMoves(sq, board, turn));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleMove = (fromSq, toSq) => {
    const movingPiece = board[fromSq];
    const targetPiece = board[toSq];
    const newBoard = { ...board };
    delete newBoard[fromSq];
    newBoard[toSq] = movingPiece;

    setBoard(newBoard);
    setLastMove({ from: fromSq, to: toSq });
    setSelectedSquare(null);
    setLegalMoves([]);
    setMoveCount((prev) => prev + 1);

    playChessSound(targetPiece ? 'capture' : 'move');

    if (targetPiece && targetPiece.type === 'k') {
      setGameStatus(`${turn === 'w' ? 'White' : 'Black'} Wins by Checkmate!`);
      playChessSound('success');
      return;
    }

    setTurn(turn === 'w' ? 'b' : 'w');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Play with Friends (Multiplayer)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase">
                Private Room
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Generate or enter a unique Player ID to invite friends to a private chess match
            </p>
          </div>
        </div>

        {activeTab === 'game' && (
          <button
            onClick={() => setActiveTab('lobby')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Lobby</span>
          </button>
        )}
      </div>

      {/* VIEW 1: MULTIPLAYER LOBBY & PLAYER ID SYSTEM */}
      {activeTab === 'lobby' && (
        <div className="space-y-6">
          
          {/* Top Player ID Card: Ludo Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* My Player ID Badge */}
            <div className="p-6 rounded-3xl glass-card border border-amber-500/30 space-y-4 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Your Unique Player ID
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online Ready
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#09101e] border-2 border-amber-500/40 shadow-inner">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Share with a friend</p>
                  <p className="text-2xl sm:text-3xl font-black text-[#e5a93c] tracking-widest font-mono">
                    {myPlayerId}
                  </p>
                </div>
                <button
                  onClick={handleCopyId}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Player: <strong className="text-white">{username}</strong></span>
                <span>Rating: <strong className="text-amber-400">{rating} ELO</strong></span>
              </div>
            </div>

            {/* Enter Friend's Player ID Box */}
            <div className="p-6 rounded-3xl glass-card space-y-4 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Connect With Friend
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Enter Friend's Player ID
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paste your friend's 8-character ID to invite them to a live private match.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={friendInputId}
                    onChange={(e) => setFriendInputId(e.target.value)}
                    placeholder="e.g. CC-591024"
                    className="glass-input flex-1 px-4 py-3 rounded-xl text-sm font-mono text-white placeholder-slate-500 uppercase tracking-widest focus:border-amber-400"
                  />
                  <button
                    onClick={() => handleSendInvite()}
                    disabled={!friendInputId.trim()}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5b94e] text-black font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Invite</span>
                  </button>
                </div>
              </div>

              {/* Status Alert */}
              {requestStatus && (
                <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                  requestStatus.type === 'accepted'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span>
                      {requestStatus.type === 'accepted'
                        ? `${requestStatus.name} accepted your request!`
                        : `Invite dispatched to ${requestStatus.toId}. Waiting...`}
                    </span>
                  </div>
                  {requestStatus.type === 'accepted' && (
                    <button
                      onClick={startPrivateMatch}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs cursor-pointer shadow hover:bg-emerald-400"
                    >
                      Start Game
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Online Friends / Active Players Pool */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Active Online Friends
                </h3>
              </div>
              <span className="text-xs text-slate-400">Click to challenge directly</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {onlineFriends.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        {f.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                          {f.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">{f.id}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-400">{f.rating}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-emerald-400 font-medium">{f.status}</span>
                    <button
                      onClick={() => handleSendInvite(f.id, f.name)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Invite
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PRIVATE CHESS MATCH SCREEN */}
      {activeTab === 'game' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Chess Board Arena (7 cols) */}
          <div className="lg:col-span-8 flex flex-col items-center space-y-4">
            
            {/* Opponent (Black) Card */}
            <div className="w-full max-w-lg p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold">
                  {activeFriend?.name ? activeFriend.name[0] : 'F'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{activeFriend?.name || 'Challenged Friend'}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      Black ({activeFriend?.id || 'CC-FRIEND'})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {turn === 'b' ? 'Thinking & Moving...' : 'Waiting'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                turn === 'b' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'text-slate-500'
              }`}>
                {turn === 'b' ? "Black's Turn" : 'Standby'}
              </span>
            </div>

            {/* Interactive 2-Player Chess Board */}
            <div className="relative">
              <ChessBoard
                boardState={board}
                playerColor={turn}
                selectedSquare={selectedSquare}
                onSelectSquare={handleSelectSquare}
                legalMoves={legalMoves}
                lastMove={lastMove}
                onMove={handleMove}
                isLocked={gameStatus.includes('Wins') || gameStatus === 'Resigned'}
                successHighlight={gameStatus.includes('Wins') && lastMove ? lastMove.to : null}
              />
            </div>

            {/* You (White) Card */}
            <div className="w-full max-w-lg p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                  {username ? username[0].toUpperCase() : 'Y'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{username} (You)</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      White ({myPlayerId})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Rating: {rating} ELO</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                turn === 'w' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'text-slate-500'
              }`}>
                {turn === 'w' ? "White's Turn" : 'Standby'}
              </span>
            </div>
          </div>

          {/* Right Panel: Controls, Status & Chat (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Game Status Banner */}
            <div className="p-5 rounded-2xl glass-card border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Private Game Status
                </span>
                <span className="text-xs font-bold text-amber-400 font-mono">
                  Move #{moveCount}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#09101e] border border-slate-800 text-sm font-bold text-white">
                {gameStatus}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={startPrivateMatch}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restart Match</span>
                </button>

                <button
                  onClick={() => setGameStatus('Match Concluded by Resignation')}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Resign</span>
                </button>
              </div>
            </div>

            {/* In-Game Room Chat / Quick Taunts */}
            <div className="p-5 rounded-2xl glass-card space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Private Room Chat</span>
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-amber-400 font-bold block">{activeFriend?.name || 'Friend'}</span>
                  <p className="text-slate-300 mt-0.5">Good luck! May the best grandmaster win.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-right">
                  <span className="text-[10px] text-amber-300 font-bold block">You</span>
                  <p className="text-slate-200 mt-0.5">Think ahead, move smart!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
