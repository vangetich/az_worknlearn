import React, { useState } from 'react';
import {
  BookOpen,
  Cloud,
  Layers,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react';
import { MaasaiMedallion, KitengeRibbon } from './MotifDecorations';

interface LearningPathOverviewProps {
  onSelectPath?: (pathId: 1 | 2 | 3 | 'all') => void;
  selectedPathId?: number | 'all';
}

export const PATH_SUMMARIES = [
  {
    id: 1 as const,
    title: 'Describe Cloud Concepts',
    weight: '25–30%',
    accentColor: '#D97706', // Warm Ochre
    bgLight: 'bg-amber-50/70',
    borderLight: 'border-amber-200/90',
    textAccent: 'text-amber-800',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: Cloud,
    summary:
      'Covers fundamental cloud models (IaaS, PaaS, SaaS), essential cloud benefits like high availability, scalability, and elasticity, and cloud economics contrasting CapEx with consumption-based OpEx. This path establishes the non-negotiable conceptual foundation and Shared Responsibility Model tested across every scenario question on the AZ-900 exam.',
    keyThemes: ['Shared Responsibility Model', 'IaaS vs PaaS vs SaaS', 'CapEx vs OpEx', 'Elasticity & High Availability'],
    examTip: 'Exam Anchor: If the scenario asks who patches the OS, IaaS = Customer, PaaS/SaaS = Microsoft.',
  },
  {
    id: 2 as const,
    title: 'Describe Azure Architecture & Services',
    weight: '35–40%',
    accentColor: '#0078D4', // Azure Blue
    bgLight: 'bg-blue-50/70',
    borderLight: 'border-blue-200/90',
    textAccent: 'text-[#0078D4]',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    icon: Layers,
    summary:
      'Encompasses Azure global infrastructure hierarchy (geographies, regions, availability zones) and core enterprise services spanning virtual machines, containers, networking, storage access tiers, and Microsoft Entra ID. As the heaviest-weighted exam domain, mastering service boundaries and Zero Trust defense-in-depth is paramount for achieving a 700+ passing score.',
    keyThemes: ['Availability Zones & Region Pairs', 'Virtual Machines vs Containers', 'Storage Tiers & Redundancy (LRS/GRS)', 'Microsoft Entra ID & RBAC'],
    examTip: 'Exam Anchor: Datacenter isolation in the same region = Availability Zones; 300+ miles apart = Region Pairs.',
  },
  {
    id: 3 as const,
    title: 'Describe Azure Management & Governance',
    weight: '30–35%',
    accentColor: '#C2410C', // Safari Terracotta
    bgLight: 'bg-orange-50/70',
    borderLight: 'border-orange-200/90',
    textAccent: 'text-[#C2410C]',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
    icon: ShieldCheck,
    summary:
      'Focuses on cost management tools (Pricing vs TCO calculators, budgets, tags), governance mechanisms like Azure Policy, Resource Locks, and Blueprints, alongside monitoring with Azure Monitor and Service Health. Crucial for exam scenarios testing compliance enforcement, resource lifecycle boundaries, and multi-cloud management.',
    keyThemes: ['Pricing Calculator vs TCO', 'Azure Policy vs Resource Locks', 'Azure Arc & Resource Manager', 'Service Health & SLAs'],
    examTip: 'Exam Anchor: Resource Locks override RBAC permissions; even subscription Owners cannot delete locked resources.',
  },
];

export const LearningPathOverview: React.FC<LearningPathOverviewProps> = ({
  onSelectPath,
  selectedPathId = 'all',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden transition-all mb-6">
      <KitengeRibbon height={3} />

      {/* Header bar */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 via-white to-sky-50/40 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#0078D4] to-blue-700 text-white shadow-xs">
            <BookOpen className="w-5 h-5" />
            <div className="absolute -bottom-1 -right-1">
              <MaasaiMedallion size={14} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Learning Path Overview
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#0078D4] border border-blue-200">
                Official Curriculum Structure
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Core concepts, exam weightings, and architectural anchors across all 3 paths
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
        >
          <span>{isExpanded ? 'Hide' : 'Show Overview'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Content Body */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PATH_SUMMARIES.map((p) => {
              const Icon = p.icon;
              const isSelected = selectedPathId === p.id;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between space-y-3.5 relative overflow-hidden ${
                    isSelected
                      ? 'ring-2 ring-[#0078D4] shadow-md bg-white'
                      : `${p.bgLight} ${p.borderLight} hover:shadow-xs hover:bg-white`
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Path Title & Weight Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-2 rounded-xl text-white shadow-2xs"
                          style={{ backgroundColor: p.accentColor }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                            Path {p.id}
                          </span>
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-snug">
                            {p.title}
                          </h4>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${p.badgeColor}`}
                      >
                        {p.weight} Weight
                      </span>
                    </div>

                    {/* Concise Summary (2-3 sentences) */}
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {p.summary}
                    </p>

                    {/* Key Core Themes */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.keyThemes.map((theme, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 border border-slate-200 text-slate-700 shadow-2xs"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Exam Anchor and Filter Button */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <p className="text-[10px] text-slate-500 italic">
                      <strong className="text-slate-700 not-italic">Anchor:</strong> {p.examTip}
                    </p>

                    {onSelectPath && (
                      <button
                        type="button"
                        onClick={() => onSelectPath(p.id)}
                        className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0078D4] text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        <span>{isSelected ? 'Active Path' : `Practice Path ${p.id}`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
