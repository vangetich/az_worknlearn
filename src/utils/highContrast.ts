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
  return isEnabled;
}
