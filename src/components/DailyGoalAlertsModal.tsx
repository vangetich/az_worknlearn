import React, { useState, useEffect } from 'react';
import {
  Target,
  Bell,
  Sparkles,
  Volume2,
  VolumeX,
  AlertTriangle,
  Clock,
  Check,
  X,
  Flame,
  Award,
  Sliders,
  MessageCircle,
  Copy,
  ExternalLink,
  Share2,
  Calendar,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { setDailyGoal } from '../utils/storage';
import { MaasaiMedallion } from './MotifDecorations';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';
import { AccessibilityFontSizeControl } from './AccessibilityFontSizeControl';
import confetti from 'canvas-confetti';

export interface CustomAlertSettings {
  streakAtRiskEnabled: boolean;
  streakAtRiskTime: string;
  milestoneCelebrationEnabled: boolean;
  weaknessAlertEnabled: boolean;
  soundEffectsEnabled: boolean;
  studyReminderDays?: string[];
  studyReminderTime?: string;
  studyReminderFocus?: string;
  studyReminderPeerPhone?: string;
}

const DEFAULT_ALERTS: CustomAlertSettings = {
  streakAtRiskEnabled: true,
  streakAtRiskTime: '20:00',
  milestoneCelebrationEnabled: true,
  weaknessAlertEnabled: true,
  soundEffectsEnabled: true,
  studyReminderDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  studyReminderTime: '20:00',
  studyReminderFocus: 'Path 2: Azure Compute, Networking & Storage',
  studyReminderPeerPhone: '',
};

const ALERTS_STORAGE_KEY = 'az900_custom_alerts_v1';

export function getStoredAlertSettings(): CustomAlertSettings {
  try {
    const saved = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (saved) return { ...DEFAULT_ALERTS, ...JSON.parse(saved) };
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_ALERTS;
}

interface DailyGoalAlertsModalProps {
  stats: UserStats;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStats?: (newStats: UserStats) => void;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DailyGoalAlertsModal: React.FC<DailyGoalAlertsModalProps> = ({
  stats,
  isOpen,
  onClose,
  onUpdateStats,
}) => {
  const currentGoal = stats.dailyGoal || 10;
  const [goal, setGoal] = useState<number>(currentGoal);
  const [goalText, setGoalText] = useState<string>(String(currentGoal));
  const [alerts, setAlerts] = useState<CustomAlertSettings>(getStoredAlertSettings);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [inlineGoalSaved, setInlineGoalSaved] = useState<boolean>(false);
  const [copiedWaLink, setCopiedWaLink] = useState<boolean>(false);
  const [copiedWaText, setCopiedWaText] = useState<boolean>(false);

  useEffect(() => {
    const nextGoal = stats.dailyGoal || 10;
    setGoal(nextGoal);
    setGoalText(String(nextGoal));
  }, [stats.dailyGoal]);

  // Compute today's answers
  const todayKey = new Date().toISOString().split('T')[0];
  let todayAnswered = 0;
  Object.values(stats.attempts || {}).forEach((attemptsList) => {
    attemptsList.forEach((att) => {
      if (
        att.timestamp &&
        new Date(att.timestamp).toISOString().split('T')[0] === todayKey
      ) {
        todayAnswered++;
      }
    });
  });

  const safeGoal = Math.max(1, Math.min(100, goal || 10));
  const goalPercent = Math.min(100, Math.round((todayAnswered / safeGoal) * 100));
  const isGoalReached = todayAnswered >= safeGoal && safeGoal > 0;

  // Circular SVG ring constants for live modal preview
  const ringRadius = 20;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (goalPercent / 100) * ringCircumference;

  const updateGoalValue = (nextVal: number) => {
    const clamped = Math.max(1, Math.min(100, Math.round(nextVal)));
    setGoal(clamped);
    setGoalText(String(clamped));
  };

  const selectedDays = alerts.studyReminderDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const reminderTime = alerts.studyReminderTime || '20:00';
  const reminderFocus =
    alerts.studyReminderFocus || 'Path 2: Azure Compute, Networking & Storage';
  const peerPhone = alerts.studyReminderPeerPhone || '';

  const toggleDay = (day: string) => {
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setAlerts({
      ...alerts,
      studyReminderDays: nextDays.length > 0 ? nextDays : ['Mon'],
    });
  };

  const whatsappScheduleMessage = `🚀 *AZ-900 Study Reminder & Peer Schedule*\n\n📅 *Study Days:* ${selectedDays.join(', ')}\n⏰ *Daily Study Time:* ${reminderTime}\n🎯 *Daily Question Target:* ${safeGoal} Scenario Questions\n📘 *Current Focus:* ${reminderFocus}\n🔥 *Current Streak:* ${stats.streakDays || 1} Day(s)\n\n_"Harambee! Let's pull together and pass Microsoft Azure Fundamentals (700+)!"_`;

  const cleanPeerPhone = peerPhone.replace(/[^0-9]/g, '');
  const whatsappShareUrl = cleanPeerPhone
    ? `https://wa.me/${cleanPeerPhone}?text=${encodeURIComponent(whatsappScheduleMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappScheduleMessage)}`;

  const handleCopyWaLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(whatsappShareUrl);
      setCopiedWaLink(true);
      setTimeout(() => setCopiedWaLink(false), 2200);
    }
  };

  const handleCopyWaMessage = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(whatsappScheduleMessage);
      setCopiedWaText(true);
      setTimeout(() => setCopiedWaText(false), 2200);
    }
  };

  const applyDailyGoalImmediately = (closeAfter: boolean = false) => {
    const parsed = parseInt(goalText, 10);
    const cleanGoal = !isNaN(parsed)
      ? Math.max(1, Math.min(100, parsed))
      : safeGoal;
    updateGoalValue(cleanGoal);

    const updated = setDailyGoal(stats, cleanGoal);
    if (onUpdateStats) {
      onUpdateStats(updated);
    }

    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch (e) {
      console.error(e);
    }

    // Dispatch event so the header progress ring UI immediately pulses & displays saved feedback
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('az900_daily_goal_saved', {
          detail: { goal: cleanGoal, todayAnswered },
        })
      );
    }

    if (alerts.milestoneCelebrationEnabled && todayAnswered >= cleanGoal) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    setInlineGoalSaved(true);
    setTimeout(() => setInlineGoalSaved(false), 2400);

    if (closeAfter) {
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 750);
    }
  };

  const handleSave = () => {
    applyDailyGoalImmediately(true);
  };

  if (!isOpen) return null;

  return (
    <ResponsiveModalContainer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      closeOnBackdropClick={true}
      ariaLabel="Daily Learning Goal & Study Reminder Settings"
    >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50/80 via-white to-amber-50/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xs shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Daily Learning Goal &amp; Study Reminder Settings
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-900 shrink-0">
                  Adaptive Cadence
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Directly edit your Daily Learning Goal question target with instant progress ring feedback
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1 min-h-0">
          {/* Direct Daily Learning Goal Editor with Live Circular Progress Ring UI Feedback */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border border-slate-200/90 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-extrabold text-sm text-slate-900 block">
                  Daily Learning Goal (Question Target)
                </span>
                <span className="text-xs text-slate-500">
                  Directly type or adjust your daily target (1–100 questions/day)
                </span>
              </div>

              {/* Live Interactive Progress Ring Preview */}
              <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-center">
                <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle
                      cx="24"
                      cy="24"
                      r={ringRadius}
                      fill="none"
                      stroke={isGoalReached ? '#A7F3D0' : '#FED7AA'}
                      strokeWidth="4"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r={ringRadius}
                      fill="none"
                      stroke={isGoalReached ? '#16A34A' : '#EA580C'}
                      strokeWidth="4"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      style={{
                        transition:
                          'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Flame
                      className={`w-4 h-4 ${
                        isGoalReached
                          ? 'text-emerald-600 fill-emerald-500'
                          : 'text-orange-600 fill-orange-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-xs font-black text-slate-900">
                    {todayAnswered} / {safeGoal} Qs
                  </div>
                  <div
                    className={`text-[11px] font-bold ${
                      isGoalReached ? 'text-emerald-700' : 'text-orange-700'
                    }`}
                  >
                    {isGoalReached ? 'Goal Met! ✨' : `${goalPercent}% Ring Progress`}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Number Input + Stepper + Instant Apply Button */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => updateGoalValue(safeGoal - 1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-black text-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center shadow-2xs cursor-pointer shrink-0"
                title="Decrease daily goal by 1"
              >
                -
              </button>

              <div className="relative flex-1 min-w-[130px]">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={goalText}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setGoalText(raw);
                    const parsed = parseInt(raw, 10);
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
                      setGoal(parsed);
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseInt(goalText, 10);
                    if (!isNaN(parsed) && parsed >= 1) {
                      updateGoalValue(parsed);
                    } else {
                      updateGoalValue(currentGoal);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyDailyGoalImmediately(false);
                    }
                  }}
                  aria-label="Daily Learning Goal Question Target"
                  className="w-full h-10 px-3 pr-16 rounded-xl bg-white border-2 border-slate-300 focus:border-[#0078D4] focus:outline-none text-center font-black text-base text-slate-900 shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  Qs / day
                </span>
              </div>

              <button
                type="button"
                onClick={() => updateGoalValue(safeGoal + 1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-black text-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center shadow-2xs cursor-pointer shrink-0"
                title="Increase daily goal by 1"
              >
                +
              </button>

              <button
                type="button"
                onClick={() => applyDailyGoalImmediately(false)}
                className="h-10 px-4 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Update Ring</span>
              </button>
            </div>

            {/* Range Slider */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] font-bold text-slate-400">1</span>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={Math.min(60, safeGoal)}
                onChange={(e) => updateGoalValue(parseInt(e.target.value, 10))}
                className="flex-1 accent-[#0078D4] h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-400">60+</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Targets:</span>
              {[5, 10, 15, 20, 25, 30].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateGoalValue(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    safeGoal === preset
                      ? 'bg-[#0078D4] text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {preset} Qs
                </button>
              ))}
            </div>

            {/* Immediate Ring Save Confirmation Banner */}
            {inlineGoalSaved && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>
                    Daily Learning Goal updated to <strong>{safeGoal} questions/day</strong>! Header progress ring updated immediately.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200/80 text-emerald-950">
                  {goalPercent}% Ring
                </span>
              </div>
            )}

            {/* Today's Live Preview with Immediate Progress Ring simulation */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                Today's progress toward new goal:
              </span>
              <span className="font-extrabold text-slate-900">
                {todayAnswered} / {safeGoal} questions ({goalPercent}%)
              </span>
            </div>
          </div>

          {/* Study Reminder Configuration Setting (WhatsApp-Compatible Message Link Generator) */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/90 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  Study Reminder Configuration (WhatsApp Peer Share Link)
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                Mobile Ready
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Customize your weekly study days, preferred reminder time, and Azure focus topic to generate a ready-to-share WhatsApp link for your study peers or accountability group.
            </p>

            {/* Study Days Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Active Study Schedule Days:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WEEK_DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Study Time & Optional Peer WhatsApp Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reminder Time:
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) =>
                    setAlerts({ ...alerts, studyReminderTime: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Peer Mobile Number (Optional):
                </label>
                <input
                  type="tel"
                  value={peerPhone}
                  onChange={(e) =>
                    setAlerts({ ...alerts, studyReminderPeerPhone: e.target.value })
                  }
                  placeholder="e.g. 254712345678 or blank"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* Study Focus Topic */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Scheduled Azure Study Topic:
              </label>
              <select
                value={reminderFocus}
                onChange={(e) =>
                  setAlerts({ ...alerts, studyReminderFocus: e.target.value })
                }
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900"
              >
                <option value="Path 1: Cloud Concepts, High Availability & Shared Responsibility">
                  Path 1: Cloud Concepts, High Availability &amp; Shared Responsibility
                </option>
                <option value="Path 2: Azure Compute, Networking & Storage">
                  Path 2: Azure Compute, Networking &amp; Storage
                </option>
                <option value="Path 3: Microsoft Entra ID, Azure Policy, RBAC & Cost Management">
                  Path 3: Microsoft Entra ID, Azure Policy, RBAC &amp; Cost Management
                </option>
                <option value="Full AZ-900 Mock Exam & Missed Services Review">
                  Full AZ-900 Mock Exam &amp; Missed Services Review
                </option>
              </select>
            </div>

            {/* Generated WhatsApp Link Box */}
            <div className="p-3 rounded-xl bg-white border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Generated WhatsApp-Compatible Share Link
                </span>
                <button
                  type="button"
                  onClick={handleCopyWaMessage}
                  className="text-[11px] font-bold text-[#0078D4] hover:underline cursor-pointer"
                >
                  {copiedWaText ? '✓ Message Text Copied' : 'Copy Message Text Only'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={whatsappShareUrl}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyWaLink}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                >
                  {copiedWaLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Link!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-1 flex items-center justify-between gap-2">
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open WhatsApp Link to Share with Peers</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>
          </div>

          {/* Custom Alerts Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0078D4]" />
              <h4 className="font-extrabold text-sm text-slate-900">
                Personalized Motivation Alerts
              </h4>
            </div>

            <div className="space-y-2.5">
              {/* Alert 1: Streak At-Risk Reminder */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Streak At-Risk Reminder
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gentle evening prompt if daily question target is not reached
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={alerts.streakAtRiskTime}
                    onChange={(e) =>
                      setAlerts({ ...alerts, streakAtRiskTime: e.target.value })
                    }
                    className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  >
                    <option value="19:00">7:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                    <option value="21:00">9:00 PM</option>
                    <option value="22:00">10:00 PM</option>
                  </select>
                  <input
                    type="checkbox"
                    checked={alerts.streakAtRiskEnabled}
                    onChange={(e) =>
                      setAlerts({ ...alerts, streakAtRiskEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#0078D4] cursor-pointer"
                  />
                </div>
              </div>

              {/* Alert 2: Milestone Celebration */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Goal Milestone Celebrations
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Trigger animated celebration and praise badges when daily target is met
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={alerts.milestoneCelebrationEnabled}
                  onChange={(e) =>
                    setAlerts({
                      ...alerts,
                      milestoneCelebrationEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#0078D4] cursor-pointer"
                />
              </div>

              {/* Alert 3: Domain Weakness Warning */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Domain Weakness Alert
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Flag modules where mastery dips below the 60% exam danger threshold
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={alerts.weaknessAlertEnabled}
                  onChange={(e) =>
                    setAlerts({ ...alerts, weaknessAlertEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#0078D4] cursor-pointer"
                />
              </div>

              {/* Alert 4: Sound Chime */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Audio Chime Feedback
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gentle auditory affirmation on correct question submission
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={alerts.soundEffectsEnabled}
                  onChange={(e) =>
                    setAlerts({ ...alerts, soundEffectsEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#0078D4] cursor-pointer"
                />
              </div>
            </div>
          </div>
          {/* Accessibility Font Size Adjustment Control in User Settings Panel */}
          <AccessibilityFontSizeControl variant="panel" />
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-white shadow-xs transition-all cursor-pointer ${
              savedSuccess
                ? 'bg-emerald-600 scale-102'
                : 'bg-[#0078D4] hover:bg-blue-600'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved &amp; Updated Ring!</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                <span>Save Goal &amp; Reminders</span>
              </>
            )}
          </button>
        </div>
    </ResponsiveModalContainer>
  );
};

