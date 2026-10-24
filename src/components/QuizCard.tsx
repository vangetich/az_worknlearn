import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Bookmark,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Info,
  Check,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  Maximize2,
  Minimize2,
  FileText,
  Zap,
  Users,
  Volume2,
  VolumeX,
  Square,
  Share2,
  Clock,
  Timer,
  StickyNote,
  Trash2,
  Filter,
  Mic,
  MicOff,
  ShieldCheck,
  Lock,
  Unlock,
  QrCode,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';
import { KeyConceptSidePanel, extractScenarioTerminology } from './KeyConceptSidePanel';
import { ScenarioTextWithTooltips } from './ScenarioTextWithTooltips';
import { QuickNotesDrawer } from './QuickNotesDrawer';
import { getQuestionNote, saveQuestionNote } from '../utils/storage';
import { ShareQuestionModal } from './ShareQuestionModal';
import { QuickStudyOverlay } from './QuickStudyOverlay';
import { DeepWorkTimerWidget } from './DeepWorkTimerWidget';

interface QuizCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (questionId: string, selectedAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onBookmark: (questionId: string) => void;
  isBookmarked: boolean;
  onAskTutorAboutQuestion?: (question: Question) => void;
  stats?: UserStats;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  dynamicDifficulty?: 'Fundamental' | 'Intermediate' | 'Advanced';
  consecutiveStreak?: number;
  isDynamicDifficultyEnabled?: boolean;
  onToggleDynamicDifficulty?: () => void;
  lockedDifficulty?: 'Fundamental' | 'Intermediate' | 'Advanced' | null;
  onChangeLockedDifficulty?: (nextLock: 'Fundamental' | 'Intermediate' | 'Advanced' | null) => void;
  selectedDifficultyFilter?: 'all' | 'Fundamental' | 'Intermediate' | 'Advanced';
  onSelectDifficultyFilter?: (nextFilter: 'all' | 'Fundamental' | 'Intermediate' | 'Advanced') => void;
  onOpenStudyRoom?: () => void;
  onFinishSession?: () => void;
  onOpenPersonalizedReview?: () => void;
  unresolvedMistakesCount?: number;
  sessionAnsweredCount?: number;
  onToggleRetryIncorrectInPath?: (pathId: 1 | 2 | 3) => void;
  isRetryingIncorrectInPath?: boolean;
  incorrectCountInCurrentPath?: number;
}

const EXAM_SIMULATION_DURATION_SECONDS = 45 * 60; // 45:00 standard AZ-900 exam duration

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  onNext,
  onPrev,
  onBookmark,
  isBookmarked,
  onAskTutorAboutQuestion,
  stats,
  isFocusMode = false,
  onToggleFocusMode,
  dynamicDifficulty,
  consecutiveStreak = 0,
  isDynamicDifficultyEnabled = false,
  onToggleDynamicDifficulty,
  lockedDifficulty = null,
  onChangeLockedDifficulty,
  selectedDifficultyFilter = 'all',
  onSelectDifficultyFilter,
  onOpenStudyRoom,
  onFinishSession,
  onOpenPersonalizedReview,
  unresolvedMistakesCount = 0,
  sessionAnsweredCount = 0,
  onToggleRetryIncorrectInPath,
  isRetryingIncorrectInPath = false,
  incorrectCountInCurrentPath = 0,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [showKnowledgeCheck, setShowKnowledgeCheck] = useState<boolean>(false);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [showQuickNotes, setShowQuickNotes] = useState<boolean>(false);
  const [questionNoteText, setQuestionNoteText] = useState<string>(() => getQuestionNote(question.id));
  const [hasNote, setHasNote] = useState<boolean>(() => Boolean(getQuestionNote(question.id)));
  const [noteSavedFeedback, setNoteSavedFeedback] = useState<boolean>(false);
  const [retryNoticeMessage, setRetryNoticeMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareCopiedToast, setShareCopiedToast] = useState<boolean>(false);
  const [showQuickStudy, setShowQuickStudy] = useState<boolean>(false);

  // Local fallback state for permanent difficulty lock if parent doesn't control it
  const [localLockedDifficulty, setLocalLockedDifficulty] = useState<
    'Fundamental' | 'Intermediate' | 'Advanced' | null
  >(() => {
    try {
      const saved = localStorage.getItem('az900_locked_difficulty');
      if (saved === 'Fundamental' || saved === 'Intermediate' || saved === 'Advanced') {
        return saved;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const activeLockedDifficulty =
    onChangeLockedDifficulty !== undefined ? lockedDifficulty : localLockedDifficulty;

  const handleSetLockedDifficulty = (
    level: 'Fundamental' | 'Intermediate' | 'Advanced' | null
  ) => {
    if (onChangeLockedDifficulty) {
      onChangeLockedDifficulty(level);
    } else {
      setLocalLockedDifficulty(level);
      try {
        if (level) {
          localStorage.setItem('az900_locked_difficulty', level);
        } else {
          localStorage.removeItem('az900_locked_difficulty');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Multi-state difficulty badge cycle handler (Fundamental -> Intermediate -> Advanced -> All)
  const handleCycleDifficultyBadgeFilter = () => {
    if (!onSelectDifficultyFilter) return;
    const cycleOrder: Array<'all' | 'Fundamental' | 'Intermediate' | 'Advanced'> = [
      'all',
      'Fundamental',
      'Intermediate',
      'Advanced',
    ];
    const currentIndex = cycleOrder.indexOf(selectedDifficultyFilter);
    const nextFilter = cycleOrder[(currentIndex + 1) % cycleOrder.length];
    onSelectDifficultyFilter(nextFilter);
  };

  // Instant Share Deep-Link Copy Handler
  const handleShareDeepLinkCopy = async () => {
    if (typeof window === 'undefined') return;
    const deepLinkUrl = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(
      question.id
    )}&path=${question.learningPathId}&mod=${question.moduleId}`;

    try {
      window.history.replaceState(
        null,
        '',
        `?q=${encodeURIComponent(question.id)}&path=${question.learningPathId}&mod=${question.moduleId}`
      );
    } catch {
      // ignore history errors in restricted iframes
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(deepLinkUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = deepLinkUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setShareCopiedToast(true);
      setTimeout(() => setShareCopiedToast(false), 2600);
    } catch {
      // Fallback: open share modal if clipboard is blocked
      setShowShareModal(true);
    }
  };

  // Global Toggle: 'study' (Study Mode: immediate feedback, hints, distractor explanations)
  // vs 'exam' (Exam Simulation Mode: no hints, no immediate feedback, live Time Remaining countdown)
  const [quizCardMode, setQuizCardMode] = useState<'study' | 'exam'>(() => {
    try {
      const saved = localStorage.getItem('az900_quiz_card_mode');
      return saved === 'exam' ? 'exam' : 'study';
    } catch {
      return 'study';
    }
  });
  const [examFeedbackRevealed, setExamFeedbackRevealed] = useState<boolean>(false);

  // Exam Simulation Mode 'Time Remaining' Countdown Timer (45:00 certification pressure timer)
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('az900_exam_sim_time_remaining');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return EXAM_SIMULATION_DURATION_SECONDS;
  });

  // Tick down 'Time Remaining' every second when in Exam Simulation Mode
  React.useEffect(() => {
    if (quizCardMode !== 'exam') return;
    const countdownInterval = setInterval(() => {
      setExamTimeRemaining((prev) => {
        const nextVal = Math.max(0, prev - 1);
        try {
          sessionStorage.setItem('az900_exam_sim_time_remaining', String(nextVal));
        } catch {
          // ignore
        }
        return nextVal;
      });
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [quizCardMode]);

  const handleResetExamCountdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExamTimeRemaining(EXAM_SIMULATION_DURATION_SECONDS);
    try {
      sessionStorage.setItem(
        'az900_exam_sim_time_remaining',
        String(EXAM_SIMULATION_DURATION_SECONDS)
      );
    } catch {
      // ignore
    }
  };

  const handleToggleQuizCardMode = (nextMode: 'study' | 'exam') => {
    setQuizCardMode(nextMode);
    try {
      localStorage.setItem('az900_quiz_card_mode', nextMode);
    } catch (e) {
      console.error(e);
    }
    if (nextMode === 'exam') {
      setShowKnowledgeCheck(false);
      setShowQuickStudy(false);
      if (examTimeRemaining === 0) {
        setExamTimeRemaining(EXAM_SIMULATION_DURATION_SECONDS);
      }
    }
  };

  // SpeechRecognition API state for hands-free Study Notes dictation
  const [isRecordingNote, setIsRecordingNote] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  const [isDeepWorkEnabled, setIsDeepWorkEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('az900_deep_work_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleDeepWork = () => {
    setIsDeepWorkEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('az900_deep_work_enabled', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Per-Question Exam Readiness Timer & Rolling Average Completion Time
  const QUESTION_TIMING_STORAGE_KEY = 'az900_question_timing_v1';
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [avgCompletionSeconds, setAvgCompletionSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(QUESTION_TIMING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.count > 0 && parsed.totalSeconds > 0) {
          return Math.max(10, Math.round(parsed.totalSeconds / parsed.count));
        }
      }
    } catch {
      // ignore storage errors
    }
    return 45; // Default AZ-900 exam benchmark: 45s per question
  });

  const scenarioConcepts = React.useMemo(() => extractScenarioTerminology(question), [question]);

  // Reset state, question timer, study note & cancel audio when question changes
  React.useEffect(() => {
    setSelectedOption(null);
    setHasSubmitted(false);
    setExamFeedbackRevealed(false);
    setElapsedSeconds(0);
    setShowKnowledgeCheck(false);
    setSelectedConceptId(null);
    const savedNote = getQuestionNote(question.id);
    setQuestionNoteText(savedNote);
    setHasNote(Boolean(savedNote.trim()));
    setNoteSavedFeedback(false);
    setRetryNoticeMessage(null);
    setSpeechError(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsRecordingNote(false);
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [question.id]);

  const handleInlineNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setQuestionNoteText(nextVal);
    saveQuestionNote(question.id, nextVal);
    setHasNote(Boolean(nextVal.trim()));
    setNoteSavedFeedback(true);
  };

  const handleClearInlineNote = () => {
    setQuestionNoteText('');
    saveQuestionNote(question.id, '');
    setHasNote(false);
    setNoteSavedFeedback(false);
  };

  // Toggle SpeechRecognition API dictation for Study Notes
  const handleToggleVoiceNote = () => {
    setSpeechError(null);
    if (isRecordingNote && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsRecordingNote(false);
      return;
    }

    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      setSpeechError(
        'Voice dictation (SpeechRecognition API) is not supported in this browser. Try Chrome or Edge.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecordingNote(true);
      };

      recognition.onresult = (event: any) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (newTranscript.trim()) {
          setQuestionNoteText((prev) => {
            const combined = prev.trim()
              ? `${prev.trim()} ${newTranscript.trim()}`
              : newTranscript.trim();
            saveQuestionNote(question.id, combined);
            setHasNote(Boolean(combined.trim()));
            setNoteSavedFeedback(true);
            return combined;
          });
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted') {
          setSpeechError(`Voice input stopped (${event.error || 'microphone permission required'}).`);
        }
        setIsRecordingNote(false);
      };

      recognition.onend = () => {
        setIsRecordingNote(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechError('Could not start microphone transcription.');
      setIsRecordingNote(false);
    }
  };

  const handleRetryIncorrectClick = () => {
    if (!onToggleRetryIncorrectInPath) return;
    if (!isRetryingIncorrectInPath && incorrectCountInCurrentPath === 0) {
      setRetryNoticeMessage(
        `You currently have 0 missed questions in Learning Path ${question.learningPathId}. Answer questions in this path first—any missed questions will automatically be queued for Retry Incorrect!`
      );
      return;
    }
    setRetryNoticeMessage(null);
    onToggleRetryIncorrectInPath(question.learningPathId);
  };

  // Increment per-question timer every second until user submits an answer
  React.useEffect(() => {
    if (hasSubmitted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasSubmitted, question.id]);

  // Cancel speech on unmount
  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  // Color-code timer (Green -> Amber -> Red) based on average completion time
  const timerRatio = avgCompletionSeconds > 0 ? elapsedSeconds / avgCompletionSeconds : 0;
  const timerPaceZone: 'green' | 'amber' | 'red' =
    timerRatio <= 0.75 ? 'green' : timerRatio <= 1.15 ? 'amber' : 'red';

  const timerColorConfig = {
    green: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500/20',
      icon: 'text-emerald-600',
      dot: 'bg-emerald-500',
      bar: 'from-emerald-500 to-teal-500',
      label: 'Optimal Exam Pace',
    },
    amber: {
      badge: 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-500/25',
      icon: 'text-amber-600',
      dot: 'bg-amber-500',
      bar: 'from-amber-400 to-orange-500',
      label: 'Near Average Pace',
    },
    red: {
      badge: 'bg-rose-50 text-rose-900 border-rose-300 ring-2 ring-rose-500/25',
      icon: 'text-rose-600 animate-pulse',
      dot: 'bg-rose-600 animate-ping',
      bar: 'from-rose-500 to-red-600',
      label: 'Over Average Time',
    },
  }[timerPaceZone];

  const handleToggleReadQuestion = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const optionsText = question.options
      .map((o) => `Option ${o.letter}: ${o.text}`)
      .join('. ');
    const speechText = `Scenario context: ${question.scenario}. Question: ${question.question}. Choices: ${optionsText}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelect = (letter: string) => {
    if (hasSubmitted) return;
    setSelectedOption(letter);
    setHasSubmitted(true);

    // Record question completion time to update rolling average
    try {
      const timeSpent = Math.max(1, Math.min(300, elapsedSeconds));
      const raw = localStorage.getItem(QUESTION_TIMING_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : { totalSeconds: 45, count: 1 };
      const nextTotal = (parsed.totalSeconds || 45) + timeSpent;
      const nextCount = (parsed.count || 1) + 1;
      localStorage.setItem(
        QUESTION_TIMING_STORAGE_KEY,
        JSON.stringify({ totalSeconds: nextTotal, count: nextCount })
      );
      setAvgCompletionSeconds(Math.max(10, Math.round(nextTotal / nextCount)));
    } catch {
      // ignore storage errors
    }

    const isCorrect = letter === question.correctAnswer;
    onAnswer(question.id, letter, isCorrect);
  };

  const isAnswered = hasSubmitted && selectedOption !== null;
  const isExamMode = quizCardMode === 'exam';
  const showImmediateFeedback = isAnswered && (!isExamMode || examFeedbackRevealed);
  const isSelectedCorrect = selectedOption === question.correctAnswer;

  // Path styling tags
  const pathColor =
    question.learningPathId === 1
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : question.learningPathId === 2
      ? 'border-blue-200 bg-blue-50 text-blue-800'
      : 'border-orange-200 bg-orange-50 text-orange-800';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 card-elevation overflow-hidden transition-all">
      {/* Top Motif Header Bar */}
      <div className="relative px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Learning Path & Module Badges */}
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${pathColor}`}
          >
            Path {question.learningPathId}: Module {question.moduleId}
          </span>
          <span className="text-xs font-medium text-slate-600 hidden sm:inline">
            {question.moduleTitle}
          </span>

          {/* Clickable Multi-State Difficulty Badge & Filter (Fundamental, Intermediate, Advanced) */}
          <div className="inline-flex items-center rounded-lg border border-slate-200/90 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleCycleDifficultyBadgeFilter}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                question.difficulty === 'Fundamental'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : question.difficulty === 'Intermediate'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
              }`}
              title={`Current Question Difficulty: ${question.difficulty}. Click to cycle multi-state difficulty filter (${
                selectedDifficultyFilter === 'all' ? 'All Difficulties' : `Filtered: ${selectedDifficultyFilter}`
              })`}
            >
              <Filter className="w-2.5 h-2.5 opacity-75" />
              <span>{question.difficulty}</span>
            </button>

            {onSelectDifficultyFilter && (
              <div
                className="inline-flex items-center gap-0.5 pl-1 ml-1 border-l border-slate-200 text-[10px] font-extrabold"
                role="group"
                aria-label="Filter active quiz questions by difficulty level"
              >
                {(['Fundamental', 'Intermediate', 'Advanced'] as const).map((level) => {
                  const isFiltered = selectedDifficultyFilter === level;
                  const shortLabel =
                    level === 'Fundamental' ? 'Fund' : level === 'Intermediate' ? 'Inter' : 'Adv';
                  const activeColor =
                    level === 'Fundamental'
                      ? 'bg-emerald-600 text-white'
                      : level === 'Intermediate'
                      ? 'bg-[#0078D4] text-white'
                      : 'bg-purple-600 text-white';

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        onSelectDifficultyFilter(isFiltered ? 'all' : level)
                      }
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        isFiltered
                          ? `${activeColor} shadow-2xs`
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title={
                        isFiltered
                          ? `Showing only ${level} questions. Click to show all difficulties.`
                          : `Filter active quiz questions to ${level} difficulty only`
                      }
                    >
                      {shortLabel}
                    </button>
                  );
                })}
                {selectedDifficultyFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => onSelectDifficultyFilter('all')}
                    className="px-1 py-0.5 rounded text-rose-600 hover:bg-rose-50 font-black cursor-pointer"
                    title="Clear difficulty filter (show all)"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {question.isAiGenerated && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300">
              <Sparkles className="w-3 h-3 text-amber-600" />
              AI Scenario
            </span>
          )}

          {/* Dynamic Difficulty Scaling & Permanent Difficulty Lock UI Toggle */}
          <div className="inline-flex items-center rounded-lg border border-slate-200/90 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                if (activeLockedDifficulty !== null) {
                  handleSetLockedDifficulty(null);
                } else if (onToggleDynamicDifficulty) {
                  onToggleDynamicDifficulty();
                }
              }}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                activeLockedDifficulty !== null
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : isDynamicDifficultyEnabled
                  ? 'bg-sky-50 text-[#0078D4] border border-sky-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
              title={
                activeLockedDifficulty !== null
                  ? `Dynamic Difficulty is permanently locked to ${activeLockedDifficulty} mode. Click to unlock automatic progression.`
                  : 'Dynamic Difficulty: Automatically adjusts based on your consecutive answers, or click a mode to lock permanently.'
              }
            >
              {activeLockedDifficulty !== null ? (
                <Lock className="w-3 h-3 text-amber-700" />
              ) : (
                <Unlock className="w-3 h-3 text-[#0078D4]" />
              )}
              <span>
                {activeLockedDifficulty !== null
                  ? `Locked: ${activeLockedDifficulty}`
                  : `Dynamic: ${dynamicDifficulty || 'Intermediate'}`}
              </span>
              {consecutiveStreak > 0 && (
                <span className="text-[10px] font-black bg-amber-200/90 text-amber-950 px-1 rounded-sm">
                  {consecutiveStreak}🔥
                </span>
              )}
            </button>

            {/* Permanent Lock Mode Selector Buttons (Fundamental / Intermediate / Advanced) */}
            <div
              className="inline-flex items-center gap-0.5 pl-1 ml-1 border-l border-slate-200 text-[10px] font-extrabold"
              role="group"
              aria-label="Permanently lock dynamic difficulty adjustment mode"
            >
              {(['Fundamental', 'Intermediate', 'Advanced'] as const).map((mode) => {
                const isLockedToMode = activeLockedDifficulty === mode;
                const shortMode =
                  mode === 'Fundamental' ? 'F' : mode === 'Intermediate' ? 'I' : 'A';
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      handleSetLockedDifficulty(isLockedToMode ? null : mode)
                    }
                    className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-all cursor-pointer ${
                      isLockedToMode
                        ? 'bg-amber-600 text-white shadow-2xs font-black'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title={
                      isLockedToMode
                        ? `Unlock ${mode} mode and return to automatic difficulty progression`
                        : `Permanently lock dynamic difficulty to ${mode} mode (overrides automatic progression)`
                    }
                  >
                    {isLockedToMode && <Lock className="w-2.5 h-2.5" />}
                    <span>{shortMode}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Counter, Study vs Exam Mode Toggle, Exam Countdown Timer, Share Deep-Link, Focus Mode Toggle and Bookmark */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Global Toggle: Study Mode vs. Exam Simulation Mode */}
          <div
            className="inline-flex items-center p-0.5 rounded-xl bg-slate-200/90 border border-slate-300/80 text-[11px] font-bold shadow-2xs"
            role="group"
            aria-label="Switch between Study Mode and Exam Simulation Mode"
          >
            <button
              type="button"
              onClick={() => handleToggleQuizCardMode('study')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                !isExamMode
                  ? 'bg-[#0078D4] text-white font-extrabold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Study Mode: Immediate answer feedback, hints, and distractor explanations enabled"
            >
              <BookOpen className="w-3 h-3" />
              <span>Study Mode</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleQuizCardMode('exam')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                isExamMode
                  ? 'bg-slate-900 text-amber-300 font-extrabold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exam Simulation Mode: No hints, no immediate answer feedback, and active Time Remaining countdown"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Exam Simulation</span>
            </button>
          </div>

          {/* Exam Simulation Mode 'Time Remaining' Countdown Timer */}
          {isExamMode && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-extrabold shadow-xs transition-all ${
                examTimeRemaining <= 180
                  ? 'bg-rose-950 text-rose-200 border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                  : examTimeRemaining <= 600
                  ? 'bg-amber-950 text-amber-200 border-amber-500 ring-1 ring-amber-400/30'
                  : 'bg-slate-900 text-amber-300 border-slate-700'
              }`}
              title="Certification Exam Simulation Countdown: Official 45-minute AZ-900 exam time pressure"
            >
              <Clock
                className={`w-3.5 h-3.5 ${
                  examTimeRemaining <= 180 ? 'text-rose-400 animate-spin' : 'text-amber-400'
                }`}
              />
              <span className="uppercase tracking-wider text-[10px] text-slate-300">
                Time Remaining:
              </span>
              <span className="font-mono text-xs font-black tracking-tight text-white">
                {examTimeRemaining > 0 ? formatTimer(examTimeRemaining) : '0:00 (Time Up)'}
              </span>
              <button
                type="button"
                onClick={handleResetExamCountdown}
                className="ml-0.5 p-0.5 rounded hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Reset 45:00 Exam Simulation countdown timer"
                aria-label="Reset Exam Simulation countdown timer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Focus Mode Toggle */}
          {onToggleFocusMode && (
            <button
              type="button"
              onClick={onToggleFocusMode}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isFocusMode
                  ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title={
                isFocusMode
                  ? 'Exit Focus Mode: Restore navigation bar and footer'
                  : 'Focus Mode: Hide navigation bar and footer to maximize test-like concentration'
              }
            >
              {isFocusMode ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Focus</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Focus Mode</span>
                </>
              )}
            </button>
          )}

          {/* Read Question (SpeechSynthesis API) Button */}
          <button
            type="button"
            onClick={handleToggleReadQuestion}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isSpeaking
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/40'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
            }`}
            title={
              isSpeaking
                ? 'Stop reading question audio'
                : 'Read question aloud with browser SpeechSynthesis for accessibility'
            }
          >
            {isSpeaking ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current text-white" />
                <span>Stop</span>
                <span className="flex items-center gap-0.5 ml-0.5">
                  <span className="w-1 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-3.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#0078D4]" />
                <span className="hidden sm:inline">Read Question</span>
                <span className="sm:hidden">Read</span>
              </>
            )}
          </button>

          {/* Quick Notes Slide-Out Trigger */}
          <button
            type="button"
            onClick={() => setShowQuickNotes(true)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              hasNote
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs ring-1 ring-amber-400/30'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
            }`}
            title={
              hasNote
                ? 'Open all saved study notes drawer'
                : 'Open study notes drawer'
            }
          >
            <FileText className={`w-3.5 h-3.5 ${hasNote ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Notes</span>
            {hasNote && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          {/* Retry Incorrect in Current Learning Path Button */}
          {onToggleRetryIncorrectInPath && (
            <button
              type="button"
              onClick={handleRetryIncorrectClick}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isRetryingIncorrectInPath
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/40'
                  : incorrectCountInCurrentPath > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-2xs'
              }`}
              title={
                isRetryingIncorrectInPath
                  ? `Showing only missed questions in Learning Path ${question.learningPathId}. Click to restore all path questions.`
                  : `Filter this quiz session to only show your previously missed questions in Learning Path ${question.learningPathId} (${incorrectCountInCurrentPath} missed)`
              }
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${
                  isRetryingIncorrectInPath
                    ? 'text-white'
                    : incorrectCountInCurrentPath > 0
                    ? 'text-rose-600'
                    : 'text-slate-400'
                }`}
              />
              <span>{isRetryingIncorrectInPath ? 'Exit Retry Incorrect' : 'Retry Incorrect'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isRetryingIncorrectInPath
                    ? 'bg-white/25 text-white'
                    : incorrectCountInCurrentPath > 0
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {incorrectCountInCurrentPath} • P{question.learningPathId}
              </span>
            </button>
          )}

          {/* Virtual Study Room Trigger */}
          {onOpenStudyRoom && (
            <button
              type="button"
              onClick={onOpenStudyRoom}
              className="px-2.5 py-1 rounded-lg border border-sky-200 bg-sky-50/80 hover:bg-sky-100 text-[#0078D4] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Open Virtual Study Room to discuss this question with peers"
            >
              <Users className="w-3.5 h-3.5 text-[#0078D4]" />
              <span className="hidden sm:inline">Study Room</span>
            </button>
          )}

          {/* Quick Study Toggle: Frequently Missed Key Terms (Hidden in Exam Simulation Mode) */}
          {!isExamMode && (
            <button
              type="button"
              onClick={() => setShowQuickStudy(!showQuickStudy)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showQuickStudy
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/40'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title={showQuickStudy ? 'Hide Quick Study overlay' : 'Toggle Quick Study: displays only the most frequently missed key terms for this module'}
            >
              <Zap className={`w-3.5 h-3.5 ${showQuickStudy ? 'text-amber-200 fill-amber-200' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">Quick Study</span>
              <span className="sm:hidden">Terms</span>
              {showQuickStudy && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </button>
          )}

          {/* Share Question Icon Button (Generates & Copies Deep-Link URL Directly to Clipboard + QR Option) */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={handleShareDeepLinkCopy}
              className={`px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                shareCopiedToast
                  ? 'bg-emerald-600 text-white'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="Copy Deep-Link URL to clipboard: Opens this specific question and its Learning Path directly"
              aria-label="Share question deep-link URL to clipboard"
            >
              {shareCopiedToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="px-1.5 py-1 border-l border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-[#0078D4] transition-colors cursor-pointer"
              title="Open QR Code & Study Peer Share Modal"
              aria-label="Open QR Code Share Modal"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Deep Work Timer Toggle */}
          <button
            type="button"
            onClick={handleToggleDeepWork}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isDeepWorkEnabled
                ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/40'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
            }`}
            title={
              isDeepWorkEnabled
                ? 'Hide Deep Work timer'
                : 'Enable Deep Work timer: tracks active study time per module session and provides gentle daily goal summary'
            }
          >
            <Clock className={`w-3.5 h-3.5 ${isDeepWorkEnabled ? 'text-blue-200' : 'text-[#0078D4]'}`} />
            <span className="hidden sm:inline">Deep Work</span>
            <span className="sm:hidden">Timer</span>
            {isDeepWorkEnabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          {/* Visible Color-Coded Question Timer Badge (Green -> Amber -> Red) */}
          <div
            className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold transition-colors duration-300 flex items-center gap-1.5 shadow-2xs ${timerColorConfig.badge}`}
            title={`Question Timer: ${formatTimer(elapsedSeconds)} spent vs. ${formatTimer(
              avgCompletionSeconds
            )} average completion time (${timerColorConfig.label})`}
          >
            <Timer className={`w-3.5 h-3.5 ${timerColorConfig.icon}`} />
            <span className="font-mono tracking-tight">{formatTimer(elapsedSeconds)}</span>
            <span className="text-[10px] opacity-75 hidden md:inline">
              / avg {formatTimer(avgCompletionSeconds)}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${timerColorConfig.dot}`} />
          </div>

          <span className="text-xs font-bold text-slate-500">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <button
            onClick={() => onBookmark(question.id)}
            className={`p-1.5 rounded-lg border transition-all ${
              isBookmarked
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-400 hover:text-amber-600 border-slate-200'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark for revision'}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Live Color-Coded Question Pace Bar (Green -> Amber -> Red Exam Readiness Indicator) */}
      <div className="px-6 py-2 bg-slate-50/90 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Timer className={`w-3.5 h-3.5 ${timerColorConfig.icon}`} />
            <span>Question Timer:</span>
          </span>
          <span className="font-mono font-black text-slate-900">
            {formatTimer(elapsedSeconds)}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${timerColorConfig.badge}`}
          >
            {hasSubmitted ? `Completed in ${formatTimer(elapsedSeconds)}` : timerColorConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-2.5 grow sm:grow-0 sm:min-w-[240px]">
          <div className="w-full sm:w-36 h-2 rounded-full bg-slate-200/90 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${timerColorConfig.bar} transition-all duration-500`}
              style={{
                width: `${Math.min(100, Math.round((elapsedSeconds / (avgCompletionSeconds * 1.4)) * 100))}%`,
              }}
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">
            Avg Pace: <strong className="text-slate-700">{formatTimer(avgCompletionSeconds)}</strong>
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Optional Deep Work Timer Widget */}
        <DeepWorkTimerWidget
          moduleId={question.moduleId}
          moduleTitle={question.moduleTitle}
          stats={stats}
          isEnabled={isDeepWorkEnabled}
          onToggleEnabled={handleToggleDeepWork}
          className="mb-5"
        />

        {/* Quick Study Non-Obtrusive Overlay: Most Frequently Missed Key Terms for Current Module */}
        {showQuickStudy && (
          <QuickStudyOverlay
            moduleId={question.moduleId}
            moduleTitle={question.moduleTitle}
            onClose={() => setShowQuickStudy(false)}
          />
        )}

        <div className={`grid gap-6 ${showKnowledgeCheck ? 'grid-cols-1 lg:grid-cols-12 items-start' : 'grid-cols-1'}`}>
          {/* Main Question & Answering Column */}
          <div className={`space-y-6 ${showKnowledgeCheck ? 'lg:col-span-8' : 'w-full'}`}>
            {/* Scenario Narrative Box */}
            <div className="relative bg-slate-50/80 rounded-xl p-5 border-l-4 border-[#0078D4] border-t border-r border-b border-slate-200/60 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 grow">
                  <div className="p-2 rounded-lg bg-blue-100/70 text-[#0078D4] shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="grow">
                    <h3 className="text-xs font-bold tracking-wider uppercase text-blue-900 mb-1.5 flex items-center gap-1.5 flex-wrap">
                      <span>Scenario Context</span>
                      <span className="text-[10px] text-slate-400 font-normal lowercase">(hover/click highlighted terms for quick concept definition)</span>
                    </h3>
                    <ScenarioTextWithTooltips
                      text={question.scenario}
                      concepts={scenarioConcepts}
                      onSelectConcept={setSelectedConceptId}
                      isKnowledgeCheckActive={showKnowledgeCheck}
                      onActivateKnowledgeCheck={() => setShowKnowledgeCheck(true)}
                    />
                  </div>
                </div>

                {/* Knowledge Check Toggle Switch (Hidden in Exam Simulation Mode) */}
                {!isExamMode ? (
                  <button
                    type="button"
                    onClick={() => setShowKnowledgeCheck(!showKnowledgeCheck)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs shrink-0 self-start ${
                      showKnowledgeCheck
                        ? 'bg-gradient-to-r from-blue-50 to-sky-50 text-[#0078D4] border-sky-300 ring-2 ring-sky-400/20'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                    title="Toggle concise Key Concept Definition side-panel for core Azure terminology in this scenario"
                  >
                    <BookOpen className={`w-3.5 h-3.5 ${showKnowledgeCheck ? 'text-[#0078D4]' : 'text-slate-400'}`} />
                    <span>Knowledge Check</span>

                    {/* Toggle Pill Slider */}
                    <div
                      className={`w-7 h-4 rounded-full transition-colors flex items-center p-0.5 ${
                        showKnowledgeCheck ? 'bg-[#0078D4]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                          showKnowledgeCheck ? 'translate-x-3' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-900 text-amber-300 border border-slate-700 shrink-0 self-start">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Exam Mode • Hints Disabled</span>
                  </span>
                )}
              </div>
            </div>

        {/* Actual Exam Question */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {question.question}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose the single best answer that meets all architectural criteria:
          </p>
        </div>

        {/* 4 Choices (A, B, C, D) */}
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = selectedOption === option.letter;
            const isCorrectOption = option.letter === question.correctAnswer;

            let cardStyles =
              'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-800';
            let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-300';

            if (showImmediateFeedback) {
              if (isCorrectOption) {
                cardStyles =
                  'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20';
                badgeStyles = 'bg-emerald-600 text-white border-emerald-600';
              } else if (isSelected && !isCorrectOption) {
                cardStyles =
                  'border-red-400 bg-red-50/80 text-red-950 ring-2 ring-red-400/20';
                badgeStyles = 'bg-red-600 text-white border-red-600';
              } else {
                cardStyles = 'border-slate-200 bg-slate-50/40 text-slate-400 opacity-60';
                badgeStyles = 'bg-slate-200 text-slate-400 border-slate-300';
              }
            } else if (isSelected) {
              cardStyles =
                'border-[#0078D4] bg-blue-50/70 text-blue-900 ring-2 ring-[#0078D4]/20';
              badgeStyles = 'bg-[#0078D4] text-white border-[#0078D4]';
            }

            return (
              <button
                key={option.letter}
                onClick={() => handleSelect(option.letter)}
                disabled={hasSubmitted}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 group ${cardStyles}`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border transition-colors ${badgeStyles}`}
                >
                  {showImmediateFeedback && isCorrectOption ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : showImmediateFeedback && isSelected && !isCorrectOption ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    option.letter
                  )}
                </span>
                <span className="text-sm sm:text-base font-medium pt-1 grow leading-relaxed">
                  {option.text}
                </span>

                {showImmediateFeedback && isCorrectOption && (
                  <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md self-center">
                    Correct Answer
                  </span>
                )}
                {isAnswered && isExamMode && !examFeedbackRevealed && isSelected && (
                  <span className="shrink-0 text-xs font-bold text-[#0078D4] bg-blue-100 px-2.5 py-1 rounded-md self-center">
                    Answer Recorded
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Exam Simulation Mode Locked Answer Banner (No Immediate Feedback) */}
        {isAnswered && isExamMode && !examFeedbackRevealed && (
          <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold block text-white">
                  Exam Simulation Mode: Option {selectedOption} Recorded
                </span>
                <span className="text-slate-300">
                  Immediate feedback and hints are hidden during Exam Simulation Mode. Proceed to the next question or inspect the breakdown below.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExamFeedbackRevealed(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/30 text-xs font-bold transition-colors cursor-pointer"
              >
                Reveal Explanation
              </button>
              {questionIndex < totalQuestions - 1 && (
                <button
                  type="button"
                  onClick={onNext}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active 'Retry Incorrect' Filter Banner or Info Notice */}
        {(isRetryingIncorrectInPath || retryNoticeMessage) && (
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 text-xs ${
              isRetryingIncorrectInPath
                ? 'bg-rose-50/90 border-rose-300 text-rose-900'
                : 'bg-amber-50/90 border-amber-300 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <Filter
                className={`w-4 h-4 shrink-0 ${
                  isRetryingIncorrectInPath ? 'text-rose-600' : 'text-amber-600'
                }`}
              />
              <span>
                {isRetryingIncorrectInPath
                  ? `Filtered to Previously Missed Questions in Learning Path ${question.learningPathId} (${questionIndex + 1} of ${totalQuestions})`
                  : retryNoticeMessage}
              </span>
            </div>
            {isRetryingIncorrectInPath ? (
              <button
                type="button"
                onClick={() =>
                  onToggleRetryIncorrectInPath &&
                  onToggleRetryIncorrectInPath(question.learningPathId)
                }
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[11px] transition-colors cursor-pointer"
              >
                Show All Path {question.learningPathId} Questions
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRetryNoticeMessage(null)}
                className="px-2 py-0.5 rounded bg-white/80 hover:bg-white text-amber-900 border border-amber-300 font-bold text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* INLINE PERSONAL STUDY NOTES TEXT-AREA (Persisted to LocalStorage per Question) */}
        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 p-4 space-y-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={`study-note-textarea-${question.id}`}
              className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900 cursor-pointer"
            >
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200/80">
                <StickyNote className="w-3.5 h-3.5" />
              </span>
              <span>Personal Study Notes • Question {question.id.toUpperCase()}</span>
              {hasNote && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Check className="w-2.5 h-2.5" />
                  {noteSavedFeedback ? 'Saved to LocalStorage' : 'Saved Note'}
                </span>
              )}
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {/* Browser SpeechRecognition API Microphone Button for Hands-Free Study Notes */}
              <button
                type="button"
                onClick={handleToggleVoiceNote}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                  isRecordingNote
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/40 animate-pulse'
                    : 'bg-white hover:bg-blue-50 text-[#0078D4] border-blue-200 shadow-2xs'
                }`}
                title={
                  isRecordingNote
                    ? 'Stop voice transcription'
                    : 'Record and transcribe your study notes hands-free using browser SpeechRecognition'
                }
              >
                {isRecordingNote ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-white" />
                    <span>Stop Dictation</span>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Voice Note</span>
                  </>
                )}
              </button>

              {hasNote && (
                <button
                  type="button"
                  onClick={handleClearInlineNote}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  title="Clear personal note for this question"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowQuickNotes(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <FileText className="w-3 h-3 text-amber-600" />
                <span>All Saved Notes</span>
              </button>
            </div>
          </div>

          {speechError && (
            <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center justify-between gap-2">
              <span>{speechError}</span>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              id={`study-note-textarea-${question.id}`}
              value={questionNoteText}
              onChange={handleInlineNoteChange}
              rows={2}
              placeholder={
                isRecordingNote
                  ? 'Listening... Speak your study note clearly to transcribe hands-free...'
                  : `Attach your personal study notes, memory hooks, or click 'Voice Note' to dictate hands-free for ${question.moduleTitle} (${question.id.toUpperCase()})...`
              }
              className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-y leading-relaxed ${
                isRecordingNote
                  ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500 focus:border-rose-500'
                  : 'border-amber-200/90 bg-white/95 focus:ring-[#0078D4] focus:border-[#0078D4]'
              }`}
            />
            <button
              type="button"
              onClick={handleToggleVoiceNote}
              className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                isRecordingNote
                  ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                  : 'text-slate-400 hover:text-[#0078D4] hover:bg-blue-50'
              }`}
              title={
                isRecordingNote
                  ? 'Stop hands-free voice dictation'
                  : 'Dictate study note with microphone (SpeechRecognition API)'
              }
              aria-label="Toggle microphone voice dictation for study notes"
            >
              {isRecordingNote ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {isRecordingNote ? (
                <strong className="text-rose-600 animate-pulse">
                  ● Recording &amp; transcribing speech into your study note...
                </strong>
              ) : (
                <>
                  Persisted automatically in browser local storage for Question{' '}
                  <strong className="text-slate-700">{question.id.toUpperCase()}</strong>
                </>
              )}
            </span>
            <span>{questionNoteText.length} chars</span>
          </div>
        </div>

        {/* INSTANT FEEDBACK & BREAKDOWN ENGINE (Shown immediately in Study Mode, or when revealed in Exam Mode) */}
        {showImmediateFeedback && (
          <div className="mt-8 space-y-5 animate-feedback-entrance">
            {/* Status Header Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-cascade-1 ${
                isSelectedCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {isSelectedCorrect ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-base">
                    {isSelectedCorrect
                      ? 'Spot On! Correct Choice.'
                      : `Not Quite. The correct answer is ${question.correctAnswer}`}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Review the Azure Curriculum architecture breakdown below:
                  </p>
                </div>
              </div>

              {onAskTutorAboutQuestion && (
                <button
                  onClick={() => onAskTutorAboutQuestion(question)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-amber-500 hover:text-amber-700 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ask AI Tutor</span>
                </button>
              )}
            </div>

            {/* If Incorrect: Targeted Diagnostic Analysis */}
            {!isSelectedCorrect && selectedOption && (
              <div className="bg-red-50/70 rounded-xl p-5 border border-red-200 space-y-2.5 animate-cascade-2">
                <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                    !
                  </span>
                  <span>Diagnostic Breakdown: Where & Why You Stumbled</span>
                </div>
                <div className="text-xs sm:text-sm text-red-950 bg-white/80 p-3.5 rounded-lg border border-red-200/60 leading-relaxed">
                  <span className="font-bold text-red-700 block mb-1">
                    Your Selection: Option {selectedOption}
                  </span>
                  {question.distractorBreakdown.find((d) => d.letter === selectedOption)?.reason ||
                    'This option does not satisfy all architectural constraints in the scenario.'}
                </div>
                <div className="text-xs text-red-800 flex items-center gap-1.5 pt-1 font-medium">
                  <span className="font-bold">Corrective Prescription:</span>
                  <span>Review the constraints in the scenario carefully before deciding between IaaS, PaaS, or SaaS boundaries.</span>
                </div>
              </div>
            )}

            {/* Why It's Correct */}
            <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-200 animate-cascade-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Why Option {question.correctAnswer} is Correct:</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-normal">
                {question.whyCorrect}
              </p>
            </div>

            {/* Why Other Options Are Incorrect (Distractor Breakdown) */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 animate-cascade-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-3">
                <XCircle className="w-4 h-4 text-slate-500" />
                <span>Why Other Options Are Incorrect (Exam Distractors):</span>
              </div>

              <div className="space-y-2.5">
                {question.distractorBreakdown.map((distractor) => (
                  <div
                    key={distractor.letter}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 p-2.5 rounded-lg bg-white border border-slate-200/70"
                  >
                    <span className="font-bold text-red-600 shrink-0 px-1.5 py-0.5 bg-red-50 rounded border border-red-200 text-xs">
                      Option {distractor.letter}
                    </span>
                    <p className="leading-relaxed font-normal">{distractor.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam Tip Card - Savannah Gold / Warm Ochre */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-amber-50/80 to-yellow-50 rounded-xl p-5 border border-amber-300/80 shadow-xs animate-cascade-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-extrabold text-xs tracking-wider uppercase text-amber-900">
                      💡 Exam Anchor Tip
                    </h5>
                    <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded font-semibold">
                      High Yield
                    </span>
                  </div>
                  <p className="text-amber-950 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
                    {question.examTip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onPrev}
            disabled={questionIndex === 0}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct 'Retry Incorrect' Button in Footer for Current Learning Path */}
            {onToggleRetryIncorrectInPath && (
              <button
                type="button"
                onClick={handleRetryIncorrectClick}
                className={`px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isRetryingIncorrectInPath
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-xs'
                    : incorrectCountInCurrentPath > 0
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
                title={`Filter current quiz session to only show previously missed questions in Learning Path ${question.learningPathId}`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {isRetryingIncorrectInPath
                    ? `Exit Retry Incorrect (Path ${question.learningPathId})`
                    : `Retry Incorrect (${incorrectCountInCurrentPath} in Path ${question.learningPathId})`}
                </span>
              </button>
            )}

            {isAnswered && (
              <button
                onClick={() => {
                  setSelectedOption(null);
                  setHasSubmitted(false);
                }}
                className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset and re-attempt this specific question"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-Attempt Question</span>
              </button>
            )}

            {onFinishSession && (isAnswered || sessionAnsweredCount > 0 || questionIndex === totalQuestions - 1) && (
              <button
                type="button"
                onClick={onFinishSession}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Conclude this quiz session, identify your lowest-scoring modules, and generate a separate Weak-Area Review question set"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Finish Session &amp; Review Weak Areas</span>
              </button>
            )}

            {questionIndex < totalQuestions - 1 && (
              <button
                onClick={onNext}
                className="px-5 py-2.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Right Side-Panel: Concise Key Concept Definition specifically for this scenario */}
        {showKnowledgeCheck && (
          <div className="lg:col-span-4 sticky top-4">
            <KeyConceptSidePanel
              question={question}
              isOpen={showKnowledgeCheck}
              onClose={() => setShowKnowledgeCheck(false)}
              selectedConceptId={selectedConceptId}
              onSelectConceptId={setSelectedConceptId}
              onAskTutor={onAskTutorAboutQuestion}
            />
          </div>
        )}
      </div>
    </div>

    {/* Quick Notes Slide-Out Panel */}
    <QuickNotesDrawer
      question={question}
      isOpen={showQuickNotes}
      onClose={() => setShowQuickNotes(false)}
      onNoteSaved={(txt) => {
        setQuestionNoteText(txt);
        setHasNote(Boolean(txt.trim()));
      }}
    />

    {/* Share Question Modal (Link & QR Code) */}
    <ShareQuestionModal
      question={question}
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
    />
  </div>
);
};
