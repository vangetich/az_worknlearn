import React, { useState } from 'react';
import {
  Layers,
  Search,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Table,
} from 'lucide-react';
import { HIGH_YIELD_CHEAT_SHEETS } from '../data/studyNotes';
import { MaasaiMedallion } from './MotifDecorations';

export const StudyDeck: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Cloud Concepts', 'Architecture & Services', 'Management & Governance'];

  const filteredDecks = HIGH_YIELD_CHEAT_SHEETS.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyRule.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 card-elevation">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-50 text-[#0078D4]">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                High-Yield AZ-900 Study Matrix & Decks
              </h2>
            </div>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Side-by-side architectural comparison tables, key rules, and common Microsoft exam traps.
            </p>
          </div>

          <MaasaiMedallion size={36} className="hidden sm:block opacity-70" />
        </div>

        {/* Search & Category Filter */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#0078D4] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts or rules..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
            />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredDecks.map((deck) => (
          <div
            key={deck.id}
            className="bg-white rounded-xl border border-slate-200/90 card-elevation overflow-hidden transition-all hover:border-slate-300"
          >
            {/* Card Header with African Chevron Top */}
            <div className="motif-border-african px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Module {deck.moduleId} • {deck.category}
                  </span>
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-1">
                  {deck.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Table className="w-4 h-4 text-[#0078D4]" />
                <span>Comparison Matrix</span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Summary & Golden Key Rule */}
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {deck.summary}
              </p>

              {/* Golden Rule Card */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-0.5">
                    Essential Memory Rule:
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-amber-950">
                    {deck.keyRule}
                  </p>
                </div>
              </div>

              {/* Comparison Table */}
              {deck.comparisonTable && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100/80 text-slate-800 font-bold uppercase tracking-wider">
                      <tr>
                        {deck.comparisonTable.headers.map((h, idx) => (
                          <th key={idx} className="p-3 border-b border-slate-200">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deck.comparisonTable.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`p-3 ${
                                cIdx === 0
                                  ? 'font-bold text-slate-900'
                                  : 'text-slate-700'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Exam Trap Warning */}
              <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-900 block">
                    ⚠️ Microsoft Exam Trap Warning:
                  </span>
                  <p className="text-xs text-orange-950 mt-0.5 font-normal">
                    {deck.examTrap}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
