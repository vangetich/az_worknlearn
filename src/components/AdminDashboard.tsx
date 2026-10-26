import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  PlusCircle,
  Edit3,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Layers,
  Award,
  Sparkles,
  Save,
  Search,
  Check,
  FileText,
  HelpCircle,
  Users,
  KeyRound,
  ShieldCheck,
  Unlock,
  Download,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  fetchSupabaseAdminModuleStats,
  fetchPostgresModuleQuestions,
  upsertSupabaseCurriculumQuestion,
  AdminModuleStatsPayload,
  PostgresQuestionsRow,
  isSupabaseDirectConfigured,
} from '../lib/supabase';
import { Question } from '../types/quiz';

interface AdminDashboardProps {
  onQuestionSaved?: (newOrUpdatedQuestion: Question) => void;
  onStatusBanner?: (banner: { type: 'success' | 'info' | 'error'; message: string } | null) => void;
}

const DEFAULT_OPTIONS: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
  { letter: 'A', text: '' },
  { letter: 'B', text: '' },
  { letter: 'C', text: '' },
  { letter: 'D', text: '' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onQuestionSaved,
  onStatusBanner,
}) => {
  const [statsPayload, setStatsPayload] = useState<AdminModuleStatsPayload | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number>(1);
  const [moduleQuestions, setModuleQuestions] = useState<PostgresQuestionsRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localBanner, setLocalBanner] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  // Sub-view switcher inside AdminDashboard: 'curriculum' vs 'users'
  const [dashboardSection, setDashboardSection] = useState<'curriculum' | 'users'>('curriculum');

  // User accounts & password reset management state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('vangetich@gmail.com');
  const [manageFullName, setManageFullName] = useState<string>('V. Ngetich (Bootcamp Admin)');
  const [manageRole, setManageRole] = useState<'student' | 'bootcamp_admin' | 'enterprise_user'>('bootcamp_admin');
  const [managePremium, setManagePremium] = useState<boolean>(true);
  const [manageNewPassword, setManageNewPassword] = useState<string>('');
  const [isUpdatingUser, setIsUpdatingUser] = useState<boolean>(false);

  // Bulk Actions Toolbar state for User Management tab
  const [selectedBulkEmails, setSelectedBulkEmails] = useState<string[]>([]);
  const [bulkTempPassword, setBulkTempPassword] = useState<string>('Az900Reset!2026');
  const [isRunningBulkAction, setIsRunningBulkAction] = useState<boolean>(false);

  // Form state for Add / Edit Question
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingQuestionId, setEditingQuestionId] = useState<string>('');
  const [formModuleId, setFormModuleId] = useState<number>(1);
  const [formDifficulty, setFormDifficulty] = useState<
    'Fundamental' | 'Intermediate' | 'Advanced'
  >('Intermediate');
  const [formScenarioText, setFormScenarioText] = useState('');
  const [formQuestionText, setFormQuestionText] = useState('');
  const [formOptions, setFormOptions] =
    useState<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }[]>(DEFAULT_OPTIONS);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formExplanationCorrect, setFormExplanationCorrect] = useState('');
  const [formDistractors, setFormDistractors] = useState<Record<'A' | 'B' | 'C' | 'D', string>>({
    A: '',
    B: '',
    C: '',
    D: '',
  });
  const [formExamTip, setFormExamTip] = useState('');

  const notifyBanner = useCallback(
    (banner: { type: 'success' | 'info' | 'error'; message: string } | null) => {
      setLocalBanner(banner);
      if (onStatusBanner && banner) {
        onStatusBanner(banner);
      }
    },
    [onStatusBanner]
  );

  const loadModuleStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const data = await fetchSupabaseAdminModuleStats();
      setStatsPayload(data);
    } catch (err: any) {
      notifyBanner({
        type: 'error',
        message: err.message || 'Failed to load Supabase module statistics.',
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [notifyBanner]);

  const loadQuestionsForModule = useCallback(
    async (modId: number) => {
      setIsLoadingQuestions(true);
      try {
        // Fetch unredacted questions (protectAnswers = false) for Admin editing
        const rows = await fetchPostgresModuleQuestions(modId, false);
        setModuleQuestions(rows);
      } catch (err: any) {
        notifyBanner({
          type: 'error',
          message: err.message || `Failed to load questions for Module ${modId}.`,
        });
      } finally {
        setIsLoadingQuestions(false);
      }
    },
    [notifyBanner]
  );

  const loadAdminUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data.users || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadModuleStats();
    loadAdminUsers();
  }, [loadModuleStats, loadAdminUsers]);

  useEffect(() => {
    loadQuestionsForModule(selectedModuleId);
  }, [selectedModuleId, loadQuestionsForModule]);

  const handleSelectUserForManage = (u: any) => {
    setSelectedUserEmail(u.email);
    setManageFullName(u.full_name || '');
    setManageRole(u.role || 'student');
    setManagePremium(Boolean(u.is_premium));
    setManageNewPassword('');
  };

  const handleSaveUserAccountChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserEmail.trim()) return;
    setIsUpdatingUser(true);
    try {
      const res = await fetch('/api/admin/users/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedUserEmail.trim(),
          full_name: manageFullName.trim(),
          role: manageRole,
          is_premium: managePremium,
          unlockAllModules: managePremium,
          newPassword: manageNewPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user account.');
      }
      if (data.users) {
        setAdminUsers(data.users);
      } else {
        await loadAdminUsers();
      }
      setManageNewPassword('');
      notifyBanner({
        type: 'success',
        message: manageNewPassword.trim()
          ? `Updated account & reset password for ${selectedUserEmail.trim()}.`
          : `Updated account role & privileges for ${selectedUserEmail.trim()}.`,
      });
    } catch (err: any) {
      notifyBanner({
        type: 'error',
        message: err.message || 'Failed to update user account.',
      });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleToggleBulkSelectEmail = (email: string) => {
    const clean = email.toLowerCase();
    setSelectedBulkEmails((prev) =>
      prev.includes(clean) ? prev.filter((e) => e !== clean) : [...prev, clean]
    );
  };

  const handleToggleSelectAllUsers = () => {
    if (selectedBulkEmails.length === adminUsers.length && adminUsers.length > 0) {
      setSelectedBulkEmails([]);
    } else {
      setSelectedBulkEmails(adminUsers.map((u) => String(u.email).toLowerCase()));
    }
  };

  const handleBulkExportUsersCsv = () => {
    const targetUsers =
      selectedBulkEmails.length > 0
        ? adminUsers.filter((u) => selectedBulkEmails.includes(String(u.email).toLowerCase()))
        : adminUsers;

    if (targetUsers.length === 0) {
      notifyBanner({
        type: 'info',
        message: 'No user accounts available to export.',
      });
      return;
    }

    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Role',
      'Paid Status',
      'Premium',
      'Unlocked Modules Count',
      'Sessions Completed',
      'Created At',
    ];
    const rows = targetUsers.map((u) => [
      u.id || '',
      `"${String(u.full_name || '').replace(/"/g, '""')}"`,
      u.email || '',
      u.role || 'student',
      u.is_premium ? 'active' : 'inactive',
      u.is_premium ? 'Yes' : 'No',
      (u.unlocked_modules || []).length,
      u.sessions_completed ?? 0,
      u.created_at || new Date().toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `az900-cohort-users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notifyBanner({
      type: 'success',
      message: `Exported ${targetUsers.length} user record${
        targetUsers.length === 1 ? '' : 's'
      } to CSV.`,
    });
  };

  const handleBulkResetPasswords = async () => {
    if (selectedBulkEmails.length === 0) {
      notifyBanner({
        type: 'error',
        message: 'Select at least one student checkbox in the directory to bulk reset passwords.',
      });
      return;
    }

    const passwordToApply = bulkTempPassword.trim() || 'Az900Reset!2026';
    setIsRunningBulkAction(true);

    try {
      const targetUsers = adminUsers.filter((u) =>
        selectedBulkEmails.includes(String(u.email).toLowerCase())
      );

      for (const u of targetUsers) {
        await fetch('/api/admin/users/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: u.email,
            full_name: u.full_name,
            role: u.role,
            is_premium: Boolean(u.is_premium),
            unlockAllModules: Boolean(u.is_premium),
            newPassword: passwordToApply,
          }),
        });
      }

      await loadAdminUsers();
      notifyBanner({
        type: 'success',
        message: `Bulk password reset completed for ${targetUsers.length} selected account${
          targetUsers.length === 1 ? '' : 's'
        } (${targetUsers.map((u) => u.email).join(', ')}).`,
      });
    } catch (err: any) {
      notifyBanner({
        type: 'error',
        message: err.message || 'Bulk password reset encountered an error.',
      });
    } finally {
      setIsRunningBulkAction(false);
    }
  };

  const handleResetToCreate = (targetModule = selectedModuleId) => {
    setFormMode('create');
    setEditingQuestionId('');
    setFormModuleId(targetModule);
    setFormDifficulty('Intermediate');
    setFormScenarioText('');
    setFormQuestionText('');
    setFormOptions([
      { letter: 'A', text: '' },
      { letter: 'B', text: '' },
      { letter: 'C', text: '' },
      { letter: 'D', text: '' },
    ]);
    setFormCorrectAnswer('A');
    setFormExplanationCorrect('');
    setFormDistractors({ A: '', B: '', C: '', D: '' });
    setFormExamTip('');
  };

  const handleSelectQuestionForEdit = (q: PostgresQuestionsRow) => {
    setFormMode('edit');
    setEditingQuestionId(q.id);
    setFormModuleId(q.module_id);
    setFormDifficulty(q.difficulty || 'Intermediate');
    setFormScenarioText(q.scenario_text || '');
    setFormQuestionText(q.question_text || '');

    const mappedOptions: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[] = (
      ['A', 'B', 'C', 'D'] as const
    ).map((letter) => {
      const found = (q.options || []).find((o) => o.letter === letter);
      return { letter, text: found?.text || '' };
    });
    setFormOptions(mappedOptions);
    setFormCorrectAnswer((q.correct_answer as 'A' | 'B' | 'C' | 'D') || 'A');
    setFormExplanationCorrect(q.explanation_correct || '');

    const distMap: Record<'A' | 'B' | 'C' | 'D', string> = { A: '', B: '', C: '', D: '' };
    const rawDist = q.explanation_distractors as any;
    if (Array.isArray(rawDist)) {
      rawDist.forEach((d: any) => {
        if (d && ['A', 'B', 'C', 'D'].includes(d.letter)) {
          distMap[d.letter as 'A' | 'B' | 'C' | 'D'] = d.reason || '';
        }
      });
    } else if (rawDist && typeof rawDist === 'object') {
      (['A', 'B', 'C', 'D'] as const).forEach((l) => {
        if (rawDist[l]) distMap[l] = String(rawDist[l]);
      });
    }
    setFormDistractors(distMap);
    setFormExamTip(q.exam_tip || '');
  };

  const handlePrefillSampleQuestion = () => {
    const activeMod = statsPayload?.modules.find((m) => m.module_id === formModuleId);
    setFormScenarioText(
      `A Nairobi fintech enterprise is deploying mission-critical payment microservices on Azure (${
        activeMod?.title || 'Core Azure Architecture'
      }). They require automated fault isolation across separate physical power, cooling, and networking boundaries within a single Azure Region.`
    );
    setFormQuestionText(
      'Which Azure architectural capability should the cloud architect configure to meet this resilience requirement?'
    );
    setFormOptions([
      { letter: 'A', text: 'Azure Availability Zones' },
      { letter: 'B', text: 'Azure Resource Groups' },
      { letter: 'C', text: 'Azure Management Groups' },
      { letter: 'D', text: 'Locally Redundant Storage (LRS)' },
    ]);
    setFormCorrectAnswer('A');
    setFormExplanationCorrect(
      'Azure Availability Zones are physically separate datacenters within an Azure region, each equipped with independent power, cooling, and networking to protect workloads from datacenter-level failures.'
    );
    setFormDistractors({
      A: '',
      B: 'Resource Groups are logical containers for managing Azure assets and do not provide physical fault isolation.',
      C: 'Management Groups govern policies and RBAC across multiple subscriptions rather than datacenter availability.',
      D: 'LRS replicates data three times within a single physical datacenter facility and does not span separate zones.',
    });
    setFormExamTip(
      'Exam Keyword: Independent power, cooling, and networking inside one Region = Availability Zones (minimum 3 zones).'
    );
  };

  const handleSubmitQuestionForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const emptyOption = formOptions.find((o) => !o.text.trim());
    if (!formScenarioText.trim() || !formQuestionText.trim() || emptyOption) {
      notifyBanner({
        type: 'error',
        message: 'Please complete the scenario, question prompt, and all 4 options (A–D).',
      });
      return;
    }

    setIsSaving(true);
    notifyBanner(null);

    try {
      const distractorArray = (['A', 'B', 'C', 'D'] as const)
        .filter((l) => l !== formCorrectAnswer)
        .map((l) => ({
          letter: l,
          reason:
            formDistractors[l]?.trim() ||
            `Option ${l} does not satisfy the specific Azure architectural constraints in the scenario.`,
        }));

      const response = await upsertSupabaseCurriculumQuestion(
        {
          id: formMode === 'edit' ? editingQuestionId : undefined,
          module_id: formModuleId,
          difficulty: formDifficulty,
          scenario_text: formScenarioText.trim(),
          question_text: formQuestionText.trim(),
          options: formOptions.map((o) => ({
            letter: o.letter,
            text: o.text.trim(),
          })),
          correct_answer: formCorrectAnswer,
          explanation_correct:
            formExplanationCorrect.trim() ||
            `Option ${formCorrectAnswer} is the official Microsoft Azure solution for this scenario.`,
          explanation_distractors: distractorArray,
          exam_tip:
            formExamTip.trim() ||
            'Remember to match the core Azure service SLA and architectural scope to the business requirement.',
        },
        formMode === 'edit'
      );

      const savedQ = response.question;
      if (response.module_stats) {
        setStatsPayload(response.module_stats);
      } else {
        await loadModuleStats();
      }

      setSelectedModuleId(formModuleId);
      await loadQuestionsForModule(formModuleId);

      if (savedQ && onQuestionSaved) {
        const mappedFrontendQ: Question = {
          id: savedQ.id,
          learningPathId: savedQ.learning_path_id || (formModuleId <= 3 ? 1 : formModuleId <= 7 ? 2 : 3),
          learningPathTitle: savedQ.learning_path_title || `Learning Path`,
          moduleId: savedQ.module_id,
          moduleTitle: savedQ.module_title || `Module ${savedQ.module_id}`,
          difficulty: savedQ.difficulty || formDifficulty,
          scenario: savedQ.scenario_text,
          question: savedQ.question_text,
          options: savedQ.options,
          correctAnswer: savedQ.correct_answer,
          whyCorrect: savedQ.explanation_correct,
          distractorBreakdown: Array.isArray(savedQ.explanation_distractors)
            ? savedQ.explanation_distractors
            : distractorArray,
          examTip: savedQ.exam_tip,
        };
        onQuestionSaved(mappedFrontendQ);
      }

      notifyBanner({
        type: 'success',
        message:
          formMode === 'edit'
            ? `Updated question "${savedQ?.id || editingQuestionId}" in Postgres database (Module ${formModuleId}).`
            : `Inserted new question "${savedQ?.id}" into Postgres database (Module ${formModuleId}).`,
      });

      if (formMode === 'create') {
        handleResetToCreate(formModuleId);
      }
    } catch (err: any) {
      notifyBanner({
        type: 'error',
        message: err.message || 'Failed to save question to Postgres database.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredQuestions = moduleQuestions.filter((q) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      q.id.toLowerCase().includes(term) ||
      q.scenario_text.toLowerCase().includes(term) ||
      q.question_text.toLowerCase().includes(term)
    );
  });

  const activeModuleMeta = statsPayload?.modules.find((m) => m.module_id === selectedModuleId);

  return (
    <div className="space-y-6">
      {/* Top Header & Connection Status Bar */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-[#003E6B] to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-amber-300">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base">
                Supabase PostgreSQL Curriculum Admin Dashboard
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-400/40">
                {isSupabaseDirectConfigured ? 'Supabase Direct + API' : 'Postgres API Connected'}
              </span>
            </div>
            <p className="text-xs text-sky-100/80">
              Live module telemetry from <code className="font-mono">public.modules</code> &amp; direct CRUD into <code className="font-mono">public.questions</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadModuleStats();
              loadQuestionsForModule(selectedModuleId);
            }}
            disabled={isLoadingStats || isLoadingQuestions}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingStats || isLoadingQuestions ? 'animate-spin' : ''}`}
            />
            <span>Refresh Supabase Stats</span>
          </button>

          <button
            type="button"
            onClick={() => handleResetToCreate(selectedModuleId)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Question</span>
          </button>
        </div>
      </div>

      {/* Local Status Feedback Banner */}
      {localBanner && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 ${
            localBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : localBanner.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-blue-50 border-blue-300 text-blue-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {localBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{localBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocalBanner(null)}
            className="text-xs underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Dashboard Mode Switcher: Curriculum Content Edits vs User Accounts & Password Resets */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDashboardSection('curriculum')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              dashboardSection === 'curriculum'
                ? 'bg-[#0078D4] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Curriculum Content Edits &amp; Question Bank ({statsPayload?.total_questions ?? 27} Qs)</span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardSection('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              dashboardSection === 'users'
                ? 'bg-[#0078D4] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts &amp; Password Resets ({adminUsers.length})</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Authorized Whitelist Admin View</span>
        </span>
      </div>

      {/* SECTION A: USER ACCOUNTS, ROLES & PASSWORD RESETS */}
      {dashboardSection === 'users' && (
        <div className="space-y-4">
          {/* Bulk Actions Toolbar for User Management */}
          <div
            role="toolbar"
            aria-label="User Management Bulk Actions Toolbar"
            className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-[#003865] to-slate-900 text-white border border-sky-400/30 flex flex-wrap items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleSelectAllUsers}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-extrabold flex items-center gap-1.5 border border-white/15 cursor-pointer transition-colors"
              >
                {selectedBulkEmails.length === adminUsers.length && adminUsers.length > 0 ? (
                  <CheckSquare className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-sky-300" />
                )}
                <span>
                  {selectedBulkEmails.length === adminUsers.length && adminUsers.length > 0
                    ? 'Deselect All'
                    : `Select All (${adminUsers.length})`}
                </span>
              </button>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-400 text-slate-950">
                {selectedBulkEmails.length} Selected
              </span>

              <span className="text-xs text-sky-200 hidden sm:inline">
                Bulk Actions Toolbar: Export selected students to CSV or reset passwords simultaneously
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
                <KeyRound className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <input
                  type="text"
                  value={bulkTempPassword}
                  onChange={(e) => setBulkTempPassword(e.target.value)}
                  placeholder="Bulk temp password"
                  aria-label="Temporary password for bulk student password reset"
                  className="bg-transparent text-xs font-mono font-bold text-white focus:outline-hidden w-32"
                />
              </div>

              <button
                type="button"
                disabled={isRunningBulkAction || selectedBulkEmails.length === 0}
                onClick={handleBulkResetPasswords}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-45 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>
                  {isRunningBulkAction
                    ? 'Resetting...'
                    : `Bulk Reset Passwords (${selectedBulkEmails.length})`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleBulkExportUsersCsv}
                className="px-3 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-black flex items-center gap-1.5 border border-sky-300/30 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {selectedBulkEmails.length > 0
                    ? `Export Selected (${selectedBulkEmails.length}) to CSV`
                    : 'Export All Users to CSV'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Registered User Directory */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <h4 className="text-xs sm:text-sm font-extrabold">
                    Registered Learner &amp; Admin Accounts ({adminUsers.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={loadAdminUsers}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {adminUsers.map((u) => {
                  const isSelected = u.email.toLowerCase() === selectedUserEmail.toLowerCase();
                  const isBulkChecked = selectedBulkEmails.includes(
                    String(u.email).toLowerCase()
                  );
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUserForManage(u)}
                      className={`p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-50/90 border-l-4 border-[#0078D4]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isBulkChecked}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleToggleBulkSelectEmail(u.email)}
                          aria-label={`Select ${u.full_name} (${u.email}) for bulk actions`}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-[#0078D4] focus:ring-[#0078D4] cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                              {u.full_name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                u.role === 'bootcamp_admin'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : u.role === 'enterprise_user'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {u.role}
                            </span>
                            {u.is_premium && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Premium (12 Modules)
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-600">{u.email}</div>
                          <div className="text-[10px] text-slate-500">
                            Unlocked Modules: {(u.unlocked_modules || []).length}/12 • Sessions:{' '}
                            {u.sessions_completed ?? 0}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectUserForManage(u);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3 text-amber-300" />
                        <span>Manage / Reset Password</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          {/* Right: Account Editor & Direct Password Reset Form */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-3.5 bg-slate-900 text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold">
                  Manage Account &amp; Password Reset
                </h4>
                <p className="text-[10px] text-slate-300">
                  Update credentials, role, or module access for any user
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveUserAccountChanges} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                  Target Account Email
                </label>
                <input
                  type="email"
                  required
                  value={selectedUserEmail}
                  onChange={(e) => setSelectedUserEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={manageFullName}
                  onChange={(e) => setManageFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                    Account Role
                  </label>
                  <select
                    value={manageRole}
                    onChange={(e) => setManageRole(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="student">student</option>
                    <option value="enterprise_user">enterprise_user</option>
                    <option value="bootcamp_admin">bootcamp_admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                    Curriculum Access
                  </label>
                  <button
                    type="button"
                    onClick={() => setManagePremium((p) => !p)}
                    className={`w-full px-2.5 py-2 rounded-lg border text-xs font-black flex items-center justify-center gap-1 cursor-pointer ${
                      managePremium
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{managePremium ? 'All 12 Unlocked' : 'Standard (1–4)'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                  Reset / Set New Password (Optional)
                </label>
                <input
                  type="password"
                  value={manageNewPassword}
                  onChange={(e) => setManageNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars) to reset..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingUser}
                className="w-full py-2.5 rounded-xl bg-[#0078D4] hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {isUpdatingUser ? 'Updating Account...' : 'Save Account & Password Changes'}
                </span>
              </button>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* Top 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Total Postgres Questions</span>
            <BookOpen className="w-4 h-4 text-[#0078D4]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {statsPayload?.total_questions ?? '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Across {statsPayload?.total_modules ?? 12} AZ-900 curriculum modules
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Selected Module Bank</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {activeModuleMeta?.question_count ?? moduleQuestions.length} Qs
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            Mod #{selectedModuleId}: {activeModuleMeta?.title || 'Loading...'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Difficulty Distribution</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs font-extrabold">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              F: {activeModuleMeta?.difficulty_breakdown.Fundamental ?? 0}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              I: {activeModuleMeta?.difficulty_breakdown.Intermediate ?? 0}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
              A: {activeModuleMeta?.difficulty_breakdown.Advanced ?? 0}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Fundamental / Intermediate / Advanced
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Module Learner Telemetry</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {activeModuleMeta?.avg_score ?? 0}% Avg
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {activeModuleMeta?.total_attempts ?? 0} attempts · {activeModuleMeta?.mastery_rate ?? 0}% mastered
          </div>
        </div>
      </div>

      {/* 12-Module Supabase Telemetry Selector Grid */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            12-Module Supabase Curriculum Stats (Click a module to inspect or add questions)
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">
            Showing live counts from <code className="font-mono font-bold">public.modules</code> &amp;{' '}
            <code className="font-mono font-bold">public.questions</code>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(statsPayload?.modules || []).map((mod) => {
            const isSelected = mod.module_id === selectedModuleId;
            return (
              <button
                key={mod.module_id}
                type="button"
                onClick={() => {
                  setSelectedModuleId(mod.module_id);
                  if (formMode === 'create') {
                    setFormModuleId(mod.module_id);
                  }
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0078D4] text-white border-[#0078D4] shadow-sm ring-2 ring-[#0078D4]/25'
                    : 'bg-white hover:bg-blue-50/50 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Mod {mod.module_number}
                  </span>
                  <span
                    className={`text-xs font-black ${
                      isSelected ? 'text-amber-300' : 'text-[#0078D4]'
                    }`}
                  >
                    {mod.question_count} Qs
                  </span>
                </div>
                <div
                  className={`text-[11px] font-bold truncate mt-1.5 ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                  title={mod.title}
                >
                  {mod.title}
                </div>
                <div
                  className={`text-[10px] mt-1 flex items-center justify-between ${
                    isSelected ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  <span>Path {mod.path_id}</span>
                  <span>{mod.avg_score}% avg</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Left = Module Question Browser | Right = Add/Edit Postgres Question Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Existing Questions in Selected Module */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  Module {selectedModuleId} Question Rows ({filteredQuestions.length})
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {activeModuleMeta?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleResetToCreate(selectedModuleId)}
                className="px-2.5 py-1.5 rounded-lg bg-[#0078D4] hover:bg-blue-700 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add New</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search questions in this module..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {isLoadingQuestions ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0078D4]" />
                <span>Querying Postgres questions for Module {selectedModuleId}...</span>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No matching questions found in Module {selectedModuleId}.
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isBeingEdited = formMode === 'edit' && editingQuestionId === q.id;
                return (
                  <div
                    key={q.id}
                    className={`p-3.5 space-y-2 transition-colors ${
                      isBeingEdited
                        ? 'bg-blue-50/70 border-l-4 border-[#0078D4]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {q.id}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            q.difficulty === 'Fundamental'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.difficulty === 'Advanced'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        {q.correct_answer && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ans: {q.correct_answer}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectQuestionForEdit(q)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                          isBeingEdited
                            ? 'bg-[#0078D4] text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isBeingEdited ? 'Editing' : 'Edit'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {q.scenario_text}
                    </p>
                    <p className="text-xs font-extrabold text-slate-900 line-clamp-2">
                      {q.question_text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Add / Edit Question Form in Postgres */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {formMode === 'edit' ? (
                <Edit3 className="w-4 h-4 text-amber-400" />
              ) : (
                <PlusCircle className="w-4 h-4 text-emerald-400" />
              )}
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold">
                  {formMode === 'edit'
                    ? `Edit Postgres Question (${editingQuestionId})`
                    : 'Add New Curriculum Question to Postgres'}
                </h4>
                <p className="text-[11px] text-slate-300 font-mono">
                  {formMode === 'edit'
                    ? `PUT /api/admin/questions/${editingQuestionId} • public.questions`
                    : 'POST /api/admin/questions • INSERT INTO public.questions'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrefillSampleQuestion}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 border border-white/15 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title="Auto-fill a sample AZ-900 scenario question for quick testing"
              >
                <Sparkles className="w-3 h-3" />
                <span>Fill Sample Scenario</span>
              </button>
              {formMode === 'edit' && (
                <button
                  type="button"
                  onClick={() => handleResetToCreate(selectedModuleId)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-[11px] font-bold cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmitQuestionForm} className="p-5 space-y-4">
            {/* Row 1: Module Selection & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Target Curriculum Module (FK module_id)
                </label>
                <select
                  value={formModuleId}
                  onChange={(e) => setFormModuleId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                >
                  {(statsPayload?.modules || []).map((m) => (
                    <option key={m.module_id} value={m.module_id}>
                      Module {m.module_number}: {m.title} (Path {m.path_id})
                    </option>
                  ))}
                  {(!statsPayload || statsPayload.modules.length === 0) &&
                    Array.from({ length: 12 }, (_, i) => i + 1).map((id) => (
                      <option key={id} value={id}>
                        Module {id}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Exam Difficulty Tier
                </label>
                <select
                  value={formDifficulty}
                  onChange={(e) =>
                    setFormDifficulty(
                      e.target.value as 'Fundamental' | 'Intermediate' | 'Advanced'
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                >
                  <option value="Fundamental">Fundamental (Core Concept)</option>
                  <option value="Intermediate">Intermediate (Scenario Application)</option>
                  <option value="Advanced">Advanced (Multi-Service Architecture)</option>
                </select>
              </div>
            </div>

            {/* Scenario Text */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>Real-World Enterprise Scenario (scenario_text)</span>
              </label>
              <textarea
                rows={3}
                required
                value={formScenarioText}
                onChange={(e) => setFormScenarioText(e.target.value)}
                placeholder="Describe the business or cloud architecture scenario..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
              />
            </div>

            {/* Question Prompt */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>Exam Question Prompt (question_text)</span>
              </label>
              <input
                type="text"
                required
                value={formQuestionText}
                onChange={(e) => setFormQuestionText(e.target.value)}
                placeholder="Which Azure service or feature should you recommend?"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
              />
            </div>

            {/* 4 JSONB Options + Correct Answer Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  Options JSONB Array (A, B, C, D) &amp; Correct Answer Selection
                </label>
                <span className="text-[11px] font-bold text-emerald-700">
                  Correct Answer: Option {formCorrectAnswer}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {formOptions.map((opt, idx) => {
                  const isCorrect = formCorrectAnswer === opt.letter;
                  return (
                    <div
                      key={opt.letter}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCorrect
                          ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400/40'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-slate-800">
                          Option {opt.letter}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormCorrectAnswer(opt.letter)}
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isCorrect && <Check className="w-3 h-3" />}
                          <span>{isCorrect ? 'Correct Answer' : 'Mark Correct'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => {
                          const next = [...formOptions];
                          next[idx] = { ...next[idx], text: e.target.value };
                          setFormOptions(next);
                        }}
                        placeholder={`Enter choice ${opt.letter}...`}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Correct Answer Explanation & Exam Tip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Why Correct Explanation (explanation_correct)
                </label>
                <textarea
                  rows={2}
                  value={formExplanationCorrect}
                  onChange={(e) => setFormExplanationCorrect(e.target.value)}
                  placeholder="Explain why the correct option satisfies the scenario..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Exam Memory Tip (exam_tip)
                </label>
                <textarea
                  rows={2}
                  value={formExamTip}
                  onChange={(e) => setFormExamTip(e.target.value)}
                  placeholder="Key exam anchor rule or shortcut..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                />
              </div>
            </div>

            {/* Distractor Explanations JSONB */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                Distractor Breakdown JSONB (explanation_distractors for incorrect choices)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['A', 'B', 'C', 'D'] as const)
                  .filter((letter) => letter !== formCorrectAnswer)
                  .map((letter) => (
                    <div key={letter}>
                      <span className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Why Option {letter} is Incorrect:
                      </span>
                      <input
                        type="text"
                        value={formDistractors[letter] || ''}
                        onChange={(e) =>
                          setFormDistractors((prev) => ({
                            ...prev,
                            [letter]: e.target.value,
                          }))
                        }
                        placeholder={`Reason ${letter} is a distractor...`}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                      />
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#0078D4] hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Postgres Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>
                      {formMode === 'edit'
                        ? 'Update Question in Postgres'
                        : 'Save Question to Postgres Database'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
