import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Users,
  Target,
  Sparkles,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Crown,
  Search,
  RefreshCw,
  Zap,
  Heart,
  Globe2,
  BookOpen,
  UserCheck,
  SlidersHorizontal,
  ArrowUpRight,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import {
  CohortLeaderboardEntry,
  fetchGlobalHarambeeLeaderboard,
  syncLearnerToGlobalCohort,
  sendHarambeePeerKudos,
} from '../lib/supabase';
import { MaasaiMedallion, KitengeRibbon, KenyanFlagMiniEmblem } from './MotifDecorations';

const FALLBACK_COHORT_DATA: CohortLeaderboardEntry[] = [
  {
    id: 'peer-1',
    name: 'Amina Kimani',
    avatar: '🇰🇪',
    location: 'Nairobi, Kenya',
    region: 'East Africa',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'Nairobi Savannah Hub',
    totalAnswered: 142,
    streakDays: 14,
    accuracy: 94,
    masteredModules: 12,
    kudosCount: 48,
    specialBadge: 'Azure Architect',
    recentActivity: 'Mastered Module 11: Monitoring & Advisor (96%)',
  },
  {
    id: 'peer-2',
    name: 'Chidi Okonkwo',
    avatar: '🇳🇬',
    location: 'Lagos, Nigeria',
    region: 'West Africa',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'Yaba Cloud Explorers',
    totalAnswered: 128,
    streakDays: 12,
    accuracy: 91,
    masteredModules: 11,
    kudosCount: 39,
    specialBadge: 'Centurion',
    recentActivity: 'Completed 45-Min Timed Mock Exam (885/1000)',
  },
  {
    id: 'peer-3',
    name: 'Thabo Mokoena',
    avatar: '🇿🇦',
    location: 'Johannesburg, South Africa',
    region: 'Southern Africa',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'Mzansi Azure Guild',
    totalAnswered: 115,
    streakDays: 9,
    accuracy: 88,
    masteredModules: 10,
    kudosCount: 34,
    specialBadge: 'Sharpshooter',
    recentActivity: 'Solved 15 Adaptive Quiz scenarios in a row',
  },
  {
    id: 'peer-4',
    name: 'Abeba Haile',
    avatar: '🇪🇹',
    location: 'Addis Ababa, Ethiopia',
    region: 'North & Horn',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'Highland Cloud Chapter',
    totalAnswered: 96,
    streakDays: 8,
    accuracy: 89,
    masteredModules: 9,
    kudosCount: 29,
    specialBadge: 'Master of Modules',
    recentActivity: 'Mastered Module 7: Azure Storage Redundancy',
  },
  {
    id: 'peer-5',
    name: 'Kofi Mensah',
    avatar: '🇬🇭',
    location: 'Accra, Ghana',
    region: 'West Africa',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'Black Star Tech Hub',
    totalAnswered: 84,
    streakDays: 7,
    accuracy: 86,
    masteredModules: 8,
    kudosCount: 25,
    specialBadge: 'Consistency Master',
    recentActivity: 'Completed Daily 5-Question Harambee Micro-Drill',
  },
  {
    id: 'peer-6',
    name: 'Claudine Uwase',
    avatar: '🇷🇼',
    location: 'Kigali, Rwanda',
    region: 'East Africa',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'Kigali Innovation Hub',
    totalAnswered: 72,
    streakDays: 6,
    accuracy: 92,
    masteredModules: 8,
    kudosCount: 31,
    specialBadge: 'Concepts Sentinel',
    recentActivity: 'Scored 95% on Path 2: Azure Architecture',
  },
  {
    id: 'peer-7',
    name: 'Marcus Vance',
    avatar: '🇬🇧',
    location: 'London, UK',
    region: 'Global Diaspora',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'London Diaspora Cloud Circle',
    totalAnswered: 65,
    streakDays: 5,
    accuracy: 84,
    masteredModules: 7,
    kudosCount: 19,
    specialBadge: 'Azure Explorer',
    recentActivity: 'Reviewed Zero Trust & Entra ID Conditional Access',
  },
  {
    id: 'peer-8',
    name: 'Fatima Al-Mansoor',
    avatar: '🇪🇬',
    location: 'Cairo, Egypt',
    region: 'North & Horn',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'Nile Valley Azure League',
    totalAnswered: 58,
    streakDays: 5,
    accuracy: 85,
    masteredModules: 6,
    kudosCount: 22,
    specialBadge: 'Cloud Explorer',
    recentActivity: 'Mastered Module 9: Cost Management & TCO',
  },
  {
    id: 'peer-9',
    name: 'Wanjiku Njoroge',
    avatar: '🇰🇪',
    location: 'Mombasa, Kenya',
    region: 'East Africa',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'Swahili Coast Cloud Hub',
    totalAnswered: 51,
    streakDays: 5,
    accuracy: 87,
    masteredModules: 6,
    kudosCount: 20,
    specialBadge: 'Governance Pro',
    recentActivity: 'Completed Azure Policy vs RBAC Scenario Drill',
  },
  {
    id: 'peer-10',
    name: 'David Ochieng',
    avatar: '🇰🇪',
    location: 'Kisumu, Kenya',
    region: 'East Africa',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'Lake Victoria Tech Network',
    totalAnswered: 44,
    streakDays: 4,
    accuracy: 82,
    masteredModules: 5,
    kudosCount: 17,
    specialBadge: 'Rookie Builder',
    recentActivity: 'Practicing Module 6: VNets & ExpressRoute',
  },
  {
    id: 'peer-11',
    name: 'Elena Rostova',
    avatar: '🇨🇦',
    location: 'Toronto, Canada',
    region: 'Global Diaspora',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'North Star Azure Group',
    totalAnswered: 36,
    streakDays: 3,
    accuracy: 80,
    masteredModules: 4,
    kudosCount: 14,
    specialBadge: 'Cloud Rookie',
    recentActivity: 'Finished Path 1: Cloud Concepts Fundamentals',
  },
  {
    id: 'peer-12',
    name: 'Baraka Mwakasege',
    avatar: '🇹🇿',
    location: 'Dar es Salaam, Tanzania',
    region: 'East Africa',
    cohort: 'Global Harambee Azure Cohort',
    chapter: 'Kilimanjaro Cloud Guild',
    totalAnswered: 29,
    streakDays: 3,
    accuracy: 83,
    masteredModules: 3,
    kudosCount: 15,
    specialBadge: 'Rising Star',
    recentActivity: 'Started Module 4: Core Architectural Components',
  },
];

const REGION_FILTERS = [
  { id: 'all', label: 'All Cohort Chapters' },
  { id: 'East Africa', label: 'East Africa Hub' },
  { id: 'West Africa', label: 'West Africa Hub' },
  { id: 'Southern Africa', label: 'Southern Africa Hub' },
  { id: 'North & Horn', label: 'North & Horn Hub' },
  { id: 'Global Diaspora', label: 'Global Diaspora' },
] as const;

const AVATAR_CHOICES = ['🌟', '🇰🇪', '🇳🇬', '🇿🇦', '🇪🇹', '🇬🇭', '🇷🇼', '🇹🇿', '🇺🇬', '🚀'];

export interface GlobalLeaderboardProps {
  stats: UserStats;
  onPracticeClick?: () => void;
  onLaunchCompetitiveDrill?: (moduleId: number) => void;
  onFetchingChange?: (isFetching: boolean) => void;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  stats,
  onPracticeClick,
  onLaunchCompetitiveDrill,
  onFetchingChange,
}) => {
  const [activeSort, setActiveSort] = useState<'answered' | 'streak' | 'accuracy' | 'mastered'>(
    'answered'
  );
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cohortPerformers, setCohortPerformers] =
    useState<CohortLeaderboardEntry[]>(FALLBACK_COHORT_DATA);
  const [isLoadingCohort, setIsLoadingCohort] = useState<boolean>(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState<boolean>(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [kudosSentIds, setKudosSentIds] = useState<Record<string, boolean>>({});
  const [showProfileCustomizer, setShowProfileCustomizer] = useState<boolean>(false);

  // User customizable cohort identity persisted in localStorage
  const [customName, setCustomName] = useState<string>(() => {
    try {
      return localStorage.getItem('az900_cohort_name') || 'You (Current Aspirant)';
    } catch {
      return 'You (Current Aspirant)';
    }
  });
  const [customLocation, setCustomLocation] = useState<string>(() => {
    try {
      return localStorage.getItem('az900_cohort_location') || 'Nairobi, Kenya';
    } catch {
      return 'Nairobi, Kenya';
    }
  });
  const [customRegion, setCustomRegion] = useState<
    'East Africa' | 'West Africa' | 'Southern Africa' | 'North & Horn' | 'Global Diaspora'
  >(() => {
    try {
      const saved = localStorage.getItem('az900_cohort_region') as any;
      return saved || 'East Africa';
    } catch {
      return 'East Africa';
    }
  });
  const [customAvatar, setCustomAvatar] = useState<string>(() => {
    try {
      return localStorage.getItem('az900_cohort_avatar') || '🌟';
    } catch {
      return '🌟';
    }
  });

  const userAccuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  const userMasteredModulesCount = useMemo(() => {
    const completedSet = new Set<number>(stats.completedModules || []);
    Object.entries(stats.moduleMastery || {}).forEach(([mId, m]) => {
      if (m && m.total > 0 && Math.round((m.correct / m.total) * 100) >= 80) {
        completedSet.add(Number(mId));
      }
    });
    return completedSet.size;
  }, [stats.completedModules, stats.moduleMastery]);

  // Fetch top performers from the 'Global Harambee Azure Cohort'
  const loadCohortLeaderboard = useCallback(async () => {
    setIsLoadingCohort(true);
    onFetchingChange?.(true);
    try {
      const payload = await fetchGlobalHarambeeLeaderboard({
        region: 'all',
        sortBy: activeSort,
      });
      if (payload && Array.isArray(payload.performers) && payload.performers.length > 0) {
        setCohortPerformers(payload.performers);
        setLastFetchedAt(
          new Date(payload.fetched_at || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      }
    } catch {
      // Keep fallback data if offline
    } finally {
      setIsLoadingCohort(false);
      onFetchingChange?.(false);
    }
  }, [activeSort, onFetchingChange]);

  useEffect(() => {
    loadCohortLeaderboard();
  }, [loadCohortLeaderboard]);

  const handleSyncMyProfileToCohort = async () => {
    setIsSyncingProfile(true);
    onFetchingChange?.(true);
    try {
      localStorage.setItem('az900_cohort_name', customName);
      localStorage.setItem('az900_cohort_location', customLocation);
      localStorage.setItem('az900_cohort_region', customRegion);
      localStorage.setItem('az900_cohort_avatar', customAvatar);

      const response = await syncLearnerToGlobalCohort({
        name: customName,
        avatar: customAvatar,
        location: customLocation,
        region: customRegion,
        chapter: 'Global Harambee Azure Cohort • Active Aspirant',
        totalAnswered: stats.totalAnswered,
        streakDays: stats.streakDays || 1,
        accuracy: userAccuracy,
        masteredModules: userMasteredModulesCount,
        recentActivity: `Solved ${stats.totalAnswered} AZ-900 scenarios (${userAccuracy}% accuracy)`,
      });

      if (response?.leaderboard?.performers) {
        setCohortPerformers(response.leaderboard.performers);
      }
      setSyncNotice('Your live stats & profile are synced with the Global Harambee Azure Cohort!');
      setShowProfileCustomizer(false);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch {
      setSyncNotice('Saved locally to your Global Harambee Azure Cohort profile.');
      setTimeout(() => setSyncNotice(null), 3500);
    } finally {
      setIsSyncingProfile(false);
      onFetchingChange?.(false);
    }
  };

  const handleGiveKudos = async (peerId: string) => {
    if (kudosSentIds[peerId]) return;
    setKudosSentIds((prev) => ({ ...prev, [peerId]: true }));
    setCohortPerformers((prev) =>
      prev.map((p) => (p.id === peerId ? { ...p, kudosCount: (p.kudosCount || 0) + 1 } : p))
    );
    try {
      await sendHarambeePeerKudos(peerId);
    } catch {
      // Optimistic kudos preserved
    }
  };

  // Combine fetched cohort performers with dynamic user entry
  const fullLeaderboard = useMemo(() => {
    const userEntry: CohortLeaderboardEntry = {
      id: 'current-user',
      name: customName || 'You (Current Aspirant)',
      avatar: customAvatar || '🌟',
      location: customLocation || 'Nairobi, Kenya',
      region: customRegion || 'East Africa',
      cohort: 'Global Harambee Azure Cohort',
      chapter: 'Global Harambee Azure Cohort • Active Aspirant',
      totalAnswered: stats.totalAnswered,
      streakDays: stats.streakDays || 1,
      accuracy: userAccuracy,
      masteredModules: userMasteredModulesCount,
      kudosCount: 24 + Math.floor(stats.totalAnswered / 5),
      isCurrentUser: true,
      specialBadge:
        userAccuracy >= 85 && stats.totalAnswered >= 20
          ? 'Azure Architect'
          : stats.totalAnswered >= 50
          ? 'Centurion'
          : userMasteredModulesCount >= 6
          ? 'Master of Modules'
          : stats.totalAnswered >= 10
          ? 'Azure Explorer'
          : 'Cloud Rookie',
      recentActivity:
        stats.totalAnswered > 0
          ? `Solved ${stats.totalAnswered} AZ-900 scenarios • ${userMasteredModulesCount}/12 Modules Mastered`
          : 'Ready to solve first AZ-900 scenario!',
    };

    const withoutCurrentUser = cohortPerformers
      .filter((p) => p.id !== 'current-user' && !p.isCurrentUser)
      .map((p) => ({ ...p, isCurrentUser: false }));

    const combined: CohortLeaderboardEntry[] = [...withoutCurrentUser, userEntry];

    if (activeSort === 'answered') {
      combined.sort((a, b) => {
        if (b.totalAnswered !== a.totalAnswered) return b.totalAnswered - a.totalAnswered;
        return b.accuracy - a.accuracy;
      });
    } else if (activeSort === 'streak') {
      combined.sort((a, b) => {
        if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
        return b.totalAnswered - a.totalAnswered;
      });
    } else if (activeSort === 'mastered') {
      combined.sort((a, b) => {
        if (b.masteredModules !== a.masteredModules) {
          return b.masteredModules - a.masteredModules;
        }
        return b.totalAnswered - a.totalAnswered;
      });
    } else {
      combined.sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return b.totalAnswered - a.totalAnswered;
      });
    }

    return combined;
  }, [
    cohortPerformers,
    customName,
    customAvatar,
    customLocation,
    customRegion,
    stats.totalAnswered,
    stats.streakDays,
    userAccuracy,
    userMasteredModulesCount,
    activeSort,
  ]);

  // User's dynamic rank & immediate rival above
  const userRank = useMemo(() => {
    const idx = fullLeaderboard.findIndex((entry) => entry.isCurrentUser);
    return idx >= 0 ? idx + 1 : 1;
  }, [fullLeaderboard]);

  const nextPeerAbove = useMemo(() => {
    const idx = fullLeaderboard.findIndex((entry) => entry.isCurrentUser);
    if (idx > 0) {
      return fullLeaderboard[idx - 1];
    }
    return null;
  }, [fullLeaderboard]);

  const filteredLeaderboard = useMemo(() => {
    return fullLeaderboard.filter((entry) => {
      const matchesRegion =
        selectedRegion === 'all' ||
        entry.region.toLowerCase() === selectedRegion.toLowerCase() ||
        entry.isCurrentUser;

      if (!matchesRegion) return false;
      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.location.toLowerCase().includes(q) ||
        entry.cohort.toLowerCase().includes(q) ||
        entry.chapter.toLowerCase().includes(q) ||
        (entry.specialBadge && entry.specialBadge.toLowerCase().includes(q))
      );
    });
  }, [fullLeaderboard, selectedRegion, searchTerm]);

  const cohortStatsSummary = useMemo(() => {
    const totalQuestions = fullLeaderboard.reduce((acc, p) => acc + p.totalAnswered, 0);
    const avgAccuracy = Math.round(
      fullLeaderboard.reduce((acc, p) => acc + p.accuracy, 0) /
        Math.max(1, fullLeaderboard.length)
    );
    const activeStreaks = fullLeaderboard.filter((p) => p.streakDays >= 5).length;
    return {
      totalMembers: fullLeaderboard.length,
      totalQuestions,
      avgAccuracy,
      activeStreaks,
    };
  }, [fullLeaderboard]);

  const rivalProgressPercent = useMemo(() => {
    if (!nextPeerAbove) return 100;
    const target = Math.max(1, nextPeerAbove.totalAnswered + 1);
    return Math.min(99, Math.max(8, Math.round((stats.totalAnswered / target) * 100)));
  }, [nextPeerAbove, stats.totalAnswered]);

  const questionsNeededToOvertake = nextPeerAbove
    ? Math.max(1, nextPeerAbove.totalAnswered - stats.totalAnswered + 1)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-5 w-full min-w-0">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#004C87] to-slate-900 border border-slate-800 text-white p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 left-0 right-0">
          <KitengeRibbon height={3} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#0078D4] text-white uppercase tracking-wider inline-flex items-center gap-1.5">
                <KenyanFlagMiniEmblem size={14} />
                <span>Global Harambee Azure Cohort</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 inline-flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${
                    isLoadingCohort ? 'animate-ping' : 'animate-pulse'
                  }`}
                />
                <span>{isLoadingCohort ? 'Fetching Cohort Standings...' : `Synced ${lastFetchedAt}`}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <Trophy className="w-7 h-7 text-amber-400 shrink-0" />
              <span>Global Peer Leaderboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
              Live rankings fetched from the <strong>Global Harambee Azure Cohort</strong>. Compete on total questions solved, daily streaks, and module mastery to stay motivated for exam day!
            </p>

            {/* Cohort Aggregate Stats Strip */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5 text-[11px]">
              <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-bold text-sky-100 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-300" />
                <span>{cohortStatsSummary.totalMembers} Cohort Performers</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-bold text-sky-100 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                <span>{cohortStatsSummary.totalQuestions.toLocaleString()} Total Questions Solved</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-bold text-sky-100 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-sky-300" />
                <span>{cohortStatsSummary.avgAccuracy}% Cohort Avg Accuracy</span>
              </div>
            </div>
          </div>

          {/* User's Current Rank Card + Actions */}
          <div className="flex flex-col gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-md shrink-0 lg:w-[320px]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xl shadow-inner shrink-0">
                  #{userRank}
                </div>
                <div>
                  <div className="text-[11px] text-amber-300 font-extrabold uppercase tracking-wider">
                    Your Cohort Standing
                  </div>
                  <div className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>{stats.totalAnswered} Qs</span>
                    <span className="text-amber-400">•</span>
                    <span>{stats.streakDays || 1}d Streak</span>
                    <span className="text-amber-400">•</span>
                    <span>{userAccuracy}%</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={loadCohortLeaderboard}
                disabled={isLoadingCohort}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
                title="Refresh Global Harambee Azure Cohort standings"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingCohort ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            </div>

            {/* Next Rank Target Progress Bar */}
            {nextPeerAbove ? (
              <div className="space-y-1.5 pt-2 border-t border-white/15">
                <div className="flex items-center justify-between text-[11px] text-sky-100">
                  <span className="truncate">
                    Rival: <strong className="text-amber-300">{nextPeerAbove.avatar} {nextPeerAbove.name}</strong> (#{userRank - 1})
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-black shrink-0">
                    +{questionsNeededToOvertake} Qs to pass
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950/60 overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400 transition-all duration-500"
                    style={{ width: `${rivalProgressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-white/15 text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
                <Crown className="w-4 h-4 fill-amber-400" />
                <span>You are #1 in the Global Harambee Azure Cohort!</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowProfileCustomizer((prev) => !prev)}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 border border-white/20 transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                <span>{showProfileCustomizer ? 'Hide Profile' : 'Customize Profile'}</span>
              </button>
              {onLaunchCompetitiveDrill && (
                <button
                  type="button"
                  onClick={() => onLaunchCompetitiveDrill(5)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-[11px] font-black flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                  title="Launch a rapid 5-Question Competitive Drill to overtake your next cohort rival"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>+5 Q Rival Drill</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sync Notification Toast */}
        {syncNotice && (
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* Collapsible Cohort Profile Customizer & Live Sync Drawer */}
        {showProfileCustomizer && (
          <div className="mt-4 pt-4 border-t border-white/15 bg-slate-950/40 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Your Global Harambee Azure Cohort Identity</span>
              </h3>
              <span className="text-[11px] text-slate-300">
                Appears on the live cohort leaderboard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={60}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="Your Name or Handle"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                  City &amp; Country
                </label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  maxLength={60}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Nairobi, Kenya"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                  Regional Hub Chapter
                </label>
                <select
                  value={customRegion}
                  onChange={(e) => setCustomRegion(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="East Africa">East Africa Hub</option>
                  <option value="West Africa">West Africa Hub</option>
                  <option value="Southern Africa">Southern Africa Hub</option>
                  <option value="North & Horn">North &amp; Horn Hub</option>
                  <option value="Global Diaspora">Global Diaspora</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-300 mr-1">Flag / Emblem:</span>
                {AVATAR_CHOICES.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setCustomAvatar(emoji)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                      customAvatar === emoji
                        ? 'bg-amber-400 text-slate-950 scale-110 ring-2 ring-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSyncMyProfileToCohort}
                disabled={isSyncingProfile}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingProfile ? 'animate-spin' : ''}`} />
                <span>{isSyncingProfile ? 'Syncing...' : 'Sync Score to Cohort'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* #2 Silver */}
        {fullLeaderboard[1] && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm order-2 md:order-1 relative overflow-hidden flex flex-col justify-between">
            <div className="h-1.5 bg-slate-300 absolute top-0 left-0 right-0" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{fullLeaderboard[1].avatar}</span>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    {fullLeaderboard[1].name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{fullLeaderboard[1].location}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold truncate max-w-full">
                    {fullLeaderboard[1].chapter}
                  </span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                #2
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">
                {fullLeaderboard[1].totalAnswered} Qs Solved
              </span>
              <span className="font-semibold text-orange-600 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {fullLeaderboard[1].streakDays}d Streak
              </span>
              <span className="font-bold text-emerald-700">{fullLeaderboard[1].accuracy}%</span>
            </div>
          </div>
        )}

        {/* #1 Gold */}
        {fullLeaderboard[0] && (
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-300 p-6 shadow-md order-1 md:order-2 relative overflow-hidden flex flex-col justify-between transform md:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-500 absolute top-0 left-0 right-0" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl shrink-0">{fullLeaderboard[0].avatar}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                    <span className="text-[11px] font-black text-amber-800 uppercase tracking-wide">
                      Cohort Champion
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 truncate">
                    {fullLeaderboard[0].name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{fullLeaderboard[0].location}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 text-[10px] font-bold truncate max-w-full">
                    {fullLeaderboard[0].chapter}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                #1
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-900">
                {fullLeaderboard[0].totalAnswered} Qs Solved
              </span>
              <span className="font-bold text-orange-600 flex items-center gap-1">
                <Flame className="w-4 h-4 fill-orange-500" />
                {fullLeaderboard[0].streakDays}d Streak
              </span>
              <span className="font-bold text-emerald-700">{fullLeaderboard[0].accuracy}% Acc</span>
            </div>
          </div>
        )}

        {/* #3 Bronze */}
        {fullLeaderboard[2] && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm order-3 md:order-3 relative overflow-hidden flex flex-col justify-between">
            <div className="h-1.5 bg-amber-700 absolute top-0 left-0 right-0" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{fullLeaderboard[2].avatar}</span>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    {fullLeaderboard[2].name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{fullLeaderboard[2].location}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-bold truncate max-w-full">
                    {fullLeaderboard[2].chapter}
                  </span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center font-bold text-xs text-amber-900 shrink-0">
                #3
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">
                {fullLeaderboard[2].totalAnswered} Qs Solved
              </span>
              <span className="font-semibold text-orange-600 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {fullLeaderboard[2].streakDays}d Streak
              </span>
              <span className="font-bold text-emerald-700">{fullLeaderboard[2].accuracy}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Regional Cohort Chapters, Sort Tabs & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Regional Chapter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1 mr-1 shrink-0">
            <Globe2 className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>Chapter:</span>
          </span>
          {REGION_FILTERS.map((reg) => (
            <button
              key={reg.id}
              type="button"
              onClick={() => setSelectedRegion(reg.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedRegion === reg.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {reg.label}
            </button>
          ))}
        </div>

        {/* Sort Tabs & Search Input */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveSort('answered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSort === 'answered'
                  ? 'bg-[#0078D4] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Total Questions Solved
            </button>

            <button
              type="button"
              onClick={() => setActiveSort('streak')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeSort === 'streak'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Daily Streak</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSort('accuracy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSort === 'accuracy'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Accuracy %
            </button>

            <button
              type="button"
              onClick={() => setActiveSort('mastered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeSort === 'mastered'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Modules Mastered</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cohort peer, hub, or badge..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0078D4] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Main Cohort Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Performers • Global Harambee Azure Cohort</th>
                <th className="py-3 px-4 text-center">Questions</th>
                <th className="py-3 px-4 text-center">Modules</th>
                <th className="py-3 px-4 text-center">Streak</th>
                <th className="py-3 px-4 text-center">Accuracy</th>
                <th className="py-3 px-4 text-center">Kudos</th>
                <th className="py-3 px-4 text-right">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaderboard.map((entry, index) => {
                const rankNum = index + 1;
                const isUser = entry.isCurrentUser;
                const hasSentKudos = Boolean(kudosSentIds[entry.id]);

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isUser
                        ? 'bg-blue-50/75 border-l-4 border-l-[#0078D4] font-semibold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold">
                        {rankNum === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black">
                            1
                          </span>
                        ) : rankNum === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center text-xs font-black">
                            2
                          </span>
                        ) : rankNum === 3 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-xs font-black">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-xs">#{rankNum}</span>
                        )}
                      </div>
                    </td>

                    {/* Learner & Cohort Chapter Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0">{entry.avatar}</span>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{entry.name}</span>
                            {isUser && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0078D4] text-white">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 flex-wrap">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{entry.location}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[#0078D4] font-semibold">{entry.chapter}</span>
                          </div>
                          {entry.recentActivity && (
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                              <span className="truncate">{entry.recentActivity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Questions Answered */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-sm text-slate-900">
                        {entry.totalAnswered}
                      </span>
                    </td>

                    {/* Mastered Modules */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[11px]">
                        {entry.masteredModules ?? 0}/12
                      </span>
                    </td>

                    {/* Streak Days */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-bold text-xs">
                        <Flame className="w-3 h-3 text-orange-500 fill-orange-400" />
                        <span>{entry.streakDays}d</span>
                      </div>
                    </td>

                    {/* Accuracy */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{entry.accuracy}%</span>
                      </div>
                    </td>

                    {/* Harambee Kudos Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleGiveKudos(entry.id)}
                        disabled={hasSentKudos}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          hasSentKudos
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-200 hover:border-amber-300'
                        }`}
                        title={
                          hasSentKudos
                            ? 'Harambee Kudos sent!'
                            : `Send Harambee Kudos to ${entry.name}`
                        }
                      >
                        <Heart
                          className={`w-3 h-3 ${
                            hasSentKudos ? 'text-rose-600 fill-rose-500' : 'text-rose-500'
                          }`}
                        />
                        <span>{entry.kudosCount || 12}</span>
                      </button>
                    </td>

                    {/* Badge */}
                    <td className="py-3.5 px-4 text-right">
                      {entry.specialBadge ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                          {entry.specialBadge}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Harambee Community Banner with Competitive Practice Actions */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-emerald-50/60 border border-amber-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <MaasaiMedallion size={38} />
          <div>
            <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
              <span>Harambee Spirit: "Together We Rise to AZ-900 Certification"</span>
            </h4>
            <p className="text-xs text-amber-900/90 max-w-xl leading-relaxed">
              Every scenario question you solve in Practice or Rapid Micro-Drills updates your standing in the <strong>Global Harambee Azure Cohort</strong> and brings you closer to a 700+ exam score.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onLaunchCompetitiveDrill && (
            <button
              type="button"
              onClick={() => onLaunchCompetitiveDrill(5)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>5-Q Rank Boost Drill</span>
            </button>
          )}
          {onPracticeClick && (
            <button
              type="button"
              onClick={onPracticeClick}
              className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Practice Next Module</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
