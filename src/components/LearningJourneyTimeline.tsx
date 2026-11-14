import React, { useMemo, useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Lock,
  Unlock,
  Palette,
  Wand2,
  ArrowRight,
  Compass,
  Shield,
  Flame,
  Layers,
  BookOpen,
  Check,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import {
  ThemeMode,
  STUDIO_THEMES,
  getStoredTheme,
  applyTheme,
  getUnlockedMilestoneIds,
  unlockMilestoneRewardId,
} from '../utils/theme';
import { computeDifficultyStreaks } from './DifficultyStreakTracker';

export interface JourneyAiPromptReward {
  id: string;
  title: string;
  pathId: 1 | 2 | 3;
  moduleId: number;
  difficulty: 'Fundamental' | 'Intermediate' | 'Advanced';
  promptText: string;
}

export interface LearningJourneyMilestone {
  id: string;
  stepNumber: string;
  title: string;
  badgeTitle: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unitLabel: string;
  isNaturallyEarned: boolean;
  isUnlocked: boolean;
  rewardType: 'theme' | 'ai-prompts' | 'both';
  rewardHeadline: string;
  themeRewardId?: ThemeMode;
  aiPromptsReward?: JourneyAiPromptReward[];
}

export const PENDING_AI_PROMPT_STORAGE_KEY = 'az900_pending_journey_ai_prompt_v1';

export const MILESTONE_AI_PROMPT_PACKS: Record<string, JourneyAiPromptReward[]> = {
  'ten-questions-answered': [
    {
      id: 'prompt-sovereign-expressroute',
      title: 'Sovereign Banking ExpressRoute Migration',
      pathId: 2,
      moduleId: 5,
      difficulty: 'Intermediate',
      promptText:
        'Central bank migrating core settlement workloads from on-premises to Azure using dedicated private ExpressRoute circuits with Zone-Redundant Virtual Network Gateways.',
    },
    {
      id: 'prompt-shared-resp-paas',
      title: 'Shared Responsibility Matrix in PaaS vs IaaS',
      pathId: 1,
      moduleId: 1,
      difficulty: 'Fundamental',
      promptText:
        'Enterprise security audit evaluating customer vs Microsoft patching and identity responsibilities across Azure SQL Database (PaaS) and Azure Virtual Machines (IaaS).',
    },
  ],
  'difficulty-spectrum-strategist': [
    {
      id: 'prompt-zero-trust-entra',
      title: 'Zero-Trust Conditional Access & PIM Governance',
      pathId: 3,
      moduleId: 7,
      difficulty: 'Advanced',
      promptText:
        'Global enterprise enforcing Zero-Trust sign-in risk policies using Microsoft Entra Conditional Access, MFA, and least-privilege RBAC role assignments at Resource Group scope.',
    },
    {
      id: 'prompt-defense-in-depth-nsg',
      title: 'Defense-in-Depth Perimeter & NSG Micro-Segmentation',
      pathId: 2,
      moduleId: 5,
      difficulty: 'Intermediate',
      promptText:
        'Multi-tier e-commerce platform isolating web, application, and database subnets using Network Security Groups (NSGs) and Azure DDoS Protection.',
    },
  ],
  'hundred-questions-answered': [
    {
      id: 'prompt-ha-dr-gzrs',
      title: 'Multi-Region GZRS Storage & Availability Zone Failover',
      pathId: 2,
      moduleId: 6,
      difficulty: 'Advanced',
      promptText:
        'Mission-critical healthcare telemetry platform requiring synchronous intra-region Availability Zone resilience combined with asynchronous cross-region paired failover using GZRS.',
    },
    {
      id: 'prompt-composite-sla-architecture',
      title: 'Composite Architecture SLA & Downtime Elimination',
      pathId: 1,
      moduleId: 2,
      difficulty: 'Advanced',
      promptText:
        'Architecting a multi-tier web service across Azure App Service, Azure SQL Database, and Front Door to maximize composite SLA and eliminate single points of failure.',
    },
  ],
  'curriculum-grandmaster': [
    {
      id: 'prompt-finops-arc-policy',
      title: 'C-Suite Cloud FinOps, TCO & Azure Arc Hybrid Governance',
      pathId: 3,
      moduleId: 10,
      difficulty: 'Advanced',
      promptText:
        'Multinational conglomerate unifying hybrid Kubernetes clusters with Azure Arc while enforcing tag inheritance via Azure Policy and optimizing 3-year commitment spend with Azure Reservations.',
    },
  ],
};

export function getAllUnlockedJourneyPrompts(
  stats: UserStats,
  questions: Question[] = []
): JourneyAiPromptReward[] {
  const manualUnlocked = new Set(getUnlockedMilestoneIds());
  const totalAnswered = stats.totalAnswered || 0;
  const completedCount = (stats.completedModules || []).length;
  const diffStreaks = computeDifficultyStreaks(stats, questions);
  const tiersAttempted = (['Fundamental', 'Intermediate', 'Advanced'] as const).filter(
    (t) => diffStreaks[t].totalAttempts > 0
  ).length;

  const result: JourneyAiPromptReward[] = [];

  if (totalAnswered >= 10 || manualUnlocked.has('ten-questions-answered')) {
    result.push(...MILESTONE_AI_PROMPT_PACKS['ten-questions-answered']);
  }
  if (
    tiersAttempted >= 3 ||
    (stats.streakDays || 0) >= 3 ||
    manualUnlocked.has('difficulty-spectrum-strategist')
  ) {
    result.push(...MILESTONE_AI_PROMPT_PACKS['difficulty-spectrum-strategist']);
  }
  if (totalAnswered >= 100 || manualUnlocked.has('hundred-questions-answered')) {
    result.push(...MILESTONE_AI_PROMPT_PACKS['hundred-questions-answered']);
  }
  if (
    completedCount >= 6 ||
    totalAnswered >= 150 ||
    manualUnlocked.has('curriculum-grandmaster')
  ) {
    result.push(...MILESTONE_AI_PROMPT_PACKS['curriculum-grandmaster']);
  }

  return result;
}

interface LearningJourneyTimelineProps {
  stats: UserStats;
  questions?: Question[];
  onLaunchAiPrompt?: (promptReward: JourneyAiPromptReward) => void;
  onNavigateToPractice?: () => void;
}

export const LearningJourneyTimeline: React.FC<LearningJourneyTimelineProps> = ({
  stats,
  questions = [],
  onLaunchAiPrompt,
  onNavigateToPractice,
}) => {
  const [activeTheme, setActiveTheme] = useState<ThemeMode>(getStoredTheme);
  const [unlockedRewardIds, setUnlockedRewardIds] = useState<string[]>(
    getUnlockedMilestoneIds
  );
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    'first-module-mastered'
  );
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: ThemeMode }>;
      if (customEvent.detail?.theme) {
        setActiveTheme(customEvent.detail.theme);
      }
    };
    const handleRewardsUpdated = () => {
      setUnlockedRewardIds(getUnlockedMilestoneIds());
    };
    window.addEventListener('az900_theme_changed', handleThemeChange);
    window.addEventListener('az900_journey_rewards_updated', handleRewardsUpdated);
    return () => {
      window.removeEventListener('az900_theme_changed', handleThemeChange);
      window.removeEventListener('az900_journey_rewards_updated', handleRewardsUpdated);
    };
  }, []);

  // Calculate mastered modules count (completedModules OR moduleMastery >= 80% with at least 3 answers)
  const masteredModulesCount = useMemo(() => {
    const masteredSet = new Set<number>(stats.completedModules || []);
    Object.entries(stats.moduleMastery || {}).forEach(([modIdStr, record]) => {
      if (record && record.total >= 3 && record.correct / record.total >= 0.8) {
        masteredSet.add(Number(modIdStr));
      }
    });
    return masteredSet.size;
  }, [stats.completedModules, stats.moduleMastery]);

  const difficultyStreaks = useMemo(
    () => computeDifficultyStreaks(stats, questions),
    [stats, questions]
  );

  const practicedDifficultyTiersCount = useMemo(() => {
    return (['Fundamental', 'Intermediate', 'Advanced'] as const).filter(
      (t) => difficultyStreaks[t].totalAttempts > 0 || difficultyStreaks[t].currentStreak > 0
    ).length;
  }, [difficultyStreaks]);

  const milestones: LearningJourneyMilestone[] = useMemo(() => {
    const totalAnswered = stats.totalAnswered || 0;
    const unlockedSet = new Set(unlockedRewardIds);

    const list: LearningJourneyMilestone[] = [
      {
        id: 'ten-questions-answered',
        stepNumber: '01',
        title: '10 Questions Answered',
        badgeTitle: 'Cloud Explorer Initiate',
        description:
          'Complete your first 10 AZ-900 practice questions to calibrate your baseline domain accuracy.',
        currentValue: Math.min(10, totalAnswered),
        targetValue: 10,
        unitLabel: 'Questions',
        isNaturallyEarned: totalAnswered >= 10,
        isUnlocked: totalAnswered >= 10 || unlockedSet.has('ten-questions-answered'),
        rewardType: 'ai-prompts',
        rewardHeadline: 'Sovereign Hybrid & ExpressRoute AI Prompt Pack (+2 Prompts)',
        aiPromptsReward: MILESTONE_AI_PROMPT_PACKS['ten-questions-answered'],
      },
      {
        id: 'first-module-mastered',
        stepNumber: '02',
        title: 'First Module Mastered',
        badgeTitle: 'Module Mastery Vanguard',
        description:
          'Achieve 80%+ accuracy in any AZ-900 curriculum module or mark your first module complete.',
        currentValue: Math.min(1, masteredModulesCount),
        targetValue: 1,
        unitLabel: 'Module Mastered',
        isNaturallyEarned: masteredModulesCount >= 1,
        isUnlocked:
          masteredModulesCount >= 1 || unlockedSet.has('first-module-mastered'),
        rewardType: 'theme',
        rewardHeadline: 'Savanna Gold Studio Specialized UI Theme',
        themeRewardId: 'savanna-gold',
      },
      {
        id: 'difficulty-spectrum-strategist',
        stepNumber: '03',
        title: 'Difficulty Spectrum Balanced',
        badgeTitle: 'Trifecta Difficulty Strategist',
        description:
          'Answer questions across all 3 difficulty levels (Fundamental, Intermediate, Advanced) to build full-spectrum resilience.',
        currentValue: Math.min(3, practicedDifficultyTiersCount),
        targetValue: 3,
        unitLabel: 'Difficulty Tiers',
        isNaturallyEarned: practicedDifficultyTiersCount >= 3,
        isUnlocked:
          practicedDifficultyTiersCount >= 3 ||
          unlockedSet.has('difficulty-spectrum-strategist'),
        rewardType: 'ai-prompts',
        rewardHeadline: 'Zero-Trust Entra ID & Defense-in-Depth AI Prompt Pack (+2 Prompts)',
        aiPromptsReward: MILESTONE_AI_PROMPT_PACKS['difficulty-spectrum-strategist'],
      },
      {
        id: 'fifty-questions-scholar',
        stepNumber: '04',
        title: '50 Questions Answered',
        badgeTitle: 'Rift Valley Cloud Architect',
        description:
          'Reach 50 total answered questions across the official Microsoft Azure Fundamentals curriculum.',
        currentValue: Math.min(50, totalAnswered),
        targetValue: 50,
        unitLabel: 'Questions',
        isNaturallyEarned: totalAnswered >= 50,
        isUnlocked: totalAnswered >= 50 || unlockedSet.has('fifty-questions-scholar'),
        rewardType: 'theme',
        rewardHeadline: 'Emerald Rift Canopy Specialized UI Theme',
        themeRewardId: 'emerald-rift',
      },
      {
        id: 'hundred-questions-answered',
        stepNumber: '05',
        title: '100 Questions Answered',
        badgeTitle: 'AZ-900 Centurion Scholar',
        description:
          'Cross the 100-question milestone, demonstrating sustained exam stamina and recall speed.',
        currentValue: Math.min(100, totalAnswered),
        targetValue: 100,
        unitLabel: 'Questions',
        isNaturallyEarned: totalAnswered >= 100,
        isUnlocked:
          totalAnswered >= 100 || unlockedSet.has('hundred-questions-answered'),
        rewardType: 'ai-prompts',
        rewardHeadline: 'Multi-Region HA/DR & Composite SLA AI Prompt Pack (+2 Prompts)',
        aiPromptsReward: MILESTONE_AI_PROMPT_PACKS['hundred-questions-answered'],
      },
      {
        id: 'curriculum-grandmaster',
        stepNumber: '06',
        title: '6 Modules Mastered',
        badgeTitle: 'Harambee Azure Grandmaster',
        description:
          'Master at least 6 curriculum modules (or answer 150+ questions) to unlock the pinnacle studio theme and C-Suite AI prompt.',
        currentValue: Math.min(6, masteredModulesCount),
        targetValue: 6,
        unitLabel: 'Modules Mastered',
        isNaturallyEarned: masteredModulesCount >= 6 || totalAnswered >= 150,
        isUnlocked:
          masteredModulesCount >= 6 ||
          totalAnswered >= 150 ||
          unlockedSet.has('curriculum-grandmaster'),
        rewardType: 'both',
        rewardHeadline:
          'Kilimanjaro Aurora Dark UI Theme + FinOps & Azure Arc AI Prompt Pack',
        themeRewardId: 'kilimanjaro-aurora',
        aiPromptsReward: MILESTONE_AI_PROMPT_PACKS['curriculum-grandmaster'],
      },
    ];

    return list;
  }, [
    stats.totalAnswered,
    masteredModulesCount,
    practicedDifficultyTiersCount,
    unlockedRewardIds,
  ]);

  const unlockedCount = useMemo(
    () => milestones.filter((m) => m.isUnlocked).length,
    [milestones]
  );

  const selectedMilestone = useMemo(
    () =>
      milestones.find((m) => m.id === selectedMilestoneId) || milestones[0],
    [milestones, selectedMilestoneId]
  );

  const handleUnlockMilestone = (milestoneId: string, title: string) => {
    const updated = unlockMilestoneRewardId(milestoneId);
    setUnlockedRewardIds(updated);
    setStatusFeedback(`Unlocked "${title}" badge and its specialized studio reward!`);
    setTimeout(() => setStatusFeedback(null), 3500);
  };

  const handleApplyThemeReward = (themeId: ThemeMode, milestoneId?: string) => {
    if (milestoneId && !unlockedRewardIds.includes(milestoneId)) {
      const updated = unlockMilestoneRewardId(milestoneId);
      setUnlockedRewardIds(updated);
    }
    applyTheme(themeId);
    setActiveTheme(themeId);
    const themeMeta = STUDIO_THEMES.find((t) => t.id === themeId);
    setStatusFeedback(`Applied "${themeMeta?.name || themeId}" UI Theme across the studio.`);
    setTimeout(() => setStatusFeedback(null), 3500);
  };

  const handleUseAiPrompt = (
    promptReward: JourneyAiPromptReward,
    milestoneId: string
  ) => {
    if (!unlockedRewardIds.includes(milestoneId)) {
      const updated = unlockMilestoneRewardId(milestoneId);
      setUnlockedRewardIds(updated);
    }
    try {
      localStorage.setItem(
        PENDING_AI_PROMPT_STORAGE_KEY,
        JSON.stringify(promptReward)
      );
    } catch {
      // ignore storage errors
    }
    if (onLaunchAiPrompt) {
      onLaunchAiPrompt(promptReward);
    } else {
      setStatusFeedback(
        `Loaded AI Prompt "${promptReward.title}" into the AI Scenario Generator!`
      );
      setTimeout(() => setStatusFeedback(null), 3500);
    }
  };

  return (
    <section
      aria-label="Learning Journey Milestone Timeline and Reward Vault"
      className="bg-white rounded-2xl border border-slate-200/90 card-elevation overflow-hidden shadow-xs"
    >
      {/* Top Header Strip */}
      <div className="px-4 sm:px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base tracking-tight text-white">
              Learning Journey Timeline &amp; Milestone Rewards
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Interactive milestone badges that unlock specialized studio UI themes and enterprise AI scenario prompts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-300">
          <span>
            Milestones Unlocked: <strong className="text-amber-300">{unlockedCount}/{milestones.length}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Answered: <strong className="text-sky-300">{stats.totalAnswered || 0} Qs</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Mastered: <strong className="text-emerald-300">{masteredModulesCount}/12 Mods</strong>
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Status Toast Feedback */}
        {statusFeedback && (
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusFeedback}</span>
            </span>
          </div>
        )}

        {/* Interactive 6-Node Horizontal / Responsive Timeline */}
        <div className="relative">
          {/* Connecting Horizontal Line on Desktop */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-9 left-8 right-8 h-0.5 bg-slate-200"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 relative z-10">
            {milestones.map((milestone) => {
              const isSelected = selectedMilestone.id === milestone.id;
              const progressPct = Math.min(
                100,
                Math.round((milestone.currentValue / milestone.targetValue) * 100)
              );

              return (
                <button
                  key={milestone.id}
                  type="button"
                  onClick={() => setSelectedMilestoneId(milestone.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-sky-50/90 border-[#0078D4] ring-2 ring-[#0078D4]/20 shadow-sm'
                      : milestone.isUnlocked
                      ? 'bg-white hover:bg-slate-50 border-emerald-300/90'
                      : 'bg-slate-50/70 hover:bg-white border-slate-200/90'
                  }`}
                >
                  {/* Top Row: Step Number + Badge Icon */}
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="font-mono tabular-nums text-xs font-bold text-slate-500">
                      {milestone.stepNumber}. {milestone.isUnlocked ? 'Unlocked' : `${progressPct}%`}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        milestone.isUnlocked
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {milestone.isUnlocked ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>

                  {/* Milestone Title & Badge Name */}
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      {milestone.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {milestone.badgeTitle}
                    </div>
                  </div>

                  {/* Progress Bar & Numeric Readout */}
                  <div className="w-full space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          milestone.isUnlocked ? 'bg-emerald-600' : 'bg-[#0078D4]'
                        }`}
                        style={{ width: `${milestone.isUnlocked ? 100 : progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500">
                      <span>
                        {milestone.currentValue}/{milestone.targetValue} {milestone.unitLabel}
                      </span>
                      <span>
                        {milestone.rewardType === 'theme'
                          ? 'UI Theme'
                          : milestone.rewardType === 'ai-prompts'
                          ? 'AI Prompts'
                          : 'Theme + AI'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Milestone Inspector & Interactive Reward Unlock Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 border-t border-slate-100 items-stretch">
          {/* Left 7 Columns: Selected Milestone Details & Reward Action Controls */}
          <div className="lg:col-span-7 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-mono tabular-nums">
                  <span>Milestone {selectedMilestone.stepNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedMilestone.badgeTitle}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      selectedMilestone.isUnlocked
                        ? 'text-emerald-700 font-bold'
                        : 'text-amber-700 font-bold'
                    }
                  >
                    {selectedMilestone.isUnlocked ? 'Badge Unlocked' : 'In Progress'}
                  </span>
                </div>

                {!selectedMilestone.isUnlocked && (
                  <button
                    type="button"
                    onClick={() =>
                      handleUnlockMilestone(
                        selectedMilestone.id,
                        selectedMilestone.badgeTitle
                      )
                    }
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock Badge &amp; Preview Reward</span>
                  </button>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                {selectedMilestone.title} — {selectedMilestone.rewardHeadline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedMilestone.description}
              </p>
            </div>

            {/* Reward Section: Specialized UI Theme Control (if applicable) */}
            {selectedMilestone.themeRewardId && (() => {
              const themeOption = STUDIO_THEMES.find(
                (t) => t.id === selectedMilestone.themeRewardId
              );
              if (!themeOption) return null;
              const isCurrentTheme = activeTheme === themeOption.id;

              return (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-1 shrink-0">
                      {themeOption.previewSwatches.map((hex, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full border border-slate-300"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-[#0078D4]" />
                        <span>{themeOption.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {themeOption.tagline}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleApplyThemeReward(themeOption.id, selectedMilestone.id)
                    }
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                      isCurrentTheme
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#0078D4] hover:bg-[#005A9E] text-white'
                    }`}
                  >
                    {isCurrentTheme ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Active Studio Theme</span>
                      </>
                    ) : (
                      <>
                        <Palette className="w-3.5 h-3.5" />
                        <span>Apply {themeOption.name}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })()}

            {/* Reward Section: Additional AI Generation Prompts (if applicable) */}
            {selectedMilestone.aiPromptsReward &&
              selectedMilestone.aiPromptsReward.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>
                      Unlocked AI Scenario Generation Prompts ({selectedMilestone.aiPromptsReward.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedMilestone.aiPromptsReward.map((promptItem) => (
                      <div
                        key={promptItem.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900">
                            {promptItem.title}{' '}
                            <span className="font-normal text-slate-500">
                              · M{promptItem.moduleId} · {promptItem.difficulty}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                            “{promptItem.promptText}”
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleUseAiPrompt(promptItem, selectedMilestone.id)
                          }
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                        >
                          <span>Use in AI Builder</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Right 5 Columns: Studio UI Theme Switcher & Unlocked Rewards Summary */}
          <div className="lg:col-span-5 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#0078D4]" />
                <span>Specialized Studio UI Themes Vault</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Switch between default modes or activate any specialized UI theme unlocked along your Learning Journey.
              </p>

              <div className="mt-3 space-y-2">
                {STUDIO_THEMES.map((themeOpt) => {
                  const isCurrent = activeTheme === themeOpt.id;
                  const associatedMilestone = milestones.find(
                    (m) => m.id === themeOpt.milestoneId
                  );
                  const isThemeUnlocked =
                    !themeOpt.milestoneId ||
                    Boolean(associatedMilestone?.isUnlocked);

                  return (
                    <div
                      key={themeOpt.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-sky-50/90 border-[#0078D4]'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex items-center gap-0.5 shrink-0">
                          {themeOpt.previewSwatches.map((hex, idx) => (
                            <span
                              key={idx}
                              className="w-3.5 h-3.5 rounded-full border border-slate-300"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {themeOpt.name}
                          </div>
                          <div className="text-[10.5px] text-slate-500 truncate">
                            {isThemeUnlocked
                              ? themeOpt.tagline
                              : `Unlocks at: ${associatedMilestone?.title}`}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleApplyThemeReward(themeOpt.id, themeOpt.milestoneId)
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isCurrent ? 'Active' : isThemeUnlocked ? 'Apply' : 'Unlock & Apply'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {onNavigateToPractice && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600">
                  Keep answering questions to advance all milestones.
                </span>
                <button
                  type="button"
                  onClick={onNavigateToPractice}
                  className="font-bold text-[#0078D4] hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Continue Practice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
