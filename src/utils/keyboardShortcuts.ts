export type DetectedPlatform = 'mac' | 'windows' | 'linux';

export interface ShortcutBinding {
  key: string; // lowercase single key e.g. 'f', 'a', 'd', 'k'
  ctrlOrCmd: boolean; // Ctrl on Windows/Linux, Cmd (Meta) on macOS
  alt: boolean; // Alt on Windows/Linux, Option on macOS
  shift: boolean;
}

export interface AccessibilityShortcutConfig {
  focusMode: ShortcutBinding;
  adaptiveDifficulty: ShortcutBinding;
}

export const CUSTOM_SHORTCUTS_STORAGE_KEY = 'az900_custom_shortcuts_v1';
export const SHORTCUTS_UPDATED_EVENT = 'az900_shortcuts_updated';

export const DEFAULT_SHORTCUT_CONFIG: AccessibilityShortcutConfig = {
  focusMode: {
    key: 'f',
    ctrlOrCmd: true,
    alt: false,
    shift: false,
  },
  adaptiveDifficulty: {
    key: 'a',
    ctrlOrCmd: false,
    alt: true,
    shift: false,
  },
};

export function detectUserPlatform(): DetectedPlatform {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'windows';
  }
  const navAny = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platformStr = (
    navAny.userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    ''
  ).toLowerCase();

  if (
    platformStr.includes('mac') ||
    platformStr.includes('iphone') ||
    platformStr.includes('ipad')
  ) {
    return 'mac';
  }
  if (platformStr.includes('linux') || platformStr.includes('x11')) {
    return 'linux';
  }
  return 'windows';
}

export function getPlatformDisplayInfo(platform: DetectedPlatform): {
  label: string;
  ctrlLabel: string;
  altLabel: string;
  shiftLabel: string;
} {
  if (platform === 'mac') {
    return {
      label: 'macOS',
      ctrlLabel: '⌘',
      altLabel: '⌥',
      shiftLabel: '⇧',
    };
  }
  if (platform === 'linux') {
    return {
      label: 'Linux',
      ctrlLabel: 'Ctrl',
      altLabel: 'Alt',
      shiftLabel: 'Shift',
    };
  }
  return {
    label: 'Windows',
    ctrlLabel: 'Ctrl',
    altLabel: 'Alt',
    shiftLabel: 'Shift',
  };
}

function sanitizeBinding(
  raw: unknown,
  fallback: ShortcutBinding
): ShortcutBinding {
  if (!raw || typeof raw !== 'object') return fallback;
  const obj = raw as Record<string, unknown>;
  const key =
    typeof obj.key === 'string' && obj.key.trim().length > 0
      ? obj.key.trim().toLowerCase().slice(0, 12)
      : fallback.key;
  return {
    key,
    ctrlOrCmd: typeof obj.ctrlOrCmd === 'boolean' ? obj.ctrlOrCmd : fallback.ctrlOrCmd,
    alt: typeof obj.alt === 'boolean' ? obj.alt : fallback.alt,
    shift: typeof obj.shift === 'boolean' ? obj.shift : fallback.shift,
  };
}

export function getStoredShortcutConfig(): AccessibilityShortcutConfig {
  if (typeof window === 'undefined') return DEFAULT_SHORTCUT_CONFIG;
  try {
    const raw = localStorage.getItem(CUSTOM_SHORTCUTS_STORAGE_KEY);
    if (!raw) return DEFAULT_SHORTCUT_CONFIG;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      focusMode: sanitizeBinding(parsed.focusMode, DEFAULT_SHORTCUT_CONFIG.focusMode),
      adaptiveDifficulty: sanitizeBinding(
        parsed.adaptiveDifficulty,
        DEFAULT_SHORTCUT_CONFIG.adaptiveDifficulty
      ),
    };
  } catch {
    return DEFAULT_SHORTCUT_CONFIG;
  }
}

export function saveShortcutConfig(config: AccessibilityShortcutConfig): AccessibilityShortcutConfig {
  const sanitized: AccessibilityShortcutConfig = {
    focusMode: sanitizeBinding(config.focusMode, DEFAULT_SHORTCUT_CONFIG.focusMode),
    adaptiveDifficulty: sanitizeBinding(
      config.adaptiveDifficulty,
      DEFAULT_SHORTCUT_CONFIG.adaptiveDifficulty
    ),
  };
  try {
    localStorage.setItem(CUSTOM_SHORTCUTS_STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(
      new CustomEvent(SHORTCUTS_UPDATED_EVENT, { detail: sanitized })
    );
  } catch (e) {
    console.error('Failed to save custom shortcuts:', e);
  }
  return sanitized;
}

export function resetShortcutConfig(): AccessibilityShortcutConfig {
  try {
    localStorage.removeItem(CUSTOM_SHORTCUTS_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(SHORTCUTS_UPDATED_EVENT, { detail: DEFAULT_SHORTCUT_CONFIG })
    );
  } catch {
    // ignore
  }
  return DEFAULT_SHORTCUT_CONFIG;
}

export function formatKeyName(key: string): string {
  const lower = key.toLowerCase();
  if (lower === ' ') return 'Space';
  if (lower.length === 1) return lower.toUpperCase();
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function formatShortcutCombo(
  binding: ShortcutBinding,
  platform: DetectedPlatform = detectUserPlatform()
): string {
  const info = getPlatformDisplayInfo(platform);
  const parts: string[] = [];
  if (binding.ctrlOrCmd) parts.push(info.ctrlLabel);
  if (binding.alt) parts.push(info.altLabel);
  if (binding.shift) parts.push(info.shiftLabel);
  parts.push(formatKeyName(binding.key));
  return platform === 'mac' ? parts.join(' + ') : parts.join('+');
}

export function isSameBinding(a: ShortcutBinding, b: ShortcutBinding): boolean {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    a.ctrlOrCmd === b.ctrlOrCmd &&
    a.alt === b.alt &&
    a.shift === b.shift
  );
}

export function matchesShortcutEvent(
  e: KeyboardEvent,
  binding: ShortcutBinding,
  isEditableTarget: boolean,
  defaultSingleKeyAlias?: string
): boolean {
  const eventKey = (e.key || '').toLowerCase();
  const targetKey = binding.key.toLowerCase();
  const usesCtrlOrCmd = e.ctrlKey || e.metaKey;

  // Match explicit configured binding
  const primaryMatches =
    eventKey === targetKey &&
    usesCtrlOrCmd === binding.ctrlOrCmd &&
    e.altKey === binding.alt &&
    e.shiftKey === binding.shift;

  if (primaryMatches) {
    // If no modifiers are used, never hijack typing inside inputs/textareas
    if (!binding.ctrlOrCmd && !binding.alt && isEditableTarget) {
      return false;
    }
    if (binding.ctrlOrCmd && isEditableTarget) {
      return false;
    }
    return true;
  }

  // Optional single-key fallback alias (e.g. 'f' or 'a' when on default binding)
  if (
    defaultSingleKeyAlias &&
    !isEditableTarget &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    !e.shiftKey &&
    eventKey === defaultSingleKeyAlias.toLowerCase()
  ) {
    return true;
  }

  return false;
}
