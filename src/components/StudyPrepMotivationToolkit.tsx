import React, { useState, useEffect } from 'react';
import {
  PenTool,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Flame,
  Clock,
  Share2,
  Download,
  Lightbulb,
  HeartHandshake,
  ExternalLink,
} from 'lucide-react';
import { UserStats } from '../types/quiz';

interface StudyPrepMotivationToolkitProps {
  stats: UserStats;
}

interface PrepRitual {
  id: string;
  title: string;
  subtitle: string;
  category: 'Paper Notes' | 'Active Recall' | 'Accountability' | 'Deep Focus';
}

const DAILY_PREP_RITUALS: PrepRitual[] = [
  {
    id: 'ritual-paper-3col',
    title: 'Draw a 3-Column Paper Note Sheet for Missed Services',
    subtitle:
      'On physical paper, write: [Service Name] | [Scenario Trigger Word] | [Why It Is Confused]. Handwriting engages spatial memory.',
    category: 'Paper Notes',
  },
  {
    id: 'ritual-sketch-boundary',
    title: 'Sketch 1 Cloud Architecture Diagram by Hand',
    subtitle:
      'Draw the Shared Responsibility matrix or VNet Peering vs. ExpressRoute on paper in under 2 minutes from memory.',
    category: 'Paper Notes',
  },
  {
    id: 'ritual-whatsapp-pledge',
    title: 'Send Your Daily Study Time Pledge to WhatsApp',
    subtitle:
      'Message yourself or your study buddy on WhatsApp with your exact study time and 10-question goal to lock in accountability.',
    category: 'Accountability',
  },
  {
    id: 'ritual-feynman-voice',
    title: '60-Second Out-Loud Feynman Explanation',
    subtitle:
      'Explain the difference between Azure Policy and RBAC out loud as if teaching a junior colleague.',
    category: 'Active Recall',
  },
];

const RITUALS_STORAGE_KEY = 'az900_daily_prep_rituals_v1';

export const StudyPrepMotivationToolkit: React.FC<StudyPrepMotivationToolkitProps> = ({
  stats,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'paper' | 'whatsapp' | 'rituals'>('paper');
  const [studyTime, setStudyTime] = useState<string>('20:00');
  const [studyDays, setStudyDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [studyPresetLabel, setStudyPresetLabel] = useState<string>('Evening Deep Work (8:00 PM)');
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [focusTopic, setFocusTopic] = useState<string>(
    'Azure Policy vs. RBAC & Networking Services'
  );
  const [copiedWhatsapp, setCopiedWhatsapp] = useState<boolean>(false);
  const [copiedWhatsappLink, setCopiedWhatsappLink] = useState<boolean>(false);
  const [copiedPaperTemplate, setCopiedPaperTemplate] = useState<boolean>(false);

  const [completedRituals, setCompletedRituals] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RITUALS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return ['ritual-paper-3col'];
  });

  useEffect(() => {
    try {
      localStorage.setItem(RITUALS_STORAGE_KEY, JSON.stringify(completedRituals));
    } catch (e) {
      console.error(e);
    }
  }, [completedRituals]);

  const toggleRitual = (id: string) => {
    setCompletedRituals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleStudyDay = (day: string) => {
    setStudyDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      return next.length > 0 ? next : ['Mon'];
    });
  };

  const dailyGoal = stats.dailyGoal || 10;
  const streak = stats.streakDays || 1;

  // Pre-formatted WhatsApp reminder text
  const whatsappMessage = `🚀 *AZ-900 Study Reminder & Harambee Peer Schedule*\n\n📅 *Study Days:* ${studyDays.join(', ')}\n⏰ *Scheduled Time:* ${studyTime} (${studyPresetLabel})\n🎯 *Daily Target:* ${dailyGoal} Scenario Questions\n📘 *Priority Focus:* ${focusTopic}\n🔥 *Current Streak:* ${streak} Day${streak === 1 ? '' : 's'}\n✍️ *Prep Method:* 3-Column Paper Notes + Active Re-Test\n\n_"Kidogo kidogo hujaza kibaba" — Little by little fills the measure. Let's hit 700+ together!_`;

  const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const paperTemplateText = `======================================================================
AZ-900 CORNELL & 3-COLUMN PAPER NOTE-TAKING SHEET
Date: ${new Date().toLocaleDateString()} | Target: 700+ Passing Score | Daily Goal: ${dailyGoal} Qs
======================================================================

[COLUMN 1: AZURE SERVICE]   | [COLUMN 2: SCENARIO TRIGGER]      | [COLUMN 3: EXAM TRAP TO AVOID]
----------------------------|-----------------------------------|-----------------------------------------
1. Azure Policy             | "Enforce allowed VM SKUs/regions" | Do NOT confuse with RBAC (user access)
2. Azure RBAC               | "Grant user least-privilege role" | Does not restrict resource locations
3. ExpressRoute             | "Dedicated private fiber link"    | Does NOT traverse the public internet
4. Availability Zones       | "99.99% SLA across datacenters"   | Not available in every single region
5. Resource Locks           | "Prevent accidental deletion"     | ReadOnly also blocks VM start/stop!

----------------------------------------------------------------------
HAND-DRAWN ARCHITECTURE SKETCH BOX (Draw for 2 minutes from memory):
[ ] Sketch Shared Responsibility: IaaS (You patch OS) -> PaaS (MS patches OS) -> SaaS
[ ] Sketch Hybrid Connectivity: On-Premises -> ExpressRoute (Private) vs VPN (Public IPSec)

BOTTOM SUMMARY (In your own words, 2 sentences):
"Today I mastered how Governance policies differ from Identity RBAC, and I verified why..."
======================================================================`;

  const handleCopyWhatsapp = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(whatsappMessage);
      setCopiedWhatsapp(true);
      setTimeout(() => setCopiedWhatsapp(false), 2200);
    }
  };

  const handleCopyWhatsappLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(whatsappUrl);
      setCopiedWhatsappLink(true);
      setTimeout(() => setCopiedWhatsappLink(false), 2200);
    }
  };

  const handleCopyPaperTemplate = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(paperTemplateText);
      setCopiedPaperTemplate(true);
      setTimeout(() => setCopiedPaperTemplate(false), 2200);
    }
  };

  const handleDownloadIcsReminder = () => {
    const now = new Date();
    const [hours, minutes] = studyTime.split(':').map(Number);
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours || 20,
      minutes || 0,
      0
    );
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const formatIcsDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Azure Curriculum AZ-900//Study Reminder//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:AZ-900 Study Sprint (${dailyGoal} Questions + Paper Notes)`,
      `DESCRIPTION:${whatsappMessage.replace(/\n/g, '\\n')}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT10M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Time for your AZ-900 Study Session!',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'az900-study-reminder.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden">
      {/* Top Motivational Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-[#00345d] via-[#005a9e] to-[#00345d] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-base sm:text-lg tracking-tight text-white">
                Student Exam Prep &amp; Study Motivation Hub
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950">
                Active Learning Habits
              </span>
            </div>
            <p className="text-xs text-sky-100/90 mt-0.5">
              Combine tactile paper note-taking, WhatsApp study reminders, and micro-habits to stay energized all the way to 700+
            </p>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex items-center p-1 bg-slate-950/35 rounded-xl border border-white/15 text-xs font-bold self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('paper')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'paper'
                ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                : 'text-sky-100 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Paper Note-Taking</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('whatsapp')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'whatsapp'
                ? 'bg-emerald-400 text-slate-950 font-black shadow-2xs'
                : 'text-sky-100 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Reminders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('rituals')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'rituals'
                ? 'bg-white text-slate-900 font-black shadow-2xs'
                : 'text-sky-100 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Prep Rituals ({completedRituals.length}/{DAILY_PREP_RITUALS.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="p-6 space-y-5">
        {/* SUB-TAB 1: TACTILE PAPER NOTE-TAKING SYSTEM */}
        {activeSubTab === 'paper' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Why & How to Take Notes on Paper for AZ-900 */}
              <div className="lg:col-span-5 space-y-3.5">
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>Why Paper Notes Beat Passive Screen Reading</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Neuroscience research shows handwriting concepts on physical paper activates deeper sensorimotor memory pathways than typing. When you sketch an Azure architecture boundary by hand, your brain encodes the spatial relationships permanently.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#0078D4] text-white text-[10px] font-black flex items-center justify-center">
                        1
                      </span>
                      <span>Divide Your Notebook Page into 3 Columns</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 pl-6">
                      Column 1: <strong>Azure Service</strong> • Column 2: <strong>1-Phrase Scenario Trigger</strong> • Column 3: <strong>Exam Trap to Avoid</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#0078D4] text-white text-[10px] font-black flex items-center justify-center">
                        2
                      </span>
                      <span>Use the "Red Pen Correction" Rule</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 pl-6">
                      Every time you miss a quiz question, write a 1-line correction in red or orange ink on your paper sheet. Review only those red lines 15 minutes before your exam!
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#0078D4] text-white text-[10px] font-black flex items-center justify-center">
                        3
                      </span>
                      <span>Draw Box-and-Arrow Sketches</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 pl-6">
                      Sketch Management Groups → Subscriptions → Resource Groups → Resources as nested boxes on paper so inheritance rules become visual second nature.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Notebook Sheet Preview & Copyable Template */}
              <div className="lg:col-span-7 rounded-2xl border-2 border-amber-200/90 bg-[#fffdf7] p-5 shadow-inner space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-rose-200/80 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block">
                      Physical Notebook Layout Blueprint
                    </span>
                    <h4 className="font-black text-sm text-slate-900">
                      3-Column AZ-900 Cornell Revision Sheet
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPaperTemplate}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    {copiedPaperTemplate ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied Template!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Printable Sheet</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Simulated Ruled Paper Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-blue-200 text-[10px] font-bold uppercase text-[#0078D4]">
                        <th className="py-2 pr-2">1. Azure Service</th>
                        <th className="py-2 px-2 border-l border-rose-200">2. Scenario Trigger</th>
                        <th className="py-2 pl-2 border-l border-rose-200">3. Exam Trap (Red Pen)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100/80 text-[11px] text-slate-800">
                      <tr>
                        <td className="py-2 pr-2 font-bold">Azure Policy</td>
                        <td className="py-2 px-2 border-l border-rose-200">Enforce allowed SKUs/regions</td>
                        <td className="py-2 pl-2 border-l border-rose-200 text-rose-700 font-semibold">
                          ≠ RBAC (RBAC is user identity access)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-2 font-bold">ExpressRoute</td>
                        <td className="py-2 px-2 border-l border-rose-200">Dedicated private fiber link</td>
                        <td className="py-2 pl-2 border-l border-rose-200 text-rose-700 font-semibold">
                          Never uses public internet (unlike VPN)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-2 font-bold">Availability Zones</td>
                        <td className="py-2 px-2 border-l border-rose-200">Survive datacenter failure</td>
                        <td className="py-2 pl-2 border-l border-rose-200 text-rose-700 font-semibold">
                          99.99% SLA (vs 99.95% Availability Set)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-2 font-bold">ReadOnly Lock</td>
                        <td className="py-2 px-2 border-l border-rose-200">Block resource modifications</td>
                        <td className="py-2 pl-2 border-l border-rose-200 text-rose-700 font-semibold">
                          Also blocks starting/stopping VMs!
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-xl bg-amber-100/60 border border-amber-300/70 text-[11px] text-amber-950 flex items-center justify-between gap-2">
                  <span>
                    💡 <strong>Study Tip:</strong> Grab a pen and sheet of paper right now and write down the Top 5 services from the table above!
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: WHATSAPP STUDY REMINDERS & ACCOUNTABILITY */}
        {activeSubTab === 'whatsapp' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Reminder Configuration */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Study Reminder &amp; Buddy Pledge</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Students who commit to a specific study time via WhatsApp ("Message Yourself" or a study partner) are <strong>3x more likely</strong> to maintain a 7-day streak.
                  </p>
                </div>

                {/* Study Schedule Days Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-800">
                    1. Select Your Study Schedule Days:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                      const active = studyDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleStudyDay(day)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preset Study Time Slots */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-800">
                    2. Pick Your Daily Study Time Window:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { time: '06:30', label: 'Morning Kahawa (6:30 AM)' },
                      { time: '13:00', label: 'Lunch Sprint (1:00 PM)' },
                      { time: '20:00', label: 'Evening Deep Work (8:00 PM)' },
                    ].map((preset) => (
                      <button
                        key={preset.time}
                        type="button"
                        onClick={() => {
                          setStudyTime(preset.time);
                          setStudyPresetLabel(preset.label);
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                          studyTime === preset.time
                            ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 mb-1 opacity-80" />
                        <div className="truncate">{preset.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Time & Phone Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Custom Study Time:
                    </label>
                    <input
                      type="time"
                      value={studyTime}
                      onChange={(e) => {
                        setStudyTime(e.target.value);
                        setStudyPresetLabel('Custom Study Session');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:border-[#0078D4] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Peer WhatsApp Number (Optional, e.g. 2547...):
                    </label>
                    <input
                      type="tel"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="Leave blank to pick any chat"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:border-[#0078D4] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    3. Priority Study Topic for Session:
                  </label>
                  <input
                    type="text"
                    value={focusTopic}
                    onChange={(e) => setFocusTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:border-[#0078D4] focus:outline-none"
                  />
                </div>
              </div>

              {/* Right Column: Live WhatsApp Preview & Direct Send Actions */}
              <div className="lg:col-span-6 rounded-2xl border border-emerald-300/90 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/50 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-emerald-200/70 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      WhatsApp Reminder Card &amp; Shareable Link
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    Mobile Peer Share
                  </span>
                </div>

                <pre className="p-4 rounded-xl bg-white border border-emerald-200/90 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed shadow-2xs">
                  {whatsappMessage}
                </pre>

                {/* Copyable WhatsApp-Compatible Share URL Box */}
                <div className="p-3 rounded-xl bg-white border border-emerald-200/80 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 block">
                    Customized WhatsApp-Compatible Message Link (wa.me):
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={whatsappUrl}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyWhatsappLink}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                    >
                      {copiedWhatsappLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Share via WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyWhatsapp}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedWhatsapp ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadIcsReminder}
                    className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0078D4] border border-blue-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Download .ics calendar alarm for your phone or desktop"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Calendar Alarm (.ics)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: INTERACTIVE EXAM PREP RITUALS CHECKLIST */}
        {activeSubTab === 'rituals' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="w-5 h-5 text-[#0078D4]" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    Daily High-Retention Study Rituals
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Check off each study habit as you complete it today to reinforce both digital and paper-based mastery.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-200 self-start sm:self-center">
                {completedRituals.length} of {DAILY_PREP_RITUALS.length} Completed Today
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {DAILY_PREP_RITUALS.map((ritual) => {
                const isDone = completedRituals.includes(ritual.id);
                return (
                  <button
                    key={ritual.id}
                    type="button"
                    onClick={() => toggleRitual(ritual.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                      isDone
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-100 border-slate-300 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-black text-xs sm:text-sm ${
                            isDone ? 'line-through text-emerald-900' : 'text-slate-900'
                          }`}
                        >
                          {ritual.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {ritual.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {ritual.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
