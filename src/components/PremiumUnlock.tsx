import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CreditCard,
  CheckCircle2,
  Lock,
  Unlock,
  Send,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Receipt,
  Radio,
} from 'lucide-react';
import {
  FirebaseUser,
  recordPendingPaymentToFirestore,
} from '../lib/firebase';

export interface PaymentTransactionRecord {
  id: string;
  user_id: string;
  gateway: 'mpesa' | 'stripe';
  phone_number: string;
  amount: number;
  currency: 'KES' | 'USD';
  module_id: number | 'all';
  checkout_request_id: string;
  merchant_request_id: string;
  status: 'pending' | 'completed' | 'failed';
  receipt_number?: string | null;
  created_at: string;
  completed_at?: string | null;
}

interface PremiumUnlockProps {
  currentUserId: string;
  userEmail: string;
  firebaseUser: FirebaseUser | null;
  unlockedModules: number[];
  isPremiumUnlocked: boolean;
  transactions: PaymentTransactionRecord[];
  onRefreshProgress: () => Promise<void>;
  onStatusBanner: (banner: { type: 'success' | 'info' | 'error'; message: string } | null) => void;
}

const MODULE_TITLES: Record<number, string> = {
  1: 'Cloud Concepts & Shared Responsibility',
  2: 'Cloud Models (Public, Private, Hybrid)',
  3: 'Consumption-Based & Serverless Pricing',
  4: 'Core Azure Architectural Components',
  5: 'Azure Compute & Networking Services',
  6: 'Azure Storage & Redundancy Tiers',
  7: 'Azure Identity, Access & Zero Trust Security',
  8: 'Cost Management, TCO & FinOps',
  9: 'Governance & Compliance (Policy, Locks)',
  10: 'Resource Deployment (ARM, Bicep, Portal)',
  11: 'Azure Monitor, Advisor & Service Health',
  12: 'Final Exam Readiness & Scenario Mastery',
};

export const PremiumUnlock: React.FC<PremiumUnlockProps> = ({
  currentUserId,
  userEmail,
  firebaseUser,
  unlockedModules,
  isPremiumUnlocked,
  transactions,
  onRefreshProgress,
  onStatusBanner,
}) => {
  const [mpesaPhone, setMpesaPhone] = useState('0712345678');
  const [paymentPlan, setPaymentPlan] = useState<'all' | number>('all');
  const [activePendingTx, setActivePendingTx] = useState<PaymentTransactionRecord | null>(null);
  const [isSubmittingPush, setIsSubmittingPush] = useState(false);
  const [isConfirmingWebhook, setIsConfirmingWebhook] = useState(false);
  const [pendingElapsedSec, setPendingElapsedSec] = useState(0);
  const [lastWebhookPayload, setLastWebhookPayload] = useState<any>(null);

  // Sync activePendingTx with any pending transaction from backend progress report
  useEffect(() => {
    const existingPending = transactions.find((t) => t.status === 'pending');
    if (existingPending) {
      setActivePendingTx(existingPending);
    } else if (activePendingTx) {
      // Check if our previously tracked pending transaction just transitioned to completed
      const matched = transactions.find(
        (t) => t.checkout_request_id === activePendingTx.checkout_request_id
      );
      if (matched && matched.status !== 'pending') {
        setActivePendingTx(null);
      }
    }
  }, [transactions, activePendingTx]);

  // Elapsed timer and polling while awaiting `/api/payments/webhook` confirmation
  useEffect(() => {
    if (!activePendingTx) {
      setPendingElapsedSec(0);
      return;
    }

    const timerInterval = setInterval(() => {
      setPendingElapsedSec((prev) => prev + 1);
    }, 1000);

    // Poll backend every 3.5s to detect external `/api/payments/webhook` callback completion
    const pollInterval = setInterval(() => {
      onRefreshProgress().catch(() => {});
    }, 3500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(pollInterval);
    };
  }, [activePendingTx, onRefreshProgress]);

  const handleInitiateMpesaStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPush(true);
    onStatusBanner(null);

    try {
      const amountKes = paymentPlan === 'all' ? 950 : 250;
      const res = await fetch('/api/payments/mpesa/stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({
          user_id: currentUserId,
          phone_number: mpesaPhone,
          amount: amountKes,
          module_id: paymentPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        onStatusBanner({
          type: 'error',
          message: data.error || 'Could not initiate M-Pesa STK Push.',
        });
      } else {
        setActivePendingTx(data.transaction);
        setPendingElapsedSec(0);
        if (firebaseUser && data.transaction) {
          await recordPendingPaymentToFirestore(
            firebaseUser.uid,
            'mpesa',
            amountKes,
            'KES',
            data.transaction.checkout_request_id
          );
        }
        onStatusBanner({
          type: 'info',
          message: `${data.CustomerMessage} (CheckoutRequestID: ${data.CheckoutRequestID}) — Awaiting /api/payments/webhook confirmation.`,
        });
        await onRefreshProgress();
      }
    } catch (err: any) {
      onStatusBanner({
        type: 'error',
        message: err.message || 'M-Pesa STK Push request failed.',
      });
    } finally {
      setIsSubmittingPush(false);
    }
  };

  const handleInitiateStripeCheckout = async () => {
    setIsSubmittingPush(true);
    onStatusBanner(null);
    try {
      const amountUsd = paymentPlan === 'all' ? 15 : 2;
      const res = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({
          user_id: currentUserId,
          email: userEmail,
          amount: amountUsd,
          module_id: paymentPlan,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActivePendingTx(data.transaction);
        setPendingElapsedSec(0);
        if (firebaseUser && data.transaction) {
          await recordPendingPaymentToFirestore(
            firebaseUser.uid,
            'stripe',
            amountUsd,
            'USD',
            data.transaction.checkout_request_id
          );
        }
        onStatusBanner({
          type: 'info',
          message: `Stripe Checkout initialized (${data.checkout_request_id}). Awaiting /api/payments/webhook confirmation.`,
        });
        await onRefreshProgress();
      } else {
        onStatusBanner({
          type: 'error',
          message: data.error || 'Failed to initialize Stripe session.',
        });
      }
    } catch (err: any) {
      onStatusBanner({
        type: 'error',
        message: err.message || 'Stripe checkout initialization failed.',
      });
    } finally {
      setIsSubmittingPush(false);
    }
  };

  const handleTriggerWebhookCallback = async (
    checkoutRequestId: string,
    resultCode: number = 0
  ) => {
    setIsConfirmingWebhook(true);
    onStatusBanner(null);

    try {
      const receipt =
        resultCode === 0
          ? `SJK${Math.floor(1000000 + Math.random() * 9000000)}Z`
          : undefined;

      const callbackBody = {
        Body: {
          stkCallback: {
            MerchantRequestID:
              activePendingTx?.merchant_request_id || '29115-34620561-1',
            CheckoutRequestID: checkoutRequestId,
            ResultCode: resultCode,
            ResultDesc:
              resultCode === 0
                ? 'The service request is processed successfully.'
                : 'Request cancelled by user.',
            CallbackMetadata:
              resultCode === 0
                ? {
                    Item: [
                      { Name: 'Amount', Value: activePendingTx?.amount || 950 },
                      { Name: 'MpesaReceiptNumber', Value: receipt },
                      {
                        Name: 'PhoneNumber',
                        Value: activePendingTx?.phone_number || mpesaPhone,
                      },
                    ],
                  }
                : undefined,
          },
        },
      };

      const res = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callbackBody),
      });

      const data = await res.json();
      setLastWebhookPayload(data);

      if (res.ok) {
        if (resultCode === 0) {
          setActivePendingTx(null);
          onStatusBanner({
            type: 'success',
            message: `Webhook /api/payments/webhook confirmed! Receipt: ${receipt}. Premium Azure Modules unlocked.`,
          });
        } else {
          setActivePendingTx(null);
          onStatusBanner({
            type: 'error',
            message: `Webhook received ResultCode ${resultCode} (Cancelled/Failed). Modules remain locked.`,
          });
        }
        await onRefreshProgress();
      } else {
        onStatusBanner({
          type: 'error',
          message: data.error || 'Webhook confirmation failed.',
        });
      }
    } catch (err: any) {
      onStatusBanner({
        type: 'error',
        message: err.message || 'Error invoking /api/payments/webhook.',
      });
    } finally {
      setIsConfirmingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Grid: Left = STK Push & Pending State Handler | Right = Curriculum Unlock Matrix & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: M-Pesa STK Push Initiator & Live Pending State Tracker */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/40 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Premium Unlock — M-Pesa Express (STK Push)
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Triggers <code className="font-mono font-bold text-emerald-800">POST /api/payments/mpesa/stk-push</code> &amp; awaits <code className="font-mono font-bold text-emerald-800">/api/payments/webhook</code>
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                Daraja 2.0 API
              </span>
            </div>

            <form onSubmit={handleInitiateMpesaStkPush} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  1. Select Premium Curriculum Package
                </label>
                <select
                  value={paymentPlan}
                  onChange={(e) =>
                    setPaymentPlan(
                      e.target.value === 'all' ? 'all' : Number(e.target.value)
                    )
                  }
                  disabled={Boolean(activePendingTx) || isSubmittingPush}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 disabled:opacity-60"
                >
                  <option value="all">
                    Full AZ-900 Pro Curriculum (Unlock Modules 5–12) — KES 950 / $15
                  </option>
                  {[5, 6, 7, 8, 9, 10, 11, 12].map((mId) => (
                    <option key={mId} value={mId}>
                      Module #{mId}: {MODULE_TITLES[mId]} — KES 250 / $2
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  2. Safaricom M-Pesa Phone Number (MSISDN)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    disabled={Boolean(activePendingTx) || isSubmittingPush}
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-mono font-bold text-slate-900 disabled:opacity-60"
                    placeholder="0712345678 or 254712345678"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">
                    KE +254
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingPush || Boolean(activePendingTx)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmittingPush ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching STK Push...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        Initiate M-Pesa STK Push (KES{' '}
                        {paymentPlan === 'all' ? '950' : '250'})
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleInitiateStripeCheckout}
                  disabled={isSubmittingPush || Boolean(activePendingTx)}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Stripe (${paymentPlan === 'all' ? '15' : '2'})</span>
                </button>
              </div>
            </form>

            {/* LIVE PENDING STATE HANDLER (Active until /api/payments/webhook confirms) */}
            {activePendingTx && (
              <div className="p-4 rounded-xl bg-amber-50/95 border-2 border-amber-400 space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-600"></span>
                    </span>
                    <span className="text-xs sm:text-sm font-black text-amber-950">
                      Pending Payment Confirmation ({pendingElapsedSec}s elapsed)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-mono text-[10px] font-black uppercase">
                    STATUS: {activePendingTx.status}
                  </span>
                </div>

                {/* 3-Step STK Push -> Webhook Lifecycle Progress */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-emerald-100/80 border border-emerald-300 text-[11px]">
                    <div className="font-black text-emerald-950 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>1. STK Push Sent</span>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-mono truncate mt-0.5">
                      {activePendingTx.phone_number}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-amber-100 border border-amber-400 text-[11px]">
                    <div className="font-black text-amber-950 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin shrink-0" />
                      <span>2. Handset PIN</span>
                    </div>
                    <div className="text-[10px] text-amber-900 font-mono truncate mt-0.5">
                      {activePendingTx.currency} {activePendingTx.amount}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-amber-300 text-[11px]">
                    <div className="font-black text-slate-700 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                      <span>3. Webhook</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                      /api/payments/webhook
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/90 border border-amber-200 text-[11px] font-mono text-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">CheckoutRequestID:</span>
                    <span className="font-bold text-slate-900">
                      {activePendingTx.checkout_request_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Target Unlock:</span>
                    <span className="font-bold text-emerald-700">
                      {activePendingTx.module_id === 'all'
                        ? 'All 12 AZ-900 Modules (Pro)'
                        : `Module #${activePendingTx.module_id}`}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-amber-900 leading-relaxed">
                  Listening for Safaricom Daraja callback on{' '}
                  <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">
                    POST /api/payments/webhook
                  </code>
                  . Trigger the webhook callback below to simulate immediate PIN completion on the handset:
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isConfirmingWebhook}
                    onClick={() =>
                      handleTriggerWebhookCallback(
                        activePendingTx.checkout_request_id,
                        0
                      )
                    }
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    {isConfirmingWebhook ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Posting to /api/payments/webhook...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Simulate Webhook Success (ResultCode: 0)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isConfirmingWebhook}
                    onClick={() =>
                      handleTriggerWebhookCallback(
                        activePendingTx.checkout_request_id,
                        1032
                      )
                    }
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Simulate user cancelling the STK Push prompt on their phone (ResultCode 1032)"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Cancel (1032)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Module Unlock Status Grid & Transaction Ledger */}
        <div className="lg:col-span-6 space-y-4">
          {/* 12-Module Access Matrix */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0078D4]" />
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  Curriculum Module Access Status
                </h4>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-black ${
                  isPremiumUnlocked
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isPremiumUnlocked
                  ? 'All 12 Modules Unlocked'
                  : `${unlockedModules.length} of 12 Modules Unlocked`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, idx) => idx + 1).map((modId) => {
                const isUnlocked =
                  isPremiumUnlocked ||
                  modId <= 4 ||
                  unlockedModules.includes(modId);
                return (
                  <div
                    key={modId}
                    onClick={() => {
                      if (!isUnlocked && !activePendingTx) {
                        setPaymentPlan(modId);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isUnlocked
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-400 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-black">
                      <span>Module {modId}</span>
                      {isUnlocked ? (
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 truncate mt-0.5">
                      {MODULE_TITLES[modId]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Webhook Transaction Ledger */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-extrabold text-slate-800">
                  M-Pesa &amp; Stripe Transaction Ledger
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {transactions.length} record{transactions.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No payment transactions recorded yet. Initiate an M-Pesa STK Push on the left to test the pending state and webhook unlock flow.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/80"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <span className="uppercase">{tx.gateway}</span>
                        <span>·</span>
                        <span>
                          {tx.currency} {tx.amount}
                        </span>
                        <span>·</span>
                        <span className="text-slate-600">
                          {tx.module_id === 'all'
                            ? 'All 12 Modules'
                            : `Module #${tx.module_id}`}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {tx.checkout_request_id}
                        {tx.receipt_number
                          ? ` · Receipt: ${tx.receipt_number}`
                          : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {tx.status === 'pending' && (
                        <button
                          type="button"
                          disabled={isConfirmingWebhook}
                          onClick={() =>
                            handleTriggerWebhookCallback(
                              tx.checkout_request_id,
                              0
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] cursor-pointer"
                        >
                          Confirm Webhook
                        </button>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          tx.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.status === 'pending'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {lastWebhookPayload && (
            <div className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono space-y-1">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>Last /api/payments/webhook Response</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <pre className="overflow-x-auto text-[10px] text-slate-300">
                {JSON.stringify(lastWebhookPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
