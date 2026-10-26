import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LogOut,
  X,
  Share2,
  Download,
  FileText,
  FileCode,
  CheckCircle2,
  Award,
  Sparkles,
  Flame,
  Clock,
  Send,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { calculateDomainConfidence } from '../utils/storage';
import { generateDomainConfidencePdf } from '../utils/pdfGenerator';
import { MaasaiMedallion, MoranShieldMotif, KitengeRibbon } from './MotifDecorations';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';

interface ExitStudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSignOut: () => void;
  stats: UserStats;
  userEmail?: string | null;
  userName?: string | null;
  todayAnsweredCount?: number;
}

const COUNTDOWN_SECONDS = 17;

const AFRICAN_EXIT_PROVERBS = [
  {
    swahili: 'Safari ya siku elfu moja huanza na hatua moja.',
    english: 'A journey of a thousand miles begins with a single step.',
    origin: 'East African Wisdom',
  },
  {
    swahili: 'Haba na haba, hujaza kibaba.',
    english: 'Little by little fills the measure — your daily consistency guarantees success.',
    origin: 'Swahili Proverb',
  },
  {
    swahili: 'Mti wenye matunda ndio hupigwa mawe.',
    english: 'A tree that bears good fruit is the one worth climbing — keep sharpening your Azure craft.',
    origin: 'Kenyan Wisdom',
  },
  {
    swahili: 'Mvumilivu hula mbivu.',
    english: 'The patient and disciplined one eats the ripe fruit — 700+ is within your reach!',
    origin: 'Coastal Heritage',
  },
];

export const ExitStudySessionModal: React.FC<ExitStudySessionModalProps> = ({
  isOpen,
  onClose,
  onConfirmSignOut,
  stats,
  userEmail,
  userName,
  todayAnsweredCount = 0,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(COUNTDOWN_SECONDS);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [whatsappCopied, setWhatsappCopied] = useState<boolean>(false);
  const [jsonDownloaded, setJsonDownloaded] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);
  const [customPhone, setCustomPhone] = useState<string>('');

  const randomProverb = useMemo(() => {
    const idx = Math.floor(Math.random() * AFRICAN_EXIT_PROVERBS.length);
    return AFRICAN_EXIT_PROVERBS[idx];
  }, [isOpen]);

  const overallAccuracy = useMemo(() => {
    return stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;
  }, [stats.totalAnswered, stats.totalCorrect]);

  const estimatedScaledScore = Math.round((overallAccuracy / 100) * 1000);
  const isPassingReady = estimatedScaledScore >= 700;
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute weakest module for next session focus recommendation
  const weakestModuleInfo = useMemo(() => {
    let lowestPct = 101;
    let target = {
      id: 4,
      title: 'Azure Compute & Networking Services',
      pathId: 2,
    };

    LEARNING_PATHS.forEach((p) => {
      p.modules.forEach((m) => {
        const modStat = stats.moduleMastery[m.id];
        if (modStat && modStat.total > 0) {
          const pct = Math.round((modStat.correct / modStat.total) * 100);
          if (pct < lowestPct) {
            lowestPct = pct;
            target = { id: m.id, title: m.title, pathId: p.id };
          }
        }
      });
    });

    return { ...target, lowestPct: lowestPct === 101 ? null : lowestPct };
  }, [stats.moduleMastery]);

  const completedModulesCount = useMemo(() => {
    return (stats.completedModules || []).length;
  }, [stats.completedModules]);

  // Reset timer on open
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(COUNTDOWN_SECONDS);
      setIsPaused(false);
      setWhatsappCopied(false);
      setJsonDownloaded(false);
      setPdfDownloaded(false);
    }
  }, [isOpen]);

  // 17-second countdown effect
  useEffect(() => {
    if (!isOpen || isPaused) return;

    if (secondsRemaining <= 0) {
      onConfirmSignOut();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onConfirmSignOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, secondsRemaining, onConfirmSignOut]);

  // WhatsApp formatted milestone message
  const whatsappMessage = useMemo(() => {
    const learnerDisplayName = userName || (userEmail ? userEmail.split('@')[0] : 'AZ-900 Cloud Scholar');
    return `🌟 *AZ-900 Studio Milestone & Study Summary* 🌟
📅 *Date:* ${todayDateStr}
👤 *Learner:* ${learnerDisplayName}
🔥 *Study Streak:* ${stats.streakDays || 1} Days Active
🎯 *Questions Answered Today:* ${todayAnsweredCount} (Total: ${stats.totalAnswered})
📈 *Overall Accuracy:* ${overallAccuracy}% (Est. Scaled Score: ${estimatedScaledScore}/1000)
🏆 *Curriculum Mastery:* ${completedModulesCount}/12 Modules Mastered
📌 *Next Session Target:* Module ${weakestModuleInfo.id}: ${weakestModuleInfo.title}
💬 *Harambee Wisdom:* "${randomProverb.swahili}" (${randomProverb.english})

🔒 *Status:* All session progress is safely synced to Cloud Firestore & PostgreSQL!
🚀 *AZ-900 Practice Studio:* Keep up the daily consistency to guarantee your 700+ pass!`;
  }, [
    todayDateStr,
    userName,
    userEmail,
    stats.streakDays,
    todayAnsweredCount,
    stats.totalAnswered,
    overallAccuracy,
    estimatedScaledScore,
    completedModulesCount,
    weakestModuleInfo,
    randomProverb,
  ]);

  const handleShareToWhatsApp = () => {
    setIsPaused(true);
    const encoded = encodeURIComponent(whatsappMessage);
    const cleanPhone = customPhone.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    // Use standard window navigation or anchor click
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setWhatsappCopied(true);
    setTimeout(() => setWhatsappCopied(false), 4000);
  };

  const handleDownloadPdf = () => {
    setIsPaused(true);
    try {
      generateDomainConfidencePdf(stats);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3500);
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
  };

  const handleDownloadJson = () => {
    setIsPaused(true);
    try {
      const exportPayload = {
        title: 'AZ-900 Study Session Milestone Snapshot',
        exportedAt: new Date().toISOString(),
        learner: {
          email: userEmail || 'student@az900.ke',
          name: userName || 'AZ-900 Learner',
          streakDays: stats.streakDays,
        },
        progress: {
          totalAnswered: stats.totalAnswered,
          totalCorrect: stats.totalCorrect,
          overallAccuracy,
          estimatedScaledScore,
          isPassingReady,
          todayAnsweredCount,
          completedModulesCount,
        },
        moduleMastery: stats.moduleMastery,
        nextTargetRecommendation: {
          moduleId: weakestModuleInfo.id,
          moduleTitle: weakestModuleInfo.title,
        },
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `az900-milestone-${todayDateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setJsonDownloaded(true);
      setTimeout(() => setJsonDownloaded(false), 3500);
    } catch (e) {
      console.error('Error generating JSON snapshot:', e);
    }
  };

  if (!isOpen) return null;

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / COUNTDOWN_SECONDS) * 100));

  return (
    <ResponsiveModalContainer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      overlayClassName="bg-slate-950/80 backdrop-blur-md"
      containerClassName="relative bg-white dark:bg-[#0B1526] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-sky-200/80 dark:border-sky-500/30"
      ariaLabel="Exit Study Session and Sign Out"
    >
        {/* Kitenge Heritage Top Ribbon Motif */}
        <div className="shrink-0">
          <KitengeRibbon height={5} />
        </div>

        {/* Header Hero Banner with Maasai Medallion & African Proverb */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white">
          {/* Ambient decorative glow */}
          <div
            className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-amber-400/10 pointer-events-none blur-2xl"
            aria-hidden="true"
          />

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0078D4] to-[#004578] shadow-lg shadow-sky-500/30 border border-white/30 shrink-0">
                <MoranShieldMotif size={26} animate={true} />
                <div className="absolute -bottom-1 -right-1">
                  <MaasaiMedallion size={15} />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                    Session Milestone &amp; Safe Exit
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-sky-200 border border-white/20">
                    Cloud Firestore &amp; PostgreSQL Synced
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                  Asante Sana! Excellent Study Effort Today
                </h2>
                <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed max-w-lg mt-0.5">
                  Your questions, module mastery, and daily streak are safely saved. Review your milestone below or send it directly to your phone via WhatsApp before transitioning to sign in.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Cancel exit and continue studying"
              aria-label="Cancel and return to studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Inspirational Positive African Proverb Box */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-950/50 border border-amber-300/30 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-extrabold text-amber-200 italic">
                &ldquo;{randomProverb.swahili}&rdquo;
              </p>
              <p className="text-sky-100/80 text-[11px] mt-0.5">
                {randomProverb.english} <span className="opacity-60">• {randomProverb.origin}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 17-Second Countdown Live Progress Bar */}
        <div className="px-5 py-2.5 bg-sky-50 dark:bg-slate-900 border-b border-sky-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[#0078D4] animate-spin" />
            <span>
              Auto-transitioning to Protected Sign-In in{' '}
              <strong className="text-[#0078D4] dark:text-sky-400 font-mono text-sm">
                {secondsRemaining}s
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
            >
              {isPaused ? 'Resume Timer' : 'Pause Countdown'}
            </button>
            <div className="w-24 sm:w-32 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-[#0078D4] to-emerald-500 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Body: Session Summary & WhatsApp Save Options */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Work Covered KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-slate-900/60 border border-blue-200 dark:border-blue-900/50">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Answered Today
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg sm:text-xl font-black text-[#0078D4]">
                  {todayAnsweredCount}
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  ({stats.totalAnswered} Total)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-slate-900/60 border border-emerald-200 dark:border-emerald-900/50">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Overall Accuracy
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {overallAccuracy}%
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  ({estimatedScaledScore}/1000)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-slate-900/60 border border-amber-200 dark:border-amber-900/50">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Active Streak
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400">
                  {stats.streakDays || 1} Days
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-slate-900/60 border border-purple-200 dark:border-purple-900/50">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Curriculum Mastery
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg sm:text-xl font-black text-purple-700 dark:text-purple-400">
                  {completedModulesCount}
                </span>
                <span className="text-[11px] text-slate-500 font-bold">/ 12 Modules</span>
              </div>
            </div>
          </div>

          {/* Next Target Recommendation Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#0078D4]/10 text-[#0078D4] dark:text-sky-300 shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4]">
                  Recommended Next Drill
                </span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Path {weakestModuleInfo.pathId}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                Module {weakestModuleInfo.id}: {weakestModuleInfo.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Pick up here on your next mobile or laptop session to maintain your learning momentum!
              </p>
            </div>
          </div>

          {/* Offer to Save Work & Send to Phone via WhatsApp */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500 text-white shadow-2xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Send Study Summary to Phone via WhatsApp
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Get your current milestone, score, and next target drill directly on WhatsApp.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                1-Click Mobile Handoff
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="Optional Phone (e.g. +254712345678)"
                className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleShareToWhatsApp}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{whatsappCopied ? 'WhatsApp Opened!' : 'Send to WhatsApp'}</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </button>
            </div>

            {/* Offline & Archival Save Options */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500">Other backup options:</span>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>{pdfDownloaded ? 'PDF Saved!' : 'Download PDF Report'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-600" />
                <span>{jsonDownloaded ? 'JSON Saved!' : 'Export JSON Snapshot'}</span>
              </button>
            </div>
          </div>

          {/* Discrete Security & Compliance Note */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Discrete Session Security:</strong> Your answers, streak, and mastery percentages are safely synchronized with your cloud profile. Session authentication tokens will be securely scrubbed upon transition.
            </span>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel &amp; Continue Studying
          </button>

          <button
            type="button"
            onClick={onConfirmSignOut}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-102"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
            <span>Sign Out &amp; Transition Now ({secondsRemaining}s)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
    </ResponsiveModalContainer>
  );
};
