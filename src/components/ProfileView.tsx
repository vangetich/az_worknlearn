import React, { useState, useMemo } from 'react';
import {
  Award,
  Sparkles,
  Flame,
  Target,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  Crown,
  BookOpen,
  Edit3,
  Check,
  Zap,
  ArrowRight,
  User,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { BADGE_DEFINITIONS, BadgeDefinition, BadgeTier, BadgeCategory } from './BadgeSystem';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface ProfileViewProps {
  stats: UserStats;
  onNavigateToPractice: () => void;
  onNavigateToMock: () => void;
  onOpenManageGoal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  stats,
  onNavigateToPractice,
  onNavigateToMock,
  onOpenManageGoal,
}) => {
  const [candidateName, setCandidateName] = useState<string>(() => {
    return localStorage.getItem('az900_candidate_name') || 'Azure Cloud Explorer';
  });
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(candidateName);
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('all');
  const [filterUnlocked, setFilterUnlocked] = useState<'all' | 'unlocked' | 'locked'>('all');

  const accuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  // Calculate user level & rank
  const candidateLevel = useMemo(() => {
    const q = stats.totalAnswered;
    if (q >= 100 && accuracy >= 80) return { title: 'Master Cloud Architect', level: 5, color: 'text-amber-500 bg-amber-50 border-amber-300' };
    if (q >= 50 && accuracy >= 70) return { title: 'Senior Azure Scholar', level: 4, color: 'text-purple-600 bg-purple-50 border-purple-300' };
    if (q >= 25) return { title: 'Azure Cloud Practitioner', level: 3, color: 'text-blue-600 bg-blue-50 border-blue-300' };
    if (q >= 10) return { title: 'Cloud Apprentice', level: 2, color: 'text-emerald-600 bg-emerald-50 border-emerald-300' };
    return { title: 'Azure Novice', level: 1, color: 'text-slate-600 bg-slate-50 border-slate-300' };
  }, [stats.totalAnswered, accuracy]);

  // Evaluated badges
  const evaluatedBadges = useMemo(() => {
    return BADGE_DEFINITIONS.map((def) => {
      const unlocked = def.isUnlocked(stats, accuracy);
      const curr = def.getCurrentValue(stats, accuracy);
      const progress = Math.min(100, Math.round((curr / def.targetValue) * 100));
      return {
        ...def,
        unlocked,
        currentValue: curr,
        progress,
      };
    });
  }, [stats, accuracy]);

  const unlockedCount = evaluatedBadges.filter((b) => b.unlocked).length;
  const totalBadges = evaluatedBadges.length;

  const filteredBadges = useMemo(() => {
    return evaluatedBadges.filter((b) => {
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      if (filterUnlocked === 'unlocked' && !b.unlocked) return false;
      if (filterUnlocked === 'locked' && b.unlocked) return false;
      return true;
    });
  }, [evaluatedBadges, selectedCategory, filterUnlocked]);

  const handleSaveName = () => {
    const trimmed = tempName.trim() || 'Azure Cloud Explorer';
    setCandidateName(trimmed);
    localStorage.setItem('az900_candidate_name', trimmed);
    setIsEditingName(false);
  };

  const tierColors: Record<BadgeTier, { bg: string; text: string; border: string; ring: string }> = {
    bronze: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', ring: 'ring-amber-400/20' },
    silver: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', ring: 'ring-slate-400/20' },
    gold: { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-400', ring: 'ring-yellow-400/30' },
    diamond: { bg: 'bg-cyan-50', text: 'text-cyan-900', border: 'border-cyan-300', ring: 'ring-cyan-400/30' },
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden">
        <KitengeRibbon height={4} />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            {/* Avatar & User Details */}
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#0078D4] via-blue-600 to-[#C2410C] flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-md border-2 border-white ring-4 ring-blue-100">
                  {candidateName.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1.5 -right-1.5">
                  <MaasaiMedallion size={24} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="px-2.5 py-1 text-base font-bold text-slate-900 border border-[#0078D4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20"
                        maxLength={30}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-1 rounded-lg bg-[#0078D4] text-white hover:bg-blue-700"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {candidateName}
                      </h2>
                      <button
                        onClick={() => {
                          setTempName(candidateName);
                          setIsEditingName(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Edit profile name"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${candidateLevel.color}`}>
                    <Crown className="w-3 h-3" />
                    <span>Level {candidateLevel.level}: {candidateLevel.title}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0078D4] border border-blue-200">
                    <Award className="w-3 h-3 text-amber-500" />
                    <span>AZ-900 Exam Candidate</span>
                  </span>
                </div>

                <p className="text-xs text-slate-500 pt-1">
                  Target: Microsoft Certified: Azure Fundamentals • Harambee Azure Cohort 🇰🇪
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
              <button
                onClick={onNavigateToPractice}
                className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Continue Practice</span>
              </button>

              <button
                onClick={onNavigateToMock}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Timed Mini-Mock</span>
              </button>

              <button
                onClick={onOpenManageGoal}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Daily Goal
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600 shrink-0">
                <Flame className="w-5 h-5 fill-orange-500" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-slate-900 leading-none block">
                  {stats.streakDays || 1} Days
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Learning Streak</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-[#0078D4] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-slate-900 leading-none block">
                  {stats.totalAnswered}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Questions Solved</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-slate-900 leading-none block">
                  {accuracy}%
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Overall Accuracy</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-slate-900 leading-none block">
                  {unlockedCount} / {totalBadges}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Badges Unlocked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges & Achievements Section */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              <h3 className="text-xl font-black text-slate-900">
                Azure Badges &amp; Milestone Achievements
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Earn badges for consistency, streaks, passing accuracy, and domain mastery across all 3 learning paths.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
              <button
                onClick={() => setFilterUnlocked('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterUnlocked === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({totalBadges})
              </button>
              <button
                onClick={() => setFilterUnlocked('unlocked')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  filterUnlocked === 'unlocked' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Unlocked ({unlockedCount})</span>
              </button>
              <button
                onClick={() => setFilterUnlocked('locked')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  filterUnlocked === 'locked' ? 'bg-slate-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Locked ({totalBadges - unlockedCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'consistency', label: 'Streaks & Consistency' },
            { id: 'mastery', label: 'Exam Mastery' },
            { id: 'curriculum', label: 'Curriculum Paths' },
            { id: 'milestones', label: 'Volume Milestones' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as BadgeCategory)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#0078D4] text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const tierStyle = tierColors[badge.tier];

            return (
              <div
                key={badge.id}
                className={`relative rounded-xl border p-5 transition-all flex flex-col justify-between ${
                  badge.unlocked
                    ? `${tierStyle.bg} ${tierStyle.border} shadow-xs ring-1 ${tierStyle.ring}`
                    : 'bg-slate-50/70 border-slate-200 opacity-75 hover:opacity-95'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-2xs ${
                          badge.unlocked
                            ? 'bg-white text-amber-600 border border-amber-200'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {badge.unlocked ? (
                          <Award className="w-6 h-6 text-amber-500 fill-amber-500/20" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                          {badge.title}
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          {badge.subtitle}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${tierStyle.border} ${tierStyle.text} bg-white/80`}
                    >
                      {badge.tier}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {badge.description}
                  </p>

                  {/* African Wisdom Quote */}
                  <blockquote className="text-[11px] italic text-amber-900/80 bg-white/60 p-2.5 rounded-lg border border-amber-200/50 mb-3 leading-snug">
                    {badge.proverbQuote}
                  </blockquote>
                </div>

                <div>
                  {/* Progress Bar / Unlock Status */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={badge.unlocked ? 'text-emerald-700 flex items-center gap-1' : 'text-slate-500'}>
                        {badge.unlocked ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Unlocked</span>
                          </>
                        ) : (
                          <span>Progress: {badge.currentValue} / {badge.targetValue} {badge.unit}</span>
                        )}
                      </span>
                      <span className="text-slate-700">{badge.progress}%</span>
                    </div>

                    <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badge.unlocked
                            ? 'bg-emerald-500'
                            : 'bg-[#0078D4]'
                        }`}
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>

                    {!badge.unlocked && (
                      <p className="text-[10px] text-slate-500 font-medium pt-0.5">
                        💡 {badge.tipToUnlock}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curriculum Paths Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0078D4]" />
            <h3 className="text-lg font-black text-slate-900">
              Official AZ-900 Learning Path Progress
            </h3>
          </div>
          <button
            onClick={onNavigateToPractice}
            className="text-xs font-bold text-[#0078D4] hover:underline flex items-center gap-1"
          >
            <span>Practice Specific Path</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LEARNING_PATHS.map((path) => {
            const mastery = stats.pathMastery?.[path.id] || { correct: 0, total: 0 };
            const pathAcc = mastery.total > 0 ? Math.round((mastery.correct / mastery.total) * 100) : 0;

            return (
              <div
                key={path.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-black"
                    style={{ backgroundColor: `${path.accentColor}18`, color: path.accentColor }}
                  >
                    Path {path.id} ({path.examWeight})
                  </span>
                  <span className="text-xs font-extrabold text-slate-700">
                    {pathAcc}% Acc
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                    {path.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {path.summary}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Solved: {mastery.total}</span>
                    <span>Correct: {mastery.correct}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (mastery.total / 15) * 100)}%`,
                        backgroundColor: path.accentColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
