import React from 'react';
import { BookOpen, Bot, History, User, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
import { AppTab } from './Header';

export interface MobileBottomNavBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  todayAnsweredCount?: number;
  dailyGoal?: number;
  streakDays?: number;
  unresolvedMistakesCount?: number;
}

interface NavItem {
  id: AppTab;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  description: string;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    id: 'quiz',
    label: 'Practice Quiz',
    shortLabel: 'Quiz',
    icon: BookOpen,
    description: 'AZ-900 Question Practice',
  },
  {
    id: 'assistant',
    label: 'AI Tutor',
    shortLabel: 'AI Tutor',
    icon: Bot,
    description: 'Knowledge Assistant & Concept Explanations',
  },
  {
    id: 'history',
    label: 'Study History',
    shortLabel: 'History',
    icon: History,
    description: 'Review Past Attempts & Mistakes',
  },
  {
    id: 'profile',
    label: 'Profile & Goal',
    shortLabel: 'Profile',
    icon: User,
    description: 'Candidate Profile & Study Goals',
  },
];

export const MobileBottomNavBar: React.FC<MobileBottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  todayAnsweredCount = 0,
  dailyGoal = 10,
  streakDays = 1,
  unresolvedMistakesCount = 0,
}) => {
  const isGoalMet = todayAnsweredCount >= dailyGoal && dailyGoal > 0;

  return (
    <nav
      role="navigation"
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden portrait:block landscape:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 select-none"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-md mx-auto px-2 pt-1.5 pb-1 flex items-center justify-around gap-1">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          // Badges per tab
          let badgeContent: React.ReactNode = null;
          if (item.id === 'quiz') {
            badgeContent = (
              <span
                className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border leading-tight ${
                  isGoalMet
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-sky-100 text-[#0078D4] dark:bg-sky-950 dark:text-sky-300 border-sky-300/60'
                }`}
                title={`Today: ${todayAnsweredCount}/${dailyGoal} Qs`}
              >
                {todayAnsweredCount}/{dailyGoal}
              </span>
            );
          } else if (item.id === 'assistant') {
            badgeContent = (
              <span className="flex items-center gap-0.5 text-[8.5px] font-black px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-2xs leading-tight">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI</span>
              </span>
            );
          } else if (item.id === 'history' && unresolvedMistakesCount > 0) {
            badgeContent = (
              <span
                className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-500 text-white border border-rose-400 leading-tight"
                title={`${unresolvedMistakesCount} unresolved mistakes`}
              >
                {unresolvedMistakesCount}
              </span>
            );
          } else if (item.id === 'profile' && streakDays > 0) {
            badgeContent = (
              <span
                className="flex items-center gap-0.5 text-[8.5px] font-black px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border border-orange-300/70 leading-tight"
                title={`${streakDays}-day streak`}
              >
                <Flame className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
                <span>{streakDays}d</span>
              </span>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                // Scroll gracefully to top of active view
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`relative flex-1 py-1 px-1.5 min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#0078D4] dark:text-sky-400 font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 font-semibold'
              }`}
            >
              {/* Active Indicator Top Pill */}
              {isActive && (
                <span className="absolute -top-1.5 w-8 h-1 rounded-full bg-[#0078D4] dark:bg-sky-400 shadow-xs animate-in fade-in zoom-in-75 duration-150" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-150 ${
                    isActive
                      ? 'bg-sky-100/90 dark:bg-sky-950/80 text-[#0078D4] dark:text-sky-300 scale-105 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>

                {/* Overlaid Micro Badge */}
                {badgeContent && (
                  <div className="absolute -top-1 -right-4 translate-x-1/4 scale-90 origin-bottom-left">
                    {badgeContent}
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] tracking-tight leading-none ${
                  isActive
                    ? 'font-black text-[#0078D4] dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
