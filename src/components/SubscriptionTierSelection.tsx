import React, { useState } from 'react';
import {
  X,
  Crown,
  CreditCard,
  ShieldCheck,
  Check,
  Sparkles,
  Layers,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { authService, BackendUserProfile } from '../services/authService';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

export interface SubscriptionTierSelectionProps {
  isOpen: boolean;
  lockedModuleId: number | null;
  onClose: () => void;
  onRedirectToProfileSubscription: () => void;
  onUnlockedSuccess?: (updatedProfile: BackendUserProfile, receiptNumber: string) => void;
}

export const SubscriptionTierSelection: React.FC<SubscriptionTierSelectionProps> = ({
  isOpen,
  lockedModuleId,
  onClose,
  onRedirectToProfileSubscription,
  onUnlockedSuccess,
}) => {
  const [selectedTier, setSelectedTier] = useState<'pro_all_access' | 'single_module'>(
    'pro_all_access'
  );
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvc, setCardCvc] = useState<string>('424');
  const [cardholderName, setCardholderName] = useState<string>(
    () => authService.getStoredBackendUser()?.full_name || 'Amina Wanjiku'
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const effectiveModuleId = lockedModuleId && lockedModuleId >= 5 ? lockedModuleId : 5;
  const moduleInfo = LEARNING_PATHS.flatMap((p) =>
    p.modules.map((m) => ({ ...m, pathTitle: p.title }))
  ).find((m) => m.id === effectiveModuleId);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleCompleteStripeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const rawDigits = cardNumber.replace(/\s+/g, '');
    if (rawDigits.length < 13) {
      setErrorMsg('Please enter a valid 16-digit card number.');
      return;
    }

    setIsProcessing(true);
    try {
      const currentProfile = authService.getStoredBackendUser();
      const amountUsd = selectedTier === 'pro_all_access' ? 15 : 2;
      const userId = currentProfile?.id || 'usr_student_1';
      const email = currentProfile?.email || 'student@az900.ke';

      const checkoutRes = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          email,
          amount: amountUsd,
          module_id: selectedTier === 'pro_all_access' ? undefined : effectiveModuleId,
        }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || 'Failed to initiate Stripe checkout.');
      }

      const checkoutRequestId =
        checkoutData.checkout_request_id || `cs_live_${Date.now()}`;
      const receiptNumber = `STRP-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkout_request_id: checkoutRequestId,
          result_code: 0,
          receipt_number: receiptNumber,
        }),
      });

      const existingUnlocked = currentProfile?.unlocked_modules || [1, 2, 3, 4];
      const nextUnlocked =
        selectedTier === 'pro_all_access'
          ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
          : Array.from(new Set([...existingUnlocked, effectiveModuleId])).sort(
              (a, b) => a - b
            );

      const updatedProfile = authService.updateStoredUser({
        is_premium: selectedTier === 'pro_all_access' || nextUnlocked.length >= 12,
        paid_status: 'active',
        unlocked_modules: nextUnlocked,
      });

      const planLabel =
        selectedTier === 'pro_all_access'
          ? 'AZ-900 Pro All-Access Pass (Modules 1–12)'
          : `Module ${effectiveModuleId} (${moduleInfo?.title || 'Advanced Module'}) Pass`;

      // Trigger global 'Payment Successful' toast notification in App.tsx
      window.dispatchEvent(
        new CustomEvent('az900-payment-success', {
          detail: {
            receiptNumber,
            checkoutId: checkoutRequestId,
            planLabel,
            amountUsd,
            unlockedModules: nextUnlocked,
            user: updatedProfile,
          },
        })
      );

      if (updatedProfile && onUnlockedSuccess) {
        onUnlockedSuccess(updatedProfile, receiptNumber);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Stripe checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-tier-modal-title"
    >
      <div className="bg-white rounded-2xl border border-sky-200 max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <KitengeRibbon height={4} />

        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  Locked Premium Module {effectiveModuleId}
                </span>
                <h3
                  id="subscription-tier-modal-title"
                  className="text-sm sm:text-base font-black text-white"
                >
                  Choose Your AZ-900 Subscription Tier
                </h3>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                Unlock Module {effectiveModuleId} ({moduleInfo?.title}) or all 12 AZ-900 modules
                via Stripe Checkout
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close subscription tier modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Tier Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tier 1: Pro All-Access */}
            <button
              type="button"
              onClick={() => setSelectedTier('pro_all_access')}
              className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                selectedTier === 'pro_all_access'
                  ? 'bg-sky-50/90 border-[#0078D4] ring-2 ring-[#0078D4]/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#0078D4] text-white">
                    Most Popular • Full Unlock
                  </span>
                  <MaasaiMedallion size={16} />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  AZ-900 Pro All-Access Pass
                </h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">$15</span>
                  <span className="text-xs font-bold text-slate-500">USD (KES 950)</span>
                </div>
                <ul className="space-y-1 pt-1 text-[11px] text-slate-700 font-medium">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>All 12 AZ-900 Curriculum Modules</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Timed Mock Exams &amp; AI Scenario Builder</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Sets Supabase paid_status = &apos;active&apos;</span>
                  </li>
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-extrabold text-[#0078D4]">
                <span>{selectedTier === 'pro_all_access' ? 'Selected Tier' : 'Select Pro Pass'}</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Tier 2: Single Module Pass */}
            <button
              type="button"
              onClick={() => setSelectedTier('single_module')}
              className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                selectedTier === 'single_module'
                  ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-400/25 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                    Single Module Unlock
                  </span>
                  <Layers className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  Module {effectiveModuleId} Instant Pass
                </h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">$2</span>
                  <span className="text-xs font-bold text-slate-500">USD (KES 250)</span>
                </div>
                <ul className="space-y-1 pt-1 text-[11px] text-slate-700 font-medium">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Unlocks Module {effectiveModuleId}: {moduleInfo?.title}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Includes 5-Question Harambee Micro-Drills</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Instant unlock without page reload</span>
                  </li>
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-extrabold text-amber-900">
                <span>
                  {selectedTier === 'single_module' ? 'Selected Tier' : `Select Module ${effectiveModuleId}`}
                </span>
                <Lock className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          {/* Direct Express Stripe Checkout Form */}
          <form
            onSubmit={handleCompleteStripeCheckout}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#635BFF]" />
                <span className="text-xs font-black text-slate-900">
                  Direct Stripe Checkout •{' '}
                  {selectedTier === 'pro_all_access'
                    ? 'AZ-900 Pro Pass ($15.00 USD)'
                    : `Module ${effectiveModuleId} Pass ($2.00 USD)`}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Test Card Prefilled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  Card Number
                </label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-3 grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                    Exp
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                    CVC
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRedirectToProfileSubscription();
                }}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open Full Subscription Panel in Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#0078D4] hover:opacity-95 disabled:opacity-60 text-white font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Stripe Checkout...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>
                      {selectedTier === 'pro_all_access'
                        ? 'Complete $15.00 Stripe Checkout'
                        : `Unlock Module ${effectiveModuleId} ($2.00)`}
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
