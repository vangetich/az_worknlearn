export const FONT_SCALE_STORAGE_KEY = 'az900_app_font_scale_percent_v1';
export const MIN_FONT_SCALE_PERCENT = 85;
export const MAX_FONT_SCALE_PERCENT = 150;
export const DEFAULT_FONT_SCALE_PERCENT = 100;
export const FONT_SCALE_STEP = 5;

export interface FontScalePreset {
  percent: number;
  label: string;
  shortLabel: string;
  description: string;
}

export const FONT_SCALE_PRESETS: FontScalePreset[] = [
  {
    percent: 90,
    label: 'Compact (90%)',
    shortLabel: '90%',
    description: 'Higher information density for smaller screens',
  },
  {
    percent: 100,
    label: 'Standard (100%)',
    shortLabel: '100%',
    description: 'Default studio typography scale',
  },
  {
    percent: 115,
    label: 'Enhanced (+15% / 115%)',
    shortLabel: '115%',
    description: '15% larger studio reading comfort',
  },
  {
    percent: 125,
    label: 'Large (+25% / 125%)',
    shortLabel: '125%',
    description: 'Expanded accessibility scale beyond +15%',
  },
  {
    percent: 135,
    label: 'Extra Large (+35% / 135%)',
    shortLabel: '135%',
    description: 'High-visibility reading mode for extended sessions',
  },
  {
    percent: 150,
    label: 'Maximum (+50% / 150%)',
    shortLabel: '150%',
    description: 'Maximum accessibility magnification',
  },
];

export function clampFontScalePercent(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_FONT_SCALE_PERCENT;
  return Math.max(
    MIN_FONT_SCALE_PERCENT,
    Math.min(MAX_FONT_SCALE_PERCENT, Math.round(value))
  );
}

export function getStoredFontScalePercent(): number {
  if (typeof window === 'undefined') return DEFAULT_FONT_SCALE_PERCENT;
  try {
    const raw = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    if (!raw) return DEFAULT_FONT_SCALE_PERCENT;
    const parsed = parseInt(raw, 10);
    return clampFontScalePercent(parsed);
  } catch {
    return DEFAULT_FONT_SCALE_PERCENT;
  }
}

export function applyFontScalePercent(percent: number): number {
  const clamped = clampFontScalePercent(percent);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const ratio = Number((clamped / 100).toFixed(3));
    root.style.fontSize = `${clamped}%`;
    root.style.setProperty('--app-font-scale', String(ratio));
    root.setAttribute('data-font-scale', String(clamped));
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(clamped));
    } catch {
      // ignore storage errors
    }
    window.dispatchEvent(
      new CustomEvent('az900-font-size-changed', {
        detail: { percent: clamped },
      })
    );
  }
  return clamped;
}
