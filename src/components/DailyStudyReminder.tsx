import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  CheckCircle2,
  Flame,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  X,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { KitengeRibbon } from './MotifDecorations';

export interface DailyReminderSettings {
  enabled: boolean;
  reminderTime: string; // HH:MM (24-hour format, e.g., "18:00")
  lastNotifiedDate: string | null; // YYYY-MM-DD
}

const REMINDER_STORAGE_KEY = 'az900_daily_study_reminder_v1';

export function getStoredReminderSettings(): DailyReminderSettings {
  try {
    const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled),
        reminderTime: typeof parsed.reminderTime === 'string' ? parsed.reminderTime : '18:00',
        lastNotifiedDate: parsed.lastNotifiedDate || null,
      };
    }
  } catch {
    // ignore
  }
  return {
    enabled: false,
    reminderTime: '18:00',
    lastNotifiedDate: null,
  };
}

export function saveReminderSettings(settings: DailyReminderSettings) {
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('az900-reminder-updated', { detail: settings }));
  } catch {
    // ignore
  }
}

export function getTodaySolvedQuestionsCount(stats: UserStats): number {
  const todayStr = new Date().toISOString().split('T')[0];
  let count = 0;
  Object.values(stats.attempts || {}).forEach((list) => {
    list.forEach((att) => {
      if (att.timestamp) {
        const dKey = new Date(att.timestamp).toISOString().split('T')[0];
        if (dKey === todayStr) {
          count += 1;
        }
      }
    });
  });
  return count;
}

export async function triggerBrowserStudyNotification(
  title: string,
  body: string,
  onClickJumpToQuiz?: () => void
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'az900-daily-study-reminder',
      });
      notif.onclick = () => {
        window.focus();
        if (onClickJumpToQuiz) onClickJumpToQuiz();
        notif.close();
      };
      return true;
    }
  } catch {
    // Fallback if Notification constructor is restricted in iframe or service worker context
  }
  return false;
}

interface DailyStudyReminderProps {
  stats: UserStats;
  onStartScenarioQuestion?: () => void;
  compact?: boolean;
}

const TIME_PRESETS = [
  { label: 'Morning (08:00)', value: '08:00' },
  { label: 'Midday (12:30)', value: '12:30' },
  { label: 'Evening (18:00)', value: '18:00' },
  { label: 'Night (21:00)', value: '21:00' },
];

export const DailyStudyReminder: React.FC<DailyStudyReminderProps> = ({
  stats,
  onStartScenarioQuestion,
  compact = false,
}) => {
  const [settings, setSettings] = useState<DailyReminderSettings>(getStoredReminderSettings);
  const [permissionState, setPermissionState] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [inAppPromptToast, setInAppPromptToast] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const todaySolved = getTodaySolvedQuestionsCount(stats);
  const streakSafeToday = todaySolved >= 1;

  // Listen for cross-component updates
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<DailyReminderSettings>;
      if (custom.detail) {
        setSettings(custom.detail);
      }
    };
    window.addEventListener('az900-reminder-updated', handler);
    return () => window.removeEventListener('az900-reminder-updated', handler);
  }, []);

  // Background scheduler: checks every 20 seconds if user-defined reminderTime is reached
  useEffect(() => {
    if (!settings.enabled) return;

    const checkSchedule = async () => {
      const now = new Date();
      const todayKey = now.toISOString().split('T')[0];
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      if (
        currentHHMM === settings.reminderTime &&
        settings.lastNotifiedDate !== todayKey
      ) {
        const updated: DailyReminderSettings = {
          ...settings,
          lastNotifiedDate: todayKey,
        };
        setSettings(updated);
        saveReminderSettings(updated);

        const solvedNow = getTodaySolvedQuestionsCount(stats);
        const notifTitle =
          solvedNow === 0
            ? `🔥 Keep Your ${stats.streakDays || 1}-Day AZ-900 Streak Alive!`
            : `⚡ Daily AZ-900 Study Check-In (${settings.reminderTime})`;
        const notifBody =
          solvedNow === 0
            ? 'Complete at least 1 scenario-based question right now to protect your daily study streak!'
            : `Great job solving ${solvedNow} question(s) today! Ready for one bonus scenario drill?`;

        await triggerBrowserStudyNotification(
          notifTitle,
          notifBody,
          onStartScenarioQuestion
        );
        setInAppPromptToast(notifBody);
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 20000);
    return () => clearInterval(interval);
  }, [settings, stats, onStartScenarioQuestion]);

  const handleToggleReminder = async () => {
    const nextEnabled = !settings.enabled;
    if (nextEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
      } catch {
        // ignore
      }
    }

    const nextSettings: DailyReminderSettings = {
      ...settings,
      enabled: nextEnabled,
    };
    setSettings(nextSettings);
    saveReminderSettings(nextSettings);
    setStatusFeedback(
      nextEnabled
        ? `Daily study reminder scheduled for ${nextSettings.reminderTime}`
        : 'Daily study reminder paused'
    );
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleTimeChange = (newTime: string) => {
    const nextSettings: DailyReminderSettings = {
      ...settings,
      enabled: true,
      reminderTime: newTime,
      lastNotifiedDate: null, // allow firing if set to upcoming minute today
    };
    setSettings(nextSettings);
    saveReminderSettings(nextSettings);
    setStatusFeedback(`Reminder time updated to ${newTime} daily`);
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleSendTestReminder = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
      } catch {
        // ignore
      }
    }

    const title = `🔥 AZ-900 Daily Streak Reminder (${settings.reminderTime})`;
    const body = streakSafeToday
      ? `Streak secured (${todaySolved} solved today)! Complete 1 more scenario question to boost your mastery.`
      : `You haven't completed a scenario question yet today. Solve 1 scenario question now to maintain your ${
          stats.streakDays || 1
        }-day streak!`;

    const firedNative = await triggerBrowserStudyNotification(
      title,
      body,
      onStartScenarioQuestion
    );
    setInAppPromptToast(
      firedNative
        ? `Browser Notification sent! "${body}"`
        : `Study Reminder Alert: ${body}`
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden">
      {!compact && <KitengeRibbon height={3} />}

      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                settings.enabled
                  ? 'bg-gradient-to-br from-[#0078D4] to-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {settings.enabled ? (
                <BellRing className="w-5 h-5 animate-bounce" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Daily Study Reminder (Browser Notification API)
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    streakSafeToday
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {streakSafeToday
                    ? `Today's Streak Secured (${todaySolved} Solved)`
                    : '0 Scenarios Solved Today • Action Needed'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Prompts you at your chosen daily time to complete at least one scenario-based question and protect your{' '}
                <strong className="text-slate-700">{stats.streakDays || 1}-day streak</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handleToggleReminder}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                settings.enabled
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                  : 'bg-slate-900 text-white border-slate-900 hover:bg-[#0078D4] hover:border-[#0078D4]'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{settings.enabled ? 'Reminder Active' : 'Enable Reminder'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendTestReminder}
              className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-200 text-xs font-bold transition-colors cursor-pointer"
              title="Trigger an immediate browser notification & in-app study prompt"
            >
              Test Prompt
            </button>
          </div>
        </div>

        {/* Time Picker & Quick Presets Row */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <label
              htmlFor="daily-reminder-time-input"
              className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4 text-[#0078D4]" />
              <span>Daily Notification Time:</span>
            </label>
            <input
              id="daily-reminder-time-input"
              type="time"
              value={settings.reminderTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-mono font-black text-slate-900 focus:outline-none focus:border-[#0078D4] cursor-pointer"
            />
            <span className="text-[11px] text-slate-500 font-medium">
              (Local Time)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleTimeChange(preset.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  settings.reminderTime === preset.value
                    ? 'bg-[#0078D4] text-white border-[#0078D4]'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status / Permission Feedback */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Browser Notification Permission:{' '}
              <strong
                className={
                  permissionState === 'granted'
                    ? 'text-emerald-700'
                    : permissionState === 'denied'
                    ? 'text-rose-600'
                    : 'text-amber-700'
                }
              >
                {permissionState.toUpperCase()}
              </strong>
            </span>
            {statusFeedback && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {statusFeedback}
              </span>
            )}
          </div>

          {!streakSafeToday && onStartScenarioQuestion && (
            <button
              type="button"
              onClick={onStartScenarioQuestion}
              className="text-[#0078D4] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Complete Today&apos;s 1 Scenario Question Now</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Active Prompt Toast Banner */}
        {inAppPromptToast && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in duration-150">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-400 text-slate-950 shrink-0">
                <Flame className="w-4 h-4 fill-slate-950" />
              </div>
              <div className="text-xs">
                <span className="font-black uppercase tracking-wider text-amber-300 block text-[10px]">
                  Daily Study Streak Prompt • {settings.reminderTime}
                </span>
                <p className="font-semibold text-white mt-0.5">{inAppPromptToast}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onStartScenarioQuestion && (
                <button
                  type="button"
                  onClick={() => {
                    setInAppPromptToast(null);
                    onStartScenarioQuestion();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Solve 1 Scenario Now</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setInAppPromptToast(null)}
                className="p-1 rounded-lg hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
