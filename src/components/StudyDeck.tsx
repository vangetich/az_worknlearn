import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Layers,
  Cloud,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
  Table,
  Compass,
  Check,
} from 'lucide-react';
import {
  CURRICULUM_STUDY_MODULES,
  HIGH_YIELD_CHEAT_SHEETS,
} from '../data/studyNotes';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface StudyDeckProps {
  initialPathId?: 1 | 2 | 3;
  initialModuleId?: number;
  onPracticeModule?: (moduleId: number, pathId: 1 | 2 | 3) => void;
}

export const StudyDeck: React.FC<StudyDeckProps> = ({
  initialPathId = 1,
  initialModuleId = 1,
  onPracticeModule,
}) => {
  const [selectedPathId, setSelectedPathId] = useState<1 | 2 | 3>(initialPathId);
  const [selectedModuleId, setSelectedModuleId] = useState<number>(initialModuleId);
  const [activeView, setActiveView] = useState<'units' | 'matrices'>('units');
  const [selectedMatrixCategory, setSelectedMatrixCategory] = useState<string>('All');
  const [completedUnitIds, setCompletedUnitIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('az900_completed_study_units');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modules belonging to the currently selected Learning Path
  const pathModules = useMemo(() => {
    return CURRICULUM_STUDY_MODULES.filter((m) => m.pathId === selectedPathId);
  }, [selectedPathId]);

  // Ensure selectedModuleId stays valid when switching Learning Paths
  const activeModule = useMemo(() => {
    const found = CURRICULUM_STUDY_MODULES.find((m) => m.moduleId === selectedModuleId);
    if (found && found.pathId === selectedPathId) {
      return found;
    }
    return pathModules[0] || CURRICULUM_STUDY_MODULES[0];
  }, [selectedModuleId, selectedPathId, pathModules]);

  const activePathInfo = useMemo(() => {
    return LEARNING_PATHS.find((p) => p.id === selectedPathId) || LEARNING_PATHS[0];
  }, [selectedPathId]);

  const handleSelectPath = (pathId: 1 | 2 | 3) => {
    setSelectedPathId(pathId);
    const firstModInPath = CURRICULUM_STUDY_MODULES.find((m) => m.pathId === pathId);
    if (firstModInPath) {
      setSelectedModuleId(firstModInPath.moduleId);
    }
  };

  const handleToggleUnitComplete = (unitId: string) => {
    setCompletedUnitIds((prev) => {
      const next = prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId];
      try {
        localStorage.setItem('az900_completed_study_units', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const matrixCategories = [
    'All',
    'Cloud Concepts',
    'Architecture & Services',
    'Management & Governance',
  ];

  const filteredSheets =
    selectedMatrixCategory === 'All'
      ? HIGH_YIELD_CHEAT_SHEETS
      : HIGH_YIELD_CHEAT_SHEETS.filter((s) => s.category === selectedMatrixCategory);

  const moduleCompletedUnitsCount = activeModule.units.filter((u) =>
    completedUnitIds.includes(u.id)
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner: AZ-900 Interactive Study Mode */}
      <div className="bg-white rounded-2xl border border-sky-200/90 card-elevation overflow-hidden shadow-xs">
        <KitengeRibbon height={4} />

        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-sky-400/20 border border-sky-300/40 text-amber-300 shrink-0 shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  <MaasaiMedallion size={12} />
                  <span>AZ-900 Interactive Study Mode</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-sky-100 border border-white/20">
                  3 Learning Paths • 12 Modules • {CURRICULUM_STUDY_MODULES.reduce((acc, m) => acc + m.units.length, 0)} Units
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Curriculum Study Guide &amp; Service Architecture Matrix
              </h2>
              <p className="text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
                Select a Learning Path and Module below to review concise concept explanations, relevant Azure services, and simplified real-world examples for every unit.
              </p>
            </div>
          </div>

          {/* Mode Switcher: Unit-by-Unit Study Mode vs Comparison Matrices */}
          <div className="flex items-center bg-slate-950/50 p-1 rounded-xl border border-white/15 text-xs font-bold self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('units')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'units'
                  ? 'bg-[#0078D4] text-white font-extrabold shadow-xs'
                  : 'text-sky-100/80 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-300" />
              <span>Module &amp; Unit Study Guide</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('matrices')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'matrices'
                  ? 'bg-[#0078D4] text-white font-extrabold shadow-xs'
                  : 'text-sky-100/80 hover:text-white'
              }`}
            >
              <Table className="w-4 h-4 text-sky-200" />
              <span>Comparison Matrices ({HIGH_YIELD_CHEAT_SHEETS.length})</span>
            </button>
          </div>
        </div>

        {/* =================================================================
            VIEW 1: INTERACTIVE LEARNING PATH -> MODULE -> UNIT STUDY MODE
           ================================================================= */}
        {activeView === 'units' && (
          <div className="p-5 sm:p-6 space-y-6 bg-slate-50/50">
            {/* STEP 1: Select a Learning Path (Paths 1, 2, 3) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Step 1: Select Learning Path</span>
                </span>
                <span className="text-xs font-bold text-slate-600">
                  Exam Weight: <strong className="text-[#0078D4]">{activePathInfo.examWeight}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {LEARNING_PATHS.map((path) => {
                  const isSelected = selectedPathId === path.id;
                  const PathIcon =
                    path.id === 1 ? Cloud : path.id === 2 ? Layers : ShieldCheck;

                  return (
                    <button
                      key={path.id}
                      type="button"
                      onClick={() => handleSelectPath(path.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-white border-[#0078D4] ring-2 ring-[#0078D4]/20 shadow-sm'
                          : 'bg-white/80 hover:bg-white border-slate-200/90 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase"
                          style={{
                            backgroundColor: isSelected ? path.accentColor : `${path.accentColor}15`,
                            color: isSelected ? '#FFFFFF' : path.accentColor,
                          }}
                        >
                          <PathIcon className="w-3.5 h-3.5" />
                          <span>Learning Path {path.id}</span>
                        </span>
                        <span className="text-[11px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {path.examWeight}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                          {path.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {path.summary}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Select a Specific Module within the Learning Path */}
            <div className="space-y-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Step 2: Select Module in Learning Path {selectedPathId}</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {pathModules.map((mod) => {
                  const isModActive = activeModule.moduleId === mod.moduleId;
                  const doneInMod = mod.units.filter((u) =>
                    completedUnitIds.includes(u.id)
                  ).length;

                  return (
                    <button
                      key={mod.moduleId}
                      type="button"
                      onClick={() => setSelectedModuleId(mod.moduleId)}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isModActive
                          ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-sm'
                          : 'bg-white hover:bg-blue-50/40 text-slate-800 border-slate-200 hover:border-[#0078D4]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isModActive
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-50 text-[#0078D4] border border-blue-200'
                          }`}
                        >
                          Module {mod.moduleId}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            isModActive ? 'text-sky-100' : 'text-slate-500'
                          }`}
                        >
                          {doneInMod}/{mod.units.length} Units
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs sm:text-sm leading-snug">
                        {mod.moduleTitle}
                      </h4>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE MODULE HEADER & PROGRESS SUMMARY */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs font-black text-white"
                    style={{ backgroundColor: activePathInfo.accentColor }}
                  >
                    Path {selectedPathId} • Module {activeModule.moduleId}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {activeModule.units.length} Core Curriculum Units
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {moduleCompletedUnitsCount}/{activeModule.units.length} Studied
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {activeModule.moduleTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                  {activeModule.moduleSummary}
                </p>
              </div>

              {onPracticeModule && (
                <button
                  type="button"
                  onClick={() => onPracticeModule(activeModule.moduleId, selectedPathId)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-[#005A9E] hover:from-[#005A9E] hover:to-[#004578] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0 self-start md:self-center"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Practice Module {activeModule.moduleId} Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* STEP 3: UNIT-BY-UNIT BREAKDOWN CARDS */}
            <div className="space-y-4">
              {activeModule.units.map((unit) => {
                const isUnitCompleted = completedUnitIds.includes(unit.id);

                return (
                  <article
                    key={unit.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-2xs ${
                      isUnitCompleted
                        ? 'border-emerald-300/90 ring-1 ring-emerald-500/15'
                        : 'border-slate-200/90 hover:border-sky-300'
                    }`}
                  >
                    {/* Unit Card Header */}
                    <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-[#0078D4] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          U{unit.unitNumber}
                        </span>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0078D4] block">
                            Module {activeModule.moduleId} • Unit {unit.unitNumber} of {activeModule.units.length}
                          </span>
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                            {unit.unitTitle}
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleUnitComplete(unit.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isUnitCompleted
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{isUnitCompleted ? 'Unit Studied' : 'Mark Unit Studied'}</span>
                      </button>
                    </div>

                    {/* Unit Card Body: 3 Core Pillars (Concept Explanation, Relevant Azure Services, Simplified Example) */}
                    <div className="p-5 sm:p-6 space-y-5">
                      {/* 1. Concise Explanation of Key Concepts */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#0078D4] flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Key Concept Explanation</span>
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
                          {unit.conceptExplanation}
                        </p>
                      </div>

                      {/* 2. Relevant Azure Services & 3. Simplified Real-World Example */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                        {/* Relevant Azure Services (7 cols) */}
                        <div className="lg:col-span-7 rounded-xl bg-blue-50/50 border border-blue-200/80 p-4 space-y-2.5">
                          <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                            <Cloud className="w-3.5 h-3.5 text-[#0078D4]" />
                            <span>Relevant Azure Services</span>
                          </span>
                          <div className="space-y-2">
                            {unit.azureServices.map((srv, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-lg bg-white border border-blue-100 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 text-xs"
                              >
                                <span className="font-extrabold text-[#0078D4] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0 self-start">
                                  {srv.name}
                                </span>
                                <span className="text-slate-700 leading-relaxed">
                                  {srv.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Simplified Real-World Example (5 cols) */}
                        <div className="lg:col-span-5 rounded-xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 border border-amber-200/90 p-4 flex flex-col justify-between space-y-2">
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                              <span>Simplified Real-World Example</span>
                            </span>
                            <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                              {unit.simplifiedExample}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-amber-200/60 flex items-start gap-2 text-[11px] text-amber-900">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                              <strong className="font-black">Exam Takeaway:</strong> {unit.examTakeaway}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =================================================================
          VIEW 2: HIGH-YIELD COMPARISON MATRIX CHEAT SHEETS
         ================================================================= */}
      {activeView === 'matrices' && (
        <div className="space-y-5">
          {/* Category Filter Pills */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-[#0078D4]" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                Side-by-Side Azure Service Comparison Matrices
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {matrixCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedMatrixCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedMatrixCategory === cat
                      ? 'bg-[#0078D4] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {filteredSheets.map((sheet) => (
              <div
                key={sheet.id}
                className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-[#0078D4]">
                        Module {sheet.moduleId}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {sheet.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {sheet.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {sheet.summary}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  {/* Golden Rule Banner */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-emerald-950">
                      <span className="font-bold uppercase tracking-wider text-xs text-emerald-800 block mb-0.5">
                        Core Architectural Rule:
                      </span>
                      {sheet.keyRule}
                    </div>
                  </div>

                  {/* Comparison Table */}
                  {sheet.comparisonTable && (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                            {sheet.comparisonTable.headers.map((header, i) => (
                              <th
                                key={i}
                                className="py-3 px-4 font-bold whitespace-nowrap"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sheet.comparisonTable.rows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-blue-50/30 transition-colors"
                            >
                              {row.map((cell, cIdx) => {
                                const isCustomer = cell === 'Customer';
                                const isMicrosoft = cell === 'Microsoft';

                                return (
                                  <td
                                    key={cIdx}
                                    className={`py-3 px-4 ${
                                      cIdx === 0
                                        ? 'font-bold text-slate-900 bg-slate-50/60'
                                        : 'text-slate-700'
                                    }`}
                                  >
                                    {isCustomer ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                                        Customer
                                      </span>
                                    ) : isMicrosoft ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-[#0078D4] border border-blue-200">
                                        Cloud Provider
                                      </span>
                                    ) : (
                                      cell
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Exam Trap Warning */}
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300/80 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-amber-950">
                      <span className="font-extrabold uppercase tracking-wider text-xs text-amber-900 block mb-0.5">
                        ⚠️ Common Exam Distractor Trap:
                      </span>
                      {sheet.examTrap}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
