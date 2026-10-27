import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Timer,
  Trophy,
  Zap,
  Copy,
  Check,
  Share2,
  Play,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Flame,
  Crown,
  UserPlus,
  Clock,
  Target,
  ShieldCheck,
  X,
  Hash,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon, MaasaiMedallion, KenyanFlagMiniEmblem } from './MotifDecorations';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';

export interface PeerChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  stats: UserStats;
  initialModuleId?: number | 'all';
  initialChallengeCode?: string | null;
  userName?: string | null;
  onAnswerQuestion?: (questionId: string, selectedAnswer: string, isCorrect: boolean) => void;
  onCompleteChallenge?: (moduleId: number, score: number, total: number, elapsedSeconds: number) => void;
}

interface CohortPeerChallenger {
  id: string;
  name: string;
  avatar: string;
  chapter: string;
  location: string;
  baseSpeedSecondsPerQ: number;
  baseAccuracyRate: number;
  badge: string;
}

interface PeerDrillResult {
  id: string;
  name: string;
  avatar: string;
  chapter: string;
  isCurrentUser: boolean;
  score: number;
  totalQuestions: number;
  accuracyPercent: number;
  completionTimeSeconds: number;
  questionSplitsSeconds: number[];
  badge: string;
}

interface StoredPeerChallengeRecord {
  id: string;
  challengeCode: string;
  moduleId: number | 'all';
  moduleTitle: string;
  userTimeSeconds: number;
  userScore: number;
  rank: number;
  totalParticipants: number;
  fastestPeerName: string;
  fastestPeerTimeSeconds: number;
  timestamp: number;
}

const PEER_CHALLENGE_HISTORY_KEY = 'az900_peer_challenge_history_v1';

const COHORT_PEERS: CohortPeerChallenger[] = [
  {
    id: 'peer-amina',
    name: 'Amina Kimani',
    avatar: '🇰🇪',
    chapter: 'Nairobi Savannah Hub',
    location: 'Nairobi, Kenya',
    baseSpeedSecondsPerQ: 7.8,
    baseAccuracyRate: 0.94,
    badge: 'Azure Architect',
  },
  {
    id: 'peer-chidi',
    name: 'Chidi Okonkwo',
    avatar: '🇳🇬',
    chapter: 'Yaba Cloud Explorers',
    location: 'Lagos, Nigeria',
    baseSpeedSecondsPerQ: 8.6,
    baseAccuracyRate: 0.91,
    badge: 'Speed Sprinter',
  },
  {
    id: 'peer-thabo',
    name: 'Thabo Mokoena',
    avatar: '🇿🇦',
    chapter: 'Mzansi Azure Guild',
    location: 'Johannesburg, SA',
    baseSpeedSecondsPerQ: 9.4,
    baseAccuracyRate: 0.88,
    badge: 'Sharpshooter',
  },
  {
    id: 'peer-claudine',
    name: 'Claudine Uwase',
    avatar: '🇷🇼',
    chapter: 'Kigali Innovation Hub',
    location: 'Kigali, Rwanda',
    baseSpeedSecondsPerQ: 8.2,
    baseAccuracyRate: 0.92,
    badge: 'Concepts Sentinel',
  },
  {
    id: 'peer-kofi',
    name: 'Kofi Mensah',
    avatar: '🇬🇭',
    chapter: 'Black Star Tech Hub',
    location: 'Accra, Ghana',
    baseSpeedSecondsPerQ: 10.5,
    baseAccuracyRate: 0.86,
    badge: 'Consistency Master',
  },
  {
    id: 'peer-wanjiku',
    name: 'Wanjiku Njoroge',
    avatar: '🇰🇪',
    chapter: 'Swahili Coast Cloud Hub',
    location: 'Mombasa, Kenya',
    baseSpeedSecondsPerQ: 9.1,
    baseAccuracyRate: 0.89,
    badge: 'Governance Pro',
  },
];

// Deterministic hash from a challenge code string so all cohort peers get the exact same 5 questions
function hashChallengeCode(code: string): number {
  const normalized = code.trim().toUpperCase();
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function formatChallengeCode(modId: number | 'all', seedSuffix?: string): string {
  const modPart = modId === 'all' ? 'ALL' : `M${modId}`;
  const suffix =
    seedSuffix ||
    Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();
  return `HRM-${modPart}-${suffix}`;
}

function parseModuleFromChallengeCode(code: string): number | 'all' | null {
  const match = code.trim().toUpperCase().match(/^HRM-(ALL|M(\d{1,2}))-[A-Z0-9]+$/);
  if (!match) return null;
  if (match[1] === 'ALL') return 'all';
  const num = Number(match[2]);
  if (num >= 1 && num <= 12) return num;
  return null;
}

function formatSecondsPrecise(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0.0s';
  if (sec < 60) {
    return `${sec.toFixed(1)}s`;
  }
  const mins = Math.floor(sec / 60);
  const rem = (sec % 60).toFixed(1);
  return `${mins}m ${Number(rem) < 10 ? '0' : ''}${rem}s`;
}

export const PeerChallengeModal: React.FC<PeerChallengeModalProps> = ({
  isOpen,
  onClose,
  questions,
  stats,
  initialModuleId = 'all',
  initialChallengeCode = null,
  userName,
  onAnswerQuestion,
  onCompleteChallenge,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<number | 'all'>(() => {
    if (initialChallengeCode) {
      const parsed = parseModuleFromChallengeCode(initialChallengeCode);
      if (parsed !== null) return parsed;
    }
    return initialModuleId;
  });

  const [challengeCode, setChallengeCode] = useState<string>(() => {
    if (initialChallengeCode && initialChallengeCode.trim()) {
      return initialChallengeCode.trim().toUpperCase();
    }
    return formatChallengeCode(initialModuleId, '7F3A');
  });

  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [joinCodeStatus, setJoinCodeStatus] = useState<string | null>(null);

  // Selected cohort peers invited to this 5-question micro-drill
  const [invitedPeerIds, setInvitedPeerIds] = useState<string[]>([
    'peer-amina',
    'peer-chidi',
    'peer-claudine',
  ]);
  const [customPeerInput, setCustomPeerInput] = useState<string>('');
  const [customInvitedPeers, setCustomInvitedPeers] = useState<CohortPeerChallenger[]>([]);

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState<boolean>(false);

  // Stage: 'lobby' | 'drilling' | 'results'
  const [stage, setStage] = useState<'lobby' | 'drilling' | 'results'>('lobby');

  // Drill state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState<boolean>(false);
  const [userScore, setUserScore] = useState<number>(0);
  const [questionSplits, setQuestionSplits] = useState<number[]>([]);

  // High-precision timer (100ms ticks while answering)
  const [totalElapsedMs, setTotalElapsedMs] = useState<number>(0);
  const [currentQuestionElapsedMs, setCurrentQuestionElapsedMs] = useState<number>(0);
  const lastTickRef = useRef<number | null>(null);

  const [challengeHistory, setChallengeHistory] = useState<StoredPeerChallengeRecord[]>(() => {
    try {
      const raw = localStorage.getItem(PEER_CHALLENGE_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const allAvailableModules = useMemo(() => LEARNING_PATHS.flatMap((p) => p.modules), []);

  const selectedModuleTitle = useMemo(() => {
    if (selectedModuleId === 'all') return 'All AZ-900 Domains (Mixed 5-Q Sprint)';
    const found = allAvailableModules.find((m) => m.id === selectedModuleId);
    return found ? `Module ${found.id}: ${found.title}` : `Module ${selectedModuleId}`;
  }, [selectedModuleId, allAvailableModules]);

  // Deterministically pick the exact 5 questions from the challengeCode so all peers solve the identical drill
  const drillQuestions = useMemo<Question[]>(() => {
    const pool =
      selectedModuleId === 'all'
        ? [...questions]
        : questions.filter((q) => q.moduleId === selectedModuleId);

    const effectivePool = pool.length >= 5 ? pool : [...pool, ...questions];
    const uniquePool: Question[] = [];
    const seen = new Set<string>();
    for (const q of effectivePool) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        uniquePool.push(q);
      }
    }

    const seed = hashChallengeCode(challengeCode);
    // Deterministic Fisher-Yates shuffle using LCG PRNG seeded by challengeCode
    const copy = [...uniquePool];
    let state = seed || 123456789;
    for (let i = copy.length - 1; i > 0; i--) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      const j = state % (i + 1);
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }

    return copy.slice(0, 5);
  }, [questions, selectedModuleId, challengeCode]);

  // Invited cohort peers list
  const activeInvitedPeers = useMemo<CohortPeerChallenger[]>(() => {
    const base = COHORT_PEERS.filter((p) => invitedPeerIds.includes(p.id));
    return [...base, ...customInvitedPeers];
  }, [invitedPeerIds, customInvitedPeers]);

  // Deterministic peer results for the current challenge code so everyone sees consistent peer times
  const peerResultsForChallenge = useMemo<PeerDrillResult[]>(() => {
    const baseSeed = hashChallengeCode(challengeCode);
    return activeInvitedPeers.map((peer, idx) => {
      const peerSeed = hashChallengeCode(`${challengeCode}-${peer.id}-${idx}`);
      const splits: number[] = [];
      let correctCount = 0;

      for (let qIdx = 0; qIdx < drillQuestions.length; qIdx++) {
        const qSeed = hashChallengeCode(`${peerSeed}-Q${qIdx}`);
        // Speed variation +/- 2.6s around peer's base speed
        const delta = ((qSeed % 52) - 26) / 10;
        const splitSec = Math.max(3.8, Number((peer.baseSpeedSecondsPerQ + delta).toFixed(1)));
        splits.push(splitSec);

        const accRoll = (qSeed % 100) / 100;
        if (accRoll <= peer.baseAccuracyRate || (qIdx === 0 && baseSeed % 2 === 0)) {
          correctCount += 1;
        }
      }

      // Ensure realistic competitive scores (3/5 to 5/5)
      const finalScore = Math.max(3, Math.min(5, correctCount));
      const totalSec = Number(splits.reduce((acc, v) => acc + v, 0).toFixed(1));

      return {
        id: peer.id,
        name: peer.name,
        avatar: peer.avatar,
        chapter: peer.chapter,
        isCurrentUser: false,
        score: finalScore,
        totalQuestions: drillQuestions.length,
        accuracyPercent: Math.round((finalScore / Math.max(1, drillQuestions.length)) * 100),
        completionTimeSeconds: totalSec,
        questionSplitsSeconds: splits,
        badge: peer.badge,
      };
    });
  }, [activeInvitedPeers, challengeCode, drillQuestions.length]);

  // Average cohort split time for the current question
  const currentQuestionCohortAvgSec = useMemo(() => {
    if (peerResultsForChallenge.length === 0) return 9.0;
    const sum = peerResultsForChallenge.reduce(
      (acc, p) => acc + (p.questionSplitsSeconds[currentIndex] || 9.0),
      0
    );
    return Number((sum / peerResultsForChallenge.length).toFixed(1));
  }, [peerResultsForChallenge, currentIndex]);

  // Timer effect while actively answering a question in 'drilling' stage
  useEffect(() => {
    if (stage !== 'drilling' || hasSubmittedCurrent) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = lastTickRef.current ? now - lastTickRef.current : 100;
      lastTickRef.current = now;
      setTotalElapsedMs((prev) => prev + delta);
      setCurrentQuestionElapsedMs((prev) => prev + delta);
    }, 100);

    return () => clearInterval(interval);
  }, [stage, hasSubmittedCurrent, currentIndex]);

  const handleToggleInvitePeer = (peerId: string) => {
    setInvitedPeerIds((prev) => {
      if (prev.includes(peerId)) {
        if (prev.length <= 1 && customInvitedPeers.length === 0) return prev; // Keep at least 1 challenger
        return prev.filter((id) => id !== peerId);
      }
      return [...prev, peerId];
    });
  };

  const handleAddCustomCohortPeer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customPeerInput.trim();
    if (!trimmed) return;
    const newPeer: CohortPeerChallenger = {
      id: `custom-peer-${Date.now()}`,
      name: trimmed,
      avatar: '🌍',
      chapter: 'Invited Cohort Challenger',
      location: 'Cohort Invite',
      baseSpeedSecondsPerQ: 8.9,
      baseAccuracyRate: 0.88,
      badge: 'Cohort Challenger',
    };
    setCustomInvitedPeers((prev) => [...prev, newPeer]);
    setCustomPeerInput('');
  };

  const handleRegenerateChallengeCode = (nextModId: number | 'all' = selectedModuleId) => {
    const nextCode = formatChallengeCode(nextModId);
    setSelectedModuleId(nextModId);
    setChallengeCode(nextCode);
    setJoinCodeStatus(null);
  };

  const handleApplyJoinCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = joinCodeInput.trim().toUpperCase();
    if (!cleaned) return;
    const parsedMod = parseModuleFromChallengeCode(cleaned);
    if (parsedMod !== null) {
      setSelectedModuleId(parsedMod);
    }
    setChallengeCode(cleaned);
    setJoinCodeInput('');
    setJoinCodeStatus(`Synced to Challenge Code ${cleaned} — Identical 5-question drill loaded!`);
  };

  const handleCopyChallengeCode = () => {
    try {
      navigator.clipboard.writeText(challengeCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleCopyInviteLink = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('peer_challenge', challengeCode);
      const inviteText = `⚡ Join my AZ-900 5-Question Peer Challenge (${selectedModuleTitle})! Use Challenge Code: ${challengeCode} or open: ${url.toString()}`;
      navigator.clipboard.writeText(inviteText);
      setCopiedInviteLink(true);
      setTimeout(() => setCopiedInviteLink(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleStartChallengeRace = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasSubmittedCurrent(false);
    setUserScore(0);
    setQuestionSplits([]);
    setTotalElapsedMs(0);
    setCurrentQuestionElapsedMs(0);
    setStage('drilling');
  };

  const currentQuestion = drillQuestions[currentIndex];

  const handleSelectOption = (letter: string) => {
    if (hasSubmittedCurrent || !currentQuestion) return;
    const splitSec = Number((currentQuestionElapsedMs / 1000).toFixed(1));
    setSelectedOption(letter);
    setHasSubmittedCurrent(true);
    setQuestionSplits((prev) => [...prev, Math.max(0.5, splitSec)]);

    const isCorrect = letter === currentQuestion.correctAnswer;
    if (isCorrect) {
      setUserScore((prev) => prev + 1);
    }
    if (onAnswerQuestion) {
      onAnswerQuestion(currentQuestion.id, letter, isCorrect);
    }
  };

  const handleNextOrFinish = () => {
    if (currentIndex < drillQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasSubmittedCurrent(false);
      setCurrentQuestionElapsedMs(0);
    } else {
      const userTotalSec = Number((totalElapsedMs / 1000).toFixed(1));
      setStage('results');

      if (onCompleteChallenge) {
        onCompleteChallenge(
          typeof selectedModuleId === 'number' ? selectedModuleId : 1,
          userScore,
          drillQuestions.length,
          userTotalSec
        );
      }

      // Compute rank and store in history
      const userAccuracy = Math.round((userScore / Math.max(1, drillQuestions.length)) * 100);
      const allStandings = [
        ...peerResultsForChallenge,
        {
          id: 'current-user',
          name: userName || 'You (Candidate)',
          avatar: '⭐',
          chapter: 'Your Studio Session',
          isCurrentUser: true,
          score: userScore,
          totalQuestions: drillQuestions.length,
          accuracyPercent: userAccuracy,
          completionTimeSeconds: userTotalSec,
          questionSplitsSeconds: questionSplits,
          badge: 'Challenger',
        },
      ].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.completionTimeSeconds - b.completionTimeSeconds;
      });

      const userRank = allStandings.findIndex((r) => r.isCurrentUser) + 1;
      const fastestPeer = [...peerResultsForChallenge].sort(
        (a, b) => a.completionTimeSeconds - b.completionTimeSeconds
      )[0];

      const newRecord: StoredPeerChallengeRecord = {
        id: `pc-${Date.now()}`,
        challengeCode,
        moduleId: selectedModuleId,
        moduleTitle: selectedModuleTitle,
        userTimeSeconds: userTotalSec,
        userScore,
        rank: userRank,
        totalParticipants: allStandings.length,
        fastestPeerName: fastestPeer?.name || 'Amina Kimani',
        fastestPeerTimeSeconds: fastestPeer?.completionTimeSeconds || 41.2,
        timestamp: Date.now(),
      };

      const updatedHistory = [newRecord, ...challengeHistory].slice(0, 15);
      setChallengeHistory(updatedHistory);
      try {
        localStorage.setItem(PEER_CHALLENGE_HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch {
        // ignore
      }

      confetti({
        particleCount: userRank === 1 ? 110 : 55,
        spread: 75,
        origin: { y: 0.6 },
      });
    }
  };

  // Combined ranked standings for Results view
  const finalLeaderboard = useMemo<PeerDrillResult[]>(() => {
    const userTotalSec = Number((totalElapsedMs / 1000).toFixed(1));
    const userResult: PeerDrillResult = {
      id: 'current-user',
      name: userName || 'You (Candidate)',
      avatar: '⭐',
      chapter: 'Your Studio Session',
      isCurrentUser: true,
      score: userScore,
      totalQuestions: drillQuestions.length,
      accuracyPercent: Math.round((userScore / Math.max(1, drillQuestions.length)) * 100),
      completionTimeSeconds: userTotalSec,
      questionSplitsSeconds: questionSplits,
      badge: userScore >= 4 ? 'Harambee Sprinter' : 'Challenger',
    };

    return [...peerResultsForChallenge, userResult].sort((a, b) => {
      // Sort primarily by completion time if accuracy is within 1 question, or by score + time
      if (b.score !== a.score) return b.score - a.score;
      return a.completionTimeSeconds - b.completionTimeSeconds;
    });
  }, [peerResultsForChallenge, totalElapsedMs, userName, userScore, drillQuestions.length, questionSplits]);

  const fastestOverallTime = useMemo(() => {
    if (finalLeaderboard.length === 0) return 35;
    return Math.min(...finalLeaderboard.map((r) => r.completionTimeSeconds));
  }, [finalLeaderboard]);

  const cohortAverageTime = useMemo(() => {
    if (peerResultsForChallenge.length === 0) return 44;
    const sum = peerResultsForChallenge.reduce((acc, r) => acc + r.completionTimeSeconds, 0);
    return Number((sum / peerResultsForChallenge.length).toFixed(1));
  }, [peerResultsForChallenge]);

  if (!isOpen) return null;

  return (
    <ResponsiveModalContainer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      ariaLabel="Peer Challenge 5-Question Micro-Drill Mode"
    >
      <div className="shrink-0">
        <KitengeRibbon height={4} />
      </div>

      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-[#003E73] to-[#006600] text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm sm:text-lg tracking-tight text-white">
                Harambee Peer Challenge • 5-Question Speed Micro-Drill
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950 shrink-0">
                Code: {challengeCode}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-sky-100/90 truncate">
              Invite cohort peers to solve the exact same 5-question micro-drill &amp; compare completion times
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          aria-label="Close Peer Challenge modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
        {stage === 'lobby' && (
          <>
            {/* Top Row: Challenge Seed Configuration & Join Peer Code */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 7 cols: Shareable Challenge Code & Module Selector */}
              <div className="lg:col-span-7 p-4 rounded-2xl bg-gradient-to-br from-sky-50/90 via-white to-emerald-50/50 border border-sky-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#0078D4] flex items-center gap-1.5">
                    <MaasaiMedallion size={14} />
                    <span>1. Shared 5-Question Micro-Drill Seed</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Deterministic 5 Questions
                  </span>
                </div>

                {/* Module Selector */}
                <div className="space-y-1">
                  <label
                    htmlFor="peer-challenge-module-select"
                    className="text-xs font-extrabold text-slate-700 block"
                  >
                    Select Target AZ-900 Module for This Challenge:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      id="peer-challenge-module-select"
                      value={selectedModuleId}
                      onChange={(e) => {
                        const val =
                          e.target.value === 'all' ? 'all' : Number(e.target.value);
                        handleRegenerateChallengeCode(val);
                      }}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#0078D4] focus:outline-none"
                    >
                      <option value="all">All AZ-900 Domains (Mixed 5-Question Sprint)</option>
                      {allAvailableModules.map((mod) => (
                        <option key={mod.id} value={mod.id}>
                          Module {mod.id}: {mod.title} (Path {mod.pathId})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRegenerateChallengeCode(selectedModuleId)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                      title="Generate a fresh 5-question challenge seed"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#0078D4]" />
                      <span>New Seed</span>
                    </button>
                  </div>
                </div>

                {/* Challenge Code + Copy Invite Buttons */}
                <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Cohort Challenge Room Code
                    </span>
                    <span className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-wider">
                      {challengeCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleCopyChallengeCode}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Code Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-300" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedInviteLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>Invite Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share Cohort Invite</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview of the 5 Locked Questions IDs */}
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 pt-0.5">
                  <span className="font-semibold">
                    Locked 5-Question Set:{' '}
                    <strong className="text-slate-900 font-mono">
                      {drillQuestions.map((q) => q.id.toUpperCase()).join(' • ')}
                    </strong>
                  </span>
                  <span className="text-[#006600] font-extrabold">
                    Cohort Target: {cohortAverageTime}s
                  </span>
                </div>
              </div>

              {/* Right 5 cols: Enter a Cohort Peer's Challenge Code */}
              <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-amber-600" />
                    <span>Have a Cohort Peer&apos;s Challenge Code?</span>
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Paste a code shared by a study partner (e.g.,{' '}
                    <code className="font-mono font-bold text-slate-800">HRM-M5-7F3A</code>) to load
                    their exact 5 questions and compare completion times.
                  </p>
                </div>

                <form onSubmit={handleApplyJoinCode} className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. HRM-M4-9B2C"
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold uppercase text-slate-900 placeholder:text-slate-400 focus:border-[#0078D4] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer shrink-0"
                    >
                      Load Code
                    </button>
                  </div>
                  {joinCodeStatus && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{joinCodeStatus}</span>
                    </div>
                  )}
                </form>

                <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-950 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Every cohort peer using <strong>{challengeCode}</strong> receives the exact same 5 scenarios in the same sequence.
                  </span>
                </div>
              </div>
            </div>

            {/* Cohort Member Selection & Invite Panel */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0078D4]" />
                    <span>2. Invite Cohort Peers to Compare Completion Times</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-[#0078D4]">
                      {activeInvitedPeers.length} Peers Invited
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select members from the Global Harambee Azure Cohort or invite a classmate by name/handle:
                  </p>
                </div>

                {/* Custom Peer Invite Input */}
                <form onSubmit={handleAddCustomCohortPeer} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customPeerInput}
                    onChange={(e) => setCustomPeerInput(e.target.value)}
                    placeholder="Invite peer name or @handle..."
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0078D4] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Peer</span>
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {COHORT_PEERS.map((peer) => {
                  const isInvited = invitedPeerIds.includes(peer.id);
                  const projected = peerResultsForChallenge.find((r) => r.id === peer.id);
                  return (
                    <button
                      key={peer.id}
                      type="button"
                      onClick={() => handleToggleInvitePeer(peer.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isInvited
                          ? 'bg-gradient-to-r from-sky-50/90 to-emerald-50/60 border-[#0078D4] ring-1 ring-[#0078D4]/25 shadow-2xs'
                          : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{peer.avatar}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1">
                            <span>{peer.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {peer.chapter} • ~{peer.baseSpeedSecondsPerQ}s/q
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          isInvited
                            ? 'bg-[#0078D4] text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isInvited
                          ? projected
                            ? `${projected.completionTimeSeconds}s`
                            : 'Invited ✓'
                          : '+ Invite'}
                      </span>
                    </button>
                  );
                })}

                {customInvitedPeers.map((peer) => {
                  const projected = peerResultsForChallenge.find((r) => r.id === peer.id);
                  return (
                    <div
                      key={peer.id}
                      className="p-3 rounded-xl border border-emerald-400 bg-emerald-50/60 text-left flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{peer.avatar}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-slate-900 truncate">
                            {peer.name}
                          </div>
                          <div className="text-[10px] text-emerald-800 truncate">
                            Custom Invited Peer
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shrink-0">
                        {projected ? `${projected.completionTimeSeconds}s` : 'Ready'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Peer Challenge History (if any) */}
            {challengeHistory.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Your Recent Cohort Peer Challenges</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {challengeHistory.length} completed
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {challengeHistory.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 flex items-center gap-1.5">
                          <span className="font-mono text-[#0078D4]">{item.challengeCode}</span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px]">
                            Rank #{item.rank}/{item.totalParticipants}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          You: <strong>{item.userTimeSeconds}s</strong> ({item.userScore}/5) vs.{' '}
                          {item.fastestPeerName} ({item.fastestPeerTimeSeconds}s)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setChallengeCode(item.challengeCode);
                          setSelectedModuleId(item.moduleId);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer shrink-0"
                      >
                        Load Seed
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Launch Challenge CTA */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Timer className="w-4 h-4 text-[#006600]" />
                <span>
                  Stopwatch starts when you click <strong>Start 5-Question Peer Race</strong>.
                </span>
              </div>

              <button
                type="button"
                onClick={handleStartChallengeRace}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0078D4] via-[#005A9E] to-[#006600] hover:opacity-95 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-amber-300" />
                <span>Start 5-Question Peer Challenge ({activeInvitedPeers.length} Peers)</span>
              </button>
            </div>
          </>
        )}

        {stage === 'drilling' && currentQuestion && (
          <div className="space-y-4">
            {/* Live Stopwatch & Cohort Ghost Pace Header */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs">
                    Q {currentIndex + 1} of {drillQuestions.length}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    Score: <strong className="text-emerald-400">{userScore}</strong>/
                    {currentIndex + (hasSubmittedCurrent ? 1 : 0)}
                  </span>
                </div>

                {/* Live Precision Timer */}
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span className="text-[11px] text-slate-300 font-semibold">This Q:</span>
                    <span className="font-mono text-xs sm:text-sm font-black text-amber-300">
                      {formatSecondsPrecise(currentQuestionElapsedMs / 1000)}
                    </span>
                  </div>

                  <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-300" />
                    <span className="text-[11px] text-emerald-200 font-semibold">Total Time:</span>
                    <span className="font-mono text-sm sm:text-base font-black text-white">
                      {formatSecondsPrecise(totalElapsedMs / 1000)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ghost Pace Bar vs Invited Cohort Peers on this question */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>
                    Live Pace vs. Invited Cohort Peers (Avg{' '}
                    <strong className="text-amber-300">{currentQuestionCohortAvgSec}s</strong> on Q
                    {currentIndex + 1})
                  </span>
                  <span
                    className={`font-extrabold ${
                      currentQuestionElapsedMs / 1000 <= currentQuestionCohortAvgSec
                        ? 'text-emerald-300'
                        : 'text-amber-300'
                    }`}
                  >
                    {currentQuestionElapsedMs / 1000 <= currentQuestionCohortAvgSec
                      ? '⚡ Ahead of Cohort Pace'
                      : '⏱️ Cohort Peers Completed Q' + (currentIndex + 1)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      currentQuestionElapsedMs / 1000 <= currentQuestionCohortAvgSec
                        ? 'bg-gradient-to-r from-emerald-400 to-sky-400'
                        : 'bg-gradient-to-r from-amber-400 to-rose-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((currentQuestionElapsedMs / 1000) /
                            Math.max(4, currentQuestionCohortAvgSec * 1.4)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Scenario & Question */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#0078D4] mb-1">
                <span>
                  M{currentQuestion.moduleId}: {currentQuestion.moduleTitle}
                </span>
                <span className="font-mono text-slate-400">
                  {currentQuestion.id.toUpperCase()}
                </span>
              </div>
              {currentQuestion.scenario}
            </div>

            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
              {currentQuestion.question}
            </h4>

            {/* Answer Options */}
            <div className="space-y-2">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedOption === opt.letter;
                const isCorrect = opt.letter === currentQuestion.correctAnswer;

                let btnClass =
                  'bg-white border-slate-200 text-slate-800 hover:border-[#0078D4] hover:bg-sky-50/40 cursor-pointer';
                if (hasSubmittedCurrent) {
                  if (isCorrect) {
                    btnClass =
                      'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20';
                  } else if (isSelected && !isCorrect) {
                    btnClass = 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-400/20';
                  } else {
                    btnClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={opt.letter}
                    type="button"
                    disabled={hasSubmittedCurrent}
                    onClick={() => handleSelectOption(opt.letter)}
                    className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-3 transition-all ${btnClass}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border ${
                        hasSubmittedCurrent && isCorrect
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : hasSubmittedCurrent && isSelected && !isCorrect
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {opt.letter}
                    </span>
                    <span className="flex-1 leading-snug">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Instant Split Feedback + Next Button */}
            {hasSubmittedCurrent && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="space-y-0.5 text-xs">
                  <div className="font-extrabold flex items-center gap-1.5">
                    {selectedOption === currentQuestion.correctAnswer ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span
                      className={
                        selectedOption === currentQuestion.correctAnswer
                          ? 'text-emerald-800'
                          : 'text-rose-800'
                      }
                    >
                      {selectedOption === currentQuestion.correctAnswer
                        ? `Correct! Split locked at ${
                            questionSplits[questionSplits.length - 1] || 0
                          }s (Cohort avg: ${currentQuestionCohortAvgSec}s)`
                        : `Answer is ${currentQuestion.correctAnswer} • Split locked at ${
                            questionSplits[questionSplits.length - 1] || 0
                          }s`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {currentQuestion.examTip}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleNextOrFinish}
                  className="px-5 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                >
                  <span>
                    {currentIndex < drillQuestions.length - 1
                      ? 'Next Question (Resume Timer)'
                      : 'Finish & Compare Times'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {stage === 'results' && (
          <div className="space-y-5">
            {/* Results Summary Banner */}
            {(() => {
              const userRow = finalLeaderboard.find((r) => r.isCurrentUser)!;
              const userRank = finalLeaderboard.findIndex((r) => r.isCurrentUser) + 1;
              const deltaVsCohortAvg = Number(
                (userRow.completionTimeSeconds - cohortAverageTime).toFixed(1)
              );
              const isFasterThanAvg = deltaVsCohortAvg <= 0;

              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#003E73] to-[#006600] text-white space-y-4 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                        #{userRank}
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/15 text-amber-300">
                          Challenge Code: {challengeCode}
                        </span>
                        <h4 className="text-base sm:text-xl font-black mt-0.5">
                          Completed in {formatSecondsPrecise(userRow.completionTimeSeconds)} •{' '}
                          {userRow.score}/{userRow.totalQuestions} Correct ({userRow.accuracyPercent}%)
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyInviteLink}
                        className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {copiedInviteLink ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Result &amp; Invite Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Challenge More Peers</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 4 Key Comparison Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <span className="text-[10px] uppercase font-bold text-sky-200 block">
                        Your Completion Time
                      </span>
                      <span className="font-mono text-base sm:text-lg font-black text-white">
                        {formatSecondsPrecise(userRow.completionTimeSeconds)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <span className="text-[10px] uppercase font-bold text-sky-200 block">
                        Cohort Peer Average
                      </span>
                      <span className="font-mono text-base sm:text-lg font-black text-amber-300">
                        {formatSecondsPrecise(cohortAverageTime)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <span className="text-[10px] uppercase font-bold text-sky-200 block">
                        Speed Delta vs. Cohort
                      </span>
                      <span
                        className={`font-mono text-base sm:text-lg font-black ${
                          isFasterThanAvg ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {isFasterThanAvg ? `${deltaVsCohortAvg}s Faster` : `+${deltaVsCohortAvg}s`}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <span className="text-[10px] uppercase font-bold text-sky-200 block">
                        Avg Pace / Question
                      </span>
                      <span className="font-mono text-base sm:text-lg font-black text-white">
                        {(userRow.completionTimeSeconds / Math.max(1, drillQuestions.length)).toFixed(1)}s/q
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Head-to-Head Cohort Completion Time Leaderboard */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h5 className="text-xs sm:text-sm font-black text-slate-900">
                    Cohort Completion Time &amp; Accuracy Comparison (Same 5 Questions)
                  </h5>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  Fastest: {formatSecondsPrecise(fastestOverallTime)}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {finalLeaderboard.map((entry, idx) => {
                  const rank = idx + 1;
                  const timeDiffFromFastest = Number(
                    (entry.completionTimeSeconds - fastestOverallTime).toFixed(1)
                  );
                  const barWidthPct = Math.min(
                    100,
                    Math.max(
                      25,
                      Math.round((fastestOverallTime / Math.max(1, entry.completionTimeSeconds)) * 100)
                    )
                  );

                  return (
                    <div
                      key={entry.id}
                      className={`p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        entry.isCurrentUser
                          ? 'bg-gradient-to-r from-sky-50/90 via-blue-50/50 to-emerald-50/60 border-l-4 border-l-[#0078D4]'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            rank === 1
                              ? 'bg-amber-400 text-slate-950 shadow-2xs'
                              : rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : rank === 3
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {rank === 1 ? <Crown className="w-3.5 h-3.5" /> : `#${rank}`}
                        </span>

                        <span className="text-lg shrink-0">{entry.avatar}</span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              {entry.name}
                            </span>
                            {entry.isCurrentUser && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-[#0078D4] text-white">
                                YOU
                              </span>
                            )}
                            <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              {entry.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                            <span>{entry.chapter}</span>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-slate-600">
                              Splits:{' '}
                              {entry.questionSplitsSeconds.map((s, i) => `Q${i + 1}:${s}s`).join(' | ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:min-w-[230px] justify-end">
                        <div className="w-24 hidden sm:block">
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                entry.isCurrentUser ? 'bg-[#0078D4]' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${barWidthPct}%` }}
                            />
                          </div>
                        </div>

                        <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black shrink-0">
                          {entry.score}/{entry.totalQuestions} ({entry.accuracyPercent}%)
                        </span>

                        <div className="text-right min-w-[72px]">
                          <div className="font-mono text-xs sm:text-sm font-black text-slate-900">
                            {formatSecondsPrecise(entry.completionTimeSeconds)}
                          </div>
                          <div className="font-mono text-[10px] font-bold text-slate-500">
                            {timeDiffFromFastest === 0
                              ? '⚡ Fastest'
                              : `+${timeDiffFromFastest}s`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStage('lobby')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Change Invited Peers / Code</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartChallengeRace}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rematch Same 5 Questions</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveModalContainer>
  );
};
