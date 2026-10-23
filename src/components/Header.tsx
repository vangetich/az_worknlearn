import React, { useMemo } from 'react';
import {
  BookOpen,
  Award,
  Sparkles,
  Bot,
  Layers,
  TrendingUp,
  History,
  Zap,
  Users,
  Compass,
  Download,
  Flame,
  Check,
  Target,
} from 'lucide-react';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';
import { UserStats } from '../types/quiz';
import { DailyStudyStreak } from './DailyStudyStreak';
import { PWAInstallButton } from './PWAInstallButton';

export type AppTab =
  | 'quiz'
  | 'adaptive'
  | 'flashcards'
  | 'history'
  | 'mock'
  | 'ai-builder'
  | 'assistant'
  | 'study-decks'
  | 'analytics'
  | 'leaderboard'
  | 'wisdom';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedPathId?: number | 'all';
  onSelectPath?: (pathId: number | 'all') => void;
  stats: UserStats;
  onOpenExport?: () => void;
  onUpdateStats?: (newStats: UserStats) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedPathId = 'all',
  onSelectPath,
  stats,
  onOpenExport,
  onUpdateStats,
}) => {
  // Compute today's answers toward daily goal
  const todayKey = new Date().toISOString().split('T')[0];
  let todayAnswered = 0;
  Object.values(stats.attempts || {}).forEach((attemptsList) => {
    attemptsList.forEach((att) => {
      if (
        att.timestamp &&
        new Date(att.timestamp).toISOString().split('T')[0] === todayKey
      ) {
        todayAnswered++;
      }
    });
  });

  const dailyGoal = stats.dailyGoal || 10;
  const goalPercent = Math.min(100, Math.round((todayAnswered / dailyGoal) * 100));
  const isGoalReached = todayAnswered >= dailyGoal && dailyGoal > 0;

  const overallAccuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <KitengeRibbon height={3} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Minimalist & Stylish Top Bar: Logo, Path 1, 2, 3 shortcuts, and Top Menu */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between py-2.5 sm:py-3 gap-3">
          {/* Left: Logo & Azure Curriculum Brand + Direct Path 1, 2, 3 Shortcuts */}
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 flex-wrap">
            {/* Logo */}
            <div
              className="flex items-center gap-2.5 cursor-pointer group/logo shrink-0"
              onClick={() => setActiveTab('quiz')}
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] shadow-sm shadow-blue-500/20 group-hover/logo:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
                </svg>
                <div className="absolute -bottom-1 -right-1">
                  <MaasaiMedallion size={14} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base tracking-tight text-slate-900">
                    Azure Curriculum
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#0078D4] text-white">
                    AZ-900
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Fundamentals Practice Studio
                </p>
              </div>
            </div>

            {/* Path 1, 2, 3 Minimalist Pills (Requested: keep relevant information such as logo, Path 1, 2, etc.) */}
            {onSelectPath && (
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath('all');
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    selectedPathId === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="View all 3 learning paths"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath(1);
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    selectedPathId === 1
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#0078D4]'
                  }`}
                  title="Path 1: Cloud Concepts"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Path 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath(2);
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    selectedPathId === 2
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#0078D4]'
                  }`}
                  title="Path 2: Azure Architecture & Services"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Path 2</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath(3);
                    if (activeTab !== 'quiz' && activeTab !== 'adaptive') setActiveTab('quiz');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    selectedPathId === 3
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#0078D4]'
                  }`}
                  title="Path 3: Management & Governance"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Path 3</span>
                </button>
              </div>
            )}
          </div>

          {/* Minimalist Top Menu Bar: Clean, stylish navigation pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-[#0078D4] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Practice</span>
            </button>

            {/* Adaptive Quiz Mode with glowing Zap */}
            <button
              onClick={() => setActiveTab('adaptive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'adaptive'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-xs ring-1 ring-blue-300'
                  : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50/70 border border-blue-200/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Adaptive Quiz</span>
            </button>

            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'flashcards'
                  ? 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Flashcards</span>
            </button>

            {/* Review History Tab */}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#0078D4] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Review History</span>
            </button>

            <button
              onClick={() => setActiveTab('mock')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'mock'
                  ? 'bg-[#0078D4] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Mock Exam</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Tutor</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>Ranks</span>
            </button>
          </div>

          {/* Right: Streak & Daily Goal Ring */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            <PWAInstallButton />
            <DailyStudyStreak stats={stats} onUpdateStats={onUpdateStats} />

            {/* Quick Accuracy */}
            <button
              onClick={() => setActiveTab('analytics')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              title="View Domain Confidence"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>{overallAccuracy}%</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
