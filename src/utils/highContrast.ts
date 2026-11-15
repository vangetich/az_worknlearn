export const HIGH_CONTRAST_STORAGE_KEY = 'az900_high_contrast_focus_mode_v1';

/**
 * Returns whether High-Contrast Focus Mode is currently enabled in localStorage.
 */
export function getStoredHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Applies or removes High-Contrast Focus Mode across the document.
 * Sets data-high-contrast="true" attribute and high-contrast-focus-mode class,
 * stores user preference, and broadcasts an event for all app components.
 */
export function applyHighContrast(enabled: boolean): boolean {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const body = document.body;

    if (enabled) {
      root.setAttribute('data-high-contrast', 'true');
      root.classList.add('high-contrast-focus-mode');
      if (body) body.classList.add('high-contrast-focus-mode');
    } else {
      root.removeAttribute('data-high-contrast');
      root.classList.remove('high-contrast-focus-mode');
      if (body) body.classList.remove('high-contrast-focus-mode');
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(enabled));
    } catch (e) {
      console.warn('Unable to persist high-contrast preference in localStorage', e);
    }

    window.dispatchEvent(
      new CustomEvent('az900-high-contrast-changed', {
        detail: { enabled },
      })
    );
  }

  return enabled;
}

/**
 * Automatically initializes High-Contrast state on startup.
 */
export function initHighContrast(): boolean {
  const isEnabled = getStoredHighContrast();
  if (isEnabled) {
    applyHighContrast(true);
  }
  initQuizAnimationsEnabled();
  initStreakCelebrationsEnabled();
  return isEnabled;
}

export const QUIZ_ANIMATIONS_STORAGE_KEY = 'az900_quiz_animations_enabled_v1';
export const QUIZ_ANIMATIONS_CHANGED_EVENT = 'az900-quiz-animations-changed';

/**
 * Returns whether QuizCard slide-and-fade question transition animations are enabled.
 * Defaults to true unless explicitly toggled off in Accessibility Settings.
 */
export function getStoredQuizAnimationsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(QUIZ_ANIMATIONS_STORAGE_KEY);
    if (raw === 'false') return false;
    if (raw === 'true') return true;
    return true;
  } catch {
    return true;
  }
}

/**
 * Enables or disables QuizCard slide-and-fade transition animations globally,
 * updates document attributes, persists to localStorage, and broadcasts an event.
 */
export function applyQuizAnimationsEnabled(enabled: boolean): boolean {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-quiz-animations', enabled ? 'true' : 'false');
    if (!enabled) {
      root.classList.add('reduce-quiz-transitions');
    } else {
      root.classList.remove('reduce-quiz-transitions');
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(QUIZ_ANIMATIONS_STORAGE_KEY, String(enabled));
    } catch (e) {
      console.warn('Unable to persist quiz animations preference in localStorage', e);
    }

    window.dispatchEvent(
      new CustomEvent(QUIZ_ANIMATIONS_CHANGED_EVENT, {
        detail: { enabled },
      })
    );
  }

  return enabled;
}

export function initQuizAnimationsEnabled(): boolean {
  const isEnabled = getStoredQuizAnimationsEnabled();
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute(
      'data-quiz-animations',
      isEnabled ? 'true' : 'false'
    );
  }
  return isEnabled;
}

export const STREAK_CELEBRATION_EFFECTS_STORAGE_KEY = 'az900_streak_celebration_effects_enabled_v1';
export const STREAK_CELEBRATION_EFFECTS_CHANGED_EVENT = 'az900-streak-celebration-effects-changed';

/**
 * Returns whether the Five-Streak Header Pulse animation and other high-energy
 * celebration fanfare (confetti, intense pulses) are enabled.
 * Defaults to true unless explicitly disabled in Accessibility Settings to reduce cognitive load.
 */
export function getStoredStreakCelebrationsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STREAK_CELEBRATION_EFFECTS_STORAGE_KEY);
    if (raw === 'false') return false;
    if (raw === 'true') return true;
    return true;
  } catch {
    return true;
  }
}

/**
 * Enables or disables the Five-Streak Header Pulse animation and high-energy celebration fanfare globally,
 * updates document attributes, persists to localStorage, and broadcasts an event.
 */
export function applyStreakCelebrationsEnabled(enabled: boolean): boolean {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root?.setAttribute?.('data-streak-celebrations', enabled ? 'true' : 'false');
    if (!enabled) {
      root?.classList?.add?.('reduce-celebration-motion');
    } else {
      root?.classList?.remove?.('reduce-celebration-motion');
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STREAK_CELEBRATION_EFFECTS_STORAGE_KEY, String(enabled));
    } catch (e) {
      console.warn('Unable to persist streak celebrations preference in localStorage', e);
    }

    window.dispatchEvent(
      new CustomEvent(STREAK_CELEBRATION_EFFECTS_CHANGED_EVENT, {
        detail: { enabled },
      })
    );
  }

  return enabled;
}

export function initStreakCelebrationsEnabled(): boolean {
  const isEnabled = getStoredStreakCelebrationsEnabled();
  if (typeof document !== 'undefined') {
    document.documentElement?.setAttribute?.(
      'data-streak-celebrations',
      isEnabled ? 'true' : 'false'
    );
    if (!isEnabled) {
      document.documentElement?.classList?.add?.('reduce-celebration-motion');
    }
  }
  return isEnabled;
}


