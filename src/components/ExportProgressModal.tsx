import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileCode,
  Printer,
  CheckCircle2,
  X,
  Share2,
  Award,
  Sparkles,
} from 'lucide-react';
import { UserStats } from '../types/quiz';
import { LEARNING_PATHS } from '../data/curriculum';
import { calculateDomainConfidence } from '../utils/storage';
import { MaasaiMedallion, KitengeRibbon } from './MotifDecorations';

interface ExportProgressModalProps {
  stats: UserStats;
  onClose: () => void;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  stats,
  onClose,
}) => {
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const overallAccuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  const scaledScore = Math.round((overallAccuracy / 100) * 1000);
  const isPassReady = scaledScore >= 700;
  const today = new Date().toISOString().split('T')[0];

  // 1. Export as JSON
  const handleExportJSON = () => {
    const reportData = {
      reportTitle: 'Microsoft AZ-900 Study Progress & Domain Confidence Report',
      generatedDate: new Date().toISOString(),
      applet: 'AZ-900 Smart Quiz Builder & Knowledge Assistant',
      summary: {
        totalQuestionsAnswered: stats.totalAnswered,
        totalCorrectAnswers: stats.totalCorrect,
        overallAccuracyPercentage: overallAccuracy,
        estimatedExamScore: scaledScore,
        passingThreshold: 700,
        isExamReady: isPassReady,
        currentStreakDays: stats.streakDays,
        bookmarkedQuestionsCount: stats.bookmarks.length,
      },
      learningPathMastery: LEARNING_PATHS.map((path) => {
        const mastery = stats.pathMastery[path.id] || { correct: 0, total: 0 };
        const conf = calculateDomainConfidence(mastery.correct, mastery.total);
        return {
          pathId: path.id,
          title: path.title,
          examWeight: path.examWeight,
          correct: mastery.correct,
          total: mastery.total,
          accuracyPercentage: conf.percentage,
          rating: conf.rating,
        };
      }),
      moduleMasteryDetails: LEARNING_PATHS.flatMap((p) => p.modules).map((mod) => {
        const modStat = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
        const pct = modStat.total > 0 ? Math.round((modStat.correct / modStat.total) * 100) : 0;
        return {
          moduleId: mod.id,
          title: mod.title,
          pathId: mod.pathId,
          solvedCount: modStat.total,
          correctCount: modStat.correct,
          accuracyPercentage: pct,
          status: pct >= 85 ? 'Mastery' : pct >= 70 ? 'Solid' : pct >= 50 ? 'Developing' : modStat.total === 0 ? 'Unattempted' : 'Critical Focus',
        };
      }),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `az900-confidence-report-${today}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopiedNotification('JSON progress report downloaded successfully!');
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  // 2. Export / Print as PDF
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF report.');
      return;
    }

    const modulesHtml = LEARNING_PATHS.flatMap((p) => p.modules)
      .map((mod) => {
        const modStat = stats.moduleMastery[mod.id] || { correct: 0, total: 0 };
        const pct = modStat.total > 0 ? Math.round((modStat.correct / modStat.total) * 100) : 0;
        const color = pct >= 85 ? '#15803d' : pct >= 70 ? '#0078d4' : pct >= 50 ? '#d97706' : '#dc2626';
        return `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">M${mod.id}: ${mod.title}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">Path ${mod.pathId}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${modStat.correct} / ${modStat.total}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: ${color};">${pct}%</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AZ-900 Study Progress Report - ${today}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; padding: 30px; margin: 0; background: #fff; }
            .header { border-bottom: 3px solid #0078d4; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; background: #ebf3fc; color: #0078d4; }
            .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
            .metric-val { font-size: 24px; font-weight: 800; color: #0078d4; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
            th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
            @media print {
              body { padding: 0; }
              @page { margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 24px; color: #0f172a;">Microsoft Azure Fundamentals (AZ-900)</h1>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Official Study Progress & Domain Confidence Report</p>
            </div>
            <div style="text-align: right;">
              <span class="badge">Date: ${today}</span>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Streak: ${stats.streakDays} Days</p>
            </div>
          </div>

          <div class="metrics-grid">
            <div class="card">
              <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Estimated Score</div>
              <div class="metric-val" style="color: ${isPassReady ? '#16a34a' : '#0078d4'};">${scaledScore} / 1000</div>
              <div style="font-size: 11px; color: #64748b;">Pass Mark: 700</div>
            </div>
            <div class="card">
              <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Accuracy</div>
              <div class="metric-val">${overallAccuracy}%</div>
              <div style="font-size: 11px; color: #64748b;">${stats.totalCorrect} correct answers</div>
            </div>
            <div class="card">
              <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Questions</div>
              <div class="metric-val">${stats.totalAnswered}</div>
              <div style="font-size: 11px; color: #64748b;">Scenarios solved</div>
            </div>
            <div class="card">
              <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Certification Status</div>
              <div class="metric-val" style="font-size: 18px; color: ${isPassReady ? '#16a34a' : '#d97706'};">${isPassReady ? 'Exam Ready' : 'In Progress'}</div>
              <div style="font-size: 11px; color: #64748b;">${isPassReady ? 'Passing Benchmark Met' : 'Approaching 700 pts'}</div>
            </div>
          </div>

          <h3 style="font-size: 16px; margin: 24px 0 8px 0;">Curriculum Module Breakdown (12 Modules)</h3>
          <table>
            <thead>
              <tr>
                <th>Module Name</th>
                <th style="text-align: center;">Learning Path</th>
                <th style="text-align: center;">Questions Solved</th>
                <th style="text-align: right;">Mastery %</th>
              </tr>
            </thead>
            <tbody>
              ${modulesHtml}
            </tbody>
          </table>

          <div class="footer">
            Generated via AZ-900 Smart Quiz Builder & Knowledge Assistant • Aligned with Microsoft Learn Official Standards
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Trigger print dialog automatically after render
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);

    setCopiedNotification('Print dialog opened! You can save as PDF directly.');
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 card-elevation overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <KitengeRibbon height={5} />

        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-400/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Export Quiz Statistics & Confidence
              </h3>
              <p className="text-xs text-slate-400">
                Save your AZ-900 learning progress and domain reports offline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Status Snapshot Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Current Standing
              </span>
              <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>{scaledScore} / 1000 Scaled Points</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isPassReady
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isPassReady ? 'Exam Ready' : 'Developing'}
                </span>
              </div>
            </div>

            <div className="text-right text-xs text-slate-600 font-semibold">
              <div>{stats.totalAnswered} Questions Solved</div>
              <div className="text-[#0078D4]">{overallAccuracy}% Accuracy</div>
            </div>
          </div>

          {/* Export Options Grid */}
          <div className="space-y-3">
            {/* Option 1: PDF Export */}
            <div
              onClick={handlePrintPDF}
              className="p-4 rounded-xl border border-slate-200 hover:border-[#0078D4] hover:bg-blue-50/20 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#0078D4] transition-colors">
                    Download / Print Summary PDF
                  </h4>
                  <p className="text-xs text-slate-500">
                    High-fidelity printable readiness report with 12-module breakdown table
                  </p>
                </div>
              </div>

              <Printer className="w-4 h-4 text-slate-400 group-hover:text-[#0078D4] transition-colors" />
            </div>

            {/* Option 2: JSON Export */}
            <div
              onClick={handleExportJSON}
              className="p-4 rounded-xl border border-slate-200 hover:border-[#0078D4] hover:bg-blue-50/20 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#0078D4] transition-colors">
                    Download Raw Data (.JSON)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Machine-readable backup of complete attempts, timestamps, and confidence scores
                  </p>
                </div>
              </div>

              <Download className="w-4 h-4 text-slate-400 group-hover:text-[#0078D4] transition-colors" />
            </div>
          </div>

          {/* Alert Notification */}
          {copiedNotification && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{copiedNotification}</span>
            </div>
          )}

          {/* Close button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
