import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Keyboard,
  SlidersHorizontal,
  RotateCcw,
  Check,
  X,
  Laptop,
  Sparkles,
  Accessibility,
} from 'lucide-react';
import {
  AccessibilityShortcutConfig,
  DEFAULT_SHORTCUT_CONFIG,
  DetectedPlatform,
  SHORTCUTS_UPDATED_EVENT,
  ShortcutBinding,
  detectUserPlatform,
  formatKeyName,
  formatShortcutCombo,
  getPlatformDisplayInfo,
  getStoredShortcutConfig,
  isSameBinding,
  resetShortcutConfig,
  saveShortcutConfig,
} from '../utils/keyboardShortcuts';

export function useKeyboardShortcutsConfig() {
  const [config, setConfig] = useState<AccessibilityShortcutConfig>(getStoredShortcutConfig);
  const [platform] = useState<DetectedPlatform>(detectUserPlatform);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AccessibilityShortcutConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(getStoredShortcutConfig());
      }
    };
    window.addEventListener(SHORTCUTS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(SHORTCUTS_UPDATED_EVENT, handleUpdate);
  }, []);

  return { config, platform };
}

interface KeyboardShortcutGuidePopoverProps {
  isDynamicDifficultyEnabled?: boolean;
  effectiveDynamicDifficulty?: 'Fundamental' | 'Intermediate' | 'Advanced';
  onToggleDynamicDifficulty?: () => void;
  onOpenAccessibilitySettings: () => void;
  align?: 'left' | 'right';
}

/**
 * Dynamic, platform-aware Keyboard Shortcut Guide popover rendered on hover
 * over the Focus Mode indicator.
 */
export const KeyboardShortcutGuidePopover: React.FC<KeyboardShortcutGuidePopoverProps> = ({
  isDynamicDifficultyEnabled = true,
  effectiveDynamicDifficulty = 'Intermediate',
  onToggleDynamicDifficulty,
  onOpenAccessibilitySettings,
  align = 'right',
}) => {
  const { config, platform } = useKeyboardShortcutsConfig();
  const platformInfo = getPlatformDisplayInfo(platform);

  const focusCombo = formatShortcutCombo(config.focusMode, platform);
  const adaptiveCombo = formatShortcutCombo(config.adaptiveDifficulty, platform);

  const isDefaultFocus = isSameBinding(config.focusMode, DEFAULT_SHORTCUT_CONFIG.focusMode);
  const isDefaultAdaptive = isSameBinding(
    config.adaptiveDifficulty,
    DEFAULT_SHORTCUT_CONFIG.adaptiveDifficulty
  );

  return (
    <div
      role="tooltip"
      className={`pointer-events-none group-hover/focusguide:pointer-events-auto group-hover/cardfocusguide:pointer-events-auto group-hover/floatingfocus:pointer-events-auto opacity-0 invisible group-hover/focusguide:opacity-100 group-hover/focusguide:visible group-hover/cardfocusguide:opacity-100 group-hover/cardfocusguide:visible group-hover/floatingfocus:opacity-100 group-hover/floatingfocus:visible transition-all duration-150 absolute ${
        align === 'left' ? 'left-0' : 'right-0'
      } top-full mt-2 w-76 sm:w-84 rounded-2xl bg-slate-950/98 text-white border border-sky-400/50 shadow-2xl p-3.5 z-[95] text-left space-y-2.5`}
    >
      {/* Header with Auto-Detected Platform Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Keyboard className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="text-[11px] font-black uppercase tracking-wider text-sky-200 truncate">
            Keyboard Shortcut Guide
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/30 text-sky-200 text-[9.5px] font-extrabold shrink-0">
          <Laptop className="w-2.5 h-2.5 text-sky-300" />
          <span>{platformInfo.label}</span>
        </span>
      </div>

      {/* Platform-Aware Shortcut Rows */}
      <div className="space-y-2 text-[11px]">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
          <div>
            <div className="font-extrabold text-white">Focus Mode Toggle</div>
            <div className="text-[10px] text-slate-300">
              Distraction-free exam view (Esc exits)
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isDefaultFocus && (
              <>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 font-mono text-[10px] font-black text-amber-300">
                  F
                </kbd>
                <span className="text-[9px] text-slate-400">or</span>
              </>
            )}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 font-mono text-[10px] font-black text-amber-300">
              {focusCombo}
            </kbd>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
          <div>
            <div className="font-extrabold text-white">Adaptive Difficulty Toggle</div>
            <div className="text-[10px] text-slate-300">
              Status:{' '}
              <span className="text-emerald-300 font-bold">
                {isDynamicDifficultyEnabled ? 'Auto-Balancing ON' : 'Paused'}
              </span>{' '}
              ({effectiveDynamicDifficulty})
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isDefaultAdaptive && (
              <>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 font-mono text-[10px] font-black text-emerald-300">
                  A
                </kbd>
                <span className="text-[9px] text-slate-400">or</span>
              </>
            )}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 font-mono text-[10px] font-black text-emerald-300">
              {adaptiveCombo}
            </kbd>
          </div>
        </div>
      </div>

      {/* Footer Actions: Quick Adaptive Toggle & Customize Accessibility Settings Sub-Modal */}
      <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-slate-800 text-[10px]">
        {onToggleDynamicDifficulty ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDynamicDifficulty();
            }}
            className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer transition-colors"
          >
            {isDynamicDifficultyEnabled ? 'Pause Adaptive' : 'Enable Adaptive'}
          </button>
        ) : (
          <span className="text-slate-400">Auto-detected for {platformInfo.label}</span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAccessibilitySettings();
          }}
          className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black flex items-center gap-1 cursor-pointer transition-colors"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Customize Keys</span>
        </button>
      </div>
    </div>
  );
};

interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KEY_CHOICES = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'x', 'z',
];

export const AccessibilitySettingsModal: React.FC<AccessibilitySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [platform] = useState<DetectedPlatform>(detectUserPlatform);
  const platformInfo = getPlatformDisplayInfo(platform);

  const [draft, setDraft] = useState<AccessibilityShortcutConfig>(getStoredShortcutConfig);
  const [recordingTarget, setRecordingTarget] = useState<
    'focusMode' | 'adaptiveDifficulty' | null
  >(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(getStoredShortcutConfig());
      setRecordingTarget(null);
      setSavedToast(null);
    }
  }, [isOpen]);

  // Interactive key-combo recorder when user clicks "Record Key Combo"
  useEffect(() => {
    if (!isOpen || !recordingTarget) return;

    const handleRecordKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingTarget(null);
        return;
      }

      const rawKey = (e.key || '').toLowerCase();
      // Ignore pure modifier presses until user presses an actual key
      if (['control', 'meta', 'alt', 'shift', 'os'].includes(rawKey)) {
        return;
      }

      const nextBinding: ShortcutBinding = {
        key: rawKey,
        ctrlOrCmd: e.ctrlKey || e.metaKey,
        alt: e.altKey,
        shift: e.shiftKey,
      };

      setDraft((prev) => ({
        ...prev,
        [recordingTarget]: nextBinding,
      }));
      setRecordingTarget(null);
    };

    window.addEventListener('keydown', handleRecordKeyDown, true);
    return () => window.removeEventListener('keydown', handleRecordKeyDown, true);
  }, [isOpen, recordingTarget]);

  const handleSave = () => {
    saveShortcutConfig(draft);
    setSavedToast('Custom keyboard bindings saved and activated globally!');
    setTimeout(() => {
      setSavedToast(null);
      onClose();
    }, 900);
  };

  const handleResetDefaults = () => {
    const resetVal = resetShortcutConfig();
    setDraft(resetVal);
    setRecordingTarget(null);
    setSavedToast('Restored default platform-aware keyboard bindings.');
    setTimeout(() => setSavedToast(null), 2400);
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-settings-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-left animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 border border-white/20 text-amber-300">
              <Accessibility className="w-5 h-5" />
            </div>
            <div>
              <h3 id="accessibility-settings-title" className="text-sm sm:text-base font-black">
                Accessibility Settings &amp; Key Bindings
              </h3>
              <p className="text-[11px] text-sky-100/90 flex items-center gap-1.5 mt-0.5">
                <Laptop className="w-3 h-3 text-amber-300 shrink-0" />
                <span>
                  Auto-Detected Platform: <strong>{platformInfo.label}</strong> ({platformInfo.ctrlLabel} / {platformInfo.altLabel})
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close Accessibility Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75dvh] overflow-y-auto">
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-slate-700 leading-relaxed">
            Customize your keyboard shortcuts for <strong>Focus Mode</strong> and{' '}
            <strong>Adaptive Difficulty</strong>. Key labels automatically adapt to{' '}
            <strong>{platformInfo.label}</strong> ({platformInfo.ctrlLabel}, {platformInfo.altLabel},{' '}
            {platformInfo.shiftLabel}). Click <em>Record Key Combo</em> or configure modifiers directly below.
          </div>

          {(
            [
              {
                id: 'focusMode' as const,
                title: 'Focus Mode Shortcut',
                desc: 'Hides navigation & distractions for a focused exam experience (Esc always exits).',
                accent: 'amber',
              },
              {
                id: 'adaptiveDifficulty' as const,
                title: 'Adaptive Difficulty Shortcut',
                desc: 'Toggles automatic difficulty balancing on or off during active study sessions.',
                accent: 'emerald',
              },
            ]
          ).map((item) => {
            const binding = draft[item.id];
            const isRecording = recordingTarget === item.id;
            const formatted = formatShortcutCombo(binding, platform);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isRecording
                    ? 'bg-sky-50 border-[#0078D4] ring-2 ring-[#0078D4]/25'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">{item.desc}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <kbd className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 border border-slate-700 font-mono text-xs font-black shadow-2xs">
                      {formatted}
                    </kbd>
                    <button
                      type="button"
                      onClick={() =>
                        setRecordingTarget(isRecording ? null : item.id)
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                        isRecording
                          ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                          : 'bg-white hover:bg-sky-50 text-[#0078D4] border-sky-300'
                      }`}
                    >
                      {isRecording ? 'Press any key combo...' : 'Record Combo'}
                    </button>
                  </div>
                </div>

                {/* Accessible Manual Modifier & Key Pickers */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1">
                    Modifiers:
                  </span>
                  {(
                    [
                      { prop: 'ctrlOrCmd' as const, label: platformInfo.ctrlLabel },
                      { prop: 'alt' as const, label: platformInfo.altLabel },
                      { prop: 'shift' as const, label: platformInfo.shiftLabel },
                    ]
                  ).map((mod) => (
                    <label
                      key={mod.prop}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer font-bold text-[11px] transition-colors ${
                        binding[mod.prop]
                          ? 'bg-[#0078D4] text-white border-[#005A9E]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={binding[mod.prop]}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              [mod.prop]: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span>{mod.label}</span>
                    </label>
                  ))}

                  <div className="inline-flex items-center gap-1.5 ml-auto">
                    <label
                      htmlFor={`shortcut-key-${item.id}`}
                      className="text-[10px] font-black uppercase tracking-wider text-slate-500"
                    >
                      Key:
                    </label>
                    <select
                      id={`shortcut-key-${item.id}`}
                      value={
                        KEY_CHOICES.includes(binding.key.toLowerCase())
                          ? binding.key.toLowerCase()
                          : binding.key
                      }
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            key: e.target.value.toLowerCase(),
                          },
                        }))
                      }
                      className="px-2 py-1 rounded-lg bg-white border border-slate-300 font-mono text-xs font-black text-slate-900 cursor-pointer"
                    >
                      {!KEY_CHOICES.includes(binding.key.toLowerCase()) && (
                        <option value={binding.key}>{formatKeyName(binding.key)}</option>
                      )}
                      {KEY_CHOICES.map((k) => (
                        <option key={k} value={k}>
                          {k.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}

          {savedToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedToast}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Save Bindings</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
