import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Check, X, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { UserStats } from '../types/quiz';

interface ResetModuleModalProps {
  stats: UserStats;
  initialModuleId?: number | null;
  onReset: (moduleId: number) => void;
  onClose: () => void;
}

export const ResetModuleModal: React.FC<ResetModuleModalProps> = ({
  stats,
  initialModuleId,
  onReset,
  onClose,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<number>(initialModuleId || 1);
  const [hasConfirmed, setHasConfirmed] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const selectedModuleInfo = React.useMemo(() => {
    for (const p of LEARNING_PATHS) {
      const found = p.modules.find((m) => m.id === selectedModuleId);
      if (found) {
        return { ...found, pathTitle: p.title, pathId: p.id };
      }
    }
    return null;
  }, [selectedModuleId]);

  const currentModMastery = stats.moduleMastery[selectedModuleId] || { correct: 0, total: 0 };
  const currentAccuracy =
    currentModMastery.total > 0
      ? Math.round((currentModMastery.correct / currentModMastery.total) * 100)
      : 0;

  const handleExecuteReset = () => {
    onReset(selectedModuleId);
    setResetSuccessMessage(`Module M${selectedModuleId} confidence cleared! You can now re-train from scratch.`);
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Reset Module Confidence
              </h3>
              <p className="text-xs text-slate-500">
                Clear progress on a specific module without affecting other modules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {resetSuccessMessage ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Module Confidence Reset!
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                {resetSuccessMessage}
              </p>
            </div>
          ) : (
            <>
              {/* Select Module Dropdown / Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Select Module to Reset:
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => {
                    setSelectedModuleId(parseInt(e.target.value, 10));
                    setHasConfirmed(false);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                >
                  {LEARNING_PATHS.map((path) => (
                    <optgroup key={path.id} label={`Path ${path.id}: ${path.title}`}>
                      {path.modules.map((mod) => {
                        const mStat = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
                        const label = `M${mod.id}: ${mod.title} (${mStat.total} attempts${mStat.total > 0 ? `, ${Math.round((mStat.correct / mStat.total) * 100)}%` : ''})`;
                        return (
                          <option key={mod.id} value={mod.id}>
                            {label}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Module Current Status Banner */}
              {selectedModuleInfo && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Path {selectedModuleInfo.pathId}: {selectedModuleInfo.title}
                    </span>
                    <span
                      className={`font-black px-2 py-0.5 rounded text-xs ${
                        currentModMastery.total === 0
                          ? 'bg-slate-200 text-slate-600'
                          : currentAccuracy >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {currentModMastery.total === 0
                        ? '0 attempts'
                        : `${currentAccuracy}% (${currentModMastery.correct}/${currentModMastery.total} correct)`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {selectedModuleInfo.description}
                  </p>
                </div>
              )}

              {/* Notice & Scope Assurance */}
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Safe Scoped Reset:</span>
                  <p className="leading-relaxed">
                    Clearing this module only resets question attempts and confidence scores for <strong>M{selectedModuleId}</strong>. Your daily streak ({stats.streakDays} days), bookmarked questions, and all other 11 modules remain completely untouched.
                  </p>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={hasConfirmed}
                  onChange={(e) => setHasConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <span>I want to clear M{selectedModuleId} history and start fresh</span>
              </label>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteReset}
                  disabled={!hasConfirmed}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirm Reset M{selectedModuleId}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
