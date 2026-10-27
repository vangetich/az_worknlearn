import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Download,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { ResponsiveModalContainer } from './ResponsiveModalContainer';
import { KitengeRibbon } from './MotifDecorations';
import {
  UserMfaSettings,
  getUserMfaSettings,
  saveUserMfaSettings,
  generateBase32Secret,
  generateBackupRecoveryCodes,
  generateCurrentTotpCode,
  getTotpRemainingSeconds,
  verifyTotpCode,
  buildOtpAuthUri,
  generateOtpQrSvgDataUrl,
} from '../utils/totpSecurity';
import { authService } from '../services/authService';

export interface MfaSecuritySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userIdentifier?: string | null;
  candidateName?: string;
  candidateUsername?: string;
  onMfaStateChanged?: (settings: UserMfaSettings) => void;
}

export const MfaSecuritySetupModal: React.FC<MfaSecuritySetupModalProps> = ({
  isOpen,
  onClose,
  userIdentifier,
  candidateName = 'Amina Wanjiku',
  candidateUsername = 'harambee_cloud_ke',
  onMfaStateChanged,
}) => {
  const storedBackendUser = authService.getStoredBackendUser();
  const effectiveUserId =
    userIdentifier ||
    storedBackendUser?.email ||
    storedBackendUser?.id ||
    candidateUsername ||
    'default-learner';

  const accountDisplayLabel =
    storedBackendUser?.email || `${candidateUsername}@az900.cloud`;

  const [mfaSettings, setMfaSettings] = useState<UserMfaSettings>(() =>
    getUserMfaSettings(effectiveUserId, accountDisplayLabel)
  );
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [liveUserTotp, setLiveUserTotp] = useState<string>(() =>
    generateCurrentTotpCode(
      getUserMfaSettings(effectiveUserId, accountDisplayLabel).secret
    )
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    getTotpRemainingSeconds()
  );
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedUri, setCopiedUri] = useState<boolean>(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Sync user MFA state when modal opens or user changes
  useEffect(() => {
    if (!isOpen) return;
    const loaded = getUserMfaSettings(effectiveUserId, accountDisplayLabel);
    setMfaSettings(loaded);
    setLiveUserTotp(generateCurrentTotpCode(loaded.secret));
    setRemainingSeconds(getTotpRemainingSeconds());
    setFeedbackBanner(null);
    setVerificationCode('');
  }, [isOpen, effectiveUserId, accountDisplayLabel]);

  // 1-second RFC 6238 TOTP ticker
  useEffect(() => {
    if (!isOpen) return;
    const tick = () => {
      setLiveUserTotp(generateCurrentTotpCode(mfaSettings.secret));
      setRemainingSeconds(getTotpRemainingSeconds());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isOpen, mfaSettings.secret]);

  if (!isOpen) return null;

  const otpAuthUri = buildOtpAuthUri({
    secret: mfaSettings.secret,
    accountName: accountDisplayLabel,
    issuer: 'AZ900-LearnerProfile',
  });
  const qrDataUrl = generateOtpQrSvgDataUrl(otpAuthUri);

  const persistAndNotify = (updates: Partial<UserMfaSettings>) => {
    const updated = saveUserMfaSettings(effectiveUserId, {
      ...updates,
      accountLabel: accountDisplayLabel,
    });
    setMfaSettings(updated);
    if (onMfaStateChanged) {
      onMfaStateChanged(updated);
    }
    return updated;
  };

  const handleToggleMfaSwitch = () => {
    if (mfaSettings.enabled) {
      // Disable user account MFA immediately when toggled off
      persistAndNotify({
        enabled: false,
      });
      setFeedbackBanner({
        type: 'info',
        message:
          'Personal account TOTP Multi-Factor Authentication has been disabled. You can re-enable it anytime by verifying a 6-digit TOTP code.',
      });
    } else {
      // If user already entered a valid 6-digit code, enable immediately; otherwise auto-fill or prompt verification
      if (verifyTotpCode(mfaSettings.secret, verificationCode)) {
        const nowIso = new Date().toISOString();
        persistAndNotify({
          enabled: true,
          configuredAt: mfaSettings.configuredAt || nowIso,
          lastVerifiedAt: nowIso,
        });
        setVerificationCode('');
        setFeedbackBanner({
          type: 'success',
          message:
            'TOTP Multi-Factor Authentication enabled and verified for your personal learner profile!',
        });
      } else {
        setVerificationCode(liveUserTotp);
        setFeedbackBanner({
          type: 'info',
          message: `We pre-filled your active 6-digit TOTP code (${liveUserTotp}). Click "Verify & Enable Account MFA" below to confirm activation.`,
        });
      }
    }
  };

  const handleVerifyAndSaveTotp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCode.replace(/\s+/g, '').trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setFeedbackBanner({
        type: 'error',
        message: 'Please enter a valid 6-digit numeric TOTP code from your authenticator.',
      });
      return;
    }

    const isValid = verifyTotpCode(mfaSettings.secret, cleanCode);
    if (!isValid) {
      setFeedbackBanner({
        type: 'error',
        message:
          'Invalid or expired 6-digit TOTP code. Check the 30-second window timer or click "Auto-Fill Active Code" to synchronize.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    persistAndNotify({
      enabled: true,
      configuredAt: mfaSettings.configuredAt || nowIso,
      lastVerifiedAt: nowIso,
    });
    setVerificationCode('');
    setFeedbackBanner({
      type: 'success',
      message: `TOTP code ${cleanCode} verified! Multi-Factor Authentication is now active for ${candidateName} (@${candidateUsername}).`,
    });
  };

  const handleRotateSecretKey = () => {
    const newSecret = generateBase32Secret(16);
    const updated = persistAndNotify({
      secret: newSecret,
      lastVerifiedAt: null,
    });
    setLiveUserTotp(generateCurrentTotpCode(updated.secret));
    setVerificationCode('');
    setFeedbackBanner({
      type: 'info',
      message: `Generated a new Base32 TOTP secret key (${newSecret}). Scan the updated QR code and verify a 6-digit code to confirm.`,
    });
  };

  const handleRegenerateBackupCodes = () => {
    const freshCodes = generateBackupRecoveryCodes(6);
    persistAndNotify({ backupCodes: freshCodes });
    setFeedbackBanner({
      type: 'success',
      message: 'Generated 6 new emergency backup recovery codes for your learner profile.',
    });
  };

  const handleDownloadBackupCodes = () => {
    const content = [
      'AZ-900 CLOUD ARCHITECT STUDIO — PERSONAL ACCOUNT MFA BACKUP CODES',
      `Candidate: ${candidateName} (@${candidateUsername})`,
      `Account: ${accountDisplayLabel}`,
      `Generated At: ${new Date().toISOString()}`,
      '-----------------------------------------------------------------',
      ...mfaSettings.backupCodes.map((c, idx) => `${idx + 1}. ${c}`),
      '-----------------------------------------------------------------',
      'Keep these single-use recovery codes in a safe place.',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `az900-mfa-recovery-codes-${candidateUsername}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ResponsiveModalContainer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      ariaLabel="MFA Security Setup — Personal Learner Account TOTP Multi-Factor Authentication"
    >
      <div className="shrink-0">
        <KitengeRibbon height={4} />
      </div>

      {/* Modal Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-[#003865] to-[#005A9E] text-white flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                MFA Security Setup
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                  mfaSettings.enabled
                    ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                    : 'bg-slate-800 text-amber-300 border-amber-400/40'
                }`}
              >
                {mfaSettings.enabled ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>TOTP MFA Enabled</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>TOTP MFA Disabled</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-sky-100/90 truncate">
              Configure RFC 6238 TOTP Multi-Factor Authentication for {candidateName} (@{candidateUsername})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
          aria-label="Close MFA Security Setup modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Isolation Banner: Explicitly independent of Admin Console 2FA */}
      <div className="px-5 py-2.5 bg-slate-900 text-slate-200 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 font-extrabold">
            Personal Account Scope: @{candidateUsername}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-300">
            Independent of the Admin Console 2FA layer (manages your personal learner profile security)
          </span>
        </div>
        <span className="font-mono text-emerald-300 font-bold">
          Microsoft Entra ID / AZ-900 Zero Trust Aligned
        </span>
      </div>

      {/* Modal Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/80 space-y-5">
        {feedbackBanner && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-bold flex items-start justify-between gap-3 ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : feedbackBanner.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-sky-50 border-sky-300 text-sky-950'
            }`}
          >
            <div className="flex items-start gap-2">
              {feedbackBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : feedbackBanner.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#0078D4] shrink-0 mt-0.5" />
              )}
              <span>{feedbackBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-[11px] underline opacity-75 hover:opacity-100 cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Primary Toggle Bar Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Time-Based One-Time Password (TOTP) Protection
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  mfaSettings.enabled
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {mfaSettings.enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Protect your personal study progress, unlocked modules, and cloud sync sessions with a 6-digit code that rotates every 30 seconds.
            </p>
            {mfaSettings.lastVerifiedAt && (
              <p className="text-[11px] font-mono text-emerald-700 font-semibold">
                Last TOTP verification:{' '}
                {new Date(mfaSettings.lastVerifiedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={mfaSettings.enabled}
              aria-label="Toggle personal account TOTP Multi-Factor Authentication"
              onClick={handleToggleMfaSwitch}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                mfaSettings.enabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  mfaSettings.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={handleToggleMfaSwitch}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
                mfaSettings.enabled
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-[#0078D4] hover:bg-[#005A9E] text-white border-[#0078D4]'
              }`}
            >
              {mfaSettings.enabled ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Disable MFA</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Enable MFA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Authenticator App Selector Strip */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#0078D4]" />
              <span>Step 1: Select Preferred TOTP Authenticator App</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Standard RFC 6238 • SHA-1 • 6 Digits • 30s Period
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(
              [
                {
                  id: 'microsoft',
                  name: 'Microsoft Authenticator',
                  badge: 'Entra ID Recommended',
                },
                {
                  id: 'google',
                  name: 'Google Authenticator',
                  badge: 'iOS & Android',
                },
                {
                  id: 'authy',
                  name: 'Twilio Authy / 1Password',
                  badge: 'Multi-Device TOTP',
                },
              ] as const
            ).map((app) => {
              const isSelected = mfaSettings.preferredAuthenticator === app.id;
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => persistAndNotify({ preferredAuthenticator: app.id })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/90 border-[#0078D4] ring-2 ring-[#0078D4]/20'
                      : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold text-slate-900">
                      {app.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#0078D4] shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                    {app.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main 2-Column Setup & Verification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Left Column: QR Code + Base32 Secret Key */}
          <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#0078D4]" />
                <span>Step 2: Scan QR or Copy Key</span>
              </span>
              <button
                type="button"
                onClick={handleRotateSecretKey}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title="Generate a new Base32 secret key"
              >
                <RefreshCw className="w-3 h-3 text-[#0078D4]" />
                <span>New Key</span>
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={qrDataUrl}
                alt={`TOTP QR Code for ${accountDisplayLabel}`}
                className="w-36 h-36 object-contain rounded-lg border border-slate-200 bg-white p-1.5 shadow-2xs"
              />
              <span className="text-[11px] font-bold text-slate-600 mt-2 text-center">
                Scan with{' '}
                {mfaSettings.preferredAuthenticator === 'microsoft'
                  ? 'Microsoft Authenticator'
                  : mfaSettings.preferredAuthenticator === 'google'
                  ? 'Google Authenticator'
                  : 'Authy'}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Personal Base32 Secret Key
              </label>
              <div className="flex items-center justify-between gap-2 bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-800">
                <code className="text-xs font-mono font-bold text-amber-300 tracking-wider truncate">
                  {mfaSettings.secret}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(mfaSettings.secret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 1800);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedSecret ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 font-medium">
                Need the <code className="font-mono">otpauth://</code> URI?
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(otpAuthUri);
                  setCopiedUri(true);
                  setTimeout(() => setCopiedUri(false), 1800);
                }}
                className="text-[11px] font-bold text-[#0078D4] hover:underline cursor-pointer"
              >
                {copiedUri ? 'Copied URI!' : 'Copy otpauth:// URI'}
              </button>
            </div>
          </div>

          {/* Right Column: Step 3 Verify 6-Digit TOTP Code & Emergency Backup Codes */}
          <div className="md:col-span-7 space-y-4">
            <form
              onSubmit={handleVerifyAndSaveTotp}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Step 3: Verify 6-Digit Authenticator Code</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0078D4] border border-sky-200 font-mono text-[11px] font-bold">
                  Window: {remainingSeconds}s remaining
                </span>
              </div>

              {/* Synchronized Authenticator Token Preview Helper */}
              <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Live Synchronized Authenticator Token
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-mono font-black tracking-[0.25em] text-emerald-300">
                      {liveUserTotp.slice(0, 3)} {liveUserTotp.slice(3)}
                    </span>
                    <span className="text-[11px] font-mono text-amber-300">
                      ({remainingSeconds}s)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setVerificationCode(liveUserTotp)}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer transition-colors"
                >
                  Auto-Fill {liveUserTotp}
                </button>
              </div>

              <div>
                <label
                  htmlFor="user-mfa-totp-input"
                  className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1"
                >
                  Enter 6-Digit TOTP Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="user-mfa-totp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="000000"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#0078D4] focus:outline-none font-mono font-black text-base tracking-[0.35em] text-center text-slate-900"
                    required
                  />
                  <button
                    type="submit"
                    disabled={verificationCode.length !== 6}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs whitespace-nowrap flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {mfaSettings.enabled
                        ? 'Verify TOTP Code'
                        : 'Verify & Enable Account MFA'}
                    </span>
                  </button>
                </div>
              </div>
            </form>

            {/* Emergency Backup Recovery Codes Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Emergency Backup Recovery Codes
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Single-use recovery codes if you lose access to your mobile authenticator
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(mfaSettings.backupCodes.join('\n'));
                      setCopiedBackupCodes(true);
                      setTimeout(() => setCopiedBackupCodes(false), 1800);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBackupCodes ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadBackupCodes}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download .txt</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateBackupCodes}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Regenerate backup recovery codes"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mfaSettings.backupCodes.map((code) => (
                  <div
                    key={code}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] font-bold text-slate-800 text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Status:{' '}
            <strong className="text-slate-900">
              {mfaSettings.enabled
                ? 'TOTP MFA Enabled for Personal Account'
                : 'TOTP MFA Currently Disabled'}
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
        >
          Done
        </button>
      </div>
    </ResponsiveModalContainer>
  );
};
