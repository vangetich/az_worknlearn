import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Cloud,
  ShieldCheck,
  Smartphone,
  CreditCard,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  LogIn,
  LogOut,
  UserPlus,
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  Layers,
  Send,
  AlertCircle,
  Database,
  Copy,
  FileCode,
} from 'lucide-react';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';
import { UserStats, Question } from '../types/quiz';
import {
  FirebaseUser,
} from '../lib/firebase';
import { authService } from '../services/authService';
import { usePostgresDatabase } from '../hooks/usePostgresDatabase';
import { PremiumUnlock } from './PremiumUnlock';
import { ApiDocumentationModal } from './ApiDocumentationModal';
import { AdminDashboard } from './AdminDashboard';

interface BackendCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onOpenApiDocs?: () => void;
  onOpenAdminBackOffice?: () => void;
  onQuestionSaved?: (newOrUpdatedQuestion: Question) => void;
  initialSection?: HubSection;
}

export type HubSection =
  | 'auth-progress'
  | 'curriculum-api'
  | 'mpesa-payments'
  | 'supabase-migrations'
  | 'admin-dashboard';

export const BackendCloudModal: React.FC<BackendCloudModalProps> = ({
  isOpen,
  onClose,
  stats,
  onOpenApiDocs,
  onOpenAdminBackOffice,
  onQuestionSaved,
  initialSection,
}) => {
  const [activeSection, setActiveSection] = useState<HubSection>(
    initialSection || 'auth-progress'
  );
  const [showInternalApiDocs, setShowInternalApiDocs] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(
    authService.getCurrentFirebaseUser()
  );

  // Backend user & token state managed via authService linked to Firebase `auth`
  const [backendUser, setBackendUser] = useState<any>(() => authService.getStoredBackendUser());
  const [authToken, setAuthToken] = useState<string>(() => authService.getStoredBackendToken());
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [emailInput, setEmailInput] = useState('vangetich@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('Cloud Architect Learner');
  const [roleInput, setRoleInput] = useState<'student' | 'bootcamp_admin' | 'enterprise_user'>(
    'student'
  );

  // Progress & Modules state from Backend API
  const [progressReport, setProgressReport] = useState<any>(null);
  const [curriculumData, setCurriculumData] = useState<any>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number>(1);
  const [moduleQuestions, setModuleQuestions] = useState<any[]>([]);
  const [protectAnswersMode, setProtectAnswersMode] = useState<boolean>(true);
  const [selectedPracticeQ, setSelectedPracticeQ] = useState<any>(null);
  const [chosenOption, setChosenOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<any>(null);

  // Supabase PostgreSQL Migration state
  const [supabaseBundle, setSupabaseBundle] = useState<any>(null);
  const [activeMigrationIndex, setActiveMigrationIndex] = useState<number>(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // M-Pesa & Stripe Payment state
  const [mpesaPhone, setMpesaPhone] = useState('0712345678');
  const [paymentPlan, setPaymentPlan] = useState<'all' | number>('all');
  const [pendingTx, setPendingTx] = useState<any>(null);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsub = authService.subscribeToAuthChanges((u) => {
      setFirebaseUser(u);
      if (u?.email) {
        setEmailInput(u.email);
      }
      if (u?.displayName) {
        setFullNameInput(u.displayName);
      }
    });
    return () => unsub();
  }, []);

  const currentUserId = firebaseUser?.uid || backendUser?.id || 'usr-default-learner';

  // Postgres / Supabase Database Utility Hook
  const postgresDb = usePostgresDatabase(currentUserId);

  const fetchBackendOverview = useCallback(async () => {
    try {
      const headers = await authService.getAuthHeaders(currentUserId);
      if (authToken && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const [progRes, modRes, supaRes] = await Promise.all([
        fetch(`/api/user/progress?userId=${encodeURIComponent(currentUserId)}`, { headers }),
        fetch(`/api/modules?userId=${encodeURIComponent(currentUserId)}`, { headers }),
        fetch('/api/supabase/migrations'),
        postgresDb.fetchCurriculumModules(),
      ]);

      if (progRes.ok) {
        const progData = await progRes.json();
        setProgressReport(progData);
        if (progData.user) setBackendUser(progData.user);
        const pendingFromReport = (progData.payment_transactions || []).find(
          (t: any) => t.status === 'pending'
        );
        if (pendingFromReport) {
          setPendingTx(pendingFromReport);
        }
      }
      if (modRes.ok) {
        const modData = await modRes.json();
        setCurriculumData(modData);
      }
      if (supaRes.ok) {
        const supaData = await supaRes.json();
        setSupabaseBundle(supaData);
      }
    } catch (err) {
      console.error('Error loading backend overview:', err);
    }
  }, [authToken, currentUserId, postgresDb.fetchCurriculumModules]);

  // Sync initialSection when opened with a specific target tab
  useEffect(() => {
    if (isOpen && initialSection) {
      setActiveSection(initialSection);
    }
  }, [isOpen, initialSection]);

  // Polling mechanism in BackendCloudModal checking `/api/payments/status/:id` after STK push is initiated
  useEffect(() => {
    if (!isOpen || !pendingTx) return;
    const txIdentifier = pendingTx.checkout_request_id || pendingTx.id;
    if (!txIdentifier) return;

    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${encodeURIComponent(txIdentifier)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'completed') {
          setPendingTx(null);
          if (data.user) {
            setBackendUser(data.user);
          }
          setStatusBanner({
            type: 'success',
            message: `Webhook confirmed via GET /api/payments/status/${txIdentifier}! Receipt: ${
              data.receipt_number || 'Verified'
            } — Premium Azure Modules Unlocked!`,
          });
          await fetchBackendOverview();
        } else if (data.status === 'failed') {
          setPendingTx(null);
          setStatusBanner({
            type: 'error',
            message: `Payment ${txIdentifier} reported status 'failed' via /api/payments/status/${txIdentifier}.`,
          });
          await fetchBackendOverview();
        }
      } catch {
        // Ignore transient network poll errors
      }
    }, 2500);

    return () => clearInterval(pollTimer);
  }, [isOpen, pendingTx, fetchBackendOverview]);

  const fetchModuleQuestions = useCallback(
    async (modId: number, protect: boolean) => {
      try {
        const questionsList = await postgresDb.fetchModuleQuestions(modId, protect);
        setModuleQuestions(questionsList || []);
        if (questionsList && questionsList.length > 0) {
          setSelectedPracticeQ(questionsList[0]);
          setChosenOption(null);
          setSubmissionFeedback(null);
        }
      } catch (err) {
        console.error('Error fetching module questions:', err);
      }
    },
    [postgresDb.fetchModuleQuestions]
  );

  useEffect(() => {
    if (isOpen) {
      fetchBackendOverview();
      fetchModuleQuestions(selectedModuleId, protectAnswersMode);
    }
  }, [isOpen, fetchBackendOverview, fetchModuleQuestions, selectedModuleId, protectAnswersMode]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusBanner(null);
    try {
      const result =
        authMode === 'signup'
          ? await authService.signup({
              email: emailInput,
              password: passwordInput || undefined,
              fullName: fullNameInput,
              role: roleInput,
            })
          : await authService.login({
              email: emailInput,
              password: passwordInput || undefined,
              fullName: fullNameInput,
              role: roleInput,
            });

      setBackendUser(result.user);
      setAuthToken(result.token);
      if (result.firebaseUser) {
        setFirebaseUser(result.firebaseUser);
      }
      setStatusBanner({
        type: 'success',
        message: `${
          authMode === 'signup' ? 'Registered' : 'Authenticated'
        } ${result.user.full_name} (${result.user.role}) via Firebase Auth Service Layer.`,
      });
      await fetchBackendOverview();
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err.message || 'Authentication failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setStatusBanner(null);
    try {
      const result = await authService.loginWithGoogle(roleInput);
      setBackendUser(result.user);
      setAuthToken(result.token);
      if (result.firebaseUser) {
        setFirebaseUser(result.firebaseUser);
      }
      setStatusBanner({
        type: 'success',
        message: `Connected Google account (${result.user.email}) via Firebase Auth Service Layer & Cloud Firestore.`,
      });
      await fetchBackendOverview();
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err.message || 'Google Sign-In was cancelled or failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncProgressToCloud = async () => {
    setIsLoading(true);
    setStatusBanner(null);
    try {
      const data = await postgresDb.syncAllModuleProgress(
        stats.moduleMastery,
        stats.totalAnswered > 0
          ? {
              questionsAnswered: stats.totalAnswered,
              correctCount: stats.totalCorrect,
            }
          : undefined
      );
      if (data) {
        setProgressReport(data);
      }

      setStatusBanner({
        type: 'success',
        message:
          'All 12 modules and quiz session telemetry synced to the Postgres Backend & Cloud Firestore!',
      });
      await fetchBackendOverview();
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err.message || 'Failed to sync progress.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitServerAnswer = async (letter: 'A' | 'B' | 'C' | 'D') => {
    if (!selectedPracticeQ) return;
    setChosenOption(letter);
    setIsLoading(true);
    try {
      const data = await postgresDb.submitQuestionAnswer(
        selectedPracticeQ.id,
        letter,
        true
      );
      if (data) {
        setSubmissionFeedback(data);
        await fetchBackendOverview();
      }
    } catch (err) {
      console.error('Error submitting answer to backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const unlockedCount = progressReport?.user?.unlocked_modules?.length || 4;
  const isPremiumUnlocked = Boolean(progressReport?.user?.is_premium || unlockedCount >= 12);

  return (
    <ResponsiveModalContainer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      ariaLabel="Cloud Sync, Protected Curriculum & M-Pesa Unlocks"
    >
        <div className="shrink-0">
          <KitengeRibbon height={4} />
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#003E6B] to-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <MaasaiMedallion size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Cloud Sync, Protected Curriculum & M-Pesa Unlocks
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isPremiumUnlocked
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                      : 'bg-amber-400/20 text-amber-200 border border-amber-400/40'
                  }`}
                >
                  {isPremiumUnlocked
                    ? 'All 12 Modules Unlocked'
                    : `${unlockedCount}/12 Modules Unlocked`}
                </span>
              </div>
              <p className="text-xs text-blue-100/80">
                Cross-device learner authentication, anti-scraping scenario verification, and M-Pesa Daraja & Stripe payments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAdminBackOffice && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminBackOffice();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open Dedicated Single-User Admin Back-Office (vangetich@gmail.com)"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Admin Back-Office</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('auth-progress')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSection === 'auth-progress'
                ? 'bg-white text-[#0078D4] border-[#0078D4] shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>1. Learner Account & Cross-Device Progress</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('curriculum-api')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSection === 'curriculum-api'
                ? 'bg-white text-[#0078D4] border-[#0078D4] shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2. Protected Question Bank & Server Grader</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('mpesa-payments')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSection === 'mpesa-payments'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>3. Premium Unlock (M-Pesa STK Push)</span>
          </button>

          {onOpenAdminBackOffice && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdminBackOffice();
              }}
              className="ml-auto mb-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Admin Question DB, SQL Migrations & API Docs are relocated to the Single-User Admin Back-Office (vangetich@gmail.com)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Relocated to Admin Back-Office (vangetich@gmail.com)</span>
            </button>
          )}
        </div>

        {/* Live Payment Polling Indicator Banner when STK Push is Pending */}
        {pendingTx && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin shrink-0" />
              <span>
                Polling{' '}
                <code className="font-mono font-extrabold bg-amber-100 px-1.5 py-0.5 rounded">
                  GET /api/payments/status/{pendingTx.checkout_request_id || pendingTx.id}
                </code>{' '}
                for STK Push webhook confirmation...
              </span>
            </div>
            <span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-black">
              Status: {pendingTx.status}
            </span>
          </div>
        )}

        {/* Status Banner */}
        {statusBanner && (
          <div
            className={`mx-6 mt-4 px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 ${
              statusBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : statusBanner.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-blue-50 border-blue-300 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : statusBanner.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span>{statusBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-xs underline opacity-75 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* =================================================================
              TAB 1: AUTHENTICATION & CROSS-DEVICE PROGRESS
             ================================================================= */}
          {activeSection === 'auth-progress' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Learner Registration & Auth */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Firebase Auth & Backend Session
                    </h3>
                    <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setAuthMode('signup')}
                        className={`px-2.5 py-1 rounded-md cursor-pointer ${
                          authMode === 'signup'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Sign Up
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className={`px-2.5 py-1 rounded-md cursor-pointer ${
                          authMode === 'login'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Log In
                      </button>
                    </div>
                  </div>

                  {/* Google Cloud Auth Button */}
                  <div className="space-y-2">
                    {firebaseUser ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                        <div className="text-xs">
                          <div className="font-extrabold text-emerald-950">
                            {firebaseUser.displayName || firebaseUser.email}
                          </div>
                          <div className="text-emerald-700">
                            Firebase Auth Linked · {firebaseUser.email}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await authService.logout();
                            setAuthToken('');
                            setStatusBanner({
                              type: 'info',
                              message: 'Signed out of Firebase Auth & Backend session.',
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                      >
                        <Cloud className="w-4 h-4 text-[#0078D4]" />
                        <span>Continue with Google (Firebase Auth)</span>
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                        placeholder="learner@organization.co.ke"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Password (Optional for Firebase Email Auth)
                      </label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                        placeholder="•••••••• (6+ chars for Email/Password Auth)"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                        placeholder="e.g. Amina Wanjiku"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Account Role Tier
                      </label>
                      <select
                        value={roleInput}
                        onChange={(e) =>
                          setRoleInput(
                            e.target.value as 'student' | 'bootcamp_admin' | 'enterprise_user'
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                      >
                        <option value="student">student (Standard Learner)</option>
                        <option value="bootcamp_admin">bootcamp_admin (Cohort Instructor)</option>
                        <option value="enterprise_user">enterprise_user (Enterprise Team)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0078D4] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {authMode === 'signup' ? (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Register Learner Profile</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>Authenticate Learner</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Sync Local Progress Card */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">
                      Cross-Device Cloud Progress Backup
                    </span>
                    <span className="text-[11px] font-bold text-[#0078D4]">
                      {stats.totalAnswered} Local Attempts
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Push your current local 12-module mastery scores and session history to the backend database so you never lose progress when switching devices.
                  </p>
                  <button
                    type="button"
                    onClick={handleSyncProgressToCloud}
                    disabled={isLoading}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Sync My 12-Module Progress Now</span>
                  </button>
                </div>
              </div>

              {/* Right Column: 12-Module Mastery Report from GET /api/user/progress */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="text-[11px] font-bold uppercase text-slate-500">
                      Overall Mastery
                    </div>
                    <div className="text-xl font-black text-[#0078D4] mt-0.5">
                      {progressReport?.summary?.overall_mastery_score ?? 0}%
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                    <div className="text-[11px] font-bold uppercase text-emerald-800">
                      Mastered Modules
                    </div>
                    <div className="text-xl font-black text-emerald-700 mt-0.5">
                      {progressReport?.summary?.mastered_modules_count ?? 0} / 12
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
                    <div className="text-[11px] font-bold uppercase text-amber-900">
                      In Progress
                    </div>
                    <div className="text-xl font-black text-amber-700 mt-0.5">
                      {progressReport?.summary?.in_progress_modules_count ?? 0} Modules
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800">
                      12-Module Relational Mastery Ledger
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Role: <strong className="text-slate-800">{backendUser?.role || 'student'}</strong>
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {(progressReport?.user_progress || []).map((row: any) => (
                      <div
                        key={row.module_id}
                        className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {row.is_unlocked ? (
                            <Unlock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-bold text-slate-900">
                              Module {row.module_id}: {row.module_title}
                            </span>
                            <span className="ml-2 text-[11px] text-slate-500">
                              Path {row.path_id}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-slate-700">
                            {row.score}% ({row.correct_count}/{row.attempts_count})
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              row.status === 'mastered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {row.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: PROTECTED CURRICULUM & SERVER-SIDE QUIZ GRADER
             ================================================================= */}
          {activeSection === 'curriculum-api' && (
            <div className="space-y-5">
              {/* Module Selector & Anti-Scraping Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-extrabold text-slate-700">
                    Select Module (1–12):
                  </label>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900"
                  >
                    {(curriculumData?.modules || []).map((m: any) => (
                      <option key={m.id} value={m.id}>
                        Module {m.module_number}: {m.title} ({m.question_count} Qs)
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={protectAnswersMode}
                    onChange={(e) => setProtectAnswersMode(e.target.checked)}
                    className="rounded text-[#0078D4]"
                  />
                  <span>Anti-Scraping Mode (Hide correct_answer until POST /api/quiz/submit)</span>
                </label>
              </div>

              {/* Interactive Server-Side Question Verification */}
              {selectedPracticeQ ? (
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#0078D4] text-xs font-extrabold">
                        Module {selectedPracticeQ.module_id}: {selectedPracticeQ.module_title}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                        {selectedPracticeQ.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {moduleQuestions.map((q, idx) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            setSelectedPracticeQ(q);
                            setChosenOption(null);
                            setSubmissionFeedback(null);
                          }}
                          className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer ${
                            selectedPracticeQ.id === q.id
                              ? 'bg-[#0078D4] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {selectedPracticeQ.scenario_text}
                  </div>

                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    {selectedPracticeQ.question_text}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(selectedPracticeQ.options || []).map((opt: any) => {
                      const isChosen = chosenOption === opt.letter;
                      const isCorrect =
                        submissionFeedback && submissionFeedback.correct_answer === opt.letter;
                      return (
                        <button
                          key={opt.letter}
                          type="button"
                          onClick={() => handleSubmitServerAnswer(opt.letter)}
                          disabled={isLoading}
                          className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium flex items-start gap-2.5 transition-all cursor-pointer ${
                            submissionFeedback
                              ? isCorrect
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                                : isChosen
                                ? 'bg-rose-50 border-rose-400 text-rose-950'
                                : 'bg-white border-slate-200 opacity-60'
                              : 'bg-white hover:bg-blue-50/40 border-slate-200 hover:border-[#0078D4]'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {opt.letter}
                          </span>
                          <span>{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {submissionFeedback && (
                    <div
                      className={`p-4 rounded-xl border space-y-2 text-xs ${
                        submissionFeedback.is_correct
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                          : 'bg-amber-50/80 border-amber-300 text-amber-950'
                      }`}
                    >
                      <div className="font-extrabold text-sm flex items-center justify-between">
                        <span>
                          {submissionFeedback.is_correct
                            ? 'Correct! Evaluated by POST /api/quiz/submit'
                            : `Incorrect — Correct Option is ${submissionFeedback.correct_answer}`}
                        </span>
                        <span className="font-mono">
                          Module Score: {submissionFeedback.module_progress?.score}% (
                          {submissionFeedback.module_progress?.status})
                        </span>
                      </div>
                      <p className="leading-relaxed">{submissionFeedback.explanation_correct}</p>
                      <div className="pt-1 font-bold text-[#0078D4]">
                        Exam Tip: {submissionFeedback.exam_tip}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Select a module above to load protected scenario questions.
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              TAB 3: PREMIUM UNLOCK (M-PESA DARAJA STK PUSH & WEBHOOK HANDLER)
             ================================================================= */}
          {activeSection === 'mpesa-payments' && (
            <PremiumUnlock
              currentUserId={currentUserId}
              userEmail={emailInput}
              firebaseUser={firebaseUser}
              unlockedModules={progressReport?.user?.unlocked_modules || [1, 2, 3, 4]}
              isPremiumUnlocked={isPremiumUnlocked}
              transactions={progressReport?.payment_transactions || []}
              onRefreshProgress={fetchBackendOverview}
              onStatusBanner={setStatusBanner}
              onPaymentInitiated={(tx) => setPendingTx(tx)}
            />
          )}

          {/* =================================================================
              TAB 4: SUPABASE POSTGRESQL MIGRATIONS & PROJECT STRUCTURE
             ================================================================= */}
          {activeSection === 'supabase-migrations' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs sm:text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span>
                      Supabase Project Initialized ({supabaseBundle?.project_id || 'az900-smart-quiz-builder'})
                    </span>
                  </div>
                  <p className="text-xs text-indigo-800">
                    Complete PostgreSQL 15 DDL migrations for Users (<code className="font-mono font-bold">users</code>), Curriculum (<code className="font-mono font-bold">learning_paths</code>, <code className="font-mono font-bold">modules</code>, <code className="font-mono font-bold">questions</code>), and Progress (<code className="font-mono font-bold">user_progress</code>, <code className="font-mono font-bold">quiz_sessions</code>, <code className="font-mono font-bold">payment_transactions</code>).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(supabaseBundle?.migrations || []).map((mig: any, idx: number) => (
                    <button
                      key={mig.filename}
                      type="button"
                      onClick={() => setActiveMigrationIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeMigrationIndex === idx
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>
                        {idx === 0
                          ? '001: Users'
                          : idx === 1
                          ? '002: Curriculum'
                          : '003: Progress & Payments'}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveMigrationIndex(99)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeMigrationIndex === 99
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>seed.sql & config.toml</span>
                  </button>
                </div>
              </div>

              {activeMigrationIndex === 99 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 text-slate-100">
                    <div className="px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-emerald-300">supabase/seed.sql</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(supabaseBundle?.seed_sql || '');
                          setCopiedFile('seed.sql');
                          setTimeout(() => setCopiedFile(null), 2000);
                        }}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedFile === 'seed.sql' ? 'Copied!' : 'Copy SQL'}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed text-slate-200">
                      {supabaseBundle?.seed_sql || '-- Loading seed.sql...'}
                    </pre>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 text-slate-100">
                    <div className="px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-amber-300">supabase/config.toml</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(supabaseBundle?.config_toml || '');
                          setCopiedFile('config.toml');
                          setTimeout(() => setCopiedFile(null), 2000);
                        }}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedFile === 'config.toml' ? 'Copied!' : 'Copy TOML'}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed text-slate-200">
                      {supabaseBundle?.config_toml || '# Loading config.toml...'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 text-slate-100">
                  {(() => {
                    const activeMig = (supabaseBundle?.migrations || [])[activeMigrationIndex];
                    return (
                      <>
                        <div className="px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-indigo-300">
                            {activeMig?.path || 'supabase/migrations/'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(activeMig?.sql || '');
                              setCopiedFile(activeMig?.filename || 'mig');
                              setTimeout(() => setCopiedFile(null), 2000);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>
                              {copiedFile === activeMig?.filename ? 'Copied!' : 'Copy Migration SQL'}
                            </span>
                          </button>
                        </div>
                        <pre className="p-4 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed text-slate-200">
                          {activeMig?.sql || '-- Loading migration file...'}
                        </pre>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              TAB 5: ADMIN DASHBOARD (SUPABASE MODULE STATS & QUESTION CRUD)
             ================================================================= */}
          {activeSection === 'admin-dashboard' && (
            <AdminDashboard
              onQuestionSaved={async (savedQ) => {
                if (onQuestionSaved) {
                  onQuestionSaved(savedQ);
                }
                await fetchBackendOverview();
                await fetchModuleQuestions(selectedModuleId, protectAnswersMode);
              }}
              onStatusBanner={setStatusBanner}
            />
          )}
        </div>

      <ApiDocumentationModal
        isOpen={showInternalApiDocs}
        onClose={() => setShowInternalApiDocs(false)}
      />
    </ResponsiveModalContainer>
  );
};
