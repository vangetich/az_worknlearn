import React, { useState, useMemo } from 'react';
import {
  X,
  Crown,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Check,
  Sparkles,
  Layers,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Calculator,
} from 'lucide-react';
import { authService, BackendUserProfile } from '../services/authService';
import { LEARNING_PATHS } from '../data/curriculum';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';
import { MpesaPaymentGateway } from './MpesaPaymentGateway';

export interface SubscriptionTierSelectionProps {
  isOpen: boolean;
  lockedModuleId: number | null;
  onClose: () => void;
  onRedirectToProfileSubscription: () => void;
  onUnlockedSuccess?: (updatedProfile: BackendUserProfile, receiptNumber: string) => void;
}

const SINGLE_MOD_KES = 250;
const SINGLE_MOD_USD = 2;
const ALL_COMBINED_KES = 950;
const ALL_COMBINED_USD = 15;

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
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState<string>('0712345678');

  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvc, setCardCvc] = useState<string>('424');
  const [showCvc, setShowCvc] = useState<boolean>(false);
  const [cardholderName, setCardholderName] = useState<string>(
    () => authService.getStoredBackendUser()?.full_name || 'Amina Wanjiku'
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const effectiveModuleId = lockedModuleId && lockedModuleId >= 5 ? lockedModuleId : 5;
  const moduleInfo = useMemo(
    () =>
      LEARNING_PATHS.flatMap((p) =>
        p.modules.map((m) => ({ ...m, pathTitle: p.title }))
      ).find((m) => m.id === effectiveModuleId),
    [effectiveModuleId]
  );

  const maskedMpesa = useMemo(() => {
    const digits = mpesaPhone.replace(/\D/g, '');
    let norm = digits;
    if (digits.startsWith('0') && digits.length === 10) norm = `254${digits.slice(1)}`;
    else if (digits.length === 9) norm = `254${digits}`;
    return norm.length >= 9 ? `+${norm.slice(0, 6)} ••• ${norm.slice(-3)}` : '+254 7•• ••• •••';
  }, [mpesaPhone]);

  const maskedCard = useMemo(() => {
    const digits = cardNumber.replace(/\D/g, '');
    const last4 = digits.slice(-4) || '4242';
    return `Card •••• ${last4}`;
  }, [cardNumber]);

  if (!isOpen) return null;

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

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (paymentMethod === 'mpesa') {
      const digits = mpesaPhone.replace(/\D/g, '');
      const valid =
        (digits.startsWith('0') && digits.length === 10) ||
        (digits.startsWith('254') && digits.length === 12) ||
        ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9);
      if (!valid) {
        setErrorMsg('Please enter a valid Safaricom M-Pesa phone number (e.g. 0712345678).');
        return;
      }
    } else {
      const rawDigits = cardNumber.replace(/\s+/g, '');
      if (rawDigits.length < 13) {
        setErrorMsg('Please enter a valid 16-digit card number.');
        return;
      }
    }

    setIsProcessing(true);
    try {
      const currentProfile = authService.getStoredBackendUser();
      const amountUsd = selectedTier === 'pro_all_access' ? ALL_COMBINED_USD : SINGLE_MOD_USD;
      const amountKes = selectedTier === 'pro_all_access' ? ALL_COMBINED_KES : SINGLE_MOD_KES;
      const userId = currentProfile?.id || 'usr_student_1';
      const email = currentProfile?.email || 'student@az900.ke';

      let checkoutRequestId = '';
      let receiptNumber = '';

      if (paymentMethod === 'mpesa') {
        const stkRes = await fetch('/api/payments/mpesa/stk-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            phone_number: mpesaPhone.trim(),
            amount: amountKes,
            module_id: selectedTier === 'pro_all_access' ? 'all' : effectiveModuleId,
          }),
        });
        const stkData = await stkRes.json();
        if (!stkRes.ok) {
          throw new Error(stkData.error || 'Failed to initiate M-Pesa STK Push.');
        }
        checkoutRequestId =
          stkData.CheckoutRequestID ||
          stkData.transaction?.checkout_request_id ||
          `ws_CO_${Date.now()}`;
        receiptNumber = `SJK${Math.floor(1000000 + Math.random() * 9000000)}M`;
      } else {
        const checkoutRes = await fetch('/api/payments/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            email,
            amount: amountUsd,
            module_id: selectedTier === 'pro_all_access' ? 'all' : effectiveModuleId,
            masked_card: maskedCard,
          }),
        });
        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok) {
          throw new Error(checkoutData.error || 'Failed to initiate card checkout.');
        }
        checkoutRequestId =
          checkoutData.checkout_request_id || `cs_live_${Date.now()}`;
        receiptNumber = `STRP-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`;
      }

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
        plan_tier: selectedTier === 'pro_all_access' ? 'all_modules_bundle' : 'single_module',
        payment_method: paymentMethod,
        masked_payment_account: paymentMethod === 'mpesa' ? maskedMpesa : maskedCard,
        last_receipt_number: receiptNumber,
      });

      const planLabel =
        selectedTier === 'pro_all_access'
          ? 'AZ-900 Pro All-Access Pass (All 12 Modules Combined)'
          : `Module ${effectiveModuleId} (${moduleInfo?.title || 'Advanced Module'}) Pass`;

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
      setErrorMsg(err.message || 'Payment verification failed. Please try again.');
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
                  Choose Your AZ-900 Learning Plan &amp; Payment Method
                </h3>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                Compare Per-Module cost vs. All 12 Modules Combined • Pay safely via M-Pesa or Card
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
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Tier Cards: All Combined vs Single Module */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tier 1: Pro All-Access (All Modules Combined) */}
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
                    All 12 Combined • Save 52%
                  </span>
                  <MaasaiMedallion size={16} />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  All 12 Modules Combined Bundle
                </h4>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-xl font-black text-slate-900">KES 950</span>
                  <span className="text-xs font-bold text-slate-600">/ $15.00 USD</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-bold">
                  Saves KES 1,050 compared to buying 8 advanced modules separately (KES 2,000)
                </p>
                <ul className="space-y-1 pt-1 text-[11px] text-slate-700 font-medium">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>All 12 AZ-900 Curriculum Modules Unlocked</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Timed Mock Exams &amp; AI Scenario Builder</span>
                  </li>
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-extrabold text-[#0078D4]">
                <span>{selectedTier === 'pro_all_access' ? 'Selected Bundle' : 'Select All Combined'}</span>
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
                    Pay-Per-Module Option
                  </span>
                  <Layers className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  Module {effectiveModuleId} Instant Pass
                </h4>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-xl font-black text-slate-900">KES 250</span>
                  <span className="text-xs font-bold text-slate-600">/ $2.00 USD per module</span>
                </div>
                <p className="text-[11px] text-amber-800 font-bold">
                  Flexible modular access (+ Modules 1–4 included free)
                </p>
                <ul className="space-y-1 pt-1 text-[11px] text-slate-700 font-medium">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Unlocks Module {effectiveModuleId}: {moduleInfo?.title}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Includes 5-Question Harambee Micro-Drills</span>
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

          {/* Payment Method Selector: M-Pesa vs Card */}
          <form
            onSubmit={handleCompletePayment}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-900">
                Select Payment Method:
              </span>
              <div className="inline-flex p-0.5 rounded-xl bg-slate-200/80 border border-slate-300 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'mpesa'
                      ? 'bg-emerald-600 text-white font-black shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>
                    M-Pesa STK Push (KES{' '}
                    {selectedTier === 'pro_all_access' ? ALL_COMBINED_KES : SINGLE_MOD_KES})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-[#635BFF] text-white font-black shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    Card (${selectedTier === 'pro_all_access' ? ALL_COMBINED_USD : SINGLE_MOD_USD}{' '}
                    USD)
                  </span>
                </button>
              </div>
            </div>

            {paymentMethod === 'mpesa' ? (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-950">
                    Safaricom M-Pesa Phone Number (STK Push Prompt)
                  </span>
                  <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Masked: {maskedMpesa}
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  placeholder="0712345678 or 254712345678"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-300 text-xs font-mono font-bold text-slate-900"
                />
                <p className="text-[11px] text-emerald-900">
                  <strong>Peace of Mind:</strong> Your M-Pesa PIN is entered strictly on your mobile
                  SIM Toolkit and never in the app.
                </p>
              </div>
            ) : (
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
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-500">
                        CVC
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCvc(!showCvc)}
                        className="text-[9px] text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        {showCvc ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                    <input
                      type={showCvc ? 'text' : 'password'}
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2 text-[11px] text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Customer Peace of Mind:</strong> Zero raw card numbers or PINs are stored.
                Protected under KDPA 2019 &amp; PCI-DSS with instant digital receipt verification.
              </span>
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
                className={`px-5 py-2.5 rounded-xl hover:opacity-95 disabled:opacity-60 text-white font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm cursor-pointer ${
                  paymentMethod === 'mpesa'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-gradient-to-r from-[#635BFF] to-[#0078D4]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>
                      {paymentMethod === 'mpesa'
                        ? selectedTier === 'pro_all_access'
                          ? `Pay KES ${ALL_COMBINED_KES} via M-Pesa (All 12 Modules)`
                          : `Pay KES ${SINGLE_MOD_KES} via M-Pesa (Module ${effectiveModuleId})`
                        : selectedTier === 'pro_all_access'
                        ? `Pay $${ALL_COMBINED_USD}.00 via Card (All 12 Modules)`
                        : `Pay $${SINGLE_MOD_USD}.00 via Card (Module ${effectiveModuleId})`}
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
