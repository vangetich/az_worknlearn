import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sliders,
  Activity,
  CloudRain,
  Wind,
  Timer,
  Radio,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { audioManager, PacingSoundscapeType } from '../services/audioManager';

export interface AudioPacingCoachProps {
  isAudioMuted: boolean;
  onToggleAudioMute?: () => void;
  currentQuestionIndex?: number;
  sessionAnsweredCount?: number;
  isFocusMode?: boolean;
  compact?: boolean;
}

interface SoundscapeOption {
  id: PacingSoundscapeType;
  label: string;
  shortLabel: string;
  description: string;
}

const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  {
    id: 'ticking',
    label: 'Studio Metronome Tick',
    shortLabel: 'Ticking',
    description: 'Subtle mechanical watch ticking with a soft 4-beat cadence accent',
  },
  {
    id: 'rain',
    label: 'Savannah Rain & Droplets',
    shortLabel: 'Savannah Rain',
    description: 'Warm ambient rainfall with gentle canopy droplets synced to your pace',
  },
  {
    id: 'wind',
    label: 'Rift Valley Breeze & Stream',
    shortLabel: 'Rift Breeze',
    description: 'Calming nature wind and water harmonics modulated at your drill tempo',
  },
  {
    id: 'pulse',
    label: 'Deep Focus Harmonic Pulse',
    shortLabel: 'Focus Pulse',
    description: 'Warm low-frequency acoustic rhythm pulse for high-volume concentration',
  },
];

const SPEED_PRESETS: Array<{
  speed: number;
  label: string;
  bpm: number;
  targetSecPerQuestion: number;
  tag: string;
}> = [
  { speed: 0.5, label: '0.5x', bpm: 36, targetSecPerQuestion: 75, tag: 'Calm Study' },
  { speed: 0.75, label: '0.75x', bpm: 54, targetSecPerQuestion: 60, tag: 'Steady Review' },
  { speed: 1.0, label: '1.0x', bpm: 72, targetSecPerQuestion: 45, tag: 'AZ-900 Exam Pace' },
  { speed: 1.25, label: '1.25x', bpm: 90, targetSecPerQuestion: 35, tag: 'High-Volume Drill' },
  { speed: 1.5, label: '1.5x', bpm: 108, targetSecPerQuestion: 25, tag: 'Blitz Rhythm' },
  { speed: 2.0, label: '2.0x', bpm: 144, targetSecPerQuestion: 18, tag: 'Rapid Recall' },
];

export const AudioPacingCoach: React.FC<AudioPacingCoachProps> = ({
  isAudioMuted,
  onToggleAudioMute,
  currentQuestionIndex = 0,
  sessionAnsweredCount = 0,
  isFocusMode = false,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const [soundscape, setSoundscape] = useState<PacingSoundscapeType>(() => {
    try {
      const saved = localStorage.getItem('az900_pacing_soundscape') as PacingSoundscapeType | null;
      if (saved && ['ticking', 'rain', 'wind', 'pulse'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'ticking';
  });

  const [speedMultiplier, setSpeedMultiplier] = useState<number>(() => {
    try {
      const saved = parseFloat(localStorage.getItem('az900_pacing_speed') || '1.0');
      if (!Number.isNaN(saved) && saved >= 0.5 && saved <= 2.0) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 1.0;
  });

  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = parseFloat(localStorage.getItem('az900_pacing_volume') || '0.4');
      if (!Number.isNaN(saved) && saved >= 0.05 && saved <= 1.0) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 0.4;
  });

  const [activeBeatStep, setActiveBeatStep] = useState<number>(0);
  const [questionElapsedSec, setQuestionElapsedSec] = useState<number>(0);

  // Compute effective BPM & target seconds per question from speedMultiplier
  const effectiveBpm = Math.round(72 * speedMultiplier);
  const targetQuestionSeconds = Math.max(15, Math.round(45 / speedMultiplier));

  // Reset per-question pacing timer whenever the active question changes
  useEffect(() => {
    setQuestionElapsedSec(0);
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setQuestionElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying, currentQuestionIndex]);

  // Manage Web Audio pacing loop
  useEffect(() => {
    if (!isPlaying || isAudioMuted) {
      audioManager.stopPacingCoach();
      return;
    }

    audioManager.startPacingCoach({
      soundscape,
      speedMultiplier,
      volume,
      isAudioMuted: false,
      onBeat: (beatIdx) => {
        setActiveBeatStep(beatIdx % 4);
      },
    });

    return () => {
      audioManager.stopPacingCoach();
    };
  }, [isPlaying, soundscape, speedMultiplier, volume, isAudioMuted]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      audioManager.stopPacingCoach();
    };
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (!isPlaying && isAudioMuted && onToggleAudioMute) {
      onToggleAudioMute();
    }
    setIsPlaying((prev) => !prev);
  }, [isPlaying, isAudioMuted, onToggleAudioMute]);

  const handleSelectSoundscape = (next: PacingSoundscapeType) => {
    setSoundscape(next);
    try {
      localStorage.setItem('az900_pacing_soundscape', next);
    } catch {
      // ignore
    }
  };

  const handleChangeSpeed = (nextSpeed: number) => {
    const clamped = Math.round(Math.max(0.5, Math.min(2.0, nextSpeed)) * 100) / 100;
    setSpeedMultiplier(clamped);
    try {
      localStorage.setItem('az900_pacing_speed', String(clamped));
    } catch {
      // ignore
    }
  };

  const handleChangeVolume = (nextVol: number) => {
    const clamped = Math.max(0.05, Math.min(1.0, nextVol));
    setVolume(clamped);
    try {
      localStorage.setItem('az900_pacing_volume', String(clamped));
    } catch {
      // ignore
    }
  };

  const renderSoundscapeIcon = (type: PacingSoundscapeType, className = 'w-3.5 h-3.5') => {
    switch (type) {
      case 'ticking':
        return <Timer className={className} />;
      case 'rain':
        return <CloudRain className={className} />;
      case 'wind':
        return <Wind className={className} />;
      case 'pulse':
        return <Radio className={className} />;
    }
  };

  const currentSoundscapeMeta =
    SOUNDSCAPE_OPTIONS.find((s) => s.id === soundscape) || SOUNDSCAPE_OPTIONS[0];
  const questionPacePct = Math.min(
    100,
    Math.round((questionElapsedSec / targetQuestionSeconds) * 100)
  );
  const isOverTargetPace = questionElapsedSec > targetQuestionSeconds;

  if (compact) {
    return (
      <div className="relative inline-flex items-center gap-1">
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
            isPlaying && !isAudioMuted
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-2xs'
              : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
          }`}
          title="Audio Pacing Coach: Toggle subtle rhythmic ticking or ambient nature soundscape"
        >
          {isPlaying && !isAudioMuted ? (
            <Pause className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          ) : (
            <Play className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          )}
          <span className="hidden md:inline">Pacing:</span>
          <span>{speedMultiplier}x</span>
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-sky-200 border border-white/15 cursor-pointer"
          title="Configure Audio Pacing Coach speed & soundscape"
          aria-expanded={isExpanded}
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {isExpanded && (
          <div
            className={`${
              isFocusMode
                ? 'fixed top-16 left-1/2 -translate-x-1/2 z-[140]'
                : 'absolute top-full right-0 mt-2 z-50'
            } w-80 sm:w-96 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl p-4 text-left space-y-3 animate-in fade-in zoom-in-95 duration-150`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Audio Pacing Coach
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {SOUNDSCAPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectSoundscape(opt.id)}
                  className={`p-2 rounded-xl border text-left text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    soundscape === opt.id
                      ? 'bg-[#0078D4] text-white border-sky-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {renderSoundscapeIcon(opt.id, 'w-3.5 h-3.5 shrink-0')}
                  <span className="truncate">{opt.shortLabel}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold">
                  Speed: {speedMultiplier}x ({effectiveBpm} BPM)
                </span>
                <span className="text-amber-300 font-mono font-bold">
                  Target: ~{targetQuestionSeconds}s/Q
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {SPEED_PRESETS.map((p) => (
                  <button
                    key={p.speed}
                    type="button"
                    onClick={() => handleChangeSpeed(p.speed)}
                    className={`py-1 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                      speedMultiplier === p.speed
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sky-200/90 bg-gradient-to-r from-slate-900 via-[#003459] to-slate-900 text-white shadow-xs overflow-hidden">
      {/* Compact Always-Visible Audio Pacing Coach Bar */}
      <div className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Title + Play/Pause Button + Active Rhythm Beat Dots */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-pressed={isPlaying && !isAudioMuted}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isPlaying && !isAudioMuted
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/40'
                : 'bg-[#0078D4] hover:bg-[#005A9E] text-white border border-sky-400/40'
            }`}
            title={
              isPlaying
                ? 'Pause Audio Pacing Coach'
                : 'Start Audio Pacing Coach for rhythmic question-drill cadence'
            }
          >
            {isPlaying && !isAudioMuted ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Pacing Active</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Start Audio Pacing Coach</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              {renderSoundscapeIcon(soundscape, 'w-3.5 h-3.5 text-amber-300')}
              <span>{currentSoundscapeMeta.shortLabel}</span>
            </span>

            <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[11px] font-mono font-bold text-amber-300">
              {speedMultiplier}x • {effectiveBpm} BPM
            </span>

            {/* 4-Beat Visual Rhythm Cadence Pulse */}
            <div
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/60 border border-white/10"
              title="4-beat rhythm cadence indicator"
            >
              {[0, 1, 2, 3].map((step) => {
                const isLit = isPlaying && !isAudioMuted && activeBeatStep === step;
                return (
                  <span
                    key={step}
                    className={`w-2 h-2 rounded-full transition-all duration-150 ${
                      isLit
                        ? step === 0
                          ? 'bg-amber-400 scale-125 shadow-[0_0_8px_#fbbf24]'
                          : 'bg-emerald-400 scale-110 shadow-[0_0_6px_#34d399]'
                        : 'bg-slate-700'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Center/Right: Soundscape Quick-Switch + Speed Presets + Expand Toggle */}
        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          {/* Quick Soundscape Selector Pills */}
          <div
            className="hidden md:inline-flex items-center bg-slate-950/55 p-0.5 rounded-xl border border-white/15 text-[11px] font-bold"
            role="group"
            aria-label="Select Audio Pacing Coach Soundscape"
          >
            {SOUNDSCAPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectSoundscape(opt.id)}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  soundscape === opt.id
                    ? 'bg-[#0078D4] text-white font-extrabold shadow-2xs'
                    : 'text-sky-100/75 hover:text-white'
                }`}
                title={opt.description}
              >
                {renderSoundscapeIcon(opt.id, 'w-3 h-3 shrink-0')}
                <span>{opt.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Quick Speed Stepper */}
          <div
            className="inline-flex items-center bg-slate-950/55 p-0.5 rounded-xl border border-white/15 text-[11px] font-bold"
            role="group"
            aria-label="Adjust Audio Pacing Speed"
          >
            {[0.75, 1.0, 1.25, 1.5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => handleChangeSpeed(spd)}
                className={`px-2 py-1 rounded-lg font-mono transition-colors cursor-pointer ${
                  speedMultiplier === spd
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={`Set pacing tempo to ${spd}x (${Math.round(72 * spd)} BPM)`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Expand Fine-Tuning Controls */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-sky-100 border border-white/15 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Sliders className="w-3 h-3 text-amber-300" />
            <span className="hidden xs:inline">Tempo &amp; Mix</span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Live Per-Question Rhythm Progress Strip when Playing */}
      {isPlaying && !isAudioMuted && (
        <div className="px-3.5 pb-2 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-sky-200/90 font-semibold">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-300" />
              <span>
                Question Rhythm Cadence: {questionElapsedSec}s / {targetQuestionSeconds}s target
                pace
              </span>
            </span>
            <span
              className={
                isOverTargetPace ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'
              }
            >
              {isOverTargetPace
                ? 'Commit & move to maintain drill rhythm'
                : `On Pace • ${sessionAnsweredCount} Qs drilled this session`}
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-slate-950 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isOverTargetPace
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                  : 'bg-gradient-to-r from-emerald-400 via-sky-400 to-[#0078D4]'
              }`}
              style={{ width: `${questionPacePct}%` }}
            />
          </div>
        </div>
      )}

      {/* Expandable Tempo, Soundscape & Volume Studio Drawer */}
      {isExpanded && (
        <div className="px-4 py-3.5 bg-slate-950/85 border-t border-white/10 space-y-3.5 text-xs animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {SOUNDSCAPE_OPTIONS.map((opt) => {
              const isSelected = soundscape === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectSoundscape(opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    isSelected
                      ? 'bg-[#0078D4]/30 border-sky-400 text-white ring-1 ring-sky-400/40'
                      : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-extrabold text-xs flex items-center gap-1.5 text-white">
                      {renderSoundscapeIcon(opt.id, 'w-3.5 h-3.5 text-amber-300')}
                      <span>{opt.label}</span>
                    </span>
                    {isSelected && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-400 text-slate-950">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-snug">{opt.description}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Speed / Rhythm Tempo Slider & Presets */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="audio-pacing-speed-slider"
                  className="text-[11px] font-extrabold text-slate-200 flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Drill Rhythm Speed: {speedMultiplier}x ({effectiveBpm} BPM)</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-amber-300">
                  ~{targetQuestionSeconds}s / Question
                </span>
              </div>

              <input
                id="audio-pacing-speed-slider"
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={speedMultiplier}
                onChange={(e) => handleChangeSpeed(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              <div className="grid grid-cols-6 gap-1 pt-0.5">
                {SPEED_PRESETS.map((p) => (
                  <button
                    key={p.speed}
                    type="button"
                    onClick={() => handleChangeSpeed(p.speed)}
                    className={`py-1 px-1 rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer text-center ${
                      speedMultiplier === p.speed
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title={`${p.tag} (${p.bpm} BPM • ~${p.targetSecPerQuestion}s/Q)`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtle Ambient Gain / Volume Control */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="audio-pacing-volume-slider"
                  className="text-[11px] font-extrabold text-slate-200 flex items-center gap-1.5"
                >
                  {isAudioMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span>Background Pacing Volume: {Math.round(volume * 100)}%</span>
                </label>

                {onToggleAudioMute && (
                  <button
                    type="button"
                    onClick={onToggleAudioMute}
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer ${
                      isAudioMuted
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                    }`}
                  >
                    {isAudioMuted ? 'Unmute Audio' : 'Audio Enabled'}
                  </button>
                )}
              </div>

              <input
                id="audio-pacing-volume-slider"
                type="range"
                min={0.05}
                max={1.0}
                step={0.05}
                value={volume}
                onChange={(e) => handleChangeVolume(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              <p className="text-[10.5px] text-slate-400 leading-snug">
                Synthesizes non-intrusive acoustic beats in real time via Web Audio API to entrain steady question-solving velocity without fatigue.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
