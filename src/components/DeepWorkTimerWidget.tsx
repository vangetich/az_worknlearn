import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  X,
  Target,
  Flame,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { UserStats } from '../types/quiz';

interface DeepWorkTimerWidgetProps {
  moduleId: number;
  moduleTitle: string;
  stats?: UserStats;
  isEnabled: boolean;
  onToggleEnabled: () => void;
  className?: string;
}

export const DeepWorkTimerWidget: React.FC<DeepWorkTimerWidgetProps> = ({
  moduleId,
  moduleTitle,
  stats,
  isEnabled,
  onToggleEnabled,
  className = '',
}) => {
  const [seconds, setSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [hasNotifiedGoal, setHasNotifiedGoal] = useState<boolean>(false);
  const [showGoalNotification, setShowGoalNotification] = useState<boolean>(false);

  // Active module reference to track module transitions
  const currentModuleRef = useRef<number>(moduleId);

  // Timer interval effect
  useEffect(() => {
    let interval: number | null = null;
    if (isEnabled && isActive) {
      interval = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isEnabled, isActive]);

  // If module changes, optionally reset or note transition
  useEffect(() => {
    if (currentModuleRef.current !== moduleId) {
      currentModuleRef.current = moduleId;
    }
  }, [moduleId]);

  // Monitor daily goal achievement
  const dailyGoal = stats?.dailyGoal || 10;
  const todayDate = new Date().toISOString().split('T')[0];
  const isTodayActive = stats?.lastActiveDate === todayDate;
  
  // Calculate today's answered count from stats attempts
  const todayAnsweredCount = React.useMemo(() => {
    if (!stats?.attempts) return 0;
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    let count = 0;
    Object.values(stats.attempts).forEach((attempts) => {
      attempts.forEach((att) => {
        if (att.timestamp >= startOfToday) {
          count++;
        }
      });
    });
    return count;
  }, [stats?.attempts]);

  // Check if daily goal reached
  useEffect(() => {
    if (todayAnsweredCount >= dailyGoal && !hasNotifiedGoal && todayAnsweredCount > 0) {
      setShowGoalNotification(true);
      setHasNotifiedGoal(true);
    }
  }, [todayAnsweredCount, dailyGoal, hasNotifiedGoal]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins.toString().padStart(2, '0')}m`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setSeconds(0);
    setIsActive(true);
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <div className={`space-y-2.5 transition-all animate-in slide-in-from-top-2 duration-200 ${className}`}>
      {/* Deep Work Timer Bar */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border border-blue-800/60 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left: Timer Display & Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center p-2 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300">
            <Clock className="w-4 h-4 animate-pulse" />
            {isActive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-300">
                Deep Work Active
              </span>
              <span className="font-mono text-base font-black tracking-wider text-white">
                {formatTime(seconds)}
              </span>
            </div>
            <p className="text-[11px] text-blue-200/80 truncate max-w-[200px] sm:max-w-xs">
              Focusing: Module {moduleId} • {moduleTitle}
            </p>
          </div>
        </div>

        {/* Right: Controls & Goal Badge */}
        <div className="flex items-center gap-2">
          {/* Daily Goal Counter Pill */}
          <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold flex items-center gap-1.5 text-blue-100">
            <Target className="w-3.5 h-3.5 text-amber-300" />
            <span>
              Goal: {todayAnsweredCount}/{dailyGoal}
            </span>
          </div>

          {/* Pause / Resume */}
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors border ${
              isActive
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/40'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-emerald-400 font-black'
            }`}
            title={isActive ? 'Pause deep work timer' : 'Resume deep work timer'}
          >
            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 border border-white/15 transition-colors"
            title="Reset timer for current session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Close / Hide Widget */}
          <button
            type="button"
            onClick={onToggleEnabled}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Disable deep work timer widget"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Gentle, Non-Intrusive Notification Summary when Daily Goal is Reached */}
      {showGoalNotification && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-50 via-white to-emerald-50 border border-amber-300 shadow-md card-elevation flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <Sparkles className="w-4 h-4 fill-amber-200 text-white" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm text-slate-900">
                  🎯 Daily Learning Goal Reached!
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {todayAnsweredCount}/{dailyGoal} Done
                </span>
              </div>
              <p className="text-xs text-slate-600">
                You logged <strong className="text-slate-900 font-bold">{formatTime(seconds)}</strong> of active deep work focus.
                <span className="italic text-amber-800 font-medium ml-1">
                  “Kidogo kidogo hujaza kibaba” — Consistent daily momentum wins!
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setShowGoalNotification(false)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              Keep Going
            </button>
            <button
              type="button"
              onClick={() => setShowGoalNotification(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
