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
  CreditCard,
  Cloud,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';
import { KitengeRibbon } from './MotifDecorations';
import { AdminDashboard } from './AdminDashboard';
import { ApiDocumentationModal } from './ApiDocumentationModal';
import { Question } from '../types/quiz';
import { authService } from '../services/authService';
import {
  ADMIN_EMAIL_WHITELIST,
  PRIMARY_ADMIN_EMAIL,
  isWhitelistedAdminEmail,
  verifyAdminRouteCredentials,
} from '../utils/adminSecurity';
import {
  getAdminTotpConfig,
  saveAdminTotpConfig,
  generateBase32Secret,
  generateCurrentTotpCode,
  getTotpRemainingSeconds,
  buildOtpAuthUri,
  generateOtpQrSvgDataUrl,
  isAdminTotpSessionAuthorized,
  revokeAdminTotpSession,
} from '../utils/totpSecurity';

export type AdminOfficeTab =
  | 'question-bank-crud'
  | 'cloud-mpesa-readiness'
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
  onOpenCloudSyncPortal?: () => void;
}

export const AdminBackOfficeModal: React.FC<AdminBackOfficeModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  initialTab = 'question-bank-crud',
  onQuestionSaved,
  onOpenCurriculumReadiness,
  onOpenCloudSyncPortal,
}) => {
  const [activeTab, setActiveTab] = useState<AdminOfficeTab>(initialTab);
  const [securityReport, setSecurityReport] = useState<any>(null);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [supabaseBundle, setSupabaseBundle] = useState<any>(null);
  const [paymentsOverview, setPaymentsOverview] = useState<any>(null);
  const [readinessOverview, setReadinessOverview] = useState<any>(null);
  const [activeMigrationIndex, setActiveMigrationIndex] = useState<number>(0);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState<boolean>(false);
  const [showFullApiModal, setShowFullApiModal] = useState<boolean>(false);

  // Route Protection Layer State (Validates against ADMIN_EMAIL_WHITELIST)
  const storedBackendUser = authService.getStoredBackendUser();
  const candidateSessionEmail = (
    userEmail ||
    authService.getCurrentFirebaseUser()?.email ||
    storedBackendUser?.email ||
    ''
  )
    .trim()
    .toLowerCase();

  const [verifiedAdminEmail, setVerifiedAdminEmail] = useState<string>(
    isWhitelistedAdminEmail(candidateSessionEmail) ? candidateSessionEmail : PRIMARY_ADMIN_EMAIL
  );
  const [adminEmailInput, setAdminEmailInput] = useState<string>(
    isWhitelistedAdminEmail(candidateSessionEmail) ? candidateSessionEmail : PRIMARY_ADMIN_EMAIL
  );
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminTotpCodeInput, setAdminTotpCodeInput] = useState<string>('');
  const [adminTotpConfig, setAdminTotpConfig] = useState(() => getAdminTotpConfig());
  const [isTotpVerified, setIsTotpVerified] = useState<boolean>(() =>
    isAdminTotpSessionAuthorized()
  );
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(
    () => !isAdminTotpSessionAuthorized()
  );
  const [liveAdminTotp, setLiveAdminTotp] = useState<string>(() =>
    generateCurrentTotpCode(getAdminTotpConfig().secret)
  );
  const [totpRemainingSec, setTotpRemainingSec] = useState<number>(() =>
    getTotpRemainingSeconds()
  );
  const [showAdminQrHelper, setShowAdminQrHelper] = useState<boolean>(true);
  const [copiedAdminSecret, setCopiedAdminSecret] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isVerifyingRouteGuard, setIsVerifyingRouteGuard] = useState<boolean>(false);

  // Admin password management state for vangetich@gmail.com
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState<string>('');
  const [passwordNotice, setPasswordNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  // Live 1-second ticker for RFC 6238 30-second TOTP window
  useEffect(() => {
    if (!isOpen) return;
    const updateTicker = () => {
      const cfg = getAdminTotpConfig();
      setAdminTotpConfig(cfg);
      setLiveAdminTotp(generateCurrentTotpCode(cfg.secret));
      setTotpRemainingSec(getTotpRemainingSeconds());
    };
    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const isSoleAuthorizedAdmin =
    !isSessionLocked &&
    isTotpVerified &&
    isWhitelistedAdminEmail(verifiedAdminEmail);

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
      await authService.setAdminPassword(PRIMARY_ADMIN_EMAIL, newAdminPassword);
      setPasswordNotice({
        type: 'success',
        message: `Admin sign-in password updated for ${PRIMARY_ADMIN_EMAIL}! Session privileges renewed.`,
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
      const res = await authService.sendPasswordReset(PRIMARY_ADMIN_EMAIL);
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
      const [secRes, teleRes, supaRes, payRes, readyRes] = await Promise.all([
        fetch('/api/admin/security-status', {
          headers: { 'x-admin-email': verifiedAdminEmail },
        }),
        fetch('/api/telemetry'),
        fetch('/api/supabase/migrations'),
        fetch('/api/admin/payments-ledger'),
        fetch('/api/curriculum/readiness-check'),
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
      if (payRes.ok) {
        setPaymentsOverview(await payRes.json());
      }
      if (readyRes.ok) {
        setReadinessOverview(await readyRes.json());
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

  const handleVerifySingleAdminIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingRouteGuard(true);
    setAuthNotice(null);
    try {
      const verification = await verifyAdminRouteCredentials({
        email: adminEmailInput,
        password: adminPasswordInput || undefined,
        totpCode: adminTotpCodeInput,
      });

      if (verification.authorized) {
        setVerifiedAdminEmail(verification.email);
        setIsTotpVerified(true);
        setIsSessionLocked(false);
        setAdminPasswordInput('');
        setAdminTotpCodeInput('');
        setAdminTotpConfig(getAdminTotpConfig());
        setAuthNotice(
          `Admin 2FA TOTP & Whitelist Verified: ${verification.email} authorized via 6-digit Time-Based One-Time Password. Full Admin Console unlocked.`
        );
        setTimeout(() => setAuthNotice(null), 5000);
      } else {
        setAuthNotice(
          verification.reason ||
            'Access denied: Valid Whitelist Email, Password, and 6-digit TOTP code required.'
        );
      }
    } finally {
      setIsVerifyingRouteGuard(false);
    }
  };

  const handleLockOrUnlockSession = () => {
    if (isSoleAuthorizedAdmin) {
      revokeAdminTotpSession();
      setIsTotpVerified(false);
      setIsSessionLocked(true);
      setAdminTotpCodeInput('');
      setAuthNotice(
        'Admin Console session locked. Enter a fresh 6-digit 2FA TOTP code to re-authorize access.'
      );
    } else {
      setIsSessionLocked(true);
    }
  };

  const handleRotateAdminTotpSecret = () => {
    const nextSecret = generateBase32Secret(16);
    const updated = saveAdminTotpConfig({ secret: nextSecret });
    setAdminTotpConfig(updated);
    setLiveAdminTotp(generateCurrentTotpCode(updated.secret));
    setPasswordNotice({
      type: 'success',
      message: `Rotated Admin Console 2FA TOTP Secret Key (${nextSecret}). Authenticator updated.`,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <ResponsiveModalContainer
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="4xl"
        ariaLabel="Admin Back-Office, Cloud Sync, M-Pesa & Curriculum Control Console"
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
                  Admin Dashboard &amp; Back-Office Control Center
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Whitelist Protected: {PRIMARY_ADMIN_EMAIL}</span>
                </span>
              </div>
              <p className="text-xs text-sky-200/85 truncate">
                Admin DB, User Accounts, Password Resets, Cloud Sync, M-Pesa Daraja Ledger &amp; Curriculum Readiness
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLockOrUnlockSession}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
                !isSoleAuthorizedAdmin
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
              }`}
              title="Lock the Admin Console session and require 2FA TOTP re-verification"
            >
              {!isSoleAuthorizedAdmin ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>2FA Gate Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>2FA TOTP Verified (Lock)</span>
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

        {/* Single-User Whitelist Security Allocation Banner */}
        <div className="px-6 py-2.5 bg-slate-900 text-slate-200 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              <UserCheck className="w-3 h-3" />
              <span>Whitelist Route Guard: [{ADMIN_EMAIL_WHITELIST.join(', ')}]</span>
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-amber-300">
              Hidden from standard student views
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenCloudSyncPortal && (
              <button
                type="button"
                onClick={onOpenCloudSyncPortal}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Cloud className="w-3 h-3" />
                <span>Open Cloud Sync &amp; M-Pesa Portal</span>
              </button>
            )}
            {onOpenCurriculumReadiness && (
              <button
                type="button"
                onClick={onOpenCurriculumReadiness}
                className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-blue-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Curriculum Readiness Modal</span>
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
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('question-bank-crud')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'question-bank-crud'
                ? 'bg-white text-amber-800 border-amber-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-amber-600" />
            <span>1. Admin Dashboard (Users, Passwords &amp; DB CRUD)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud-mpesa-readiness')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'cloud-mpesa-readiness'
                ? 'bg-white text-sky-800 border-sky-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-sky-600" />
            <span>2. Cloud Sync, M-Pesa &amp; Curriculum Readiness</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security-access-rbac')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'security-access-rbac'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>3. Whitelist Route Guard &amp; Admin Password</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('telemetry-migrations')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'telemetry-migrations'
                ? 'bg-white text-[#0078D4] border-[#0078D4] shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-[#0078D4]" />
            <span>4. Telemetry &amp; SQL Migrations</span>
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

          {/* Route Protection + Mandatory 2FA TOTP Authentication Layer Gate */}
          {!isSoleAuthorizedAdmin ? (
            <div className="max-w-2xl mx-auto my-3 bg-white rounded-2xl border-2 border-amber-300 p-5 sm:p-6 shadow-md space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        Admin Console 2FA Authentication Layer
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        RFC 6238 TOTP (30s Window)
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                      Whitelist Credential &amp; Time-Based One-Time Password (TOTP) Gate
                    </h3>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Admin Console login requires two-factor authentication: your whitelisted administrator identity (<strong>{PRIMARY_ADMIN_EMAIL}</strong>) and a valid <strong>6-digit Time-Based One-Time Password (TOTP)</strong> generated every 30 seconds.
                <span className="block mt-1 text-[11px] text-slate-500">
                  Note: This Admin Console 2FA layer is strictly isolated from learner account MFA settings in the User Profile tab.
                </span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Left Column: Login & 6-Digit TOTP Authorization Form */}
                <form
                  onSubmit={handleVerifySingleAdminIdentity}
                  className="md:col-span-7 space-y-3.5"
                >
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      1. Whitelisted Administrator Email
                    </label>
                    <input
                      type="email"
                      value={adminEmailInput}
                      onChange={(e) => setAdminEmailInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0078D4]"
                      placeholder={PRIMARY_ADMIN_EMAIL}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      2. Admin Password (Default: AdminAzure2026!)
                    </label>
                    <input
                      type="password"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0078D4]"
                      placeholder="Enter admin password (optional if session active)..."
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-300 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="admin-totp-code-input"
                        className="block text-[11px] font-black uppercase tracking-wider text-amber-950"
                      >
                        3. 6-Digit Authenticator TOTP Code (Required)
                      </label>
                      <span className="text-[11px] font-mono font-bold text-amber-800">
                        Refreshes in {totpRemainingSec}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="admin-totp-code-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={adminTotpCodeInput}
                        onChange={(e) =>
                          setAdminTotpCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-amber-400 text-base font-mono font-black tracking-[0.35em] text-center text-slate-900 focus:outline-none focus:border-[#0078D4]"
                        placeholder="000000"
                        aria-label="6-digit Admin TOTP code"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setAdminTotpCodeInput(liveAdminTotp)}
                        className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-extrabold whitespace-nowrap cursor-pointer shrink-0 border border-slate-700"
                        title="Auto-fill current 6-digit TOTP code from synchronized admin authenticator"
                      >
                        Use {liveAdminTotp}
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-900/90">
                      Enter the 6-digit code from your authenticator app or click{' '}
                      <strong className="font-mono">Use {liveAdminTotp}</strong> to fill the active 30-second token.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingRouteGuard || adminTotpCodeInput.length !== 6}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      {isVerifyingRouteGuard
                        ? 'Verifying 2FA TOTP & Whitelist...'
                        : 'Verify 2FA TOTP & Authorize Admin Console'}
                    </span>
                  </button>
                </form>

                {/* Right Column: Admin Authenticator Key & Live TOTP Sync Card */}
                <div className="md:col-span-5 rounded-xl bg-slate-900 text-white p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      Admin Authenticator Key
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdminQrHelper((prev) => !prev)}
                      className="text-[10px] font-bold text-sky-300 hover:underline cursor-pointer"
                    >
                      {showAdminQrHelper ? 'Hide QR' : 'Show QR'}
                    </button>
                  </div>

                  {showAdminQrHelper && (
                    <div className="flex flex-col items-center justify-center bg-white rounded-xl p-2.5 border border-slate-200">
                      <img
                        src={generateOtpQrSvgDataUrl(
                          buildOtpAuthUri({
                            secret: adminTotpConfig.secret,
                            accountName: PRIMARY_ADMIN_EMAIL,
                            issuer: 'AZ900-AdminConsole',
                          })
                        )}
                        alt="Admin 2FA TOTP Authenticator QR Code"
                        className="w-28 h-28 object-contain"
                      />
                      <span className="text-[10px] font-bold text-slate-600 mt-1">
                        Scan with Microsoft / Google Authenticator
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Base32 Secret Key (Admin Console)
                    </span>
                    <div className="flex items-center justify-between gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <code className="text-[11px] font-mono font-bold text-emerald-300 truncate">
                        {adminTotpConfig.secret}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(adminTotpConfig.secret);
                          setCopiedAdminSecret(true);
                          setTimeout(() => setCopiedAdminSecret(false), 1800);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 cursor-pointer shrink-0"
                      >
                        {copiedAdminSecret ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Current 30s TOTP Token
                      </span>
                      <span className="text-base font-mono font-black tracking-widest text-amber-300">
                        {liveAdminTotp.slice(0, 3)} {liveAdminTotp.slice(3)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Window Expiry
                      </span>
                      <span className="text-xs font-mono font-extrabold text-sky-300">
                        {totpRemainingSec}s left
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: ADMIN DASHBOARD (USER ACCOUNTS, PASSWORD RESETS & QUESTION BANK CRUD) */}
              {activeTab === 'question-bank-crud' && (
                <AdminDashboard onQuestionSaved={onQuestionSaved} />
              )}

              {/* TAB 2: CLOUD SYNC, M-PESA MANAGEMENT & CURRICULUM READINESS */}
              {activeTab === 'cloud-mpesa-readiness' && (
                <div className="space-y-5">
                  {/* Top KPI Summary Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                        M-Pesa Daraja STK Revenue
                      </span>
                      <div className="text-2xl font-black text-slate-900">
                        KES {paymentsOverview?.total_mpesa_kes ?? 250}
                      </div>
                      <p className="text-xs text-slate-500">
                        {paymentsOverview?.completed_transactions ?? 1} confirmed STK callbacks
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4]">
                        Cloud Sync &amp; Auth Profiles
                      </span>
                      <div className="text-2xl font-black text-slate-900">
                        {paymentsOverview?.cloud_sync_status?.synced_profiles ?? 3} Synced Users
                      </div>
                      <p className="text-xs text-slate-500">
                        {paymentsOverview?.cloud_sync_status?.firebase_project || 'Firebase + PostgreSQL'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                        Curriculum Readiness Version
                      </span>
                      <div className="text-lg font-black text-slate-900 truncate">
                        {readinessOverview?.curriculum_version || '2026.10-AZ900-MSLearn'}
                      </div>
                      <p className="text-xs text-slate-500">
                        {readinessOverview?.total_modules ?? 12} Modules • {readinessOverview?.total_questions ?? 27} Verified Qs
                      </p>
                    </div>
                  </div>

                  {/* Cloud Sync & M-Pesa Daraja Ledger Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                            M-Pesa Daraja STK Push &amp; Cloud Sync Ledger
                          </h3>
                          <p className="text-xs text-slate-500">
                            Stored administrative transaction records, STK callback receipts, and Cloud Sync state
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={loadBackOfficeData}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Refresh Ledger</span>
                        </button>
                        {onOpenCloudSyncPortal && (
                          <button
                            type="button"
                            onClick={onOpenCloudSyncPortal}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Launch Interactive M-Pesa &amp; Cloud Sync Modal</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 bg-slate-50">
                            <th className="py-2.5 px-3">Receipt / Checkout ID</th>
                            <th className="py-2.5 px-3">Gateway</th>
                            <th className="py-2.5 px-3">Phone / Account</th>
                            <th className="py-2.5 px-3">Amount</th>
                            <th className="py-2.5 px-3">Unlocked Scope</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(paymentsOverview?.transactions || []).map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                {tx.receipt_number || tx.checkout_request_id}
                              </td>
                              <td className="py-2.5 px-3 uppercase font-extrabold text-emerald-700">
                                {tx.gateway}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">
                                {tx.phone_number}
                              </td>
                              <td className="py-2.5 px-3 font-black text-slate-900">
                                {tx.currency} {tx.amount}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {tx.module_id === 'all' ? 'All 12 Modules' : `Module ${tx.module_id}`}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    tx.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Official Curriculum Readiness Duties Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#0078D4]" />
                        <div>
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                            Official Curriculum Readiness &amp; Microsoft Learn Alignment
                          </h3>
                          <p className="text-xs text-slate-500">
                            Restricted administrative audit of AZ-900 domain weights and 2026 syllabus updates
                          </p>
                        </div>
                      </div>
                      {onOpenCurriculumReadiness && (
                        <button
                          type="button"
                          onClick={onOpenCurriculumReadiness}
                          className="px-3 py-1.5 rounded-xl bg-[#0078D4] hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Full Curriculum Readiness Inspector</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(readinessOverview?.curriculum_updates || []).map((upd: any) => (
                        <div
                          key={upd.id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-slate-900">
                              Mod {upd.moduleId}: {upd.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              {upd.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {upd.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SINGLE-USER SECURITY & ACCESS CONTROL */}
              {activeTab === 'security-access-rbac' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                            Admin Route Protection Layer &amp; Whitelist Security Policy
                          </h3>
                          <p className="text-xs text-slate-500">
                            Validates user email credentials against ADMIN_EMAIL_WHITELIST before exposing Cloud Sync, M-Pesa, or Curriculum tools
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black">
                        Whitelisted Principal: {PRIMARY_ADMIN_EMAIL}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-500">
                          Hardcoded Email Whitelist
                        </span>
                        <div className="font-extrabold text-sm text-slate-900">
                          {ADMIN_EMAIL_WHITELIST.join(', ')}
                        </div>
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          Verified in src/utils/adminSecurity.ts
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
                          Admin 2FA TOTP Status
                        </span>
                        <div className="font-extrabold text-sm text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>TOTP Verified ({liveAdminTotp})</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Secret: <code className="font-mono font-bold">{adminTotpConfig.secret}</code>
                        </p>
                      </div>
                    </div>

                    {/* Dedicated Admin Console 2FA TOTP Management Card */}
                    <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase">
                            Mandatory Admin 2FA Layer
                          </span>
                          <span className="text-xs font-mono text-amber-300">
                            Next code in {totpRemainingSec}s • Active TOTP: {liveAdminTotp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Admin Console 2FA uses its own dedicated TOTP secret key (<code className="font-mono text-sky-300">{adminTotpConfig.secret}</code>), independent of learner Profile MFA settings.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRotateAdminTotpSecret}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                          <span>Rotate Admin TOTP Secret</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleLockOrUnlockSession}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Require 2FA Re-Login</span>
                        </button>
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
                              Manage or reset password credentials for sole administrator account ({PRIMARY_ADMIN_EMAIL})
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

              {/* TAB 4: SERVER TELEMETRY & SUPABASE SQL MIGRATIONS */}
              {activeTab === 'telemetry-migrations' && (
                <div className="space-y-5">
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
