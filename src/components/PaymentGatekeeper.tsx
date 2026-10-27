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
  Smartphone,
  KeyRound,
  Check,
} from 'lucide-react';
import { authService, BackendUserProfile } from '../services/authService';
import { AuthenticatedSupabaseUser } from './ProtectedRoute';
import { isWhitelistedAdminEmail } from '../utils/adminSecurity';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';
import { MpesaPaymentGateway } from './MpesaPaymentGateway';

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
 * Supabase profile and displaying an explicit 'Authorize Payment Method' helper UI
 * when a user attempts to access a locked premium module.
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
  const [helperMethod, setHelperMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [helperPlan, setHelperPlan] = useState<'pro_all_access' | 'single_module'>(
    'pro_all_access'
  );
  const [showInlineMpesa, setShowInlineMpesa] = useState<boolean>(false);

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

  const numericModuleId = typeof moduleId === 'number' ? moduleId : 5;
  const targetModInfo = LEARNING_PATHS.flatMap((p) =>
    p.modules.map((m) => ({ ...m, pathTitle: p.title, examWeight: p.examWeight }))
  ).find((m) => m.id === numericModuleId);

  const handleNavigateToProfileWithIntent = (
    method: 'mpesa' | 'card',
    plan: 'pro_all_access' | 'single_module'
  ) => {
    try {
      sessionStorage.setItem(
        'az900_preferred_payment_intent',
        JSON.stringify({
          paymentMethod: method,
          plan,
          moduleId: numericModuleId,
        })
      );
    } catch {
      // Ignore storage errors
    }

    window.dispatchEvent(
      new CustomEvent('az900-configure-subscription-panel', {
        detail: {
          paymentMethod: method,
          plan,
          moduleId: numericModuleId,
        },
      })
    );

    onRedirectToPaymentPage();
  };

  return (
    <div
      role="region"
      aria-label={`PaymentGatekeeper Locked Module ${numericModuleId}`}
      className="bg-white rounded-2xl border-2 border-amber-300/90 card-elevation overflow-hidden shadow-md animate-in fade-in duration-200"
    >
      <KitengeRibbon height={4} />

      <div className="p-5 sm:p-8 bg-gradient-to-br from-slate-900 via-[#003865] to-slate-900 text-white space-y-6">
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
            Module {numericModuleId}: {targetModInfo?.title || 'Advanced Azure Cloud Architecture'}
          </h3>
          <p className="text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
            This module is part of the Advanced AZ-900 Practice Curriculum (Modules 5–12). To
            unlock scenario questions, exam trap diagnostics, and micro-drills for Module{' '}
            {numericModuleId}, authorize a payment method below via Safaricom M-Pesa (Daraja STK
            Push) or Stripe Elements.
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
              <span>Transparent Module &amp; Bundle Pricing</span>
            </div>
            <p className="text-[11px] text-sky-100/85">
              Unlock Module {numericModuleId} for KES 250 ($2 USD) or all 12 modules for KES 950 ($15 USD).
            </p>
          </div>
        </div>

        {/* EXPLICIT 'AUTHORIZE PAYMENT METHOD' HELPER UI */}
        <div className="rounded-2xl bg-slate-950/75 border border-sky-400/30 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Authorize Payment Method</span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white">
                How to Initiate &amp; Authorize Your Module {numericModuleId} Unlock
              </h4>
              <p className="text-xs text-sky-100/85">
                Instead of simply redirecting you to your Profile tab, choose your preferred plan and payment method right here to start an instant M-Pesa STK Push or open your pre-configured checkout.
              </p>
            </div>

            {/* 3-Step Visual Authorization Guide */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold bg-white/5 px-3 py-2 rounded-xl border border-white/10 shrink-0">
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <span className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-400 text-[10px] flex items-center justify-center">
                  1
                </span>
                Choose Tier
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="inline-flex items-center gap-1 text-sky-300">
                <span className="w-4 h-4 rounded-full bg-sky-500/30 border border-sky-400 text-[10px] flex items-center justify-center">
                  2
                </span>
                Pick M-Pesa or Card
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="inline-flex items-center gap-1 text-amber-300">
                <span className="w-4 h-4 rounded-full bg-amber-500/30 border border-amber-400 text-[10px] flex items-center justify-center">
                  3
                </span>
                Authorize &amp; Unlock
              </span>
            </div>
          </div>

          {/* Step 1 + Step 2 Interactive Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Step 1: Select Plan Scope */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 block">
                Step 1: Select Unlock Scope
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHelperPlan('pro_all_access')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    helperPlan === 'pro_all_access'
                      ? 'bg-sky-500/25 border-sky-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black">All 12 Modules</span>
                    {helperPlan === 'pro_all_access' && (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs font-mono font-black text-amber-300 mt-0.5">
                    KES 950 / $15
                  </p>
                  <span className="text-[10px] text-emerald-300 font-bold block">
                    Save KES 1,050 (52.5%)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setHelperPlan('single_module')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    helperPlan === 'single_module'
                      ? 'bg-amber-500/25 border-amber-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black">Module {numericModuleId} Only</span>
                    {helperPlan === 'single_module' && (
                      <Check className="w-3.5 h-3.5 text-amber-300" />
                    )}
                  </div>
                  <p className="text-xs font-mono font-black text-white mt-0.5">
                    KES 250 / $2
                  </p>
                  <span className="text-[10px] text-sky-200 font-bold block">
                    Single Module Pass
                  </span>
                </button>
              </div>
            </div>

            {/* Step 2: Select Payment Gateway */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                Step 2: Choose Payment Method to Authorize
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHelperMethod('mpesa')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    helperMethod === 'mpesa'
                      ? 'bg-emerald-500/25 border-emerald-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
                      M-Pesa Daraja
                    </span>
                    {helperMethod === 'mpesa' && (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-200 font-bold mt-1">
                    Instant STK Push Prompt
                  </p>
                  <span className="text-[10px] text-slate-300 block">
                    KES {helperPlan === 'pro_all_access' ? '950' : '250'} via Phone PIN
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHelperMethod('card');
                    setShowInlineMpesa(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    helperMethod === 'card'
                      ? 'bg-indigo-500/25 border-indigo-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-300" />
                      Card (Stripe)
                    </span>
                    {helperMethod === 'card' && (
                      <Check className="w-3.5 h-3.5 text-indigo-300" />
                    )}
                  </div>
                  <p className="text-[11px] text-indigo-200 font-bold mt-1">
                    Visa / Mastercard
                  </p>
                  <span className="text-[10px] text-slate-300 block">
                    ${helperPlan === 'pro_all_access' ? '15.00' : '2.00'} USD Checkout
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Inline M-Pesa Daraja Gateway when user chooses to authorize M-Pesa directly */}
          {showInlineMpesa && helperMethod === 'mpesa' && (
            <div className="pt-1">
              <MpesaPaymentGateway
                selectedPlan={helperPlan}
                targetModuleId={numericModuleId}
                moduleTitle={targetModInfo?.title}
                compact
                onPaymentSuccess={(updatedProfile) => {
                  setStoredProfile(updatedProfile);
                  setForceSimulateLocked(false);
                }}
              />
            </div>
          )}

          {/* Step 3: Action Buttons to Authorize Payment Method */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {helperMethod === 'mpesa' && (
                <button
                  type="button"
                  onClick={() => setShowInlineMpesa((prev) => !prev)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {showInlineMpesa
                      ? 'Hide Inline M-Pesa STK Push'
                      : `Authorize Payment Method via M-Pesa (KES ${
                          helperPlan === 'pro_all_access' ? '950' : '250'
                        })`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenTierSelectionModal(numericModuleId)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Authorize in Cost Breakdown &amp; Checkout Modal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleNavigateToProfileWithIntent(helperMethod, helperPlan)}
                className="px-4 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 border border-sky-400/40 transition-all cursor-pointer"
              >
                <span>
                  Open Profile Subscription Panel ({helperMethod === 'mpesa' ? 'M-Pesa' : 'Card'})
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onSelectFreeModule && (
                <button
                  type="button"
                  onClick={() => onSelectFreeModule(1)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sky-100 font-bold text-xs cursor-pointer transition-colors"
                >
                  Return to Free Modules (1–4)
                </button>
              )}

              {forceSimulateLocked && (
                <button
                  type="button"
                  onClick={() => setForceSimulateLocked(false)}
                  className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-bold text-xs cursor-pointer transition-colors"
                >
                  Exit Paywall Preview
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-amber-50 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
        <div className="flex items-center gap-2 font-bold">
          <MaasaiMedallion size={16} />
          <span>Foundational Modules 1–4 are always free. Modules 5–12 require an active pass.</span>
        </div>
        <span className="font-mono text-[11px] font-bold text-amber-800">
          Secured by Safaricom Daraja API, Stripe Elements &amp; Supabase Auth
        </span>
      </div>
    </div>
  );
};
