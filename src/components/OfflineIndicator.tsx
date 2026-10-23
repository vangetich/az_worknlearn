import React from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900/95 text-white border border-amber-500/40 px-3.5 py-2 text-xs font-semibold shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400">
        <WifiOff className="w-3.5 h-3.5" />
      </div>
      <div>
        <div className="text-amber-300 font-bold">Offline Study Mode Active</div>
        <div className="text-[11px] text-slate-300">
          Microsoft curriculum, flashcards, and quizzes cached locally.
        </div>
      </div>
    </div>
  );
};
