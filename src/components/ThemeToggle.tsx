import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { ThemeMode, getStoredTheme, toggleTheme } from '../utils/theme';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    // Sync state with DOM attribute on mount
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
          ? 'Switch to Light theme'
          : 'Switch to Midnight Azure high-contrast dark theme'
      }
      onClick={handleToggle}
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] shadow-2xs group ${
        isDark
          ? 'bg-[#132238] hover:bg-[#1a2f4d] text-sky-200 border border-sky-500/40 hover:border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-300/80 hover:text-slate-900'
      } ${className}`}
      title={
        isDark
          ? 'Theme: Midnight Azure (Active). Click to switch to Light Theme.'
          : 'Theme: Light (Active). Click to switch to Midnight Azure Dark Theme.'
      }
    >
      <div className="relative flex items-center justify-center w-4 h-4">
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-300 animate-spin-slow group-hover:scale-110 transition-transform" />
            <Sparkles className="w-2.5 h-2.5 text-yellow-200 absolute -top-1 -right-1 pointer-events-none opacity-80" />
          </>
        ) : (
          <Moon className="w-4 h-4 text-[#0078D4] group-hover:scale-110 transition-transform" />
        )}
      </div>

      <span className="hidden sm:inline-block font-extrabold text-[11px] tracking-tight">
        {isDark ? 'Midnight Azure' : 'Light'}
      </span>
    </button>
  );
};
