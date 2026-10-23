import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Layers,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { Question } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';

interface AiScenarioGeneratorProps {
  onQuestionGenerated: (question: Question) => void;
  onCancel?: () => void;
}

const PRESET_TOPICS = [
  'Healthcare patient records compliance with Hybrid Cloud',
  'Cost optimization using Reserved Instances vs. Savings Plans',
  'Multi-tier web application with Azure App Service and Private Endpoints',
  'Blob Storage Lifecycle management across Cool and Archive tiers',
  'Zero Trust identity with Microsoft Entra Conditional Access',
  'Enforcing geographic deployment restrictions with Azure Policy',
  'Disaster Recovery strategy using Region Pairs and ZRS',
  'Managing on-premises Kubernetes using Azure Arc',
];

export const AiScenarioGenerator: React.FC<AiScenarioGeneratorProps> = ({
  onQuestionGenerated,
  onCancel,
}) => {
  const [selectedPathId, setSelectedPathId] = useState<number>(2);
  const [selectedModuleId, setSelectedModuleId] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'Fundamental' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number>(0);

  // Available modules for selected path
  const currentPath = LEARNING_PATHS.find((p) => p.id === selectedPathId) || LEARNING_PATHS[0];
  const modules = currentPath.modules;

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathId: selectedPathId,
          moduleId: selectedModuleId,
          difficulty,
          customPrompt: customPrompt.trim(),
          count: 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Server returned an error generating questions.');
      }

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No question was returned by the AI generator.');
      }

      const q = data.questions[0];
      // Normalize question object
      const formattedQuestion: Question = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        learningPathId: (q.learningPathId || selectedPathId) as 1 | 2 | 3,
        learningPathTitle: q.learningPathTitle || currentPath.title,
        moduleId: q.moduleId || selectedModuleId,
        moduleTitle: q.moduleTitle || (modules.find((m) => m.id === selectedModuleId)?.title || 'Custom Module'),
        difficulty: (q.difficulty || difficulty) as 'Fundamental' | 'Intermediate' | 'Advanced',
        scenario: q.scenario,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        whyCorrect: q.whyCorrect,
        distractorBreakdown: q.distractorBreakdown || [],
        examTip: q.examTip || 'Focus on Azure Curriculum architectural definitions.',
        isAiGenerated: true,
      };

      setSuccessCount((prev) => prev + 1);
      onQuestionGenerated(formattedQuestion);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || 'Could not generate scenario question. Please ensure Gemini API is configured.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 card-elevation overflow-hidden">
      {/* African Accent Header */}
      <div className="relative px-6 py-5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <Sparkles className="w-6 h-6 text-yellow-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">
                AI Scenario Quiz Generator
              </h3>
              <p className="text-amber-100 text-xs sm:text-sm">
                Generate tailored Microsoft AZ-900 enterprise scenarios with full distractor breakdowns
              </p>
            </div>
          </div>
          <MaasaiMedallion size={36} className="hidden sm:block opacity-80" />
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Step 1: Select Learning Path & Module */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Choose Learning Path
            </label>
            <select
              value={selectedPathId}
              onChange={(e) => {
                const newPathId = parseInt(e.target.value, 10);
                setSelectedPathId(newPathId);
                const pathObj = LEARNING_PATHS.find((p) => p.id === newPathId);
                if (pathObj && pathObj.modules.length > 0) {
                  setSelectedModuleId(pathObj.modules[0].id);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
            >
              {LEARNING_PATHS.map((p) => (
                <option key={p.id} value={p.id}>
                  Path {p.id}: {p.title} ({p.examWeight})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              2. Target Curriculum Module
            </label>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  Module {m.id}: {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Difficulty Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            3. Scenario Complexity
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['Fundamental', 'Intermediate', 'Advanced'] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficulty(diff)}
                className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                  difficulty === diff
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Custom Scenario Focus / Presets */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            4. Custom Focus or Enterprise Case (Optional)
          </label>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. FinTech bank migrating core payment gateway to Azure with Zero Trust..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
          />

          {/* Preset Topics Chips */}
          <div className="mt-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              💡 Or click a high-yield exam prompt:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCustomPrompt(topic)}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 border border-slate-200 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Generation Notice:</p>
              <p className="text-red-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {successCount > 0 && !isLoading && !errorMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Successfully created {successCount} scenario question! You can now answer it or generate another.
            </span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Powered by Gemini 3.8 Flash • Generates 1 scenario, 4 options, & full explanations.
          </p>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Crafting Scenario...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Generate Question</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
