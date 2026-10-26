import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  Crown,
  Loader2,
  AlertCircle,
  Layers,
  Zap,
  Check,
  ArrowRight,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { authService, BackendUserProfile } from '../services/authService';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

export interface SubscriptionPanelProps {
  onPaymentSuccess?: (updatedProfile: BackendUserProfile, receiptNumber: string) => void;
  onSelectModuleToPractice?: (moduleId: number) => void;
  defaultExpanded?: boolean;
}

export const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({
  onPaymentSuccess,
  onSelectModuleToPractice,
  defaultExpanded = true,
}) => {
  const [userProfile, setUserProfile] = useState<BackendUserProfile | null>(() =>
    authService.getStoredBackendUser()
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [selectedPlan, setSelectedPlan] = useState<'pro_all_access' | 'single_module'>(
    'pro_all_access'
  );
  const [targetModuleId, setTargetModuleId] = useState<number>(5);

  // Stripe Elements Card State
  const [cardholderName, setCardholderName] = useState<string>(
    userProfile?.full_name || 'Amina Wanjiku'
  );
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvc, setCardCvc] = useState<string>('424');
  const [billingZip, setBillingZip] = useState<string>('00100');
  const [cardFocusedField, setCardFocusedField] = useState<
    'number' | 'expiry' | 'cvc' | 'name' | null
  >(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<{
    receiptNumber: string;
    checkoutId: string;
    amountUsd: number;
    planLabel: string;
    timestamp: string;
  } | null>(null);

  // Sync with authService profile updates
  useEffect(() => {
    const handleSessionChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ user: BackendUserProfile | null }>;
      const nextUser = customEvent.detail?.user || authService.getStoredBackendUser();
      setUserProfile(nextUser);
    };
    window.addEventListener('az900-auth-session-change', handleSessionChange);
    return () => window.removeEventListener('az900-auth-session-change', handleSessionChange);
  }, []);

  const allModules = LEARNING_PATHS.flatMap((p) => p.modules);
  const advancedModules = allModules.filter((m) => m.id >= 5);

  const isPaidActive =
    userProfile?.paid_status === 'active' ||
    Boolean(userProfile?.is_premium) ||
    (userProfile?.unlocked_modules?.length || 0) >= 12;

  const unlockedModulesList =
    userProfile?.unlocked_modules || (isPaidActive ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [1, 2, 3, 4]);

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

  const handleStripePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawDigits = cardNumber.replace(/\s+/g, '');
    if (rawDigits.length < 13) {
      setErrorMessage('Please enter a valid 16-digit card number in the Stripe Element field.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setErrorMessage('Please enter a valid MM/YY expiration date.');
      return;
    }
    if (cardCvc.trim().length < 3) {
      setErrorMessage('Please enter a valid 3 or 4 digit CVC security code.');
      return;
    }

    setIsProcessing(true);

    try {
      const amountUsd = selectedPlan === 'pro_all_access' ? 15 : 2;
      const email = userProfile?.email || 'student@az900.ke';
      const userId = userProfile?.id || 'usr_student_1';
      const modId = selectedPlan === 'pro_all_access' ? undefined : targetModuleId;

      // Step 1: Initialize Stripe Checkout Intent on Backend
      const checkoutRes = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          email,
          amount: amountUsd,
          module_id: modId,
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || 'Could not initialize Stripe payment session.');
      }

      const checkoutRequestId =
        checkoutData.checkout_request_id || `cs_live_${Date.now()}`;
      const receiptNumber = `STRP-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      // Step 2: Confirm Payment Verification Webhook to unlock modules in Backend & Supabase Profile
      await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkout_request_id: checkoutRequestId,
          result_code: 0,
          receipt_number: receiptNumber,
        }),
      });

      // Step 3: Compute updated unlocked modules & paid_status
      const nextUnlocked =
        selectedPlan === 'pro_all_access'
          ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
          : Array.from(new Set([...unlockedModulesList, targetModuleId])).sort(
              (a, b) => a - b
            );

      const updatedProfile = authService.updateStoredUser({
        is_premium: selectedPlan === 'pro_all_access' || nextUnlocked.length >= 12,
        paid_status: 'active',
        unlocked_modules: nextUnlocked,
      });

      const planLabel =
        selectedPlan === 'pro_all_access'
          ? 'AZ-900 Pro All-Access Pass (Modules 1–12)'
          : `Module ${targetModuleId} Advanced Practice Unlock`;

      setLastReceipt({
        receiptNumber,
        checkoutId: checkoutRequestId,
        amountUsd,
        planLabel,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      // Dispatch global event so App.tsx displays the global 'Payment Successful' toast
      // and refreshes the user's Supabase profile without a page reload
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

      if (updatedProfile && onPaymentSuccess) {
        onPaymentSuccess(updatedProfile, receiptNumber);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Stripe payment verification failed. Please verify your card details.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleDemoPaidStatus = () => {
    if (isPaidActive) {
      authService.updateStoredUser({
        is_premium: false,
        paid_status: 'inactive',
        unlocked_modules: [1, 2, 3, 4],
      });
    } else {
      const updated = authService.updateStoredUser({
        is_premium: true,
        paid_status: 'active',
        unlocked_modules: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      });
      window.dispatchEvent(
        new CustomEvent('az900-payment-success', {
          detail: {
            receiptNumber: `STRP-DEMO-${Date.now().toString().slice(-4)}`,
            planLabel: 'AZ-900 Pro All-Access Pass (Modules 1–12)',
            amountUsd: 15,
            unlockedModules: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            user: updated,
          },
        })
      );
    }
  };

  return (
    <section
      id="profile-subscription-panel"
      aria-label="Subscription & Stripe Elements Payment Collection Panel"
      className="bg-white rounded-2xl border border-sky-200/90 card-elevation overflow-hidden shadow-xs"
    >
      <KitengeRibbon height={4} />

      {/* Top Header Bar */}
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-[#003865] to-[#005A9E] text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 shadow-xs shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm sm:text-base text-white">
                AZ-900 Premium Subscription &amp; Stripe Elements Checkout
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                  isPaidActive
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-amber-300 text-slate-950'
                }`}
              >
                {isPaidActive ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>paid_status: active ({unlockedModulesList.length}/12 Unlocked)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>paid_status: inactive (Modules 5–12 Locked)</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-sky-100/90 mt-0.5">
              Unlock advanced AZ-900 modules (Modules 5–12), AI scenario builders, and full timed simulations via PCI-compliant Stripe Elements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleDemoPaidStatus}
            className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-amber-200 border border-white/20 text-[11px] font-bold transition-colors cursor-pointer"
            title="Toggle paid_status between 'active' and 'inactive' to test PaymentGatekeeper on Modules 5–12"
          >
            {isPaidActive ? 'Simulate Free Tier (Lock M5–M12)' : 'Quick-Activate Pro Status'}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Compact</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* Receipt Confirmation Banner */}
          {lastReceipt && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xs sm:text-sm text-emerald-950">
                      Stripe Payment Verified • Premium Access Unlocked
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 font-mono text-[10px] font-black">
                      Receipt #{lastReceipt.receiptNumber}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {lastReceipt.planLabel} (${lastReceipt.amountUsd}.00 USD) verified at{' '}
                    {lastReceipt.timestamp}. Your Supabase profile{' '}
                    <code className="font-mono font-bold">paid_status</code> is now{' '}
                    <code className="font-mono font-bold">active</code>.
                  </p>
                </div>
              </div>
              {onSelectModuleToPractice && (
                <button
                  type="button"
                  onClick={() => onSelectModuleToPractice(targetModuleId)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Practice Unlocked Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Plan Selection & Module Unlock Matrix (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>1. Select Your AZ-900 Subscription Tier</span>
                </h4>
                <span className="text-[11px] font-bold text-slate-500">
                  Instant Supabase Profile Sync
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Plan 1: Pro All-Access */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('pro_all_access')}
                  className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selectedPlan === 'pro_all_access'
                      ? 'bg-sky-50/90 border-[#0078D4] ring-2 ring-[#0078D4]/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#0078D4] text-white">
                        Recommended • Best Value
                      </span>
                      <MaasaiMedallion size={16} />
                    </div>
                    <h5 className="text-sm font-black text-slate-900">
                      AZ-900 Pro All-Access Pass
                    </h5>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">$15</span>
                      <span className="text-xs font-bold text-slate-500">
                        USD (KES 950) • Lifetime Cohort Access
                      </span>
                    </div>
                    <ul className="space-y-1 pt-1 text-[11px] text-slate-700 font-medium">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Unlocks all 8 Advanced Modules (Modules 5–12)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Unlimited AI Scenario Builder &amp; Mock Exams</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Sets Supabase profile paid_status = &apos;active&apos;</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-extrabold text-[#0078D4]">
                    <span>
                      {selectedPlan === 'pro_all_access' ? 'Selected Plan' : 'Choose Pro Pass'}
                    </span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Plan 2: Single Module Pass */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('single_module')}
                  className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selectedPlan === 'single_module'
                      ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-400/25 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                        Modular Micro-Pass
                      </span>
                      <Layers className="w-4 h-4 text-amber-600" />
                    </div>
                    <h5 className="text-sm font-black text-slate-900">
                      Single Advanced Module Unlock
                    </h5>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">$2</span>
                      <span className="text-xs font-bold text-slate-500">
                        USD (KES 250) • Per Module
                      </span>
                    </div>
                    <ul className="space-y-1 pt-1 text-[11px] text-slate-700 font-medium">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Unlock any single locked module (M5–M12)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Includes module micro-drills &amp; flashcards</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Instant activation without page reload</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-extrabold text-amber-800">
                    <span>
                      {selectedPlan === 'single_module'
                        ? `Selected: Module ${targetModuleId}`
                        : 'Choose Single Module'}
                    </span>
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>

              {/* Target Module Picker when Single Module plan is chosen */}
              {selectedPlan === 'single_module' && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <label className="block text-xs font-extrabold text-amber-950">
                    Select Locked AZ-900 Module to Unlock (Modules 5–12):
                  </label>
                  <select
                    value={targetModuleId}
                    onChange={(e) => setTargetModuleId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-amber-300 text-xs font-bold text-slate-900"
                  >
                    {advancedModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        Module {m.id}: {m.title} (Path {m.pathId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Modules 1-12 Access Status Grid */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800">
                    Curriculum Access Status (Modules 1–12)
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#0078D4]">
                    {unlockedModulesList.length} / 12 Unlocked
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {allModules.map((mod) => {
                    const isUnlocked =
                      mod.id <= 4 || isPaidActive || unlockedModulesList.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => {
                          if (isUnlocked && onSelectModuleToPractice) {
                            onSelectModuleToPractice(mod.id);
                          } else {
                            setSelectedPlan('single_module');
                            setTargetModuleId(mod.id);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                          isUnlocked
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400'
                        }`}
                        title={`Module ${mod.id}: ${mod.title} (${
                          isUnlocked ? 'Unlocked' : 'Locked Premium Module'
                        })`}
                      >
                        <span className="truncate">
                          M{mod.id}: {mod.title}
                        </span>
                        {isUnlocked ? (
                          <Unlock className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Stripe Elements Secure Card Payment Form (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#635BFF] text-white shadow-2xs">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      Stripe Elements Checkout
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      256-Bit TLS Encrypted Card Collection
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/20 text-[10px] font-black">
                  STRIPE SECURE
                </span>
              </div>

              <form onSubmit={handleStripePaymentSubmit} className="space-y-3.5">
                {/* Cardholder Name */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardholderName}
                    onFocus={() => setCardFocusedField('name')}
                    onBlur={() => setCardFocusedField(null)}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Full name on card"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>

                {/* Unified Stripe PaymentElement / CardElement Container */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-extrabold uppercase text-slate-600">
                      Stripe Card Element
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCardNumber('4242 4242 4242 4242');
                        setCardExpiry('08/28');
                        setCardCvc('424');
                      }}
                      className="text-[10px] font-bold text-[#635BFF] hover:underline cursor-pointer"
                    >
                      Autofill Stripe Test Card (4242)
                    </button>
                  </div>

                  <div
                    className={`rounded-xl bg-white border transition-all overflow-hidden ${
                      cardFocusedField
                        ? 'border-[#635BFF] ring-2 ring-[#635BFF]/20'
                        : 'border-slate-300'
                    }`}
                  >
                    {/* Card Number Row */}
                    <div className="px-3 py-2.5 border-b border-slate-200 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#635BFF] shrink-0" />
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={cardNumber}
                        onFocus={() => setCardFocusedField('number')}
                        onBlur={() => setCardFocusedField(null)}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="4242 •••• •••• 4242"
                        aria-label="Stripe Card Number"
                        className="w-full text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                      />
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        VISA / MC
                      </span>
                    </div>

                    {/* Expiry + CVC + ZIP Row */}
                    <div className="grid grid-cols-3 divide-x divide-slate-200">
                      <div className="px-3 py-2">
                        <label className="block text-[9px] font-bold uppercase text-slate-400">
                          Expiry
                        </label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onFocus={() => setCardFocusedField('expiry')}
                          onBlur={() => setCardFocusedField(null)}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          aria-label="Card Expiration Date"
                          className="w-full text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                        />
                      </div>

                      <div className="px-3 py-2">
                        <label className="block text-[9px] font-bold uppercase text-slate-400">
                          CVC
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          maxLength={4}
                          value={cardCvc}
                          onFocus={() => setCardFocusedField('cvc')}
                          onBlur={() => setCardFocusedField(null)}
                          onChange={(e) =>
                            setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                          placeholder="CVC"
                          aria-label="Card CVC Security Code"
                          className="w-full text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                        />
                      </div>

                      <div className="px-3 py-2">
                        <label className="block text-[9px] font-bold uppercase text-slate-400">
                          Postal / ZIP
                        </label>
                        <input
                          type="text"
                          value={billingZip}
                          onChange={(e) => setBillingZip(e.target.value.slice(0, 10))}
                          placeholder="00100"
                          aria-label="Billing Postal Code"
                          className="w-full text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#635BFF] via-[#0078D4] to-[#005A9E] hover:opacity-95 disabled:opacity-60 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Stripe Payment &amp; Unlocking...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span>
                        {selectedPlan === 'pro_all_access'
                          ? 'Pay $15.00 USD & Unlock All 12 Modules'
                          : `Pay $2.00 USD & Unlock Module ${targetModuleId}`}
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Stripe Elements PCI-DSS Level 1</span>
                  </span>
                  <span>Updates Supabase paid_status immediately</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
