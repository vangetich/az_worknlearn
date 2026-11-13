import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { ThemeMode, getStoredTheme, toggleTheme } from '../utils/theme';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    const current = getStoredTheme();
    setTheme(current);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: ThemeMode }>;
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
      }
    };

    window.addEventListener('az900_theme_changed', handleThemeChange);
    return () => {
      window.removeEventListener('az900_theme_changed', handleThemeChange);
    };
  }, []);

  const handleToggle = () => {
    const updated = toggleTheme(theme);
    setTheme(updated);
  };

  const isDark = theme === 'midnight-azure';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={
        isDark
          ? 'Midnight Azure dark mode ON — click to switch to Light theme'
          : 'Midnight Azure dark mode OFF — click to switch to Midnight Azure dark theme'
      }
      onClick={handleToggle}
      className={`relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] shadow-2xs group ${
        isDark
          ? 'bg-[#0b1526] hover:bg-[#132238] text-sky-200 border border-sky-400/60 shadow-[0_0_16px_rgba(56,189,248,0.28)]'
          : 'bg-slate-100 hover:bg-sky-50 text-slate-800 border border-slate-300/90 hover:border-sky-300'
      } ${className}`}
      title={
        isDark
          ? 'Midnight Azure Dark Theme Active • Click to switch back to Light Mode'
          : 'Switch to Midnight Azure Dark Theme (defined in src/index.css)'
      }
    >
      {/* Switch Track & Sliding Knob */}
      <span
        className={`relative inline-flex items-center w-8 h-4.5 rounded-full transition-colors duration-300 p-0.5 shrink-0 ${
          isDark
            ? 'bg-sky-500/35 border border-sky-400/70'
            : 'bg-slate-300/80 border border-slate-400/50'
        }`}
      >
        <span
          className={`flex items-center justify-center w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform duration-300 ${
            isDark
              ? 'translate-x-3.5 bg-[#38bdf8] text-slate-950'
              : 'translate-x-0 bg-white text-[#0078D4]'
          }`}
        >
          {isDark ? (
            <Moon className="w-2.5 h-2.5 fill-current" />
          ) : (
            <Sun className="w-2.5 h-2.5" />
          )}
        </span>
      </span>

      <span className="hidden sm:inline-flex items-center gap-1 font-extrabold text-[11px] tracking-tight whitespace-nowrap">
        <span>Midnight Azure</span>
        {isDark && <Sparkles className="w-3 h-3 text-sky-300" />}
      </span>
    </button>
  );
};
