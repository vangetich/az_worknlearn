import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Crown,
  CheckCircle2,
  Layers,
  Eye,
} from 'lucide-react';
import { authService, BackendUserProfile } from '../services/authService';
import { AuthenticatedSupabaseUser } from './ProtectedRoute';
import { isWhitelistedAdminEmail } from '../utils/adminSecurity';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

export interface PaymentGatekeeperProps {
  moduleId: number | 'all';
  user: AuthenticatedSupabaseUser | null;
  onRedirectToPaymentPage: () => void;
  onOpenTierSelectionModal: (lockedModuleId: number) => void;
  onSelectFreeModule?: (moduleId: number) => void;
  children: React.ReactNode;
}

/**
 * PaymentGatekeeper conditionally wraps access to advanced AZ-900 modules (Modules 5–12),
 * checking the `paid_status` / `is_premium` / `unlocked_modules` fields in the user's
 * Supabase profile and redirecting or prompting users to unlock if they attempt to access
 * locked content.
 */
export const PaymentGatekeeper: React.FC<PaymentGatekeeperProps> = ({
  moduleId,
  user,
  onRedirectToPaymentPage,
  onOpenTierSelectionModal,
  onSelectFreeModule,
  children,
}) => {
  const [storedProfile, setStoredProfile] = useState<BackendUserProfile | null>(() =>
    authService.getStoredBackendUser()
  );
  const [forceSimulateLocked, setForceSimulateLocked] = useState<boolean>(false);

  useEffect(() => {
    const handleSessionChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ user: BackendUserProfile | null }>;
      setStoredProfile(customEvent.detail?.user || authService.getStoredBackendUser());
      setForceSimulateLocked(false);
    };
    const handlePaymentSuccess = () => {
      setStoredProfile(authService.getStoredBackendUser());
      setForceSimulateLocked(false);
    };
    window.addEventListener('az900-auth-session-change', handleSessionChange);
    window.addEventListener('az900-payment-success', handlePaymentSuccess);
    return () => {
      window.removeEventListener('az900-auth-session-change', handleSessionChange);
      window.removeEventListener('az900-payment-success', handlePaymentSuccess);
    };
  }, []);

  // Modules 1–4 (and 'all' overview) are foundational tier; Modules 5–12 are advanced premium modules
  const isAdvancedModule = typeof moduleId === 'number' && moduleId >= 5;

  const paidStatus =
    storedProfile?.paid_status ||
    user?.paid_status ||
    (storedProfile?.is_premium || user?.is_premium ? 'active' : 'inactive');

  const unlockedList =
    storedProfile?.unlocked_modules || user?.unlocked_modules || [1, 2, 3, 4];

  const isAdminBypass = isWhitelistedAdminEmail(user?.email || storedProfile?.email);

  const hasUnlockedAccess =
    !isAdvancedModule ||
    (!forceSimulateLocked &&
      (paidStatus === 'active' ||
        Boolean(storedProfile?.is_premium) ||
        Boolean(user?.is_premium) ||
        unlockedList.includes(Number(moduleId)) ||
        isAdminBypass));

  if (hasUnlockedAccess) {
    return (
      <div className="space-y-2">
        {isAdvancedModule && (
          <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-50 via-sky-50 to-white border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <Unlock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                PaymentGatekeeper Verified: Advanced Module {moduleId} Unlocked (
                <code className="font-mono text-[11px]">paid_status: active</code>)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setForceSimulateLocked(true)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
              title="Preview the PaymentGatekeeper paywall for this advanced module"
            >
              <Eye className="w-3 h-3 text-amber-600" />
              <span>Preview Gatekeeper Paywall</span>
            </button>
          </div>
        )}
        {children}
      </div>
    );
  }

  const targetModInfo = LEARNING_PATHS.flatMap((p) =>
    p.modules.map((m) => ({ ...m, pathTitle: p.title, examWeight: p.examWeight }))
  ).find((m) => m.id === moduleId);

  return (
    <div
      role="region"
      aria-label={`PaymentGatekeeper Locked Module ${moduleId}`}
      className="bg-white rounded-2xl border-2 border-amber-300/90 card-elevation overflow-hidden shadow-md animate-in fade-in duration-200"
    >
      <KitengeRibbon height={4} />

      <div className="p-5 sm:p-8 bg-gradient-to-br from-slate-900 via-[#003865] to-slate-900 text-white space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-2xs">
            <Lock className="w-3.5 h-3.5" />
            <span>PaymentGatekeeper • Advanced AZ-900 Module Locked</span>
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-mono text-[11px] text-amber-200 font-bold">
            Supabase Profile: paid_status = &quot;inactive&quot;
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
            <Layers className="w-4 h-4" />
            <span>
              Learning Path {targetModInfo?.pathId || 2} •{' '}
              {targetModInfo?.pathTitle || 'Azure Architecture & Governance'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Module {moduleId}: {targetModInfo?.title || 'Advanced Azure Cloud Architecture'}
          </h3>
          <p className="text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
            This module is part of the Advanced AZ-900 Practice Curriculum (Modules 5–12). To
            unlock scenario questions, exam trap diagnostics, and micro-drills for Module{' '}
            {moduleId}, verify your subscription via Stripe Elements.
          </p>
        </div>

        {/* Highlights of what's inside */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black">
              <Crown className="w-4 h-4" />
              <span>Real Exam Scenarios</span>
            </div>
            <p className="text-[11px] text-sky-100/85">
              Case-study questions modeled on official Microsoft AZ-900 objectives.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-black">
              <ShieldCheck className="w-4 h-4" />
              <span>Instant Supabase Sync</span>
            </div>
            <p className="text-[11px] text-sky-100/85">
              Updates <code className="font-mono">paid_status</code> to{' '}
              <code className="font-mono">active</code> immediately without page reload.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 space-y-1">
            <div className="flex items-center gap-1.5 text-sky-300 text-xs font-black">
              <Sparkles className="w-4 h-4" />
              <span>Pro &amp; Single-Module Plans</span>
            </div>
            <p className="text-[11px] text-sky-100/85">
              Unlock Module {moduleId} for $2 USD or all 12 modules for $15 USD.
            </p>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenTierSelectionModal(Number(moduleId))}
            className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Select Subscription Plan &amp; Unlock Module {moduleId}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onRedirectToPaymentPage}
            className="px-4 py-3 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 border border-sky-400/40 transition-all cursor-pointer"
          >
            <span>Go to Profile Subscription Panel</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onSelectFreeModule && (
            <button
              type="button"
              onClick={() => onSelectFreeModule(1)}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sky-100 font-bold text-xs cursor-pointer transition-colors"
            >
              Return to Free Foundational Modules (1–4)
            </button>
          )}

          {forceSimulateLocked && (
            <button
              type="button"
              onClick={() => setForceSimulateLocked(false)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-bold text-xs cursor-pointer transition-colors"
            >
              Exit Paywall Preview
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-amber-50 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
        <div className="flex items-center gap-2 font-bold">
          <MaasaiMedallion size={16} />
          <span>Foundational Modules 1–4 are always free. Modules 5–12 require an active pass.</span>
        </div>
        <span className="font-mono text-[11px] font-bold text-amber-800">
          Secured by Stripe Elements &amp; Supabase Auth
        </span>
      </div>
    </div>
  );
};
