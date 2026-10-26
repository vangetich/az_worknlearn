import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  KeyRound,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
  RefreshCw,
} from 'lucide-react';
import { authService } from '../services/authService';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail,
}) => {
  const storedUser = authService.getStoredBackendUser();
  const initialEmail =
    defaultEmail ||
    storedUser?.email ||
    authService.getCurrentFirebaseUser()?.email ||
    'student@az900.ke';

  const [email, setEmail] = useState<string>(initialEmail);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || typeof document === 'undefined') return null;

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    if (!currentPassword.trim()) {
      setErrorMsg('Please enter your current password for verification.');
      return;
    }
    if (newPassword.trim().length < 6) {
      setErrorMsg('Your new password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMsg('Your new password must be different from your current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.changePasswordWithVerification({
        email: email.trim(),
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      setSuccessMsg(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Could not verify current password. Check your current credentials and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[165] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-modal-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-slate-900 border border-sky-500/35 text-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-[#0078D4]/25 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0078D4]/20 border border-[#0078D4]/40 flex items-center justify-center text-sky-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3
                  id="reset-password-modal-title"
                  className="text-sm font-black text-white tracking-tight"
                >
                  Reset Account Password
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Email Auth
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Verify your current password to set a new secure credential
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label="Close Reset Password modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {/* Quick Demo Hint Banner */}
          <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 text-[11px] text-slate-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-white">Email Credential Verification:</span>{' '}
              Standard student default password is{' '}
              <code className="px-1 py-0.5 rounded bg-slate-950 text-sky-300 font-mono">
                StudentAzure2026!
              </code>{' '}
              and Admin (<code className="text-amber-300 font-mono">vangetich@gmail.com</code>) is{' '}
              <code className="px-1 py-0.5 rounded bg-slate-950 text-amber-300 font-mono">
                AdminAzure2026!
              </code>
              .
            </div>
          </div>

          {/* Account Email */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
              Email-Authenticated Account
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-400 focus:outline-none text-xs text-white font-medium"
              />
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
              Current Password (Required for Verification)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-400 focus:outline-none text-xs text-white font-medium"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label="Toggle current password visibility"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* New Secure Password */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
              New Secure Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters recommended"
                required
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-400 focus:outline-none text-xs text-white font-medium"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label="Toggle new password visibility"
              >
                {showNewPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-400 focus:outline-none text-xs text-white font-medium"
              />
            </div>
          </div>

          {/* Password Security Checklist */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px]">
            <div
              className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 ${
                hasMinLength
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>8+ Characters</span>
            </div>
            <div
              className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 ${
                hasUppercase
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Uppercase Letter</span>
            </div>
            <div
              className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 ${
                hasNumberOrSymbol
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Number / Symbol</span>
            </div>
            <div
              className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 ${
                passwordsMatch
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Passwords Match</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#0078D4]/25 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying &amp; Updating...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Verify &amp; Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
