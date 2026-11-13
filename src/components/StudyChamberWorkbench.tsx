import React, { useMemo, useState } from 'react';
import {
  Calculator,
  Server,
  ShieldCheck,
  Scale,
  Timer,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Flag,
  Send,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { CanonicalChamberId, getQuestionsForStudyArea } from '../data/virtualStudyAreas';

export interface ChamberHandoffItem {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  type: 'question' | 'trap' | 'concept' | 'warroom-miss';
  title: string;
  note: string;
  senderName: string;
  senderAvatar: string;
  createdAt: number;
  resolved: boolean;
  questionSnapshot?: {
    id: string;
    learningPathId: 1 | 2 | 3;
    moduleId: number;
    moduleTitle: string;
    difficulty: 'Fundamental' | 'Intermediate' | 'Advanced';
    scenario: string;
    question: string;
    options: { letter: string; text: string }[];
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    whyCorrect: string;
    examTip: string;
  };
}

interface StudyChamberWorkbenchProps {
  roomId: CanonicalChamberId;
  stats: UserStats;
  allQuestions: Question[];
  handoffQueue: ChamberHandoffItem[];
  onLoadQuestionToBoard: (q: Question) => void;
  onLoadHandoff: (handoffId: string) => void;
  onResolveHandoff: (handoffId: string, resolved: boolean) => void;
  onSendHandoff: (params: {
    toRoomId: CanonicalChamberId;
    type: 'question' | 'trap' | 'concept' | 'warroom-miss';
    title: string;
    note: string;
    question?: Question;
  }) => void;
  onRecordAnswer?: (question: Question, selectedOption: string) => void;
  onPinToWhiteboard: (title: string, category: 'compute' | 'networking' | 'storage' | 'identity' | 'governance', notes: string) => void;
  onSwitchChamber: (targetRoomId: CanonicalChamberId) => void;
  onOpenFullMockExam?: () => void;
}

export const StudyChamberWorkbench: React.FC<StudyChamberWorkbenchProps> = ({
  roomId,
  stats,
  allQuestions,
  handoffQueue,
  onLoadQuestionToBoard,
  onLoadHandoff,
  onResolveHandoff,
  onSendHandoff,
  onRecordAnswer,
  onPinToWhiteboard,
  onSwitchChamber,
  onOpenFullMockExam,
}) => {
  // 1. CONCEPTS HUB STATE: Composite SLA Calculator
  const [slaApp, setSlaApp] = useState<number>(99.95);
  const [slaDb, setSlaDb] = useState<number>(99.99);
  const [slaGateway, setSlaGateway] = useState<number>(99.9);
  const [includeGateway, setIncludeGateway] = useState<boolean>(false);

  const compositeSla = useMemo(() => {
    const product =
      (slaApp / 100) * (slaDb / 100) * (includeGateway ? slaGateway / 100 : 1);
    const pct = product * 100;
    const downtimeMinutesMonth = ((100 - pct) / 100) * 30 * 24 * 60;
    const downtimeMinutesYear = ((100 - pct) / 100) * 365 * 24 * 60;
    return {
      pct: pct.toFixed(3),
      monthMins: downtimeMinutesMonth.toFixed(1),
      yearMins: downtimeMinutesYear.toFixed(0),
    };
  }, [slaApp, slaDb, slaGateway, includeGateway]);

  // 2. SERVICES LAB STATE: Storage & Compute selector
  const [selectedRedundancy, setSelectedRedundancy] = useState<'LRS' | 'ZRS' | 'GRS' | 'GZRS'>('ZRS');
  const [selectedComputeNeed, setSelectedComputeNeed] = useState<'vm' | 'vmss' | 'app' | 'aci' | 'aks' | 'func'>('vmss');

  // 3. SECURITY CHAMBER STATE: Defense in Depth ring explorer
  const [activeDidRing, setActiveDidRing] = useState<string>('identity');

  // 4. GOVERNANCE ARENA STATE: Lock & Policy precedence tester
  const [actorRole, setActorRole] = useState<'Owner' | 'Contributor' | 'Reader'>('Owner');
  const [activeLock, setActiveLock] = useState<'None' | 'CanNotDelete' | 'ReadOnly'>('CanNotDelete');
  const [policyBlocksRegion, setPolicyBlocksRegion] = useState<boolean>(true);

  const governanceOutcome = useMemo(() => {
    const canModify =
      actorRole !== 'Reader' && activeLock !== 'ReadOnly' && !policyBlocksRegion;
    const canDelete =
      actorRole !== 'Reader' && activeLock === 'None';
    return { canModify, canDelete };
  }, [actorRole, activeLock, policyBlocksRegion]);

  // 5. WAR ROOM TIMED MOCK SPRINT STATE
  const [sprintLength, setSprintLength] = useState<10 | 20>(10);
  const [sprintQuestions, setSprintQuestions] = useState<Question[]>([]);
  const [sprintIndex, setSprintIndex] = useState<number>(0);
  const [sprintAnswers, setSprintAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [sprintFlagged, setSprintFlagged] = useState<Record<string, boolean>>({});
  const [sprintCompleted, setSprintCompleted] = useState<boolean>(false);
  const [routedMisses, setRoutedMisses] = useState<boolean>(false);

  const startWarRoomSprint = (count: 10 | 20) => {
    const p1 = allQuestions.filter((q) => q.learningPathId === 1);
    const p2 = allQuestions.filter((q) => q.learningPathId === 2);
    const p3 = allQuestions.filter((q) => q.learningPathId === 3);
    const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

    const n1 = Math.max(2, Math.round(count * 0.28));
    const n2 = Math.max(3, Math.round(count * 0.38));
    const n3 = Math.max(2, count - n1 - n2);

    const picked = [
      ...shuffle(p1).slice(0, n1),
      ...shuffle(p2).slice(0, n2),
      ...shuffle(p3).slice(0, n3),
    ];

    setSprintLength(count);
    setSprintQuestions(picked);
    setSprintIndex(0);
    setSprintAnswers({});
    setSprintFlagged({});
    setSprintCompleted(false);
    setRoutedMisses(false);
  };

  const finishWarRoomSprint = () => {
    if (onRecordAnswer) {
      sprintQuestions.forEach((q) => {
        const ans = sprintAnswers[q.id];
        if (ans) {
          onRecordAnswer(q, ans);
        }
      });
    }
    setSprintCompleted(true);
  };

  const sprintSummary = useMemo(() => {
    if (sprintQuestions.length === 0) return null;
    let correct = 0;
    const missed: Question[] = [];
    sprintQuestions.forEach((q) => {
      if (sprintAnswers[q.id] === q.correctAnswer) {
        correct += 1;
      } else {
        missed.push(q);
      }
    });
    const scaledScore = Math.round((correct / sprintQuestions.length) * 1000);
    return {
      correct,
      total: sprintQuestions.length,
      scaledScore,
      passed: scaledScore >= 700,
      missed,
    };
  }, [sprintQuestions, sprintAnswers]);

  // 6. CLINIC USER WEAK AREAS ITEMS
  const clinicUserMistakes = useMemo(() => {
    const reviewed = new Set(stats.reviewedMistakeIds || []);
    const activeIds = Array.from(
      new Set(
        (stats.mistakesHistory || [])
          .filter((m) => !reviewed.has(m.questionId))
          .map((m) => m.questionId)
      )
    );
    return activeIds
      .map((id) => allQuestions.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q))
      .slice(0, 8);
  }, [stats, allQuestions]);

  // =========================================================================
  // RENDER DOMAIN-SPECIFIC INTERACTIVE WORKBENCH
  // =========================================================================

  if (roomId === 'AZ900-CONCEPTS') {
    return (
      <div className="rounded-2xl border border-blue-200 dark:border-blue-900/70 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#0078D4] dark:text-sky-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Concepts Lab: Interactive Composite SLA &amp; CapEx/OpEx Calculator
            </h4>
          </div>
          <button
            type="button"
            onClick={() =>
              onPinToWhiteboard(
                `Composite SLA: ${compositeSla.pct}%`,
                'compute',
                `App (${slaApp}%) × DB (${slaDb}%)${includeGateway ? ` × GW (${slaGateway}%)` : ''} = ~${compositeSla.monthMins} mins downtime/month.`
              )
            }
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-[#0078D4] dark:text-sky-400 hover:bg-blue-50 cursor-pointer"
          >
            Pin Math to Whiteboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center">
          <label className="text-xs space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300 block">
              Web App SLA
            </span>
            <select
              value={slaApp}
              onChange={(e) => setSlaApp(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              <option value={99.9}>99.9% (Three 9s)</option>
              <option value={99.95}>99.95% (App Service)</option>
              <option value={99.99}>99.99% (Zone Redundant)</option>
            </select>
          </label>

          <label className="text-xs space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300 block">
              Database SLA
            </span>
            <select
              value={slaDb}
              onChange={(e) => setSlaDb(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              <option value={99.9}>99.9% (Single VM)</option>
              <option value={99.99}>99.99% (Azure SQL)</option>
              <option value={99.995}>99.995% (Business Critical)</option>
            </select>
          </label>

          <div className="text-xs space-y-1">
            <label className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGateway}
                onChange={(e) => setIncludeGateway(e.target.checked)}
                className="rounded border-slate-300 text-[#0078D4]"
              />
              <span>Add VPN/Gateway SLA</span>
            </label>
            <select
              disabled={!includeGateway}
              value={slaGateway}
              onChange={(e) => setSlaGateway(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 disabled:opacity-50"
            >
              <option value={99.9}>99.9% (Basic GW)</option>
              <option value={99.95}>99.95% (Zone Redundant GW)</option>
            </select>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 text-white tabular-nums">
            <div className="text-[10px] font-semibold text-sky-300">Composite Availability</div>
            <div className="text-lg font-extrabold text-amber-300">{compositeSla.pct}%</div>
            <div className="text-[10px] text-slate-300">
              ~{compositeSla.monthMins}m/mo · ~{compositeSla.yearMins}m/yr downtime
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roomId === 'AZ900-SERVICES') {
    const redundancyDetails = {
      LRS: { copies: '3 copies in 1 datacenter', durability: '11 nines (99.999999999%)', protects: 'Disk/rack failure; vulnerable to datacenter outage' },
      ZRS: { copies: '3 copies across 3 AZs (1 Region)', durability: '12 nines', protects: 'Full datacenter fire/power failure within a region' },
      GRS: { copies: '6 copies (3 LRS primary + 3 LRS paired region)', durability: '16 nines', protects: 'Regional disaster recovery (300+ miles away)' },
      GZRS: { copies: '3 AZs primary + 3 LRS paired region', durability: '16 nines', protects: 'Maximum availability: survives both datacenter & regional disaster' },
    }[selectedRedundancy];

    const computeDetails = {
      vm: 'IaaS: Full guest OS control; scales vertically by resizing VM SKU (brief reboot).',
      vmss: 'IaaS Horizontal: Auto-scales identical VM pools across Availability Zones with zero downtime.',
      app: 'PaaS Web Hosting: Built-in OS patching, HTTPS, CI/CD slots & horizontal autoscale.',
      aci: 'Serverless Single Container: Fast isolated container burst without managing cluster orchestration.',
      aks: 'Managed Kubernetes: Automated multi-container pod orchestration & microservice cluster scaling.',
      func: 'Event-Driven Serverless: Scales down to zero when idle; billed per execution (true OpEx).',
    }[selectedComputeNeed];

    return (
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Services Lab: Redundancy &amp; Compute Selector
            </h4>
          </div>
          <button
            type="button"
            onClick={() =>
              onPinToWhiteboard(
                `${selectedRedundancy} + ${selectedComputeNeed.toUpperCase()}`,
                'storage',
                `${redundancyDetails.copies}. ${computeDetails}`
              )
            }
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer"
          >
            Pin Blueprint to Whiteboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {(['LRS', 'ZRS', 'GRS', 'GZRS'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedRedundancy(tier)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    selectedRedundancy === tier
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                {redundancyDetails.copies} · {redundancyDetails.durability}
              </div>
              <p>{redundancyDetails.protects}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {([
                { id: 'vm', label: 'VM' },
                { id: 'vmss', label: 'VMSS' },
                { id: 'app', label: 'App Service' },
                { id: 'aci', label: 'ACI' },
                { id: 'aks', label: 'AKS' },
                { id: 'func', label: 'Functions' },
              ] as const).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedComputeNeed(c.id)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    selectedComputeNeed === c.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {computeDetails}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (roomId === 'AZ900-SECURITY') {
    const layers = [
      { id: 'physical', label: 'Physical', detail: 'Biometrics, perimeter fencing, badge access at Microsoft datacenters.' },
      { id: 'identity', label: 'Identity & Access', detail: 'Microsoft Entra ID, MFA, SSO, Conditional Access (Zero Trust primary perimeter).' },
      { id: 'perimeter', label: 'Perimeter', detail: 'Azure DDoS Protection & Azure Firewall blocking edge volumetric attacks.' },
      { id: 'network', label: 'Network', detail: 'NSGs (Layer 3/4 rules), Private Endpoints & subnet segmentation.' },
      { id: 'compute', label: 'Compute', detail: 'OS security patching, Just-In-Time (JIT) VM access & Defender for Servers.' },
      { id: 'app', label: 'Application', detail: 'TLS HTTPS enforcement, Azure Key Vault secrets & managed identities.' },
      { id: 'data', label: 'Data', detail: 'Storage/SQL encryption at rest (SSE/TDE) & Microsoft Purview classification.' },
    ];
    const currentLayer = layers.find((l) => l.id === activeDidRing) || layers[1];

    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Security Chamber: 7-Ring Defense in Depth &amp; AuthN vs AuthZ
            </h4>
          </div>
          <button
            type="button"
            onClick={() =>
              onPinToWhiteboard(
                `Defense Ring: ${currentLayer.label}`,
                'identity',
                currentLayer.detail
              )
            }
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 cursor-pointer"
          >
            Pin Layer to Whiteboard
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {layers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveDidRing(layer.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                activeDidRing === layer.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/70 text-xs text-slate-700 dark:text-slate-200">
          <strong className="text-emerald-700 dark:text-emerald-300">{currentLayer.label} Layer: </strong>
          {currentLayer.detail}
        </div>
      </div>
    );
  }

  if (roomId === 'AZ900-GOVERNANCE') {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/70 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Governance Arena: RBAC vs Resource Locks vs Policy Precedence Tester
            </h4>
          </div>
          <button
            type="button"
            onClick={() =>
              onPinToWhiteboard(
                `Precedence: ${actorRole} + ${activeLock}`,
                'governance',
                `Delete allowed? ${governanceOutcome.canDelete ? 'YES' : 'BLOCKED'}. Modify allowed? ${governanceOutcome.canModify ? 'YES' : 'BLOCKED'}.`
              )
            }
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-300 cursor-pointer"
          >
            Pin Precedence Rule
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center">
          <label className="text-xs space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300 block">User RBAC Role</span>
            <select
              value={actorRole}
              onChange={(e) => setActorRole(e.target.value as 'Owner' | 'Contributor' | 'Reader')}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="Owner">Subscription Owner</option>
              <option value="Contributor">Contributor</option>
              <option value="Reader">Reader</option>
            </select>
          </label>

          <label className="text-xs space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300 block">Resource Lock</span>
            <select
              value={activeLock}
              onChange={(e) => setActiveLock(e.target.value as 'None' | 'CanNotDelete' | 'ReadOnly')}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="None">No Lock</option>
              <option value="CanNotDelete">CanNotDelete Lock</option>
              <option value="ReadOnly">ReadOnly Lock</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={policyBlocksRegion}
              onChange={(e) => setPolicyBlocksRegion(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Azure Policy Denies Config</span>
          </label>

          <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Delete Resource:</span>
              <span className={governanceOutcome.canDelete ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {governanceOutcome.canDelete ? 'ALLOWED' : 'BLOCKED'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Modify / Deploy:</span>
              <span className={governanceOutcome.canModify ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {governanceOutcome.canModify ? 'ALLOWED' : 'BLOCKED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roomId === 'AZ900-WAR-ROOM') {
    const activeSprintQ = sprintQuestions[sprintIndex];
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/70 bg-rose-50/40 dark:bg-rose-950/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              War Room: Timed 3-Path Sprint &amp; 700-Score Readiness Check
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => startWarRoomSprint(10)}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
            >
              Start 10-Q Timed Sprint
            </button>
            <button
              type="button"
              onClick={() => startWarRoomSprint(20)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer"
            >
              Start 20-Q Balanced Sprint
            </button>
            {onOpenFullMockExam && (
              <button
                type="button"
                onClick={onOpenFullMockExam}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-[11px] font-bold text-rose-700 dark:text-rose-300 cursor-pointer"
              >
                Full 45-Min Exam
              </button>
            )}
          </div>
        </div>

        {sprintQuestions.length === 0 ? (
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Launch a 10- or 20-question balanced sprint spanning all 3 AZ-900 paths right inside this chamber—any missed questions can be routed straight to <strong>Traps Clinic (AZ900-CLINIC)</strong>.
          </p>
        ) : sprintCompleted && sprintSummary ? (
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {sprintSummary.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                    Scaled Score: {sprintSummary.scaledScore} / 1000 ({sprintSummary.correct}/{sprintSummary.total})
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {sprintSummary.passed
                      ? 'Above 700 AZ-900 passing cut-off!'
                      : 'Below 700 cut-off — route misses to Traps Clinic to close weak gaps.'}
                  </div>
                </div>
              </div>

              {sprintSummary.missed.length > 0 && (
                <button
                  type="button"
                  disabled={routedMisses}
                  onClick={() => {
                    sprintSummary.missed.slice(0, 5).forEach((mq) => {
                      onSendHandoff({
                        toRoomId: 'AZ900-CLINIC',
                        type: 'warroom-miss',
                        title: `War Room Miss: M${mq.moduleId} (${mq.moduleTitle})`,
                        note: `Correct was ${mq.correctAnswer}. Tip: ${mq.examTip}`,
                        question: mq,
                      });
                    });
                    setRoutedMisses(true);
                    onSwitchChamber('AZ900-CLINIC');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {routedMisses
                      ? 'Misses Queued in Traps Clinic'
                      : `Route ${sprintSummary.missed.length} Misses to Traps Clinic`}
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : activeSprintQ ? (
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold tabular-nums">
              <span className="text-rose-600 dark:text-rose-400">
                Item {sprintIndex + 1} of {sprintLength} · Path {activeSprintQ.learningPathId} · M{activeSprintQ.moduleId}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSprintFlagged((prev) => ({
                    ...prev,
                    [activeSprintQ.id]: !prev[activeSprintQ.id],
                  }))
                }
                className={`px-2 py-0.5 rounded-md border inline-flex items-center gap-1 cursor-pointer ${
                  sprintFlagged[activeSprintQ.id]
                    ? 'bg-amber-100 border-amber-400 text-amber-900'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Flag className="w-3 h-3" />
                <span>{sprintFlagged[activeSprintQ.id] ? 'Flagged' : 'Flag'}</span>
              </button>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {activeSprintQ.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {activeSprintQ.options.map((opt) => {
                const picked = sprintAnswers[activeSprintQ.id] === opt.letter;
                return (
                  <button
                    key={opt.letter}
                    type="button"
                    onClick={() =>
                      setSprintAnswers((prev) => ({
                        ...prev,
                        [activeSprintQ.id]: opt.letter as 'A' | 'B' | 'C' | 'D',
                      }))
                    }
                    className={`text-left p-2 rounded-lg border text-xs cursor-pointer ${
                      picked
                        ? 'bg-[#0078D4] text-white border-[#0078D4]'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <strong>{opt.letter}.</strong> {opt.text}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={sprintIndex === 0}
                onClick={() => setSprintIndex((i) => Math.max(0, i - 1))}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onLoadQuestionToBoard(activeSprintQ)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0078D4] dark:text-sky-400 cursor-pointer"
                >
                  Sync to Co-Op Board
                </button>
                {sprintIndex < sprintQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setSprintIndex((i) => i + 1)}
                    className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishWarRoomSprint}
                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Score Sprint
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // 6. TRAPS CLINIC: Escalated Handoffs & Real User Weak Areas Triage Queue
  const unresolvedHandoffs = handoffQueue.filter((h) => !h.resolved);
  const clinicDefaultPool = getQuestionsForStudyArea('AZ900-CLINIC', allQuestions, stats).slice(0, 3);

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-900/70 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Traps Clinic: Escalated Handoff Queue ({unresolvedHandoffs.length}) &amp; Your Weak Areas ({clinicUserMistakes.length})
          </h4>
        </div>
        <button
          type="button"
          onClick={() => onSwitchChamber('AZ900-WAR-ROOM')}
          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Retest in War Room</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {unresolvedHandoffs.length > 0 && (
        <div className="space-y-1.5">
          {unresolvedHandoffs.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/70 flex flex-wrap items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  <span>{item.senderAvatar} {item.senderName}</span>
                  <span>· from {item.fromRoomId}</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {item.title}
                </div>
                {item.note && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    {item.note}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.questionSnapshot && (
                  <button
                    type="button"
                    onClick={() => onLoadHandoff(item.id)}
                    className="px-2.5 py-1 rounded-lg bg-[#0078D4] text-white text-[11px] font-bold cursor-pointer"
                  >
                    Load Trap
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onResolveHandoff(item.id, true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold cursor-pointer"
                >
                  Mark Cleared
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {clinicUserMistakes.length > 0 ? (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            Your Unreviewed Weak Questions (Click to Co-Solve &amp; Dissect):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {clinicUserMistakes.map((mq) => (
              <button
                key={mq.id}
                type="button"
                onClick={() => onLoadQuestionToBoard(mq)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 hover:border-[#0078D4] text-[11px] font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3 text-rose-500" />
                <span>M{mq.moduleId}: {mq.question.slice(0, 42)}...</span>
              </button>
            ))}
          </div>
        </div>
      ) : unresolvedHandoffs.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span>
            No escalated traps queued yet! Load a high-distractor contrast item or escalate a question from any other chamber.
          </span>
          {clinicDefaultPool[0] && (
            <button
              type="button"
              onClick={() => onLoadQuestionToBoard(clinicDefaultPool[0])}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Load High-Trap Scenario</span>
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};
