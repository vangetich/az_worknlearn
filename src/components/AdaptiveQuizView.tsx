import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  Target,
  Award,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Layers,
  Check,
  Flame,
  ShieldAlert,
  Lock,
  Unlock,
  Lightbulb,
  Compass,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Question,
  UserStats,
  QuestionAttempt,
  QuizSessionRecord,
  QuizSessionMissedQuestion,
} from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { CURRICULUM_STUDY_MODULES, StudyModuleGuide } from '../data/studyNotes';
import { saveUserAttempt, saveQuizSession } from '../utils/storage';
import confetti from 'canvas-confetti';

interface AdaptiveQuizViewProps {
  questions: Question[];
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onNavigateToHistory: () => void;
  onNavigateToPractice: () => void;
  onOpenPersonalizedReview?: () => void;
  onSelectModuleForPractice?: (moduleId: number) => void;
  initialFocusPathId?: 1 | 2 | 3 | null;
  initialFocusModuleId?: number | null;
}

interface SessionAttemptItem {
  question: Question;
  selectedAnswer: string;
  isCorrect: boolean;
  adaptiveStage: 'remediation' | 'standard' | 'advanced';
}

export interface ModuleAdaptiveState {
  moduleId: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  mode: 'remediation' | 'standard' | 'advanced';
  remediationTargetRemaining: number;
}

const ADVANCED_MODULE_TOPICS: Record<
  number,
  {
    topicTitle: string;
    architecturalChallenge: string;
    synthesisRule: string;
  }
> = {
  1: {
    topicTitle: 'Multi-Cloud vs. Hybrid Cloud & Shared Responsibility Matrix Boundaries',
    architecturalChallenge:
      'Evaluating customer vs. Microsoft security duties across IaaS, PaaS, and SaaS when combining on-premises private datacenters with multiple public cloud providers.',
    synthesisRule:
      'Data, Endpoints, Accounts, and Access Management remain 100% customer-managed across every cloud model; OS & network controls shift at the IaaS -> PaaS boundary.',
  },
  2: {
    topicTitle: 'Compound SLA Math, Active-Active High Availability & RTO/RPO Disaster Recovery',
    architecturalChallenge:
      'Distinguishing automatic horizontal scale-out/scale-in (Elasticity) from multi-zone fault tolerance (HA) and cross-region catastrophic failover (DR).',
    synthesisRule:
      'Elasticity = automated dynamic capacity matching load; High Availability = continuous uptime (99.99% across AZs); Disaster Recovery = regional recovery (ASR / Region Pairs).',
  },
  3: {
    topicTitle: 'Serverless Execution Economics vs. Allocated IaaS OpEx Optimization',
    architecturalChallenge:
      'Comparing 24/7 provisioned VM hourly billing against sub-second event-driven Consumption Plan metering and egress bandwidth tiers.',
    synthesisRule:
      'Allocated VMs bill until Stopped (Deallocated); Serverless Consumption bills $0 when idle; Inbound data (ingress) is free, Outbound data (egress) is metered.',
  },
  4: {
    topicTitle: '6-Level Management Group Governance Inheritance & Sovereign Cloud Isolation',
    architecturalChallenge:
      'Designing multi-subscription policy inheritance trees while respecting non-nested Resource Group boundaries and cross-region resource placement.',
    synthesisRule:
      'Management Groups (up to 6 levels) -> Subscriptions -> Resource Groups (no nesting, 1 RG per resource) -> Resources (can reside in different regions than their RG).',
  },
  5: {
    topicTitle: 'Non-Transitive Global VNet Peering, ExpressRoute Private Fiber & Private Link',
    architecturalChallenge:
      'Isolating PaaS database traffic onto private VNet IPs while connecting on-premises headquarters without traversing the public internet.',
    synthesisRule:
      'VNet Peering is non-transitive; ExpressRoute uses dedicated private fiber bypassing public internet; Private Endpoints assign private VNet IPs to PaaS resources.',
  },
  6: {
    topicTitle: 'RA-GZRS Multi-Region Read Resilience & Archive Rehydration Lifecycle Policies',
    architecturalChallenge:
      'Balancing 16-nines durability across 3 Availability Zones + paired region replication against multi-hour offline Archive tier rehydration costs.',
    synthesisRule:
      'LRS (1 DC) < ZRS (3 AZs) < GRS (2 Regions) < GZRS (3 AZs + 2nd Region); add RA- for secondary read access. Archive tier = lowest GB price, highest retrieval latency.',
  },
  7: {
    topicTitle: 'Zero Trust Conditional Access Signals, SIEM/SOAR Threat Hunting & Defense in Depth',
    architecturalChallenge:
      'Orchestrating risk-based MFA enforcement with Microsoft Entra Conditional Access, Defender for Cloud CSPM Secure Score, and Microsoft Sentinel SIEM/SOAR.',
    synthesisRule:
      'AuthN (Entra ID / MFA) proves identity; AuthZ (RBAC) grants resource actions; Defender for Cloud = Secure Score posture; Sentinel = cloud-native SIEM + SOAR.',
  },
  8: {
    topicTitle: '3-Year Reserved Instances + Azure Hybrid Benefit Stacking & Budget Action Groups',
    architecturalChallenge:
      'Maximizing up to 80% compute cost savings by combining 1/3-year commitments with existing Software Assurance Windows/SQL licenses and automated budget alerts.',
    synthesisRule:
      'TCO Calculator = pre-migration on-prem vs. cloud comparison; Pricing Calculator = monthly Azure estimate; Reservations + Hybrid Benefit = maximum steady-state savings.',
  },
  9: {
    topicTitle: 'Layer Interaction: Owner RBAC vs. Resource Locks vs. Azure Policy Deny Effects',
    architecturalChallenge:
      'Resolving privilege conflicts when a Subscription Owner attempts to delete a locked resource or provision a resource in a Policy-denied region.',
    synthesisRule:
      'Resource Locks (CanNotDelete / ReadOnly) and Azure Policy Deny rules override ALL RBAC roles—even Subscription Owners—until explicitly removed.',
  },
  10: {
    topicTitle: 'Idempotent Declarative IaC Transpilation (Bicep -> ARM) & Azure Arc Hybrid Projection',
    architecturalChallenge:
      'Projecting AWS, GCP, and on-premises physical servers into Azure Resource Manager via Azure Arc while automating repeatable deployments with Bicep.',
    synthesisRule:
      'Bicep is a concise declarative DSL that transpiles to ARM JSON; Azure Arc extends ARM governance, tags, and Azure Policy to non-Azure servers and K8s clusters.',
  },
  11: {
    topicTitle: '3-Tier Health Telemetry (Status vs. Service Health vs. Resource Health) & KQL APM',
    architecturalChallenge:
      'Correlating Application Insights distributed traces and Log Analytics KQL queries with personalized subscription outage notifications.',
    synthesisRule:
      'Azure Status = global world map; Service Health = personalized subscription/region alerts; Resource Health = single VM/resource diagnostics; App Insights = live web APM.',
  },
  12: {
    topicTitle: 'End-to-End Enterprise Cloud Architecture & Multi-Domain Tradeoff Synthesis',
    architecturalChallenge:
      'Integrating Zero Trust identity, private PaaS networking, geo-zone storage redundancy, and governance locks into a cohesive production blueprint.',
    synthesisRule:
      'Match every business constraint (SLA, compliance, cost, management overhead) to the exact Azure service tier without over-provisioning.',
  },
};

export const AdaptiveQuizView: React.FC<AdaptiveQuizViewProps> = ({
  questions,
  stats,
  onUpdateStats,
  onNavigateToHistory,
  onNavigateToPractice,
  onOpenPersonalizedReview,
  onSelectModuleForPractice,
  initialFocusPathId = null,
  initialFocusModuleId = null,
}) => {
  const SESSION_LENGTH = 10;

  // Active question index in session
  const [sessionQuestionIndex, setSessionQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number>(0);
  const [sessionMissedQuestions, setSessionMissedQuestions] = useState<QuizSessionMissedQuestion[]>([]);
  const [sessionAttemptLog, setSessionAttemptLog] = useState<SessionAttemptItem[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [sessionStartTime] = useState<number>(Date.now());
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
  const [focusedWeakModuleFilter, setFocusedWeakModuleFilter] = useState<number[] | null>(
    initialFocusModuleId ? [initialFocusModuleId] : null
  );

  // Per-Module Adaptive Learning Path State (Tracks consecutive incorrect -> Foundational Remediation Lock; consecutive correct -> Advanced Scenario Escalation)
  const [moduleStates, setModuleStates] = useState<Record<number, ModuleAdaptiveState>>(() => {
    const initial: Record<number, ModuleAdaptiveState> = {};
    for (let m = 1; m <= 12; m++) {
      const mStats = stats.moduleMastery[m] || { correct: 0, total: 0 };
      const acc = mStats.total > 0 ? Math.round((mStats.correct / mStats.total) * 100) : null;
      let mode: 'remediation' | 'standard' | 'advanced' = 'standard';
      let remediationRemaining = 0;
      if (acc !== null && mStats.total >= 2 && acc < 55) {
        mode = 'remediation';
        remediationRemaining = 2;
      } else if (acc !== null && mStats.total >= 2 && acc >= 80) {
        mode = 'advanced';
      }
      initial[m] = {
        moduleId: m,
        consecutiveCorrect: mode === 'advanced' ? 2 : 0,
        consecutiveIncorrect: mode === 'remediation' ? 2 : 0,
        mode,
        remediationTargetRemaining: remediationRemaining,
      };
    }
    return initial;
  });

  // Active Module Lock when a user consistently misses questions in a module (holds them in that module with foundational explanations & targeted practice before moving on)
  const [lockedRemediationModuleId, setLockedRemediationModuleId] = useState<number | null>(null);
  const [activeEscalatedModuleId, setActiveEscalatedModuleId] = useState<number | null>(null);
  const [showFoundationalPrimerExpanded, setShowFoundationalPrimerExpanded] = useState<boolean>(true);
  const [adaptiveTransitionBanner, setAdaptiveTransitionBanner] = useState<{
    type: 'remediation' | 'advanced' | 'graduated';
    moduleId: number;
    moduleTitle: string;
    message: string;
  } | null>(null);

  // Rolling-Average Adaptive Difficulty State (Starts at Medium / 'Intermediate')
  const ROLLING_WINDOW_SIZE = 4;
  const [rollingOutcomes, setRollingOutcomes] = useState<boolean[]>([]);
  const [rollingDifficulty, setRollingDifficulty] = useState<
    'Fundamental' | 'Intermediate' | 'Advanced'
  >('Intermediate');

  // Learning Path Focus Selection & Confirmation State
  const [pendingPathFocus, setPendingPathFocus] = useState<1 | 2 | 3>(initialFocusPathId || 1);
  const [confirmedPathFocus, setConfirmedPathFocus] = useState<1 | 2 | 3 | null>(
    initialFocusPathId
  );
  const [showPathSelectorPanel, setShowPathSelectorPanel] = useState<boolean>(false);

  const rollingAvgPercent = useMemo(() => {
    if (rollingOutcomes.length === 0) return null;
    const correctCount = rollingOutcomes.filter(Boolean).length;
    return Math.round((correctCount / rollingOutcomes.length) * 100);
  }, [rollingOutcomes]);

  // Current session questions list generated adaptively
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [adaptiveReasons, setAdaptiveReasons] = useState<string[]>([]);

  // Function to adaptively pick the next best question based on module remediation lock, excelling escalation, or weak module priority
  const pickNextAdaptiveQuestion = (
    currentUsed: Set<string>,
    currentStats: UserStats,
    overrideModules?: number[] | null,
    targetDifficulty: 'Fundamental' | 'Intermediate' | 'Advanced' = rollingDifficulty,
    targetLearningPath: 1 | 2 | 3 | null = confirmedPathFocus,
    currentModStates: Record<number, ModuleAdaptiveState> = moduleStates,
    remediationLockModId: number | null = lockedRemediationModuleId,
    escalatedModId: number | null = activeEscalatedModuleId
  ): { question: Question; reason: string } | null => {
    // CASE A: User is locked into Foundational Remediation for a specific module before moving on
    if (remediationLockModId !== null) {
      const modQuestions = questions.filter(
        (q) => q.moduleId === remediationLockModId && !currentUsed.has(q.id)
      );
      const fundamentalPool = modQuestions.filter((q) => q.difficulty === 'Fundamental');
      const intermediatePool = modQuestions.filter((q) => q.difficulty === 'Intermediate');
      const pool =
        fundamentalPool.length > 0
          ? fundamentalPool
          : intermediatePool.length > 0
          ? intermediatePool
          : modQuestions.length > 0
          ? modQuestions
          : questions.filter((q) => q.moduleId === remediationLockModId);

      if (pool.length > 0) {
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        const remLeft = currentModStates[remediationLockModId]?.remediationTargetRemaining || 1;
        return {
          question: chosen,
          reason: `Foundational Remediation Lock (M${chosen.moduleId}: ${chosen.moduleTitle}) • Targeted ${chosen.difficulty} Practice (${remLeft} more to master before moving on)`,
        };
      }
    }

    // CASE B: User just excelled in a module -> Introduce challenging Scenario-Based Advanced question within that module before moving on
    if (escalatedModId !== null) {
      const advInModule = questions.filter(
        (q) =>
          q.moduleId === escalatedModId &&
          q.difficulty === 'Advanced' &&
          !currentUsed.has(q.id)
      );
      const interInModule = questions.filter(
        (q) =>
          q.moduleId === escalatedModId &&
          q.difficulty === 'Intermediate' &&
          !currentUsed.has(q.id)
      );
      const escPool = advInModule.length > 0 ? advInModule : interInModule;
      if (escPool.length > 0) {
        const chosen = escPool[Math.floor(Math.random() * escPool.length)];
        return {
          question: chosen,
          reason: `Advanced Scenario Escalation (M${chosen.moduleId}: ${chosen.moduleTitle}) • Excelling in module — testing complex multi-service scenario synthesis`,
        };
      }
    }

    // CASE C: Standard Adaptive Learning Path Selection
    const moduleConfidenceMap: Record<number, number> = {};
    const strugglingModules: number[] = [];
    const intermediateModules: number[] = [];
    const masteredModules: number[] = [];

    const activePaths =
      targetLearningPath !== null
        ? LEARNING_PATHS.filter((p) => p.id === targetLearningPath)
        : LEARNING_PATHS;

    activePaths.forEach((path) => {
      path.modules.forEach((mod) => {
        const mastery = currentStats.moduleMastery[mod.id] || { correct: 0, total: 0 };
        const conf = mastery.total > 0 ? Math.round((mastery.correct / mastery.total) * 100) : 0;
        moduleConfidenceMap[mod.id] = conf;

        if (currentModStates[mod.id]?.mode === 'remediation' || mastery.total === 0 || conf < 65) {
          strugglingModules.push(mod.id);
        } else if (conf < 80) {
          intermediateModules.push(mod.id);
        } else {
          masteredModules.push(mod.id);
        }
      });
    });

    const roll = Math.random();
    let targetPool: number[] = [];
    let priorityLabel = '';

    if (overrideModules && overrideModules.length > 0) {
      targetPool = overrideModules;
      priorityLabel = 'Targeted Module Focus';
    } else if (roll < 0.65 && strugglingModules.length > 0) {
      targetPool = strugglingModules;
      priorityLabel = 'Foundational Focus (Developing Module)';
    } else if (roll < 0.9 && intermediateModules.length > 0) {
      targetPool = intermediateModules;
      priorityLabel = 'Reinforcement Focus (Building Mastery)';
    } else if (masteredModules.length > 0) {
      targetPool = masteredModules;
      priorityLabel = 'Advanced Scenario Challenge (High Mastery Module)';
    } else {
      targetPool =
        strugglingModules.length > 0
          ? strugglingModules
          : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      priorityLabel = 'Core Azure Curriculum Objective';
    }

    const sortedPool = [...targetPool].sort(
      (a, b) => (moduleConfidenceMap[a] ?? 0) - (moduleConfidenceMap[b] ?? 0)
    );
    const targetModuleId =
      sortedPool.length > 1 && Math.random() < 0.65
        ? sortedPool[0]
        : sortedPool[Math.floor(Math.random() * sortedPool.length)];

    const modAdaptiveMode = currentModStates[targetModuleId]?.mode || 'standard';
    const effectiveDiff: 'Fundamental' | 'Intermediate' | 'Advanced' =
      modAdaptiveMode === 'remediation'
        ? 'Fundamental'
        : modAdaptiveMode === 'advanced'
        ? 'Advanced'
        : targetDifficulty;

    let availableQuestions = questions.filter(
      (q) => q.moduleId === targetModuleId && !currentUsed.has(q.id)
    );

    if (availableQuestions.length === 0) {
      availableQuestions = questions.filter(
        (q) =>
          (targetLearningPath === null || q.learningPathId === targetLearningPath) &&
          !currentUsed.has(q.id)
      );
    }
    if (availableQuestions.length === 0) {
      availableQuestions = questions.filter((q) => !currentUsed.has(q.id));
    }
    if (availableQuestions.length === 0) {
      availableQuestions = questions;
    }

    const difficultyMatchedPool = availableQuestions.filter(
      (q) => q.difficulty === effectiveDiff
    );
    const candidatePool =
      difficultyMatchedPool.length > 0 ? difficultyMatchedPool : availableQuestions;

    const previouslyMissedInPool = candidatePool.filter((q) => {
      const qAttempts = currentStats.attempts?.[q.id] || [];
      if (qAttempts.length === 0) return false;
      const latest = [...qAttempts].sort((a, b) => b.timestamp - a.timestamp)[0];
      return !latest.isCorrect;
    });

    const unattemptedInPool = candidatePool.filter(
      (q) => !currentStats.attempts?.[q.id] || currentStats.attempts[q.id].length === 0
    );

    let selected: Question;
    let conceptNote = priorityLabel;

    if (previouslyMissedInPool.length > 0) {
      selected =
        previouslyMissedInPool[Math.floor(Math.random() * previouslyMissedInPool.length)];
      conceptNote = 'Previously Missed Concept Remediation';
    } else if (unattemptedInPool.length > 0 && Math.random() < 0.75) {
      selected = unattemptedInPool[Math.floor(Math.random() * unattemptedInPool.length)];
      conceptNote = `${priorityLabel} • Unseen Scenario`;
    } else {
      selected = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    }

    const currentModConf = moduleConfidenceMap[selected.moduleId] ?? 0;
    const diffLabel =
      selected.difficulty === 'Fundamental'
        ? 'Foundational'
        : selected.difficulty === 'Intermediate'
        ? 'Intermediate'
        : 'Advanced Scenario';
    const reasonText = `M${selected.moduleId}: ${selected.moduleTitle} (${diffLabel} • Module Mastery: ${currentModConf}% • ${conceptNote})`;

    return { question: selected, reason: reasonText };
  };

  // Initialize first question on mount
  useEffect(() => {
    if (sessionQuestions.length === 0 && questions.length > 0) {
      const firstPick = pickNextAdaptiveQuestion(
        usedQuestionIds,
        stats,
        focusedWeakModuleFilter,
        rollingDifficulty,
        confirmedPathFocus,
        moduleStates,
        lockedRemediationModuleId,
        activeEscalatedModuleId
      );
      if (firstPick) {
        setSessionQuestions([firstPick.question]);
        setAdaptiveReasons([firstPick.reason]);
        setUsedQuestionIds(new Set([firstPick.question.id]));
      }
    }
  }, [questions, stats, focusedWeakModuleFilter]);

  const currentQuestion = sessionQuestions[sessionQuestionIndex];
  const currentReason =
    adaptiveReasons[sessionQuestionIndex] ||
    'Dynamically calibrated for your current module mastery level';

  const currentModuleState: ModuleAdaptiveState = useMemo(() => {
    if (!currentQuestion) {
      return {
        moduleId: 1,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        mode: 'standard',
        remediationTargetRemaining: 0,
      };
    }
    return (
      moduleStates[currentQuestion.moduleId] || {
        moduleId: currentQuestion.moduleId,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        mode: 'standard',
        remediationTargetRemaining: 0,
      }
    );
  }, [currentQuestion, moduleStates]);

  // Foundational Study Guide for the current module (from CURRICULUM_STUDY_MODULES)
  const currentModuleStudyGuide: StudyModuleGuide | undefined = useMemo(() => {
    if (!currentQuestion) return undefined;
    return CURRICULUM_STUDY_MODULES.find((m) => m.moduleId === currentQuestion.moduleId);
  }, [currentQuestion]);

  // Current module confidence percentage
  const currentModuleConfidence = useMemo(() => {
    if (!currentQuestion) return 0;
    const mastery = stats.moduleMastery[currentQuestion.moduleId] || { correct: 0, total: 0 };
    return mastery.total > 0 ? Math.round((mastery.correct / mastery.total) * 100) : 0;
  }, [currentQuestion, stats.moduleMastery]);

  const handleSelectOption = (letter: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(letter);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || isAnswerSubmitted || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const modId = currentQuestion.moduleId;
    const prevModState = moduleStates[modId] || {
      moduleId: modId,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      mode: 'standard',
      remediationTargetRemaining: 0,
    };

    setIsAnswerSubmitted(true);
    setSessionAttemptLog((prev) => [
      ...prev,
      {
        question: currentQuestion,
        selectedAnswer,
        isCorrect,
        adaptiveStage: prevModState.mode,
      },
    ]);

    // Update Per-Module Adaptive State (Remediation vs. Advanced Escalation)
    let nextMode = prevModState.mode;
    let nextConsecCorrect = isCorrect ? prevModState.consecutiveCorrect + 1 : 0;
    let nextConsecIncorrect = isCorrect ? 0 : prevModState.consecutiveIncorrect + 1;
    let nextRemediationRemaining = prevModState.remediationTargetRemaining;

    if (!isCorrect) {
      // If user misses a question in this module (or misses >= 1 when already struggling / >= 2 consecutive), trigger Foundational Remediation Lock
      const mStats = stats.moduleMastery[modId] || { correct: 0, total: 0 };
      const modAcc = mStats.total > 0 ? (mStats.correct / mStats.total) * 100 : 50;
      if (nextConsecIncorrect >= 1 && (prevModState.mode === 'remediation' || nextConsecIncorrect >= 2 || modAcc < 65)) {
        nextMode = 'remediation';
        nextRemediationRemaining = Math.max(2, prevModState.remediationTargetRemaining + 1);
        setLockedRemediationModuleId(modId);
        setActiveEscalatedModuleId(null);
        setShowFoundationalPrimerExpanded(true);
        setAdaptiveTransitionBanner({
          type: 'remediation',
          moduleId: modId,
          moduleTitle: currentQuestion.moduleTitle,
          message: `Foundational Remediation Activated for Module ${modId} (${currentQuestion.moduleTitle}): Providing foundational concept explanations and ${nextRemediationRemaining} targeted practice questions before moving on.`,
        });
      } else {
        // First miss in a strong module drops from advanced to standard
        nextMode = 'standard';
        setActiveEscalatedModuleId(null);
      }
    } else {
      // User answered correctly!
      if (prevModState.mode === 'remediation') {
        nextRemediationRemaining = Math.max(0, prevModState.remediationTargetRemaining - 1);
        if (nextRemediationRemaining === 0) {
          nextMode = 'standard';
          setLockedRemediationModuleId(null);
          setAdaptiveTransitionBanner({
            type: 'graduated',
            moduleId: modId,
            moduleTitle: currentQuestion.moduleTitle,
            message: `Module ${modId} Remediation Completed! You mastered the foundational concepts and unlocked progression to the next module & higher difficulty.`,
          });
        }
      } else if (nextConsecCorrect >= 2 || (nextConsecCorrect >= 1 && currentModuleConfidence >= 75)) {
        // User excels in this module -> Escalate to Advanced Scenario-Based Questions & Advanced Topics!
        nextMode = 'advanced';
        setActiveEscalatedModuleId(modId);
        setLockedRemediationModuleId(null);
        setAdaptiveTransitionBanner({
          type: 'advanced',
          moduleId: modId,
          moduleTitle: currentQuestion.moduleTitle,
          message: `Excelling in Module ${modId} (${currentQuestion.moduleTitle})! Introducing challenging multi-service scenario-based questions and advanced architectural topics.`,
        });
      }
    }

    setModuleStates((prev) => ({
      ...prev,
      [modId]: {
        moduleId: modId,
        consecutiveCorrect: nextConsecCorrect,
        consecutiveIncorrect: nextConsecIncorrect,
        mode: nextMode,
        remediationTargetRemaining: nextRemediationRemaining,
      },
    }));

    if (isCorrect) {
      setSessionCorrectCount((prev) => prev + 1);
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0078D4', '#10B981', '#38BDF8'],
      });
    } else {
      const selectedOptionObj = currentQuestion.options.find((o) => o.letter === selectedAnswer);
      const correctOptionObj = currentQuestion.options.find(
        (o) => o.letter === currentQuestion.correctAnswer
      );

      const missedEntry: QuizSessionMissedQuestion = {
        questionId: currentQuestion.id,
        scenario: currentQuestion.scenario,
        question: currentQuestion.question,
        selectedAnswer,
        selectedAnswerText: selectedOptionObj
          ? `${selectedOptionObj.letter}: ${selectedOptionObj.text}`
          : selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        correctAnswerText: correctOptionObj
          ? `${correctOptionObj.letter}: ${correctOptionObj.text}`
          : currentQuestion.correctAnswer,
        whyCorrect: currentQuestion.whyCorrect,
        examTip: currentQuestion.examTip,
        moduleId: currentQuestion.moduleId,
        moduleTitle: currentQuestion.moduleTitle,
        learningPathTitle: currentQuestion.learningPathTitle,
      };

      setSessionMissedQuestions((prev) => [...prev, missedEntry]);
    }

    // Update rolling window of recent answers in current session and adjust difficulty dynamically
    const nextWindow = [...rollingOutcomes, isCorrect].slice(-ROLLING_WINDOW_SIZE);
    setRollingOutcomes(nextWindow);
    const nextAvg = Math.round((nextWindow.filter(Boolean).length / nextWindow.length) * 100);

    if (nextWindow.length >= 2) {
      if (nextAvg >= 75) {
        setRollingDifficulty((prev) =>
          prev === 'Fundamental' ? 'Intermediate' : 'Advanced'
        );
      } else if (nextAvg <= 40) {
        setRollingDifficulty((prev) =>
          prev === 'Advanced' ? 'Intermediate' : 'Fundamental'
        );
      } else if (nextWindow.length >= 3) {
        setRollingDifficulty('Intermediate');
      }
    }

    // Save attempt to global stats immediately
    const attempt: QuestionAttempt = {
      questionId: currentQuestion.id,
      moduleId: currentQuestion.moduleId,
      pathId: currentQuestion.learningPathId,
      selectedAnswer,
      isCorrect,
      timestamp: Date.now(),
      trapType: currentQuestion.errorDiagnostic?.trapType || 'Conceptual Gap',
    };

    const updatedStats = saveUserAttempt(stats, attempt);
    onUpdateStats(updatedStats);
  };

  const handleNextQuestion = () => {
    const nextIndex = sessionQuestionIndex + 1;

    if (nextIndex >= SESSION_LENGTH) {
      finishSession();
      return;
    }

    // If we already served an escalated advanced question in activeEscalatedModuleId, allow moving on after 1 escalated question
    const currentQMod = currentQuestion?.moduleId;
    const nextEscalatedModId =
      activeEscalatedModuleId === currentQMod && currentQuestion?.difficulty === 'Advanced'
        ? null
        : activeEscalatedModuleId;
    if (nextEscalatedModId !== activeEscalatedModuleId) {
      setActiveEscalatedModuleId(nextEscalatedModId);
    }

    const nextPick = pickNextAdaptiveQuestion(
      usedQuestionIds,
      stats,
      focusedWeakModuleFilter,
      rollingDifficulty,
      confirmedPathFocus,
      moduleStates,
      lockedRemediationModuleId,
      nextEscalatedModId
    );
    if (nextPick) {
      setSessionQuestions((prev) => [...prev, nextPick.question]);
      setAdaptiveReasons((prev) => [...prev, nextPick.reason]);
      setUsedQuestionIds((prev) => new Set([...prev, nextPick.question.id]));
      setSessionQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      finishSession();
    }
  };

  // Manual trigger to force Foundational Remediation or Advanced Scenario Escalation on any module
  const handleTriggerModuleAdaptiveMode = (
    targetModId: number,
    targetMode: 'remediation' | 'advanced'
  ) => {
    const modInfo = LEARNING_PATHS.flatMap((p) => p.modules).find((m) => m.id === targetModId);
    const nextModStates: Record<number, ModuleAdaptiveState> = {
      ...moduleStates,
      [targetModId]: {
        moduleId: targetModId,
        consecutiveCorrect: targetMode === 'advanced' ? 2 : 0,
        consecutiveIncorrect: targetMode === 'remediation' ? 2 : 0,
        mode: targetMode,
        remediationTargetRemaining: targetMode === 'remediation' ? 2 : 0,
      },
    };
    setModuleStates(nextModStates);
    const nextRemediationLock = targetMode === 'remediation' ? targetModId : null;
    const nextEscalated = targetMode === 'advanced' ? targetModId : null;
    setLockedRemediationModuleId(nextRemediationLock);
    setActiveEscalatedModuleId(nextEscalated);
    setFocusedWeakModuleFilter([targetModId]);
    setShowFoundationalPrimerExpanded(true);

    setAdaptiveTransitionBanner({
      type: targetMode,
      moduleId: targetModId,
      moduleTitle: modInfo?.title || `Module ${targetModId}`,
      message:
        targetMode === 'remediation'
          ? `Foundational Remediation Activated for Module ${targetModId}: Displaying foundational explanations and targeted Fundamental practice questions before moving on.`
          : `Advanced Scenario Escalation Activated for Module ${targetModId}: Presenting challenging multi-service scenario questions and advanced topics.`,
    });

    const pick = pickNextAdaptiveQuestion(
      usedQuestionIds,
      stats,
      [targetModId],
      targetMode === 'remediation' ? 'Fundamental' : 'Advanced',
      confirmedPathFocus,
      nextModStates,
      nextRemediationLock,
      nextEscalated
    );
    if (pick) {
      const updatedQuestions = [...sessionQuestions];
      const updatedReasons = [...adaptiveReasons];
      if (!isAnswerSubmitted) {
        updatedQuestions[sessionQuestionIndex] = pick.question;
        updatedReasons[sessionQuestionIndex] = pick.reason;
        setSessionQuestions(updatedQuestions);
        setAdaptiveReasons(updatedReasons);
      } else {
        setSessionQuestions((prev) => [...prev, pick.question]);
        setAdaptiveReasons((prev) => [...prev, pick.reason]);
        setSessionQuestionIndex((prev) => prev + 1);
      }
      setUsedQuestionIds((prev) => new Set([...prev, pick.question.id]));
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    }
  };

  const finishSession = () => {
    setIsSessionComplete(true);
    const totalCount = Math.max(1, sessionAttemptLog.length || SESSION_LENGTH);
    const scorePercent = Math.round((sessionCorrectCount / totalCount) * 100);
    const passed = scorePercent >= 70;
    const duration = Math.round((Date.now() - sessionStartTime) / 1000);

    const sessionRecord: QuizSessionRecord = {
      id: `session-adaptive-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      title: `Adaptive Learning Path Sprint (${totalCount} Questions)`,
      mode: 'adaptive',
      totalQuestions: totalCount,
      correctCount: sessionCorrectCount,
      scorePercent,
      passed,
      durationSeconds: duration,
      missedQuestions: sessionMissedQuestions,
    };

    saveQuizSession(sessionRecord);

    if (passed) {
      confetti({
        particleCount: 70,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#0078D4', '#10B981', '#F59E0B'],
      });
    }
  };

  const handleRestartSession = (
    targetWeakModules?: number[] | null,
    overridePathFocus?: 1 | 2 | 3 | null
  ) => {
    const nextPathFocus =
      overridePathFocus !== undefined ? overridePathFocus : confirmedPathFocus;
    setConfirmedPathFocus(nextPathFocus);
    setFocusedWeakModuleFilter(targetWeakModules ?? null);
    setLockedRemediationModuleId(null);
    setActiveEscalatedModuleId(null);
    setAdaptiveTransitionBanner(null);
    setRollingOutcomes([]);
    setRollingDifficulty('Intermediate');
    setSessionQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setSessionCorrectCount(0);
    setSessionMissedQuestions([]);
    setSessionAttemptLog([]);
    setIsSessionComplete(false);

    const freshUsed = new Set<string>();
    const firstPick = pickNextAdaptiveQuestion(
      freshUsed,
      stats,
      targetWeakModules ?? null,
      'Intermediate',
      nextPathFocus,
      moduleStates,
      null,
      null
    );
    if (firstPick) {
      setSessionQuestions([firstPick.question]);
      setAdaptiveReasons([firstPick.reason]);
      setUsedQuestionIds(new Set([firstPick.question.id]));
    } else {
      setSessionQuestions([]);
      setAdaptiveReasons([]);
      setUsedQuestionIds(new Set());
    }
    setShowPathSelectorPanel(false);
  };

  // Session Complete View
  if (isSessionComplete) {
    const totalAnswered = Math.max(1, sessionAttemptLog.length || SESSION_LENGTH);
    const scorePercent = Math.round((sessionCorrectCount / totalAnswered) * 100);
    const passed = scorePercent >= 70;

    const pathSummaries = LEARNING_PATHS.map((path) => {
      const pathSessionAttempts = sessionAttemptLog.filter(
        (item) => item.question.learningPathId === path.id
      );
      const sessionTotal = pathSessionAttempts.length;
      const sessionCorrect = pathSessionAttempts.filter((i) => i.isCorrect).length;
      const sessionPct =
        sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : null;

      let cumulativeCorrect = 0;
      let cumulativeTotal = 0;
      path.modules.forEach((m) => {
        const modStats = stats.moduleMastery[m.id] || { correct: 0, total: 0 };
        cumulativeCorrect += modStats.correct;
        cumulativeTotal += modStats.total;
      });
      const cumulativePct =
        cumulativeTotal > 0 ? Math.round((cumulativeCorrect / cumulativeTotal) * 100) : 0;

      return {
        pathId: path.id,
        title: path.title,
        weight: path.examWeight,
        sessionCorrect,
        sessionTotal,
        sessionPct,
        cumulativePct,
        cumulativeTotal,
      };
    });

    const allModulesSummary = LEARNING_PATHS.flatMap((path) =>
      path.modules.map((mod) => {
        const modSessionAttempts = sessionAttemptLog.filter(
          (item) => item.question.moduleId === mod.id
        );
        const sessionTotal = modSessionAttempts.length;
        const sessionCorrect = modSessionAttempts.filter((i) => i.isCorrect).length;
        const sessionPct =
          sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : null;

        const overallMastery = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
        const overallPct =
          overallMastery.total > 0
            ? Math.round((overallMastery.correct / overallMastery.total) * 100)
            : 0;

        const isWeak =
          (sessionPct !== null && sessionPct < 70) ||
          (overallMastery.total > 0 && overallPct < 65) ||
          overallMastery.total === 0;

        return {
          moduleId: mod.id,
          title: mod.title,
          pathId: path.id,
          sessionCorrect,
          sessionTotal,
          sessionPct,
          overallPct,
          overallTotal: overallMastery.total,
          isWeak,
        };
      })
    );

    const testedModulesInSession = allModulesSummary.filter((m) => m.sessionTotal > 0);
    const prioritizedWeakModules = allModulesSummary
      .filter(
        (m) =>
          (m.sessionPct !== null && m.sessionPct < 70) ||
          (m.overallTotal > 0 && m.overallPct < 65)
      )
      .sort((a, b) => (a.sessionPct ?? a.overallPct) - (b.sessionPct ?? b.overallPct));

    const weakModuleIdsForNextSprint =
      prioritizedWeakModules.length > 0
        ? prioritizedWeakModules.map((m) => m.moduleId)
        : allModulesSummary.filter((m) => m.isWeak).map((m) => m.moduleId);

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#0078D4] to-blue-600 text-white flex items-center justify-center shadow-md">
              <Zap className="w-8 h-8 text-amber-300" />
            </div>

            <div className="space-y-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  passed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {passed ? 'Passed Adaptive Benchmark (70%+)' : 'Foundational Remediation Queued'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Adaptive Learning Path Session Summary
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                Your module-level accuracy has been calibrated. Weak modules automatically unlock foundational concept primers and targeted practice, while mastered modules escalate to multi-service scenario challenges.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  Session Score
                </span>
                <span className="text-3xl font-black text-[#0078D4] mt-1 block tabular-nums">
                  {scorePercent}%
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  Correct
                </span>
                <span className="text-3xl font-black text-emerald-600 mt-1 block tabular-nums">
                  {sessionCorrectCount} / {totalAnswered}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  Remediation Modules
                </span>
                <span className="text-3xl font-black text-amber-600 mt-1 block tabular-nums">
                  {prioritizedWeakModules.length}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Performance Summary by Learning Path */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0078D4]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Performance by Learning Path (Paths 1–3)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Session Accuracy &amp; Overall Domain Mastery
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {pathSummaries.map((p) => {
                const displayPct = p.sessionPct !== null ? p.sessionPct : p.cumulativePct;
                const isPathStrong = displayPct >= 70;
                return (
                  <div
                    key={p.pathId}
                    className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-50 text-[#0078D4] border border-blue-200">
                          Path {p.pathId} ({p.weight})
                        </span>
                        <span
                          className={`text-xs font-black tabular-nums ${
                            p.sessionPct === null
                              ? 'text-slate-500'
                              : isPathStrong
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {p.sessionPct !== null
                            ? `${p.sessionPct}% (${p.sessionCorrect}/${p.sessionTotal})`
                            : 'Not Tested in Sprint'}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-800 mt-2 line-clamp-2">
                        {p.title}
                      </h4>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPathStrong ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(6, displayPct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span>Overall Mastery: {p.cumulativePct}%</span>
                        <span>{p.cumulativeTotal} total attempts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Performance Summary by Module & Adaptive Next-Session Prioritization */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Module Adaptive Calibration (Remediation vs. Advanced Escalation)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-amber-900">
                Weak modules receive foundational explanations &amp; targeted drills
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(testedModulesInSession.length > 0
                ? testedModulesInSession
                : allModulesSummary.slice(0, 6)
              ).map((mod) => {
                const accuracy = mod.sessionPct ?? mod.overallPct;
                const needsFocus = accuracy < 70;
                const isExcelling = accuracy >= 80;
                return (
                  <div
                    key={mod.moduleId}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 ${
                      needsFocus
                        ? 'bg-amber-50/50 border-amber-300/90'
                        : 'bg-emerald-50/30 border-emerald-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                            Path {mod.pathId} • M{mod.moduleId}
                          </span>
                          {needsFocus ? (
                            <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                              Foundational Remediation Queued
                            </span>
                          ) : isExcelling ? (
                            <span className="text-[10px] font-extrabold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-300">
                              Advanced Scenarios Unlocked
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                              Proficient
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1.5">{mod.title}</h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-sm font-black block tabular-nums ${
                            needsFocus ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {mod.sessionPct !== null ? `${mod.sessionPct}%` : `${mod.overallPct}%`}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {mod.sessionTotal > 0
                            ? `${mod.sessionCorrect}/${mod.sessionTotal} this session`
                            : `Overall (${mod.overallTotal} Qs)`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-600 font-medium">
                        Overall Confidence: <strong>{mod.overallPct}%</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSessionComplete(false);
                            handleTriggerModuleAdaptiveMode(
                              mod.moduleId,
                              needsFocus ? 'remediation' : 'advanced'
                            );
                          }}
                          className="text-[#0078D4] hover:underline font-extrabold flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>
                            {needsFocus
                              ? `Remediate M${mod.moduleId}`
                              : `Advanced M${mod.moduleId}`}
                          </span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-2">
            {weakModuleIdsForNextSprint.length > 0 && (
              <button
                onClick={() => handleRestartSession(weakModuleIdsForNextSprint)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>
                  Start Targeted Remediation Sprint ({weakModuleIdsForNextSprint.length} Weak Module
                  {weakModuleIdsForNextSprint.length === 1 ? '' : 's'})
                </span>
              </button>
            )}

            {onOpenPersonalizedReview && sessionMissedQuestions.length > 0 && (
              <button
                onClick={onOpenPersonalizedReview}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Review Missed Questions ({sessionMissedQuestions.length} Wrong)</span>
              </button>
            )}

            <button
              onClick={() => handleRestartSession(null)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Balanced Adaptive Sprint</span>
            </button>

            <button
              onClick={onNavigateToHistory}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#0078D4]" />
              <span>Full History</span>
            </button>

            <button
              onClick={onNavigateToPractice}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Back to Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-[#0078D4] border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-slate-500 mt-3">Calibrating next adaptive question...</p>
      </div>
    );
  }

  const isRemediationActiveForCurrentMod =
    lockedRemediationModuleId === currentQuestion.moduleId ||
    currentModuleState.mode === 'remediation';
  const isAdvancedEscalationForCurrentMod =
    activeEscalatedModuleId === currentQuestion.moduleId ||
    currentModuleState.mode === 'advanced' ||
    currentQuestion.difficulty === 'Advanced';

  const advancedTopicInfo =
    ADVANCED_MODULE_TOPICS[currentQuestion.moduleId] || ADVANCED_MODULE_TOPICS[12];

  return (
    <div className="w-full max-w-6xl mx-auto min-w-0 space-y-5">
      {/* Real-time Adaptive Learning Path Engine Radar Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-[#003E73] to-[#0078D4] text-white rounded-2xl p-4 sm:p-6 shadow-md border border-blue-400/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs text-amber-300 shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black text-base sm:text-lg tracking-tight text-white">
                  Adaptive Learning Path &amp; Module Progression Engine
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  Real-Time Calibration
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                Struggling in a module unlocks foundational explanations &amp; targeted practice before moving on; excelling unlocks advanced scenario challenges.
              </p>
            </div>
          </div>

          {/* Sprint Progress */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-xs text-sky-200 block font-medium">Sprint Progress</span>
              <span className="text-lg font-black text-white tabular-nums">
                {sessionQuestionIndex + 1}{' '}
                <span className="text-xs font-normal text-sky-200">/ {SESSION_LENGTH}</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center font-bold text-xs text-white tabular-nums">
              {Math.round(((sessionQuestionIndex + 1) / SESSION_LENGTH) * 100)}%
            </div>
          </div>
        </div>

        {/* Interactive 12-Module Adaptive Path Status Matrix */}
        <div className="p-3 rounded-xl bg-black/25 border border-white/10 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="font-extrabold uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              <span>Interactive Module Adaptive States (Click any module to calibrate):</span>
            </span>
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-sky-100">
              <span>• Amber = Foundational Remediation</span>
              <span>• Sky = Core Calibration</span>
              <span>• Emerald/Purple = Advanced Scenarios</span>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {LEARNING_PATHS.flatMap((p) => p.modules).map((mod) => {
              const mState = moduleStates[mod.id] || {
                moduleId: mod.id,
                mode: 'standard',
                remediationTargetRemaining: 0,
              };
              const isCurrent = currentQuestion.moduleId === mod.id;
              const isLockedRem = lockedRemediationModuleId === mod.id;
              const mastery = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
              const pct =
                mastery.total > 0 ? Math.round((mastery.correct / mastery.total) * 100) : null;

              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() =>
                    handleTriggerModuleAdaptiveMode(
                      mod.id,
                      mState.mode === 'remediation'
                        ? 'advanced'
                        : mState.mode === 'advanced'
                        ? 'remediation'
                        : pct !== null && pct >= 75
                        ? 'advanced'
                        : 'remediation'
                    )
                  }
                  className={`px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'ring-2 ring-amber-300 bg-white text-slate-950 border-white font-black'
                      : mState.mode === 'remediation' || isLockedRem
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
                      : mState.mode === 'advanced'
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30'
                      : 'bg-white/10 border-white/15 text-sky-100 hover:bg-white/20'
                  }`}
                  title={`Module ${mod.id}: ${mod.title} • Mode: ${mState.mode.toUpperCase()}${
                    pct !== null ? ` • Accuracy: ${pct}%` : ''
                  } (Click to switch between Foundational Remediation & Advanced Scenario mode)`}
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] font-black">
                    <span>M{mod.id}</span>
                    {isLockedRem ? (
                      <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                    ) : mState.mode === 'advanced' ? (
                      <Flame className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    ) : null}
                  </div>
                  <div className="text-[9px] truncate opacity-85 tabular-nums">
                    {pct !== null ? `${pct}%` : mState.mode === 'remediation' ? 'Remediate' : 'Core'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Question Rationale + Adaptive Mode Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-black/25 text-xs text-blue-50 border border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-medium truncate">{currentReason}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                handleTriggerModuleAdaptiveMode(currentQuestion.moduleId, 'remediation')
              }
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 ${
                isRemediationActiveForCurrentMod
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-amber-200 border-white/20'
              }`}
              title="Activate Foundational Explanations & Targeted Fundamental Practice for this module"
            >
              <BookOpen className="w-3 h-3" />
              <span>Foundational Mode</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerModuleAdaptiveMode(currentQuestion.moduleId, 'advanced')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 ${
                isAdvancedEscalationForCurrentMod
                  ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                  : 'bg-white/10 hover:bg-white/20 text-emerald-200 border-white/20'
              }`}
              title="Escalate to Challenging Scenario-Based Questions & Advanced Topics in this module"
            >
              <Flame className="w-3 h-3" />
              <span>Advanced Scenarios</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPathSelectorPanel((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] border border-white/20 transition-colors cursor-pointer"
            >
              {confirmedPathFocus
                ? `Focus: Path ${confirmedPathFocus} (Change)`
                : 'Filter Learning Path'}
            </button>
          </div>
        </div>

        {/* Learning Path Focus Selector Panel */}
        {showPathSelectorPanel && (
          <div className="p-4 rounded-xl bg-white text-slate-900 border border-blue-200 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0078D4]">
                  Select &amp; Confirm AZ-900 Learning Path Focus
                </h4>
                <p className="text-[11px] text-slate-600">
                  Scope your adaptive progression to one Learning Path or across all 3 paths.
                </p>
              </div>
              {confirmedPathFocus !== null && (
                <button
                  type="button"
                  onClick={() => handleRestartSession(null, null)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                >
                  All 3 Paths (Balanced)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {LEARNING_PATHS.map((path) => {
                const isSelected = pendingPathFocus === path.id;
                return (
                  <button
                    key={path.id}
                    type="button"
                    onClick={() => setPendingPathFocus(path.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-[#0078D4] ring-2 ring-[#0078D4]/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black text-[#0078D4]">
                      <span>PATH {path.id}</span>
                      <span className="text-slate-500">{path.examWeight}</span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 mt-1">{path.title}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                Selected Focus:{' '}
                <strong className="text-[#0078D4]">
                  {LEARNING_PATHS.find((p) => p.id === pendingPathFocus)?.title}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => handleRestartSession(null, pendingPathFocus)}
                className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>Confirm Path {pendingPathFocus} &amp; Adapt Questions</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Adaptive State Transition Notification Banner */}
      {adaptiveTransitionBanner && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 ${
            adaptiveTransitionBanner.type === 'remediation'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : adaptiveTransitionBanner.type === 'advanced'
              ? 'bg-purple-50 border-purple-300 text-purple-950'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                adaptiveTransitionBanner.type === 'remediation'
                  ? 'bg-amber-500 text-slate-950'
                  : adaptiveTransitionBanner.type === 'advanced'
                  ? 'bg-purple-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {adaptiveTransitionBanner.type === 'remediation' ? (
                <BookOpen className="w-4 h-4" />
              ) : adaptiveTransitionBanner.type === 'advanced' ? (
                <Flame className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider block">
                {adaptiveTransitionBanner.type === 'remediation'
                  ? 'Adaptive Learning Path: Foundational Module Remediation Active'
                  : adaptiveTransitionBanner.type === 'advanced'
                  ? 'Adaptive Learning Path: Advanced Scenario Escalation Active'
                  : 'Adaptive Learning Path: Foundational Remediation Mastered'}
              </span>
              <p className="text-xs font-medium mt-0.5 leading-relaxed">
                {adaptiveTransitionBanner.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {lockedRemediationModuleId !== null && (
              <button
                type="button"
                onClick={() => {
                  setLockedRemediationModuleId(null);
                  setAdaptiveTransitionBanner(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Module Gate</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setAdaptiveTransitionBanner(null)}
              className="text-xs font-bold opacity-75 hover:opacity-100 cursor-pointer px-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* FOUNDATIONAL CONCEPT PRIMER PANEL (Appears automatically when user struggles in a module or activates Foundational Mode) */}
      {isRemediationActiveForCurrentMod && currentModuleStudyGuide && (
        <div className="bg-amber-50/90 rounded-2xl border border-amber-300 p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                    Foundational Concept Primer • Module {currentModuleStudyGuide.moduleId}
                  </span>
                  {lockedRemediationModuleId === currentQuestion.moduleId && (
                    <span className="text-[10px] font-bold text-amber-800">
                      • Targeted Remediation ({currentModuleState.remediationTargetRemaining || 1} practice Qs left before moving on)
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {currentModuleStudyGuide.moduleTitle}: Core Foundations
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFoundationalPrimerExpanded((prev) => !prev)}
              className="px-3 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{showFoundationalPrimerExpanded ? 'Hide Primer' : 'Show Primer'}</span>
              {showFoundationalPrimerExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {showFoundationalPrimerExpanded && (
            <div className="space-y-3 pt-1 border-t border-amber-200/80">
              <p className="text-xs text-slate-700 leading-relaxed">
                {currentModuleStudyGuide.moduleSummary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentModuleStudyGuide.units.slice(0, 2).map((unit) => (
                  <div
                    key={unit.id}
                    className="p-3.5 rounded-xl bg-white border border-amber-200/90 space-y-2"
                  >
                    <div className="text-xs font-extrabold text-slate-900">
                      Unit {unit.unitNumber}: {unit.unitTitle}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {unit.conceptExplanation}
                    </p>
                    <div className="p-2 rounded-lg bg-sky-50/80 border border-sky-200/70 text-[11px] text-slate-800">
                      <strong className="text-[#0078D4]">Real-World Analogy:</strong>{' '}
                      {unit.simplifiedExample}
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-950">
                      <strong>Exam Takeaway:</strong> {unit.examTakeaway}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADVANCED SCENARIO & ARCHITECTURAL DEEP-DIVE PANEL (Appears when user excels in a module) */}
      {isAdvancedEscalationForCurrentMod && !isRemediationActiveForCurrentMod && (
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                  Advanced Topic &amp; Scenario Escalation • Module {currentQuestion.moduleId}
                </span>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {advancedTopicInfo.topicTitle}
                </h3>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-300">
              High Module Proficiency — Multi-Service Synthesis Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300 block">
                Architectural Scenario Challenge
              </span>
              <p className="text-slate-200 leading-relaxed">
                {advancedTopicInfo.architecturalChallenge}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                Advanced Exam Synthesis Rule
              </span>
              <p className="text-emerald-100 leading-relaxed">
                {advancedTopicInfo.synthesisRule}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Adaptive Quiz Card */}
      <div
        key={`adaptive-card-${currentQuestion.id}`}
        className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden p-4 sm:p-6 lg:p-8 space-y-6 animate-quiz-card-fade-in-up"
      >
        {/* Module Header Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-extrabold text-[#0078D4]">
              M{currentQuestion.moduleId}: {currentQuestion.moduleTitle}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={`font-extrabold ${
                currentQuestion.difficulty === 'Fundamental'
                  ? 'text-emerald-700'
                  : currentQuestion.difficulty === 'Intermediate'
                  ? 'text-[#0078D4]'
                  : 'text-purple-700'
              }`}
            >
              {currentQuestion.difficulty}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500">{currentQuestion.learningPathTitle}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Module Confidence:</span>
            <span
              className={`font-black tabular-nums ${
                currentModuleConfidence >= 70 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {currentModuleConfidence}%
            </span>
          </div>
        </div>

        {/* Scenario description */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-2">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
            Business Scenario Context
          </span>
          <p className="text-sm text-slate-800 leading-relaxed font-normal">
            {currentQuestion.scenario}
          </p>
        </div>

        {/* Question Prompt */}
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
          {currentQuestion.question}
        </h3>

        {/* Options Grid */}
        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.letter;
            const isCorrect =
              isAnswerSubmitted && option.letter === currentQuestion.correctAnswer;
            const isWrong = isAnswerSubmitted && isSelected && !isCorrect;

            let cardStyle = 'border-slate-200 hover:border-[#0078D4] hover:bg-blue-50/30';
            if (isSelected && !isAnswerSubmitted) {
              cardStyle = 'border-[#0078D4] bg-blue-50/60 ring-2 ring-[#0078D4]/20';
            } else if (isCorrect) {
              cardStyle = 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20';
            } else if (isWrong) {
              cardStyle = 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20';
            }

            return (
              <button
                key={option.letter}
                type="button"
                disabled={isAnswerSubmitted}
                onClick={() => handleSelectOption(option.letter)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${cardStyle}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                    isCorrect
                      ? 'bg-emerald-600 text-white'
                      : isWrong
                      ? 'bg-rose-600 text-white'
                      : isSelected
                      ? 'bg-[#0078D4] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isCorrect ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isWrong ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    option.letter
                  )}
                </div>

                <div className="grow">
                  <span className="text-xs sm:text-sm font-medium text-slate-800 block">
                    {option.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit or Next Question Action Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-slate-500">
            {isAnswerSubmitted
              ? selectedAnswer === currentQuestion.correctAnswer
                ? '✓ Correct! Adaptive module confidence increased.'
                : '✕ Incorrect. Foundational explanation & targeted remediation queued.'
              : 'Select the best architectural answer.'}
          </span>

          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className="px-6 py-2.5 rounded-xl bg-[#0078D4] hover:bg-blue-600 disabled:opacity-40 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span>
                {sessionQuestionIndex + 1 === SESSION_LENGTH
                  ? 'Finish Adaptive Sprint'
                  : lockedRemediationModuleId !== null
                  ? `Next Targeted M${lockedRemediationModuleId} Practice Question`
                  : activeEscalatedModuleId !== null
                  ? `Next Advanced M${activeEscalatedModuleId} Scenario`
                  : 'Next Adaptive Question'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Immediate Architectural Concept & Foundational Distractor Breakdown when answered */}
        {isAnswerSubmitted && (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
                <Sparkles className="w-4 h-4 text-[#0078D4]" />
                <span>
                  {selectedAnswer === currentQuestion.correctAnswer
                    ? 'Azure Architecture Verification & Advanced Synthesis'
                    : 'Foundational Concept Breakdown & Distractor Remediation'}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Correct Answer: Option {currentQuestion.correctAnswer}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              {currentQuestion.whyCorrect}
            </p>

            {/* Step-by-Step Distractor Explanations (Why other options are wrong) */}
            {currentQuestion.distractorBreakdown &&
              currentQuestion.distractorBreakdown.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
                    Why Other Options Are Incorrect (Foundational Distinctions):
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {currentQuestion.distractorBreakdown.map((d) => (
                      <div
                        key={d.letter}
                        className={`p-2.5 rounded-lg border text-xs ${
                          d.letter === selectedAnswer
                            ? 'bg-rose-50 border-rose-300 text-rose-950 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <strong className="text-slate-900">Option {d.letter}:</strong> {d.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {currentQuestion.examTip && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <span className="font-extrabold shrink-0">Exam Anchor:</span>
                <span>{currentQuestion.examTip}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
