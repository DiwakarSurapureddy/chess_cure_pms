import React from 'react';
import { Lock, Sparkles, MessageSquare } from 'lucide-react';

export default function Chat() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-white">Secret Chat Channel</h2>
      <p className="text-xs text-slate-400 max-w-sm mx-auto">
        This channel is locked. Play with the computer and make the secret knight move to unlock this channel.
      </p>
    </div>
  );
}
