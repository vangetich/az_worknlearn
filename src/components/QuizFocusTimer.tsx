import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Sparkles,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  ChevronDown,
  Award,
} from 'lucide-react';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';
import { KitengeRibbon } from './MotifDecorations';

export interface AzureTriviaItem {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  funFact: string;
}

export const AZURE_TRIVIA_BANK: AzureTriviaItem[] = [
  {
    id: 'trivia-codename',
    topic: 'Azure History',
    question: 'What was Microsoft’s original internal codename for Azure before its public launch in 2008?',
    options: [
      'Project Red Dog',
      'Project SkyVault',
      'Project BlueHorizon',
      'Project Nimbus',
    ],
    correctIndex: 0,
    funFact:
      'Microsoft Azure began as "Project Red Dog" (named by Dave Cutler and Amitabh Srivastava after the Red Dog Saloon in Austin, Texas). That is why some legacy Azure IP ranges and diagnostics still reference "RedDog"!',
  },
  {
    id: 'trivia-natick',
    topic: 'Cloud Sustainability',
    question: 'Where did Microsoft deploy its experimental Project Natick datacenter to test natural ocean cooling?',
    options: [
      'Floating on Lake Geneva',
      'Submerged on the seafloor off Scotland’s Orkney Islands',
      'Inside an Arctic ice cave in Norway',
      'Mounted on offshore oil rigs in Texas',
    ],
    correctIndex: 1,
    funFact:
      'Project Natick submerged a sealed nitrogen-filled datacenter 117 feet underwater off the Orkney Islands. Without oxygen corrosion or human bumps, its server failure rate was roughly 1/8th of land-based datacenters!',
  },
  {
    id: 'trivia-four-nines',
    topic: 'SLA & Reliability',
    question: 'An Azure service offering a 99.99% ("four nines") SLA allows roughly how much downtime per year?',
    options: [
      'About 8.76 hours',
      'About 52.6 minutes',
      'About 3.65 days',
      'Zero seconds',
    ],
    correctIndex: 1,
    funFact:
      '99.9% ("three nines") allows ~8.76 hours/year, whereas 99.99% ("four nines") tightens that to just ~52.6 minutes/year — about 4.38 minutes per month!',
  },
  {
    id: 'trivia-regions',
    topic: 'Global Infrastructure',
    question: 'Which cloud provider currently operates more global geographic regions than any other major hyperscaler?',
    options: [
      'Microsoft Azure (60+ regions worldwide)',
      'DigitalOcean',
      'IBM Cloud',
      'Oracle Cloud',
    ],
    correctIndex: 0,
    funFact:
      'Azure spans 60+ regions globally, interconnected by Microsoft’s private WAN backbone — over 175,000+ miles of terrestrial and subsea fiber optic cable!',
  },
  {
    id: 'trivia-shared-resp',
    topic: 'Shared Responsibility',
    question: 'Across IaaS, PaaS, and SaaS, which three items ALWAYS remain the customer’s responsibility?',
    options: [
      'Physical Datacenter, Hypervisor, and Network Cables',
      'Information & Data, Devices (Endpoints), and Accounts & Identities',
      'Operating System Patching, Runtime, and Host Cooling',
      'Rack Security, Backup Generators, and Fiber Cabling',
    ],
    correctIndex: 1,
    funFact:
      'Memory trick for AZ-900: No matter the cloud model (even SaaS like Microsoft 365), YOU always own your Data, Devices/Endpoints, and Accounts & Identities!',
  },
  {
    id: 'trivia-capex-opex',
    topic: 'Cloud Economics',
    question: 'Which famous cloud economic shift moves companies from big upfront hardware bills to pay-as-you-go monthly bills?',
    options: [
      'OpEx → CapEx',
      'CapEx → OpEx',
      'DNS → BGP',
      'RBAC → ABAC',
    ],
    correctIndex: 1,
    funFact:
      'Moving from Capital Expenditure (CapEx) to Operational Expenditure (OpEx) lets startups launch globally for a few dollars an hour without buying physical servers first.',
  },
  {
    id: 'trivia-locks',
    topic: 'Azure Governance',
    question: 'If a Subscription Owner tries to delete an Azure Storage Account that has a CanNotDelete Lock, what happens?',
    options: [
      'The Owner role overrides the lock and deletes it',
      'The delete is blocked until the Lock is explicitly removed',
      'It waits 24 hours then auto-deletes',
      'It converts the account to ReadOnly',
    ],
    correctIndex: 1,
    funFact:
      'Azure Resource Locks supersede RBAC permissions — even an Owner or Global Administrator must remove the lock first before deleting or modifying locked resources!',
  },
  {
    id: 'trivia-archive-tier',
    topic: 'Azure Storage',
    question: 'Which Azure Blob access tier has the lowest storage cost per GB, is stored offline, and requires rehydration before reading?',
    options: [
      'Hot Tier',
      'Cool Tier',
      'Cold Tier',
      'Archive Tier',
    ],
    correctIndex: 3,
    funFact:
      'Archive tier offers ultra-low cost for long-term backups (at least 180 days early-deletion period), and blobs must be rehydrated to Hot, Cool, or Cold before retrieval.',
  },
];

export type FocusTimerPhase = 'idle' | 'focus' | 'break';

export interface QuizFocusTimerState {
  blockMinutes: number;
  secondsLeft: number;
  breakSecondsLeft: number;
  phase: FocusTimerPhase;
  isRunning: boolean;
  completedBlocks: number;
  showBreakModal: boolean;
  startFocusBlock: (customMinutes?: number) => void;
  togglePlayPause: () => void;
  resetTimer: () => void;
  selectBlockMinutes: (minutes: number) => void;
  openBreakPrompt: () => void;
  startBreakCountdown: () => void;
  dismissBreakModal: () => void;
  skipBreakAndStartNextFocus: () => void;
}

const DEFAULT_FOCUS_MINUTES = 25;
const BREAK_DURATION_SECONDS = 5 * 60; // 5-minute break

function playGentlePomodoroChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99]; // C5 - E5 - G5 soft chord arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startAt = ctx.currentTime + idx * 0.14;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startAt);
      gain.gain.setValueAtTime(0.001, startAt);
      gain.gain.linearRampToValueAtTime(0.12, startAt + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.72);
    });
  } catch {
    // Web Audio API unavailable or blocked
  }
}

export function useQuizFocusTimer(): QuizFocusTimerState {
  const [blockMinutes, setBlockMinutes] = useState<number>(DEFAULT_FOCUS_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_FOCUS_MINUTES * 60);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState<number>(BREAK_DURATION_SECONDS);
  const [phase, setPhase] = useState<FocusTimerPhase>('idle');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedBlocks, setCompletedBlocks] = useState<number>(0);
  const [showBreakModal, setShowBreakModal] = useState<boolean>(false);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      if (phase === 'focus') {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setCompletedBlocks((c) => c + 1);
            setPhase('break');
            setBreakSecondsLeft(BREAK_DURATION_SECONDS);
            setShowBreakModal(true);
            playGentlePomodoroChime();
            return 0;
          }
          return prev - 1;
        });
      } else if (phase === 'break') {
        setBreakSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playGentlePomodoroChime();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phase]);

  const startFocusBlock = useCallback(
    (customMinutes?: number) => {
      const targetMins = customMinutes ?? blockMinutes;
      if (customMinutes !== undefined) {
        setBlockMinutes(customMinutes);
      }
      setPhase('focus');
      setSecondsLeft(targetMins * 60);
      setIsRunning(true);
      setShowBreakModal(false);
    },
    [blockMinutes]
  );

  const togglePlayPause = useCallback(() => {
    if (phase === 'idle') {
      setPhase('focus');
      setSecondsLeft(blockMinutes * 60);
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  }, [phase, blockMinutes]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(blockMinutes * 60);
    setBreakSecondsLeft(BREAK_DURATION_SECONDS);
  }, [blockMinutes]);

  const selectBlockMinutes = useCallback(
    (minutes: number) => {
      setBlockMinutes(minutes);
      if (phase === 'idle' || !isRunning) {
        setSecondsLeft(minutes * 60);
        setPhase('idle');
      }
    },
    [phase, isRunning]
  );

  const openBreakPrompt = useCallback(() => {
    setPhase('break');
    setIsRunning(false);
    setBreakSecondsLeft(BREAK_DURATION_SECONDS);
    setShowBreakModal(true);
  }, []);

  const startBreakCountdown = useCallback(() => {
    setPhase('break');
    setBreakSecondsLeft((prev) => (prev <= 0 ? BREAK_DURATION_SECONDS : prev));
    setIsRunning(true);
  }, []);

  const dismissBreakModal = useCallback(() => {
    setShowBreakModal(false);
  }, []);

  const skipBreakAndStartNextFocus = useCallback(() => {
    setShowBreakModal(false);
    setPhase('focus');
    setSecondsLeft(blockMinutes * 60);
    setBreakSecondsLeft(BREAK_DURATION_SECONDS);
    setIsRunning(true);
  }, [blockMinutes]);

  return {
    blockMinutes,
    secondsLeft,
    breakSecondsLeft,
    phase,
    isRunning,
    completedBlocks,
    showBreakModal,
    startFocusBlock,
    togglePlayPause,
    resetTimer,
    selectBlockMinutes,
    openBreakPrompt,
    startBreakCountdown,
    dismissBreakModal,
    skipBreakAndStartNextFocus,
  };
}

export function formatFocusMMSS(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface QuizFocusTimerPillProps {
  timer: QuizFocusTimerState;
  compact?: boolean;
}

export const QuizFocusTimerPill: React.FC<QuizFocusTimerPillProps> = ({
  timer,
  compact = false,
}) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const activeSecs =
    timer.phase === 'break' ? timer.breakSecondsLeft : timer.secondsLeft;
  const totalSecs =
    timer.phase === 'break' ? BREAK_DURATION_SECONDS : timer.blockMinutes * 60;
  const progressPct = Math.min(
    100,
    Math.max(0, Math.round(((totalSecs - activeSecs) / Math.max(1, totalSecs)) * 100))
  );

  return (
    <div ref={containerRef} className="relative shrink-0">
      <div
        className={`inline-flex items-center gap-1 rounded-lg border text-[11px] font-bold transition-all shadow-2xs ${
          timer.phase === 'break'
            ? 'bg-emerald-950/75 border-emerald-400/50 text-emerald-100'
            : timer.phase === 'focus' && timer.isRunning
            ? 'bg-indigo-950/80 border-amber-300/60 text-white'
            : 'bg-black/25 border-white/20 text-white'
        } ${compact ? 'px-2 py-1' : 'px-2.5 py-1'}`}
      >
        <button
          type="button"
          onClick={() => {
            if (timer.phase === 'break') {
              timer.openBreakPrompt();
            } else if (timer.phase === 'idle') {
              timer.startFocusBlock(timer.blockMinutes);
            } else {
              timer.togglePlayPause();
            }
          }}
          className="inline-flex items-center gap-1.5 cursor-pointer hover:text-amber-200 transition-colors"
          title={
            timer.phase === 'idle'
              ? `Start ${timer.blockMinutes}-minute Pomodoro Focus Timer`
              : timer.phase === 'break'
              ? 'Open 5-minute Break & Azure Trivia prompt'
              : timer.isRunning
              ? 'Pause Focus Timer'
              : 'Resume Focus Timer'
          }
        >
          {timer.phase === 'break' ? (
            <Coffee className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          ) : (
            <Timer
              className={`w-3.5 h-3.5 shrink-0 ${
                timer.isRunning ? 'text-amber-300 animate-pulse' : 'text-sky-200'
              }`}
            />
          )}

          <span className="text-[10.5px] font-extrabold text-sky-100 hidden sm:inline">
            {timer.phase === 'break' ? 'Break:' : 'Focus Timer:'}
          </span>
          <span className="font-mono font-black text-white tabular-nums">
            {formatFocusMMSS(activeSecs)}
          </span>
          {timer.phase === 'idle' && (
            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9.5px] font-black">
              Start 25m
            </span>
          )}
          {timer.phase === 'focus' && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-white/15">
              {timer.isRunning ? (
                <Pause className="w-2.5 h-2.5 text-amber-200" />
              ) : (
                <Play className="w-2.5 h-2.5 text-emerald-300" />
              )}
            </span>
          )}
        </button>

        {timer.completedBlocks > 0 && (
          <span
            className="px-1 py-0.2 rounded bg-emerald-500/25 border border-emerald-400/40 text-[9.5px] font-black text-emerald-200"
            title={`${timer.completedBlocks} Pomodoro focus block(s) completed`}
          >
            {timer.completedBlocks}x
          </span>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="p-0.5 rounded hover:bg-white/15 text-sky-200 hover:text-white transition-colors cursor-pointer"
          aria-label="Configure Pomodoro Focus Timer"
          title="Configure 25-minute Pomodoro Focus Timer & Break Trivia"
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Popover Controls */}
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-[min(17.5rem,calc(100vw-2rem))] rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl p-3.5 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-50 text-[#0078D4]">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  Pomodoro Focus Timer
                </h4>
                <p className="text-[10px] text-slate-500">
                  25m focus block → 5m break &amp; Azure trivia
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-600">
                {timer.phase === 'break'
                  ? '5-Minute Break Active'
                  : timer.phase === 'focus'
                  ? timer.isRunning
                    ? 'Deep Focus Block Running'
                    : 'Focus Block Paused'
                  : 'Ready to Start Block'}
              </span>
              <span className="font-mono font-black text-[#0078D4]">
                {formatFocusMMSS(activeSecs)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/70">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  timer.phase === 'break'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-[#0078D4] to-amber-500'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Preset Pomodoro Block Selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Focus Block Length
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { mins: 15, label: '15m Sprint' },
                { mins: 25, label: '25m Classic' },
                { mins: 45, label: '45m Deep' },
              ].map((opt) => (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => {
                    timer.selectBlockMinutes(opt.mins);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                    timer.blockMinutes === opt.mins
                      ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (timer.phase === 'idle') {
                  timer.startFocusBlock(timer.blockMinutes);
                } else {
                  timer.togglePlayPause();
                }
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {timer.isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>{timer.phase === 'idle' ? `Start ${timer.blockMinutes}m` : 'Resume'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={timer.resetTimer}
              className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Reset Focus Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              timer.openBreakPrompt();
            }}
            className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span>Take 5-Min Break &amp; Azure Trivia Now</span>
          </button>
        </div>
      )}
    </div>
  );
};

interface QuizBreakTriviaModalProps {
  timer: QuizFocusTimerState;
}

export const QuizBreakTriviaModal: React.FC<QuizBreakTriviaModalProps> = ({ timer }) => {
  const [triviaIndex, setTriviaIndex] = useState<number>(() =>
    Math.floor(Math.random() * AZURE_TRIVIA_BANK.length)
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    if (timer.showBreakModal) {
      setSelectedOption(null);
    }
  }, [timer.showBreakModal]);

  if (!timer.showBreakModal) return null;

  const trivia = AZURE_TRIVIA_BANK[triviaIndex % AZURE_TRIVIA_BANK.length];
  const hasAnswered = selectedOption !== null;
  const isCorrect = selectedOption === trivia.correctIndex;
  const breakProgressPct = Math.round(
    ((BREAK_DURATION_SECONDS - timer.breakSecondsLeft) / BREAK_DURATION_SECONDS) * 100
  );

  const handleNextTrivia = () => {
    setSelectedOption(null);
    setTriviaIndex((prev) => (prev + 1) % AZURE_TRIVIA_BANK.length);
  };

  return (
    <ResponsiveModalContainer
      isOpen={timer.showBreakModal}
      onClose={timer.dismissBreakModal}
      maxWidth="lg"
      closeOnBackdropClick={true}
      ariaLabel="Pomodoro 5-Minute Break and Azure Trivia"
    >
      <div className="shrink-0">
        <KitengeRibbon height={4} />
      </div>

      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 py-4 bg-gradient-to-r from-amber-50 via-white to-sky-50 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                Pomodoro Complete • Block #{Math.max(1, timer.completedBlocks)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                Gentle 5-Min Breather
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              Great {timer.blockMinutes}-Minute Focus Block! Ready for a 5-Minute Break?
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Rest your eyes for 5 minutes, grab some water, and enjoy a quick Azure cloud trivia challenge while your memory consolidates.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={timer.dismissBreakModal}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
          aria-label="Close break suggestion"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain flex-1 min-h-0">
        {/* 5-Minute Break Timer Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-sky-50/70 to-white border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
              Suggested 5-Minute Rest Timer
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tabular-nums">
                {formatFocusMMSS(timer.breakSecondsLeft)}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {timer.breakSecondsLeft === 0
                  ? 'Break complete — refreshed & ready!'
                  : timer.phase === 'break' && timer.isRunning
                  ? 'Break countdown active...'
                  : 'Pause your screen & recharge'}
              </span>
            </div>
            <div className="w-48 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${breakProgressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (timer.phase === 'break' && timer.isRunning) {
                  timer.togglePlayPause();
                } else {
                  timer.startBreakCountdown();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {timer.phase === 'break' && timer.isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Break</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start 5m Break</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Brief Azure-Related Trivia Question */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0078D4]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#0078D4]">
                Azure Break Trivia • {trivia.topic}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNextTrivia}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-[#0078D4]" />
              <span>Another Trivia</span>
            </button>
          </div>

          <p className="text-sm font-extrabold text-slate-900 leading-snug">
            {trivia.question}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {trivia.options.map((opt, idx) => {
              const isChosen = selectedOption === idx;
              const isAnswer = trivia.correctIndex === idx;
              let btnStyle =
                'bg-white hover:bg-sky-50 border-slate-200 text-slate-800 hover:border-sky-300';

              if (hasAnswered) {
                if (isAnswer) {
                  btnStyle =
                    'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400/50';
                } else if (isChosen) {
                  btnStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                } else {
                  btnStyle = 'bg-slate-100/70 border-slate-200 text-slate-500 opacity-75';
                }
              }

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={hasAnswered}
                  onClick={() => setSelectedOption(idx)}
                  className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                    !hasAnswered ? 'cursor-pointer' : 'cursor-default'
                  } ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {hasAnswered && isAnswer && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {hasAnswered && isChosen && !isAnswer && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-150 ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-sky-50 border-sky-200 text-slate-800'
              }`}
            >
              <div className="font-black flex items-center gap-1.5 mb-1">
                <Award
                  className={`w-4 h-4 shrink-0 ${
                    isCorrect ? 'text-emerald-600' : 'text-[#0078D4]'
                  }`}
                />
                <span>
                  {isCorrect
                    ? 'Spot on! Fun Azure Cloud Fact:'
                    : 'Good guess! Fun Azure Cloud Fact:'}
                </span>
              </div>
              <p>{trivia.funFact}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={timer.dismissBreakModal}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
        >
          {timer.phase === 'break' && timer.isRunning
            ? 'Minimize & Continue 5m Break'
            : 'Dismiss'}
        </button>

        <button
          type="button"
          onClick={timer.skipBreakAndStartNextFocus}
          className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Start Next {timer.blockMinutes}m Focus Block</span>
        </button>
      </div>
    </ResponsiveModalContainer>
  );
};
