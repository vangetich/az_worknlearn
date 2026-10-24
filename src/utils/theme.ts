export type ThemeMode = 'light' | 'midnight-azure';

const THEME_STORAGE_KEY = 'az900_theme_preference';

/**
 * Returns the active theme from localStorage or system preference.
 */
export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'midnight-azure' || saved === 'light') {
      return saved;
    }
    // Check system preference if user hasn't explicitly chosen
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'midnight-azure';
    }
  } catch (e) {
    console.error('Error reading theme from localStorage', e);
  }
  return 'light';
}

/**
 * Applies the theme to the DOM (HTML root element) and persists to localStorage.
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  if (theme === 'midnight-azure') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.error('Error saving theme to localStorage', e);
  }

  // Dispatch custom event for components that need canvas / SVG color re-renders
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('az900_theme_changed', { detail: { theme } })
    );
  }
}

/**
 * Toggles between light and midnight-azure dark themes.
 */
export function toggleTheme(currentTheme: ThemeMode): ThemeMode {
  const nextTheme: ThemeMode = currentTheme === 'light' ? 'midnight-azure' : 'light';
  applyTheme(nextTheme);
  return nextTheme;
}
