export type OverworkStatus = 'balanced' | 'break-due' | 'overworking';

export interface OverworkAssessment {
  status: OverworkStatus;
  headline: string;
  detail: string;
  recommendedBreaks: number;
  uninterruptedMins: number;
  dailyMins: number;
}

export const STUDY_BREAKS_UPDATED_EVENT = 'az900_study_breaks_updated';

export function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTodayStudySecondsKey(): string {
  return `az900_daily_study_seconds_${getTodayDateKey()}`;
}

export function getTodayBreaksKey(): string {
  return `az900_daily_breaks_count_${getTodayDateKey()}`;
}

export function getTodayStudySeconds(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(getTodayStudySecondsKey());
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function getTodayBreaksCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(getTodayBreaksKey());
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function setTodayBreaksCount(nextCount: number): number {
  const safeCount = Math.max(0, Math.round(nextCount));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getTodayBreaksKey(), String(safeCount));
    } catch {
      // ignore storage errors
    }
    window.dispatchEvent(
      new CustomEvent(STUDY_BREAKS_UPDATED_EVENT, {
        detail: { count: safeCount, dateKey: getTodayDateKey() },
      })
    );
  }
  return safeCount;
}

export function incrementTodayBreaksCount(delta: number = 1): number {
  const current = getTodayBreaksCount();
  return setTodayBreaksCount(current + delta);
}

export function evaluateStudyOverwork({
  sessionSeconds,
  totalDailySeconds,
  pomodoroMins,
  breaksTakenToday,
}: {
  sessionSeconds: number;
  totalDailySeconds: number;
  pomodoroMins: number;
  breaksTakenToday: number;
}): OverworkAssessment {
  const safeBlockMins = Math.max(10, pomodoroMins || 25);
  const blockSeconds = safeBlockMins * 60;
  const uninterruptedMins = Math.floor(Math.max(0, sessionSeconds) / 60);
  const dailyMins = Math.floor(Math.max(0, totalDailySeconds) / 60);
  const recommendedBreaks = Math.max(
    sessionSeconds >= blockSeconds ? 1 : 0,
    Math.floor(totalDailySeconds / blockSeconds)
  );

  // Overworking thresholds:
  // 1) Current continuous session exceeded block length by 5+ mins, or 45+ mins straight
  // 2) 60+ total daily mins with fewer than 1 break per ~45 mins of study
  const overdueInCurrentBlock = sessionSeconds >= blockSeconds + 5 * 60;
  const excessiveContinuousRun = sessionSeconds >= 45 * 60;
  const dailyBreakDeficit =
    totalDailySeconds >= 60 * 60 &&
    breaksTakenToday < Math.max(1, Math.floor(totalDailySeconds / (45 * 60)));

  if (overdueInCurrentBlock || excessiveContinuousRun || dailyBreakDeficit) {
    const reason = excessiveContinuousRun
      ? `${uninterruptedMins}m of uninterrupted study in this block without resetting for a breather.`
      : overdueInCurrentBlock
      ? `You are ${uninterruptedMins - safeBlockMins}m past your ${safeBlockMins}m session target without a break.`
      : `${dailyMins}m studied today with ${breaksTakenToday} confirmed break${
          breaksTakenToday === 1 ? '' : 's'
        } (target ${Math.max(1, Math.floor(totalDailySeconds / (45 * 60)))}+).`;

    return {
      status: 'overworking',
      headline: 'Overworking Detected — Pause & Rest',
      detail: reason,
      recommendedBreaks,
      uninterruptedMins,
      dailyMins,
    };
  }

  if (sessionSeconds >= blockSeconds || (totalDailySeconds >= 35 * 60 && breaksTakenToday === 0)) {
    return {
      status: 'break-due',
      headline: 'Break Recommended Soon',
      detail:
        sessionSeconds >= blockSeconds
          ? `You've completed your ${safeBlockMins}m study block. Confirm a quick 5-minute break to stay sharp.`
          : `${dailyMins}m studied today with 0 breaks confirmed so far.`,
      recommendedBreaks: Math.max(1, recommendedBreaks),
      uninterruptedMins,
      dailyMins,
    };
  }

  return {
    status: 'balanced',
    headline: 'Healthy Study Rhythm',
    detail:
      breaksTakenToday > 0
        ? `${breaksTakenToday} break${breaksTakenToday === 1 ? '' : 's'} confirmed across ${dailyMins}m today — pacing looks sustainable.`
        : `Within your ${safeBlockMins}m focus block (${uninterruptedMins}m elapsed).`,
    recommendedBreaks,
    uninterruptedMins,
    dailyMins,
  };
}
