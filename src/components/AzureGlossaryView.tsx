import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  ExternalLink,
  AlertTriangle,
  Layers,
  Link2,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Compass,
  Filter,
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  Globe,
  Loader2,
  Flame,
  Award,
} from 'lucide-react';
import {
  AZURE_GLOSSARY_TERMS,
  AzureGlossaryTerm,
} from '../data/azureGlossaryData';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface GoogleSearchLookupResult {
  query: string;
  grounded: boolean;
  summary: string;
  examTakeaway: string;
  sources: { title: string; uri: string }[];
}

interface AzureGlossaryViewProps {
  initialTermId?: string | null;
  onDrillTermInPractice?: (term: string) => void;
  onSelectModule?: (moduleId: number, pathId: 1 | 2 | 3) => void;
  onOpenStudyMode?: (moduleId: number, pathId: 1 | 2 | 3) => void;
}

const BOOKMARKED_GLOSSARY_STORAGE_KEY = 'az900_bookmarked_glossary_terms_v1';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const OFFICIAL_REFERENCE_HUB_LINKS = [
  {
    title: 'AZ-900 Official Study Guide & Exam Skills Outline',
    category: 'Certification Blueprint',
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900',
  },
  {
    title: 'Path 1: Microsoft Azure Fundamentals — Cloud Concepts',
    category: 'Learning Path 1 (25–30%)',
    url: 'https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/',
  },
  {
    title: 'Path 2: Describe Azure Architecture and Services',
    category: 'Learning Path 2 (35–40%)',
    url: 'https://learn.microsoft.com/en-us/training/paths/azure-fundamentals-describe-azure-architecture-services/',
  },
  {
    title: 'Path 3: Describe Azure Management and Governance',
    category: 'Learning Path 3 (30–35%)',
    url: 'https://learn.microsoft.com/en-us/training/paths/describe-azure-management-governance/',
  },
  {
    title: 'Microsoft Cloud Adoption Framework for Azure',
    category: 'Architecture & Strategy',
    url: 'https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/overview',
  },
  {
    title: 'Microsoft Entra ID & Zero Trust Documentation',
    category: 'Identity & Security',
    url: 'https://learn.microsoft.com/en-us/entra/fundamentals/whatis',
  },
];

export const AzureGlossaryView: React.FC<AzureGlossaryViewProps> = ({
  initialTermId,
  onDrillTermInPractice,
  onSelectModule,
  onOpenStudyMode,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPathFilter, setSelectedPathFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<number | 'all'>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [highlightedTermId, setHighlightedTermId] = useState<string | null>(
    initialTermId || null
  );
  const [showReferenceHub, setShowReferenceHub] = useState<boolean>(false);

  // Google Search Feature State
  const [googleSearchInput, setGoogleSearchInput] = useState<string>('');
  const [isSearchingGoogle, setIsSearchingGoogle] = useState<boolean>(false);
  const [googleSearchResult, setGoogleSearchResult] =
    useState<GoogleSearchLookupResult | null>(null);

  // Daily Consistent Reading Tracker (Motivates daily glossary & docs reading habit)
  const todayDateKey = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [readTodayIds, setReadTodayIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`az900_glossary_read_${new Date().toISOString().split('T')[0]}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const handleMarkTermReadToday = (id: string) => {
    setReadTodayIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try {
        localStorage.setItem(`az900_glossary_read_${todayDateKey}`, JSON.stringify(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  const handleRunGoogleLookup = async (customQuery?: string) => {
    const targetQuery = (customQuery ?? googleSearchInput ?? searchQuery).trim();
    if (!targetQuery) return;
    setGoogleSearchInput(targetQuery);
    setIsSearchingGoogle(true);
    try {
      const res = await fetch('/api/glossary/google-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery }),
      });
      const data = await res.json();
      if (res.ok && data) {
        setGoogleSearchResult(data);
      }
    } catch {
      setGoogleSearchResult({
        query: targetQuery,
        grounded: false,
        summary: `Explore "${targetQuery}" in official Microsoft Azure documentation and Google Search below. Consistent daily reading of core Azure definitions builds lasting architectural intuition for exam day.`,
        examTakeaway:
          'Always connect each Azure service to its Learning Path (Cloud Concepts, Architecture & Services, or Management & Governance) and compare it against close distractors.',
        sources: [
          {
            title: `Google Search: Microsoft Azure ${targetQuery} AZ-900`,
            uri: `https://www.google.com/search?q=${encodeURIComponent(
              `Microsoft Azure AZ-900 ${targetQuery}`
            )}`,
          },
          {
            title: `Microsoft Learn Search: ${targetQuery}`,
            uri: `https://learn.microsoft.com/en-us/search/?terms=${encodeURIComponent(
              targetQuery
            )}`,
          },
        ],
      });
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const [savedTermIds, setSavedTermIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(BOOKMARKED_GLOSSARY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : ['shared-responsibility-model', 'azure-policy', 'rbac'];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (initialTermId) {
      setHighlightedTermId(initialTermId);
    }
  }, [initialTermId]);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKED_GLOSSARY_STORAGE_KEY, JSON.stringify(savedTermIds));
    } catch {
      // ignore storage errors
    }
  }, [savedTermIds]);

  const toggleSaveTerm = (id: string) => {
    setSavedTermIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const categories = useMemo(() => {
    const unique = Array.from(new Set(AZURE_GLOSSARY_TERMS.map((t) => t.category)));
    return ['All', ...unique];
  }, []);

  const allModules = useMemo(
    () => LEARNING_PATHS.flatMap((p) => p.modules.map((m) => ({ ...m, pathId: p.id }))),
    []
  );

  // Jump to an interrelated term when clicked
  const handlePinpointRelatedTerm = (relatedTermName: string) => {
    const qLower = relatedTermName.toLowerCase();
    const target = AZURE_GLOSSARY_TERMS.find((item) => {
      const tLower = item.term.toLowerCase();
      const aLower = (item.acronym || '').toLowerCase();
      return (
        tLower.includes(qLower) ||
        qLower.includes(tLower) ||
        (aLower && qLower.includes(aLower))
      );
    });

    // Clear restrictive filters so the target term is guaranteed to be visible
    setSelectedPathFilter('all');
    setSelectedCategory('All');
    setSelectedModuleFilter('all');
    setSelectedLetter('ALL');
    setOnlySaved(false);

    if (target) {
      setSearchQuery('');
      setHighlightedTermId(target.id);
      setTimeout(() => {
        const el = document.getElementById(`glossary-term-${target.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 80);
    } else {
      setSearchQuery(relatedTermName);
    }
  };

  const filteredTerms = useMemo(() => {
    return AZURE_GLOSSARY_TERMS.filter((item) => {
      if (selectedPathFilter !== 'all' && item.pathId !== selectedPathFilter) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (selectedModuleFilter !== 'all' && item.moduleId !== selectedModuleFilter)
        return false;
      if (onlySaved && !savedTermIds.includes(item.id)) return false;

      if (selectedLetter !== 'ALL') {
        const firstChar = item.term.charAt(0).toUpperCase();
        if (firstChar !== selectedLetter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = `${item.term} ${item.acronym || ''} ${item.category} ${item.moduleTitle} ${
          item.definition
        } ${item.interrelatedSummary} ${item.examTrap} ${item.relatedTerms
          .map((r) => r.term)
          .join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [
    selectedPathFilter,
    selectedCategory,
    selectedModuleFilter,
    onlySaved,
    savedTermIds,
    selectedLetter,
    searchQuery,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPathFilter('all');
    setSelectedCategory('All');
    setSelectedModuleFilter('all');
    setSelectedLetter('ALL');
    setOnlySaved(false);
    setHighlightedTermId(null);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* =====================================================================
          HERO BANNER: AZ-900 MASTER GLOSSARY, DICTIONARY & REFERENCE GRAPH
         ===================================================================== */}
      <section
        aria-label="Azure Glossary and Dictionary Header"
        className="bg-white rounded-2xl border border-sky-200/90 card-elevation overflow-hidden shadow-xs"
      >
        <KitengeRibbon height={4} />

        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-400/20 border border-amber-300/40 text-amber-300 shrink-0 shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  <MaasaiMedallion size={12} />
                  <span>AZ-900 Master Dictionary &amp; Concept Graph</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-sky-100 border border-white/20">
                  {AZURE_GLOSSARY_TERMS.length} Core Terms • 12 Modules • Verified MS Learn Links
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Azure Glossary &amp; Interrelated Architecture Dictionary
              </h2>
              <p className="text-xs sm:text-sm text-sky-100/90 max-w-3xl leading-relaxed">
                Explore official definitions, pinpointed interrelated Azure services, high-yield exam distractor traps, and verified Microsoft Learn references. Click any interrelated chip to jump directly to its connected concept!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowReferenceHub((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 transition-all cursor-pointer ${
                showReferenceHub
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                  : 'bg-white/15 hover:bg-white/25 text-white border-white/25'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{showReferenceHub ? 'Hide Official Reference Hub' : 'Official MS Learn Hub'}</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlySaved((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 transition-all cursor-pointer ${
                onlySaved
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-xs'
                  : 'bg-slate-950/40 hover:bg-slate-950/60 text-sky-100 border-white/20'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Saved Terms ({savedTermIds.length})</span>
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE VERIFIED OFFICIAL MICROSOFT LEARN REFERENCE HUB */}
        {showReferenceHub && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-50 via-white to-amber-50/40 border-b border-sky-200/80 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  Verified Official Microsoft Learn Reference Directory (All Links Active)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReferenceHub(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {OFFICIAL_REFERENCE_HUB_LINKS.map((ref) => (
                <a
                  key={ref.url}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-[#0078D4] transition-all flex items-start justify-between gap-2 group shadow-2xs"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4] block">
                      {ref.category}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 group-hover:text-[#0078D4] line-clamp-2 mt-0.5">
                      {ref.title}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0078D4] shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            CONSISTENT AZURE READING & DAILY LEARNING MOTIVATION BANNER
           =================================================================== */}
        <div className="p-4 sm:px-6 bg-gradient-to-r from-amber-50/90 via-sky-50/80 to-emerald-50/80 border-b border-sky-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shrink-0 shadow-2xs mt-0.5">
              <Flame className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-200/90 text-amber-950 border border-amber-300">
                  Key to 700+ AZ-900 Exam Success
                </span>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  Why Consistent Daily Reading &amp; Learning of Azure Guarantees Exam Mastery
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                Passing AZ-900 is not about last-minute cramming—it comes from <strong>consistent daily reading</strong> of official Azure definitions and understanding how services connect across Compute, Networking, Storage, and Governance. Reading just <strong>5 glossary concepts daily</strong> builds permanent architectural recall so you immediately spot exam distractor traps!
              </p>
            </div>
          </div>

          {/* Daily Glossary Reading Goal Counter */}
          <div className="flex items-center gap-3 bg-white/95 px-3.5 py-2.5 rounded-xl border border-emerald-200 shadow-2xs shrink-0 self-start lg:self-center">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Today&apos;s Reading Goal:
                </span>
                <span className="text-xs font-black text-emerald-700">
                  {readTodayIds.length} / 5 Terms Read
                </span>
              </div>
              <div className="w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-[#0078D4] to-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (readTodayIds.length / 5) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            GOOGLE SEARCH & LIVE CLOUD WEB LOOKUP BAR IN GLOSSARY
           =================================================================== */}
        <div className="p-4 sm:px-6 bg-gradient-to-r from-slate-900 via-slate-800 to-[#0c2d48] text-white border-b border-slate-700 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black tracking-wide text-white">
                    Google Search &amp; Microsoft Learn Web Discovery
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-500/20 text-sky-200 border border-sky-400/30">
                    Live Web &amp; Grounded Lookup
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Search any Azure service, SKU, or cloud concept on Google or run an instant AI Google-Search-grounded lookup right here.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={googleSearchInput}
                  onChange={(e) => setGoogleSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRunGoogleLookup();
                    }
                  }}
                  placeholder="Type any Azure topic to search Google (e.g., Azure Bastion, Sovereign Regions)..."
                  className="w-full pl-9 pr-7 py-2 rounded-xl bg-slate-950/80 border border-slate-600 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                />
                {googleSearchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleSearchInput('');
                      setGoogleSearchResult(null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRunGoogleLookup()}
                  disabled={isSearchingGoogle || !(googleSearchInput.trim() || searchQuery.trim())}
                  className="px-3 py-2 rounded-xl bg-[#0078D4] hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Run in-app Google Search Grounded Azure Lookup"
                >
                  {isSearchingGoogle ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>AI Google Lookup</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    `Microsoft Azure AZ-900 ${
                      googleSearchInput.trim() || searchQuery.trim() || 'Exam Study Guide'
                    }`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-white hover:bg-sky-50 text-slate-900 text-xs font-extrabold inline-flex items-center gap-1.5 transition-all shadow-xs"
                  title="Open Google Search in a new browser tab"
                >
                  <Globe className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Google Search</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    `site:learn.microsoft.com Azure ${
                      googleSearchInput.trim() || searchQuery.trim() || 'AZ-900'
                    }`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-200 border border-slate-600 text-xs font-bold items-center gap-1 transition-all"
                  title="Search strictly inside learn.microsoft.com via Google"
                >
                  <span>Google + MS Learn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Grounded Google Search Lookup Result Drawer */}
          {googleSearchResult && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-sky-500/40 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {googleSearchResult.grounded
                      ? 'Google Search Grounded Result'
                      : 'Azure Web Reference Result'}
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-white">
                    Google Lookup: &ldquo;{googleSearchResult.query}&rdquo;
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setGoogleSearchResult(null)}
                  className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Close ✕
                </button>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                {googleSearchResult.summary}
              </p>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-200">
                <strong className="font-extrabold text-amber-300">
                  Consistent Reading Tip:{' '}
                </strong>
                {googleSearchResult.examTakeaway}
              </div>

              {googleSearchResult.sources && googleSearchResult.sources.length > 0 && (
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-300">
                    Verified Web &amp; Google Links:
                  </span>
                  {googleSearchResult.sources.map((src, sIdx) => (
                    <a
                      key={`${src.uri}-${sIdx}`}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-[#0078D4] text-sky-200 hover:text-white border border-slate-700 text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Globe className="w-3 h-3" />
                      <span className="truncate max-w-[220px]">{src.title}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===================================================================
            SEARCH, ALPHABETICAL INDEX & MULTI-DIMENSIONAL FILTER CONTROLS
           =================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50/90 space-y-3.5">
          {/* Row 1: Search Input + Learning Path Filter + Module Dropdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Azure term, acronym (e.g., RBAC, ZRS, NSG, TCO), or related concept..."
                className="w-full pl-10 pr-8 py-2 rounded-xl bg-white border border-slate-200/90 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0078D4] shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Clear glossary search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Learning Path Filter Buttons */}
            <div className="lg:col-span-4 flex items-center bg-white p-1 rounded-xl border border-slate-200/90 text-xs font-bold shadow-2xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedPathFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  selectedPathFilter === 'all'
                    ? 'bg-slate-900 text-white font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Paths ({AZURE_GLOSSARY_TERMS.length})
              </button>
              {([1, 2, 3] as const).map((pid) => (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setSelectedPathFilter(pid)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedPathFilter === pid
                      ? 'bg-[#0078D4] text-white font-extrabold'
                      : 'text-slate-600 hover:text-[#0078D4]'
                  }`}
                >
                  Path {pid}
                </button>
              ))}
            </div>

            {/* Module Select Dropdown */}
            <div className="lg:col-span-3 flex items-center gap-2">
              <select
                value={selectedModuleFilter}
                onChange={(e) =>
                  setSelectedModuleFilter(
                    e.target.value === 'all' ? 'all' : Number(e.target.value)
                  )
                }
                aria-label="Filter glossary by curriculum module"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0078D4] shadow-2xs cursor-pointer"
              >
                <option value="all">All 12 Curriculum Modules</option>
                {allModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    M{m.id}: {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1 mr-1 shrink-0">
              <Filter className="w-3 h-3 text-[#0078D4]" />
              <span>Domain:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Row 3: A-Z Alphabetical Quick Filter Bar */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70 flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedLetter('ALL')}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  selectedLetter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                }`}
              >
                A–Z ALL
              </button>
              {ALPHABET.map((letter) => {
                const hasTerms = AZURE_GLOSSARY_TERMS.some(
                  (t) => t.term.charAt(0).toUpperCase() === letter
                );
                const isActive = selectedLetter === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={!hasTerms}
                    onClick={() => setSelectedLetter(isActive ? 'ALL' : letter)}
                    className={`w-6 h-6 rounded text-[10px] font-black flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-[#0078D4] text-white shadow-2xs cursor-pointer'
                        : hasTerms
                        ? 'bg-white hover:bg-sky-50 text-slate-700 border border-slate-200 cursor-pointer'
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-600">
                Showing <strong className="text-[#0078D4]">{filteredTerms.length}</strong> of{' '}
                {AZURE_GLOSSARY_TERMS.length} terms
              </span>
              {(searchQuery ||
                selectedPathFilter !== 'all' ||
                selectedCategory !== 'All' ||
                selectedModuleFilter !== 'all' ||
                selectedLetter !== 'ALL' ||
                onlySaved) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[#0078D4] hover:underline font-extrabold text-xs cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          GLOSSARY & DICTIONARY CARDS GRID WITH INTERRELATED PINPOINTING
         ===================================================================== */}
      {filteredTerms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0078D4] flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-black text-base text-slate-900">
            No Azure Glossary Terms Matched Your Filter
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try clearing your current search or switching back to &ldquo;All Paths&rdquo; and &ldquo;A–Z ALL&rdquo;.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-[#0078D4] text-white text-xs font-extrabold cursor-pointer"
          >
            Show All {AZURE_GLOSSARY_TERMS.length} Glossary Terms
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTerms.map((item: AzureGlossaryTerm) => {
            const isSaved = savedTermIds.includes(item.id);
            const isHighlighted = highlightedTermId === item.id;

            return (
              <article
                id={`glossary-term-${item.id}`}
                key={item.id}
                className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white shadow-2xs ${
                  isHighlighted
                    ? 'border-[#0078D4] ring-4 ring-[#0078D4]/25 scale-[1.005]'
                    : 'border-slate-200/90 hover:border-sky-300 hover:shadow-sm'
                }`}
              >
                <div className="p-5 space-y-3.5">
                  {/* Top Metadata Bar: Path • Module • Category + Bookmark */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          item.pathId === 1
                            ? 'bg-blue-100 text-blue-900'
                            : item.pathId === 2
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        Path {item.pathId} • M{item.moduleId}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                      {isHighlighted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0078D4] text-white flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          <span>Pinpointed Concept</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSaveTerm(item.id)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isSaved
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700'
                      }`}
                      title={
                        isSaved
                          ? 'Remove from Saved Glossary Terms'
                          : 'Bookmark term for quick exam review'
                      }
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 fill-amber-400/30" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Term Heading + Acronym Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                          {item.term}
                        </h3>
                        {item.acronym && (
                          <span className="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-sky-50 text-[#0078D4] border border-sky-200">
                            {item.acronym}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                        Module {item.moduleId}: {item.moduleTitle}
                      </span>
                    </div>
                  </div>

                  {/* Official Dictionary Definition */}
                  <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-[#0078D4]" />
                      <span>Official Dictionary Definition</span>
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {item.definition}
                    </p>
                  </div>

                  {/* PINPOINTED INTERRELATED AREAS & ARCHITECTURE GRAPH */}
                  <div className="p-3.5 rounded-xl bg-blue-50/55 border border-blue-200/80 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4] flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-[#0078D4]" />
                        <span>Interrelated Areas &amp; Architecture Pinpoints</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Click chip to jump
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {item.interrelatedSummary}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {item.relatedTerms.map((rel, idx) => (
                        <button
                          key={`${item.id}-rel-${idx}`}
                          type="button"
                          onClick={() => handlePinpointRelatedTerm(rel.term)}
                          className="group/chip px-2.5 py-1 rounded-lg bg-white hover:bg-[#0078D4] text-slate-800 hover:text-white border border-blue-200 hover:border-[#0078D4] text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title={`${rel.relationship} ${rel.term} — Click to pinpoint in Glossary`}
                        >
                          <span className="text-[10px] font-medium text-slate-500 group-hover/chip:text-sky-100">
                            {rel.relationship}:
                          </span>
                          <span className="font-extrabold">{rel.term}</span>
                          <ArrowRight className="w-3 h-3 text-[#0078D4] group-hover/chip:text-white" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* High-Yield Exam Distractor Trap */}
                  <div className="p-3 rounded-xl bg-amber-50/85 border border-amber-200/90 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>AZ-900 Exam Distractor &amp; Memory Cue</span>
                    </span>
                    <p className="text-xs text-amber-950 font-medium leading-relaxed">
                      {item.examTrap}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Official MS Learn Citation Link + Google Search + Daily Reading Check + In-App Practice Triggers */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <a
                      href={item.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleMarkTermReadToday(item.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-[#0078D4] border border-blue-200 hover:border-[#0078D4] text-xs font-extrabold inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      title={`${item.docsCitation} (${item.docsUrl})`}
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[155px] sm:max-w-[200px]">{item.docsLabel}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
                    </a>

                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(
                        `Microsoft Azure AZ-900 ${item.term} ${item.acronym || ''}`.trim()
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleMarkTermReadToday(item.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0078D4] border border-slate-200 hover:border-sky-300 text-xs font-bold inline-flex items-center gap-1 transition-all shadow-2xs"
                      title={`Search Google for "${item.term} Microsoft Azure AZ-900"`}
                    >
                      <Globe className="w-3.5 h-3.5 text-[#0078D4]" />
                      <span>Google</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        handleMarkTermReadToday(item.id);
                        handleRunGoogleLookup(item.term);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-200 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title={`Run AI Google-Search-grounded lookup for ${item.term}`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Web Insight</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleMarkTermReadToday(item.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                        readTodayIds.includes(item.id)
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white hover:bg-emerald-50/60 text-slate-600 border-slate-200'
                      }`}
                      title="Mark this Azure concept as read today to build your daily reading habit"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{readTodayIds.includes(item.id) ? 'Read Today' : 'Mark Read'}</span>
                    </button>

                    {onOpenStudyMode && (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkTermReadToday(item.id);
                          onOpenStudyMode(item.moduleId, item.pathId);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title={`Open Module ${item.moduleId} in Interactive Study Mode`}
                      >
                        <Compass className="w-3.5 h-3.5 text-[#0078D4]" />
                        <span>Study M{item.moduleId}</span>
                      </button>
                    )}

                    {onDrillTermInPractice && (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkTermReadToday(item.id);
                          onDrillTermInPractice(item.acronym || item.term.split('(')[0].trim());
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-[#0078D4] text-white text-xs font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title={`Filter Practice Studio questions for ${item.term}`}
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-300" />
                        <span>Drill Qs</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {onSelectModule && !onDrillTermInPractice && (
                      <button
                        type="button"
                        onClick={() => onSelectModule(item.moduleId, item.pathId)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-[#0078D4] text-white text-xs font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Practice M{item.moduleId}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
