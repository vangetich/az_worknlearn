import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Pause,
  Play,
  Square,
  Sparkles,
  Headphones,
} from 'lucide-react';
import { Question } from '../types/quiz';

interface QuizTtsBarProps {
  question: Question;
  showExplanation?: boolean;
  externalIsSpeaking?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
}

const TTS_RATE_STORAGE_KEY = 'az900_tts_speech_rate_v1';
const TTS_AUTOREAD_STORAGE_KEY = 'az900_tts_autoread_v1';

const SPEECH_RATES = [0.85, 1.0, 1.15, 1.35];

export const QuizTtsBar: React.FC<QuizTtsBarProps> = ({
  question,
  showExplanation = false,
  onSpeakingChange,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeSegment, setActiveSegment] = useState<
    'full' | 'scenario' | 'question' | 'explanation' | null
  >(null);

  const [speechRate, setSpeechRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(TTS_RATE_STORAGE_KEY);
      const parsed = saved ? parseFloat(saved) : 1.0;
      return !Number.isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0 ? parsed : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [autoReadOnNext, setAutoReadOnNext] = useState<boolean>(() => {
    try {
      return localStorage.getItem(TTS_AUTOREAD_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const updateSpeakingState = (speaking: boolean, paused = false, segment: typeof activeSegment = null) => {
    setIsSpeaking(speaking);
    setIsPaused(paused);
    setActiveSegment(speaking ? segment : null);
    if (onSpeakingChange) {
      onSpeakingChange(speaking);
    }
  };

  const speakText = (
    text: string,
    segment: 'full' | 'scenario' | 'question' | 'explanation',
    rateOverride?: number
  ) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rateOverride ?? speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      updateSpeakingState(true, false, segment);
    };

    utterance.onend = () => {
      updateSpeakingState(false, false, null);
    };

    utterance.onerror = () => {
      updateSpeakingState(false, false, null);
    };

    updateSpeakingState(true, false, segment);
    window.speechSynthesis.speak(utterance);
  };

  const buildFullText = () => {
    const optionsText = question.options
      .map((o) => `Option ${o.letter}: ${o.text}`)
      .join('. ');
    return `Scenario context: ${question.scenario}. Question: ${question.question}. Choices: ${optionsText}`;
  };

  const buildQuestionAndOptionsText = () => {
    const optionsText = question.options
      .map((o) => `Option ${o.letter}: ${o.text}`)
      .join('. ');
    return `Question: ${question.question}. Choices: ${optionsText}`;
  };

  const buildExplanationText = () => {
    return `Correct Answer is Option ${question.correctAnswer}. ${question.whyCorrect}. Exam Tip: ${question.examTip}`;
  };

  // Handle question change: stop current speech, or auto-read if Hands-Free Auto-Read is ON
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    updateSpeakingState(false, false, null);

    if (autoReadOnNext) {
      const timer = setTimeout(() => {
        speakText(buildFullText(), 'full');
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [question.id]);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePauseResume = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !isSpeaking) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    updateSpeakingState(false, false, null);
  };

  const handleCycleRate = () => {
    const idx = SPEECH_RATES.indexOf(speechRate);
    const nextRate = SPEECH_RATES[(idx + 1) % SPEECH_RATES.length];
    setSpeechRate(nextRate);
    try {
      localStorage.setItem(TTS_RATE_STORAGE_KEY, String(nextRate));
    } catch {
      // ignore
    }
    if (isSpeaking && activeSegment) {
      const textToReplay =
        activeSegment === 'scenario'
          ? `Scenario context: ${question.scenario}`
          : activeSegment === 'question'
          ? buildQuestionAndOptionsText()
          : activeSegment === 'explanation'
          ? buildExplanationText()
          : buildFullText();
      speakText(textToReplay, activeSegment, nextRate);
    }
  };

  const handleToggleAutoRead = () => {
    setAutoReadOnNext((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(TTS_AUTOREAD_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="p-3 rounded-xl bg-gradient-to-r from-sky-50/90 via-white to-indigo-50/60 border border-sky-200/90 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
      {/* Left: Accessible TTS Controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 font-extrabold text-slate-800 mr-1">
          <span
            className={`p-1.5 rounded-lg ${
              isSpeaking
                ? 'bg-[#0078D4] text-white animate-pulse'
                : 'bg-blue-100 text-[#0078D4]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
          </span>
          <span className="hidden sm:inline">Text-to-Speech (TTS):</span>
        </span>

        {/* Read Full Scenario + Question + Options */}
        <button
          type="button"
          onClick={() => {
            if (isSpeaking && activeSegment === 'full') {
              handleStop();
            } else {
              speakText(buildFullText(), 'full');
            }
          }}
          className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] border flex items-center gap-1 transition-all cursor-pointer ${
            isSpeaking && activeSegment === 'full'
              ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
              : 'bg-white hover:bg-sky-50 text-[#0078D4] border-sky-200'
          }`}
          title="Listen to the complete Scenario, Question, and Answer Choices"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{isSpeaking && activeSegment === 'full' ? 'Reading Full...' : 'Read Scenario & Q'}</span>
        </button>

        {/* Read Scenario Only */}
        <button
          type="button"
          onClick={() => {
            if (isSpeaking && activeSegment === 'scenario') {
              handleStop();
            } else {
              speakText(`Scenario context: ${question.scenario}`, 'scenario');
            }
          }}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all cursor-pointer ${
            isSpeaking && activeSegment === 'scenario'
              ? 'bg-[#0078D4] text-white border-[#0078D4]'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
          title="Listen to Scenario text only"
        >
          Scenario Only
        </button>

        {/* Read Question & Options Only */}
        <button
          type="button"
          onClick={() => {
            if (isSpeaking && activeSegment === 'question') {
              handleStop();
            } else {
              speakText(buildQuestionAndOptionsText(), 'question');
            }
          }}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all cursor-pointer ${
            isSpeaking && activeSegment === 'question'
              ? 'bg-[#0078D4] text-white border-[#0078D4]'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
          title="Listen to Question and 4 Choices only"
        >
          Question &amp; Choices
        </button>

        {/* Read Explanation (when question is answered) */}
        {showExplanation && (
          <button
            type="button"
            onClick={() => {
              if (isSpeaking && activeSegment === 'explanation') {
                handleStop();
              } else {
                speakText(buildExplanationText(), 'explanation');
              }
            }}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all cursor-pointer ${
              isSpeaking && activeSegment === 'explanation'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
            title="Listen to official explanation and Exam Anchor Tip"
          >
            Read Explanation
          </button>
        )}

        {/* Pause / Resume & Stop when speaking */}
        {isSpeaking && (
          <div className="inline-flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={handleTogglePauseResume}
              className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 cursor-pointer"
              title={isPaused ? 'Resume speech' : 'Pause speech'}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 cursor-pointer"
              title="Stop speech"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          </div>
        )}
      </div>

      {/* Right: Playback Speed & Hands-Free Auto-Read Toggle */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCycleRate}
          className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-mono font-extrabold text-[11px] cursor-pointer"
          title="Cycle Text-to-Speech playback speed"
        >
          {speechRate}x
        </button>

        <button
          type="button"
          onClick={handleToggleAutoRead}
          className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] border flex items-center gap-1 transition-all cursor-pointer ${
            autoReadOnNext
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
          }`}
          title="Hands-Free Auto-Read: Automatically read scenario & question aloud when advancing to next question"
        >
          <Sparkles className="w-3 h-3" />
          <span>Auto-Read: {autoReadOnNext ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};
