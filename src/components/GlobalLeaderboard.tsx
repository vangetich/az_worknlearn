import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Users,
  Target,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Medal,
  Crown,
  Search,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { MaasaiMedallion, KitengeRibbon } from './MotifDecorations';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  location: string;
  cohort: string;
  totalAnswered: number;
  streakDays: number;
  accuracy: number;
  isCurrentUser?: boolean;
  specialBadge?: string;
}

const PEER_LEADERBOARD_DATA: LeaderboardEntry[] = [
  {
    id: 'peer-1',
    name: 'Amina Kimani',
    avatar: '🇰🇪',
    location: 'Nairobi, Kenya',
    cohort: 'Harambee Cloud Circle',
    totalAnswered: 142,
    streakDays: 14,
    accuracy: 94,
    specialBadge: 'Azure Architect',
  },
  {
    id: 'peer-2',
    name: 'Chidi Okonkwo',
    avatar: '🇳🇬',
    location: 'Lagos, Nigeria',
    cohort: 'Yaba Cloud Explorers',
    totalAnswered: 128,
    streakDays: 12,
    accuracy: 91,
    specialBadge: 'Centurion',
  },
  {
    id: 'peer-3',
    name: 'Thabo Mokoena',
    avatar: '🇿🇦',
    location: 'Johannesburg, South Africa',
    cohort: 'Mzansi Azure Guild',
    totalAnswered: 115,
    streakDays: 9,
    accuracy: 88,
    specialBadge: 'Sharpshooter',
  },
  {
    id: 'peer-4',
    name: 'Abeba Haile',
    avatar: '🇪🇹',
    location: 'Addis Ababa, Ethiopia',
    cohort: 'Highland Cloud Cohort',
    totalAnswered: 96,
    streakDays: 8,
    accuracy: 89,
    specialBadge: 'Master of Modules',
  },
  {
    id: 'peer-5',
    name: 'Kofi Mensah',
    avatar: '🇬🇭',
    location: 'Accra, Ghana',
    cohort: 'Black Star Tech Hub',
    totalAnswered: 84,
    streakDays: 7,
    accuracy: 86,
    specialBadge: 'Consistency Master',
  },
  {
    id: 'peer-6',
    name: 'Claudine Uwase',
    avatar: '🇷🇼',
    location: 'Kigali, Rwanda',
    cohort: 'Kigali Innovation City',
    totalAnswered: 72,
    streakDays: 6,
    accuracy: 92,
    specialBadge: 'Concepts Sentinel',
  },
  {
    id: 'peer-7',
    name: 'Marcus Vance',
    avatar: '🇬🇧',
    location: 'London, UK',
    cohort: 'Global Cloud Aspirants',
    totalAnswered: 65,
    streakDays: 5,
    accuracy: 84,
    specialBadge: 'Azure Explorer',
  },
  {
    id: 'peer-8',
    name: 'Fatima Al-Mansoor',
    avatar: '🇪🇬',
    location: 'Cairo, Egypt',
    cohort: 'Nile Valley Azure League',
    totalAnswered: 58,
    streakDays: 5,
    accuracy: 85,
    specialBadge: 'Cloud Explorer',
  },
  {
    id: 'peer-9',
    name: 'David Ochieng',
    avatar: '🇰🇪',
    location: 'Kisumu, Kenya',
    cohort: 'Victoria Cloud Network',
    totalAnswered: 44,
    streakDays: 4,
    accuracy: 82,
    specialBadge: 'Rookie Builder',
  },
  {
    id: 'peer-10',
    name: 'Elena Rostova',
    avatar: '🇨🇦',
    location: 'Toronto, Canada',
    cohort: 'North Star Azure Group',
    totalAnswered: 36,
    streakDays: 3,
    accuracy: 80,
    specialBadge: 'Cloud Rookie',
  },
];

interface GlobalLeaderboardProps {
  stats: UserStats;
  onPracticeClick?: () => void;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  stats,
  onPracticeClick,
}) => {
  const [activeSort, setActiveSort] = useState<'answered' | 'streak' | 'accuracy'>('answered');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const userAccuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  // Combine peer dataset with dynamic user entry
  const fullLeaderboard = useMemo(() => {
    const userEntry: LeaderboardEntry = {
      id: 'current-user',
      name: 'You (Current Aspirant)',
      avatar: '🌟',
      location: 'Local Workspace • Kenya / Global',
      cohort: 'Harambee AZ-900 Aspirant',
      totalAnswered: stats.totalAnswered,
      streakDays: stats.streakDays || 1,
      accuracy: userAccuracy,
      isCurrentUser: true,
      specialBadge:
        userAccuracy >= 85 && stats.totalAnswered >= 20
          ? 'Azure Architect'
          : stats.totalAnswered >= 50
          ? 'Centurion'
          : stats.totalAnswered >= 10
          ? 'Azure Explorer'
          : 'Cloud Rookie',
    };

    const combined: LeaderboardEntry[] = [
      ...PEER_LEADERBOARD_DATA.map((p) => ({ ...p, isCurrentUser: false })),
      userEntry,
    ];

    // Sorting logic
    if (activeSort === 'answered') {
      combined.sort((a, b) => b.totalAnswered - a.totalAnswered);
    } else if (activeSort === 'streak') {
      combined.sort((a, b) => {
        if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
        return b.totalAnswered - a.totalAnswered;
      });
    } else {
      // accuracy
      combined.sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return b.totalAnswered - a.totalAnswered;
      });
    }

    return combined;
  }, [stats.totalAnswered, stats.streakDays, userAccuracy, activeSort]);

  // Find user's dynamic rank
  const userRank = useMemo(() => {
    const idx = fullLeaderboard.findIndex((entry) => entry.isCurrentUser);
    return idx >= 0 ? idx + 1 : 1;
  }, [fullLeaderboard]);

  const filteredLeaderboard = useMemo(() => {
    if (!searchTerm.trim()) return fullLeaderboard;
    const q = searchTerm.toLowerCase();
    return fullLeaderboard.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.location.toLowerCase().includes(q) ||
        entry.cohort.toLowerCase().includes(q)
    );
  }, [fullLeaderboard, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#004C87] to-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 left-0 right-0">
          <KitengeRibbon height={3} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0078D4] text-white uppercase tracking-wider">
                Azure Curriculum
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-300/30">
                Global Harambee Circle
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Global Learning Leaderboard
            </h1>
            <p className="text-sm text-slate-200 max-w-xl">
              Celebrate collective momentum across East Africa and worldwide Azure learners. Keep up your daily streak and answer questions to climb ranks.
            </p>
          </div>

          {/* User's Current Rank Card */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-md shrink-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xl shadow-inner">
              #{userRank}
            </div>
            <div>
              <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                Your Current Rank
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{stats.totalAnswered} Questions</span>
                <span className="text-amber-400">•</span>
                <span>{stats.streakDays || 1}d Streak</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* #2 Silver */}
        {fullLeaderboard[1] && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm order-2 md:order-1 relative overflow-hidden flex flex-col justify-between">
            <div className="h-1.5 bg-slate-300 absolute top-0 left-0 right-0" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{fullLeaderboard[1].avatar}</span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{fullLeaderboard[1].name}</h4>
                  <p className="text-xs text-slate-500">{fullLeaderboard[1].location}</p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                #2
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">{fullLeaderboard[1].totalAnswered} Questions</span>
              <span className="font-semibold text-orange-600 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {fullLeaderboard[1].streakDays}d Streak
              </span>
            </div>
          </div>
        )}

        {/* #1 Gold */}
        {fullLeaderboard[0] && (
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-300 p-6 shadow-md order-1 md:order-2 relative overflow-hidden flex flex-col justify-between transform md:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-500 absolute top-0 left-0 right-0" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{fullLeaderboard[0].avatar}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span className="text-xs font-bold text-amber-800 uppercase">Top Performer</span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900">{fullLeaderboard[0].name}</h4>
                  <p className="text-xs text-slate-500">{fullLeaderboard[0].location}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-xs">
                #1
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">{fullLeaderboard[0].totalAnswered} Questions</span>
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
              <div className="flex items-center gap-3">
                <span className="text-2xl">{fullLeaderboard[2].avatar}</span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{fullLeaderboard[2].name}</h4>
                  <p className="text-xs text-slate-500">{fullLeaderboard[2].location}</p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center font-bold text-xs text-amber-900">
                #3
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">{fullLeaderboard[2].totalAnswered} Questions</span>
              <span className="font-semibold text-orange-600 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {fullLeaderboard[2].streakDays}d Streak
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Sort Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setActiveSort('answered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSort === 'answered'
                ? 'bg-[#0078D4] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Total Questions Answered
          </button>

          <button
            onClick={() => setActiveSort('streak')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeSort === 'streak'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Streak Length</span>
          </button>

          <button
            onClick={() => setActiveSort('accuracy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSort === 'accuracy'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Accuracy %
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search learner or city..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0078D4] focus:bg-white"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Learner &amp; Cohort</th>
                <th className="py-3 px-4 text-center">Questions</th>
                <th className="py-3 px-4 text-center">Daily Streak</th>
                <th className="py-3 px-4 text-center">Accuracy</th>
                <th className="py-3 px-4 text-right">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaderboard.map((entry, index) => {
                const rankNum = index + 1;
                const isUser = entry.isCurrentUser;

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isUser
                        ? 'bg-blue-50/70 border-l-4 border-l-[#0078D4] font-semibold'
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

                    {/* Learner Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0">{entry.avatar}</span>
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{entry.name}</span>
                            {isUser && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0078D4] text-white">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{entry.location}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-600 font-medium">{entry.cohort}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Questions Answered */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-sm text-slate-900">
                        {entry.totalAnswered}
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

                    {/* Badge */}
                    <td className="py-3.5 px-4 text-right">
                      {entry.specialBadge ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
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

      {/* Harambee Community Banner with Practice Action */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MaasaiMedallion size={36} />
          <div>
            <h4 className="font-extrabold text-sm text-amber-950">
              Harambee Principle: "Together We Build Mastery"
            </h4>
            <p className="text-xs text-amber-800 max-w-xl">
              Every practice drill you finish boosts your rank, strengthens your domain retention, and reinforces your path to passing Microsoft AZ-900.
            </p>
          </div>
        </div>

        {onPracticeClick && (
          <button
            onClick={onPracticeClick}
            className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            Practice Next Module
          </button>
        )}
      </div>
    </div>
  );
};
