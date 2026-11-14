export type ThemeMode =
  | 'light'
  | 'midnight-azure'
  | 'savanna-gold'
  | 'emerald-rift'
  | 'kilimanjaro-aurora';

export interface SpecializedThemeOption {
  id: ThemeMode;
  name: string;
  tagline: string;
  isDark: boolean;
  previewSwatches: [string, string, string];
  milestoneId?: string;
}

export const STUDIO_THEMES: SpecializedThemeOption[] = [
  {
    id: 'light',
    name: 'Classic Azure Studio',
    tagline: 'Default crisp light studio canvas with Microsoft Azure blue accents',
    isDark: false,
    previewSwatches: ['#F8F9FA', '#FFFFFF', '#0078D4'],
  },
  {
    id: 'midnight-azure',
    name: 'Midnight Azure Dark',
    tagline: 'Deep obsidian navy canvas with high-contrast luminous cyan borders',
    isDark: true,
    previewSwatches: ['#060B14', '#0B1526', '#38BDF8'],
  },
  {
    id: 'savanna-gold',
    name: 'Savanna Gold Studio',
    tagline: 'Warm East African ochre-gold and ivory parchment studio palette',
    isDark: false,
    previewSwatches: ['#FFFBEB', '#FEF3C7', '#D97706'],
    milestoneId: 'first-module-mastered',
  },
  {
    id: 'emerald-rift',
    name: 'Emerald Rift Canopy',
    tagline: 'Botanical Rift Valley emerald and crisp eucalyptus study surface',
    isDark: false,
    previewSwatches: ['#ECFDF5', '#D1FAE5', '#059669'],
    milestoneId: 'fifty-questions-scholar',
  },
  {
    id: 'kilimanjaro-aurora',
    name: 'Kilimanjaro Aurora Dark',
    tagline: 'Deep alpine indigo night canvas with violet-cyan aurora highlights',
    isDark: true,
    previewSwatches: ['#090A1A', '#131633', '#818CF8'],
    milestoneId: 'curriculum-grandmaster',
  },
];

const THEME_STORAGE_KEY = 'az900_theme_preference';
const UNLOCKED_REWARDS_KEY = 'az900_learning_journey_unlocked_v1';

export function getUnlockedMilestoneIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(UNLOCKED_REWARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function unlockMilestoneRewardId(milestoneId: string): string[] {
  const current = getUnlockedMilestoneIds();
  if (current.includes(milestoneId)) return current;
  const next = [...current, milestoneId];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(UNLOCKED_REWARDS_KEY, JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent('az900_journey_rewards_updated', { detail: { unlockedIds: next } })
      );
    } catch {
      // ignore storage errors
    }
  }
  return next;
}

/**
 * Returns the active theme from localStorage or system preference.
 */
export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (
      saved === 'midnight-azure' ||
      saved === 'light' ||
      saved === 'savanna-gold' ||
      saved === 'emerald-rift' ||
      saved === 'kilimanjaro-aurora'
    ) {
      return saved;
    }
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

  const isDarkTheme = theme === 'midnight-azure' || theme === 'kilimanjaro-aurora';
  if (isDarkTheme) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.error('Error saving theme to localStorage', e);
  }

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
  const nextTheme: ThemeMode =
    currentTheme === 'midnight-azure' || currentTheme === 'kilimanjaro-aurora'
      ? 'light'
      : 'midnight-azure';
  applyTheme(nextTheme);
  return nextTheme;
}
