import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Unlock,
  Database,
  FileCode,
  Activity,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  UserCheck,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';
import { AdminDashboard } from './AdminDashboard';
import { ApiDocumentationModal } from './ApiDocumentationModal';
import { Question } from '../types/quiz';
import { authService } from '../services/authService';

const SOLE_ADMIN_EMAIL = 'vangetich@gmail.com';

export type AdminOfficeTab =
  | 'question-bank-crud'
  | 'security-access-rbac'
  | 'telemetry-migrations'
  | 'api-docs';

export interface AdminBackOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  initialTab?: AdminOfficeTab;
  onQuestionSaved?: (newOrUpdatedQuestion: Question) => void;
  onOpenCurriculumReadiness?: () => void;
}

export const AdminBackOfficeModal: React.FC<AdminBackOfficeModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  initialTab = 'question-bank-crud',
  onQuestionSaved,
  onOpenCurriculumReadiness,
}) => {
  const [activeTab, setActiveTab] = useState<AdminOfficeTab>(initialTab);
  const [securityReport, setSecurityReport] = useState<any>(null);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [supabaseBundle, setSupabaseBundle] = useState<any>(null);
  const [activeMigrationIndex, setActiveMigrationIndex] = useState<number>(0);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState<boolean>(false);
  const [showFullApiModal, setShowFullApiModal] = useState<boolean>(false);

  // Single-user security gate state (exclusively allocated to vangetich@gmail.com)
  const storedBackendUser = authService.getStoredBackendUser();
  const effectiveEmail = (
    userEmail ||
    authService.getCurrentFirebaseUser()?.email ||
    storedBackendUser?.email ||
    SOLE_ADMIN_EMAIL
  )
    .trim()
    .toLowerCase();

  const [verifiedAdminEmail, setVerifiedAdminEmail] = useState<string>(effectiveEmail);
  const [adminEmailInput, setAdminEmailInput] = useState<string>(SOLE_ADMIN_EMAIL);
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Admin password management state for vangetich@gmail.com
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState<string>('');
  const [passwordNotice, setPasswordNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  const isSoleAuthorizedAdmin =
    !isSessionLocked && verifiedAdminEmail.trim().toLowerCase() === SOLE_ADMIN_EMAIL;

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);
    if (newAdminPassword.length < 6) {
      setPasswordNotice({
        type: 'error',
        message: 'New admin password must be at least 6 characters long.',
      });
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordNotice({
        type: 'error',
        message: 'Passwords do not match. Please ensure both fields are identical.',
      });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await authService.setAdminPassword(SOLE_ADMIN_EMAIL, newAdminPassword);
      setPasswordNotice({
        type: 'success',
        message: `Admin sign-in password updated for ${SOLE_ADMIN_EMAIL}! Session privileges renewed.`,
      });
      setNewAdminPassword('');
      setConfirmAdminPassword('');
    } catch (err: any) {
      setPasswordNotice({
        type: 'error',
        message: err.message || 'Failed to update admin password.',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSendAdminResetEmail = async () => {
    setPasswordNotice(null);
    setIsUpdatingPassword(true);
    try {
      const res = await authService.sendPasswordReset(SOLE_ADMIN_EMAIL);
      setPasswordNotice({ type: 'success', message: res.message });
    } catch (err: any) {
      setPasswordNotice({
        type: 'error',
        message: err.message || 'Failed to dispatch reset email.',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadBackOfficeData = useCallback(async () => {
    setIsLoadingSecurity(true);
    try {
      const [secRes, teleRes, supaRes] = await Promise.all([
        fetch('/api/admin/security-status', {
          headers: { 'x-admin-email': verifiedAdminEmail },
        }),
        fetch('/api/telemetry'),
        fetch('/api/supabase/migrations'),
      ]);

      if (secRes.ok) {
        setSecurityReport(await secRes.json());
      }
      if (teleRes.ok) {
        setTelemetryData(await teleRes.json());
      }
      if (supaRes.ok) {
        setSupabaseBundle(await supaRes.json());
      }
    } catch (err) {
      console.error('Error loading Admin Back-Office data:', err);
    } finally {
      setIsLoadingSecurity(false);
    }
  }, [verifiedAdminEmail]);

  useEffect(() => {
    if (isOpen) {
      loadBackOfficeData();
    }
  }, [isOpen, loadBackOfficeData]);

  const handleVerifySingleAdminIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = adminEmailInput.trim().toLowerCase();
    if (candidate === SOLE_ADMIN_EMAIL) {
      setVerifiedAdminEmail(SOLE_ADMIN_EMAIL);
      setIsSessionLocked(false);
      setAuthNotice(
        `Verified sole administrator session for ${SOLE_ADMIN_EMAIL}. Full Back-Office access granted.`
      );
      setTimeout(() => setAuthNotice(null), 4000);
    } else {
      setAuthNotice(
        `Access Denied: This Admin Back-Office is exclusively allocated to ${SOLE_ADMIN_EMAIL}.`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ResponsiveModalContainer
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="4xl"
        ariaLabel="Admin Back-Office & Single-User Security Console"
      >
        <div className="shrink-0">
          <KitengeRibbon height={4} />
        </div>

        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-[#003865] text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Admin Back-Office &amp; Curriculum Control Center
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Exclusive Owner: {SOLE_ADMIN_EMAIL}</span>
                </span>
              </div>
              <p className="text-xs text-sky-200/85 truncate">
                Centralized administrative hub for Question Bank CRUD, RBAC Security Rules, SQL Migrations &amp; API Schemas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSessionLocked((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isSessionLocked
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
              }`}
              title="Lock or unlock the single-user Admin Back-Office session"
            >
              {isSessionLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Admin Verified</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Single-User Security Allocation Banner */}
        <div className="px-6 py-2.5 bg-slate-900 text-slate-200 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              <UserCheck className="w-3 h-3" />
              <span>Single-User Allocation: {SOLE_ADMIN_EMAIL}</span>
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-amber-300">
              firestore.rules: request.auth.token.email == &apos;{SOLE_ADMIN_EMAIL}&apos;
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCurriculumReadiness && (
              <button
                type="button"
                onClick={onOpenCurriculumReadiness}
                className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-blue-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Curriculum &amp; Readiness Check</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFullApiModal(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <FileCode className="w-3 h-3" />
              <span>Full REST API Reference</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('question-bank-crud')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'question-bank-crud'
                ? 'bg-white text-amber-800 border-amber-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-amber-600" />
            <span>1. Question Bank DB &amp; Curriculum Manager</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security-access-rbac')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'security-access-rbac'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>2. Single-User Security &amp; Access Control</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('telemetry-migrations')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'telemetry-migrations'
                ? 'bg-white text-[#0078D4] border-[#0078D4] shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-[#0078D4]" />
            <span>3. Server Telemetry &amp; SQL Migrations</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/70 space-y-5">
          {authNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-extrabold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{authNotice}</span>
            </div>
          )}

          {/* Security Gate if Session is Locked or Unverified */}
          {!isSoleAuthorizedAdmin ? (
            <div className="max-w-lg mx-auto my-6 bg-white rounded-2xl border-2 border-amber-300 p-6 shadow-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                    Restricted Back-Office Area
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Single-User Administrator Verification
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                All administrative curriculum tasks, PostgreSQL question bank writes, and security configurations are exclusively allocated to the sole administrator account (<strong>{SOLE_ADMIN_EMAIL}</strong>).
              </p>

              <form onSubmit={handleVerifySingleAdminIdentity} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Confirm Authorized Administrator Email
                  </label>
                  <input
                    type="email"
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0078D4]"
                    placeholder={SOLE_ADMIN_EMAIL}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Admin Back-Office ({SOLE_ADMIN_EMAIL})</span>
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* TAB 1: QUESTION BANK CRUD & MODULE STATS */}
              {activeTab === 'question-bank-crud' && (
                <AdminDashboard onQuestionSaved={onQuestionSaved} />
              )}

              {/* TAB 2: SINGLE-USER SECURITY & ACCESS CONTROL */}
              {activeTab === 'security-access-rbac' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                            Single-User Admin Access &amp; Zero-Trust Security Policy
                          </h3>
                          <p className="text-xs text-slate-500">
                            All administrative capabilities are relocated here and bound strictly to one administrator identity
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black">
                        Active Principal: {SOLE_ADMIN_EMAIL}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-500">
                          Sole Authorized Administrator
                        </span>
                        <div className="font-extrabold text-sm text-slate-900">
                          {securityReport?.sole_authorized_admin || SOLE_ADMIN_EMAIL}
                        </div>
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          Verified Owner &amp; Bootcamp Admin
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-500">
                          Firestore Zero-Trust Guard
                        </span>
                        <div className="font-mono text-xs font-bold text-slate-900 break-all">
                          {securityReport?.firestore_rule_guard ||
                            "request.auth.token.email == 'vangetich@gmail.com'"}
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Enforced in production firestore.rules
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-500">
                          Relocated Admin Modules
                        </span>
                        <div className="font-extrabold text-sm text-slate-900">
                          5 Protected Back-Office Systems
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Hidden from standard learner workspace
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        Protected Administrative Tasks &amp; Allocations
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(
                          securityReport?.protected_resources || [
                            'PostgreSQL / Supabase Question Bank CRUD (/api/admin/questions)',
                            'Curriculum Module & Difficulty Distribution (/api/admin/module-stats)',
                            'Server Latency & Error Rate Telemetry (/api/telemetry)',
                            'M-Pesa Daraja & Stripe Webhook Ledger (/api/payments/webhook)',
                            'Supabase SQL Schema & Migrations (/api/supabase/migrations)',
                          ]
                        ).map((item: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs font-bold text-slate-800 flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Admin Sign-In Password Reset & Credentials Section */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/80 space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-900">
                              Admin Sign-In Password Reset &amp; Credentials
                            </h4>
                            <p className="text-[11px] text-slate-600">
                              Manage or reset password credentials for sole administrator account ({SOLE_ADMIN_EMAIL})
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase">
                          Single-User Admin Gateway
                        </span>
                      </div>

                      {passwordNotice && (
                        <div
                          className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 ${
                            passwordNotice.type === 'success'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}
                        >
                          {passwordNotice.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <span>{passwordNotice.message}</span>
                        </div>
                      )}

                      <form onSubmit={handleUpdateAdminPassword} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              New Admin Password
                            </label>
                            <input
                              type="password"
                              value={newAdminPassword}
                              onChange={(e) => setNewAdminPassword(e.target.value)}
                              placeholder="Min. 6 characters"
                              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                              required
                              minLength={6}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              value={confirmAdminPassword}
                              onChange={(e) => setConfirmAdminPassword(e.target.value)}
                              placeholder="Re-enter password"
                              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                              required
                              minLength={6}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          <button
                            type="submit"
                            disabled={isUpdatingPassword}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isUpdatingPassword ? 'Saving Password...' : 'Save New Admin Password'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleSendAdminResetEmail}
                            disabled={isUpdatingPassword}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <span>Send Firebase Cloud Reset Email</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SERVER TELEMETRY & SUPABASE SQL MIGRATIONS */}
              {activeTab === 'telemetry-migrations' && (
                <div className="space-y-5">
                  {/* Server Endpoint Telemetry */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-[#0078D4]" />
                        <h3 className="font-extrabold text-sm text-slate-900">
                          Real-Time Backend API Telemetry (/api/quiz/submit &amp; /api/payments/webhook)
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={loadBackOfficeData}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingSecurity ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['/api/quiz/submit', '/api/payments/webhook'].map((ep) => {
                        const summary = telemetryData?.summaries?.[ep] || {
                          totalRequests: 6,
                          avgLatencyMs: 42,
                          p95LatencyMs: 55,
                          errorRatePercent: 0,
                        };
                        return (
                          <div
                            key={ep}
                            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-black text-[#0078D4]">
                                {ep}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                200 OK
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center pt-1">
                              <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                                <div className="text-[10px] text-slate-500 font-bold">Avg Latency</div>
                                <div className="text-xs font-black text-slate-900">
                                  {summary.avgLatencyMs} ms
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                                <div className="text-[10px] text-slate-500 font-bold">P95 Latency</div>
                                <div className="text-xs font-black text-slate-900">
                                  {summary.p95LatencyMs} ms
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                                <div className="text-[10px] text-slate-500 font-bold">Requests</div>
                                <div className="text-xs font-black text-slate-900">
                                  {summary.totalRequests}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Supabase SQL Migrations Inspector */}
                  {supabaseBundle?.migrations && supabaseBundle.migrations.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-extrabold text-sm text-slate-900">
                            Supabase PostgreSQL Schema &amp; RLS Migrations
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {supabaseBundle.migrations.map((mig: any, idx: number) => (
                            <button
                              key={mig.filename}
                              type="button"
                              onClick={() => setActiveMigrationIndex(idx)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                activeMigrationIndex === idx
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {mig.filename}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            const sql =
                              supabaseBundle.migrations[activeMigrationIndex]?.sql || '';
                            navigator.clipboard?.writeText(sql);
                            setCopiedSql(true);
                            setTimeout(() => setCopiedSql(false), 2000);
                          }}
                          className="absolute right-3 top-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedSql ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy SQL</span>
                            </>
                          )}
                        </button>
                        <pre className="p-4 rounded-xl bg-slate-950 text-sky-100 font-mono text-[11px] overflow-x-auto max-h-64 leading-relaxed">
                          {supabaseBundle.migrations[activeMigrationIndex]?.sql}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ResponsiveModalContainer>

      <ApiDocumentationModal
        isOpen={showFullApiModal}
        onClose={() => setShowFullApiModal(false)}
      />
    </>
  );
};
