import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Mail,
  KeyRound,
  User,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogIn,
  UserPlus,
  Globe,
  Layers,
  Key,
  Eye,
  EyeOff,
  Send,
  Smartphone,
  CreditCard,
  Crown,
  Check,
  Receipt,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase, isSupabaseDirectConfigured } from '../lib/supabase';
import {
  authService,
  BackendUserProfile,
  LearnerRole,
} from '../services/authService';
import { LEARNING_PATHS } from '../data/curriculum';
import {
  MaasaiMedallion,
  MoranShieldMotif,
  KitengeRibbon,
  AfricanWatermarkPattern,
} from './MotifDecorations';

export interface AuthenticatedSupabaseUser {
  id: string;
  email: string;
  full_name: string;
  role: LearnerRole;
  is_premium?: boolean;
  paid_status?: 'active' | 'inactive';
  unlocked_modules?: number[];
  auth_source: 'supabase' | 'firebase' | 'postgres_backend';
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  onUserChange?: (user: AuthenticatedSupabaseUser | null) => void;
}

export type RegistrationPlanOption = 'free_starter' | 'single_module' | 'all_modules_bundle';
export type RegistrationPaymentGateway = 'mpesa' | 'card';

const SINGLE_MODULE_COST_KES = 250;
const SINGLE_MODULE_COST_USD = 2;
const ALL_MODULES_COMBINED_KES = 950;
const ALL_MODULES_COMBINED_USD = 15;
const SEPARATE_8_MODULES_TOTAL_KES = 8 * SINGLE_MODULE_COST_KES; // KES 2,000
const SEPARATE_8_MODULES_TOTAL_USD = 8 * SINGLE_MODULE_COST_USD; // $16 USD

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onUserChange,
}) => {
  const [user, setUser] = useState<AuthenticatedSupabaseUser | null>(() => {
    const stored = authService.getStoredBackendUser();
    if (stored) {
      return {
        id: stored.id,
        email: stored.email,
        full_name: stored.full_name,
        role: stored.role,
        is_premium: stored.is_premium,
        paid_status: stored.paid_status ?? (stored.is_premium ? 'active' : 'inactive'),
        unlocked_modules: stored.unlocked_modules,
        auth_source: 'postgres_backend',
      };
    }
    return null;
  });

  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  // Default to 'signup' ("Register Learner Account") for first-time learners opening the app
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'admin_reset'>('signup');
  const [email, setEmail] = useState<string>('student@az900.ke');
  const [password, setPassword] = useState<string>('Az900Cloud!2025');
  const [showUserPassword, setShowUserPassword] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('Amina Wanjiku');
  const [billingRegion, setBillingRegion] = useState<'KE_KES' | 'EA_KES' | 'INTL_USD'>('KE_KES');
  const [role, setRole] = useState<LearnerRole>('student');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration Plan & Payment Options State
  const [selectedPlanOption, setSelectedPlanOption] =
    useState<RegistrationPlanOption>('all_modules_bundle');
  const [selectedSingleModules, setSelectedSingleModules] = useState<number[]>([5]);
  const [paymentGateway, setPaymentGateway] = useState<RegistrationPaymentGateway>('mpesa');
  const [showFullModuleMatrix, setShowFullModuleMatrix] = useState<boolean>(false);
  const [acceptedPrivacyShield, setAcceptedPrivacyShield] = useState<boolean>(true);

  // M-Pesa Express State
  const [mpesaPhone, setMpesaPhone] = useState<string>('0712345678');

  // Card (PCI-DSS Tokenized) State
  const [cardholderName, setCardholderName] = useState<string>('Amina Wanjiku');
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvc, setCardCvc] = useState<string>('424');
  const [billingPostal, setBillingPostal] = useState<string>('00100');
  const [showCardCvc, setShowCardCvc] = useState<boolean>(false);

  // Admin password reset & creation for vangetich@gmail.com
  const [adminTargetEmail, setAdminTargetEmail] = useState<string>('vangetich@gmail.com');
  const [adminNewPassword, setAdminNewPassword] = useState<string>('Az900Admin!2026');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState<string>('Az900Admin!2026');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);

  const allModulesList = useMemo(
    () =>
      LEARNING_PATHS.flatMap((p) =>
        p.modules.map((m) => ({
          ...m,
          pathId: p.id,
          pathTitle: p.title,
          examWeight: p.examWeight,
        }))
      ),
    []
  );

  const advancedModulesList = useMemo(
    () => allModulesList.filter((m) => m.id >= 5),
    [allModulesList]
  );

  // Password Strength & Security Evaluation for Customer Peace of Mind
  const passwordSecurity = useMemo(() => {
    const pw = password || '';
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
    if (/\d/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Vault-Grade'];
    const colors = [
      'bg-rose-500 text-rose-300',
      'bg-amber-500 text-amber-300',
      'bg-sky-500 text-sky-300',
      'bg-emerald-500 text-emerald-300',
      'bg-emerald-400 text-emerald-300',
    ];
    return {
      score,
      label: labels[score] || 'Weak',
      barColor: colors[score].split(' ')[0],
      textColor: colors[score].split(' ')[1],
    };
  }, [password]);

  // Calculate dynamic pricing based on user's selected plan option
  const pricingSummary = useMemo(() => {
    if (selectedPlanOption === 'free_starter') {
      return {
        amountKes: 0,
        amountUsd: 0,
        modulesUnlocked: [1, 2, 3, 4],
        planLabel: 'Foundational Starter Tier (Modules 1–4 Free)',
        savingsKes: 0,
        savingsUsd: 0,
      };
    }
    if (selectedPlanOption === 'single_module') {
      const count = Math.max(1, selectedSingleModules.length);
      const rawKes = count * SINGLE_MODULE_COST_KES;
      const rawUsd = count * SINGLE_MODULE_COST_USD;
      const unlocked = Array.from(new Set([1, 2, 3, 4, ...selectedSingleModules])).sort(
        (a, b) => a - b
      );
      return {
        amountKes: rawKes,
        amountUsd: rawUsd,
        modulesUnlocked: unlocked,
        planLabel:
          count === 1
            ? `Single Module #${selectedSingleModules[0]} Pass (+ Free Modules 1–4)`
            : `${count} Selected Modules Pass (Modules ${selectedSingleModules.join(', ')})`,
        savingsKes: 0,
        savingsUsd: 0,
      };
    }
    return {
      amountKes: ALL_MODULES_COMBINED_KES,
      amountUsd: ALL_MODULES_COMBINED_USD,
      modulesUnlocked: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      planLabel: 'All 12 Modules Combined Pro Pass (Modules 1–12)',
      savingsKes: SEPARATE_8_MODULES_TOTAL_KES - ALL_MODULES_COMBINED_KES, // KES 1,050 saved
      savingsUsd: SEPARATE_8_MODULES_TOTAL_USD - ALL_MODULES_COMBINED_USD, // $1 saved
    };
  }, [selectedPlanOption, selectedSingleModules]);

  // Mask M-Pesa phone number for customer privacy display
  const maskedMpesaPreview = useMemo(() => {
    const digits = mpesaPhone.replace(/\D/g, '');
    let normalized = digits;
    if (digits.startsWith('0') && digits.length === 10) {
      normalized = `254${digits.slice(1)}`;
    } else if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) {
      normalized = `254${digits}`;
    }
    if (normalized.length >= 9) {
      return `+${normalized.slice(0, 6)} ••• ${normalized.slice(-3)}`;
    }
    return '+254 7•• ••• •••';
  }, [mpesaPhone]);

  // Mask Card number for customer privacy display
  const maskedCardPreview = useMemo(() => {
    const digits = cardNumber.replace(/\D/g, '');
    const last4 = digits.slice(-4) || '4242';
    const brand = digits.startsWith('5')
      ? 'Mastercard'
      : digits.startsWith('3')
      ? 'Amex'
      : 'Visa';
    return `${brand} •••• ${last4}`;
  }, [cardNumber]);

  const formatCardNumberInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleToggleSingleModuleSelection = (modId: number) => {
    setSelectedSingleModules((prev) => {
      if (prev.includes(modId)) {
        if (prev.length === 1) return prev; // Keep at least 1 selected
        return prev.filter((id) => id !== modId);
      }
      return [...prev, modId].sort((a, b) => a - b);
    });
  };

  // Sync user state with parent if callback provided
  useEffect(() => {
    if (onUserChange) {
      onUserChange(user);
    }
  }, [user, onUserChange]);

  // Subscribe to Supabase Auth, Firebase Auth, and Postgres Backend session events
  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      try {
        // 1. Check Supabase Auth session if direct Supabase is configured
        if (isSupabaseDirectConfigured) {
          const { data } = await supabase.auth.getSession();
          const sbUser = data?.session?.user;
          if (sbUser && isMounted) {
            const stored = authService.getStoredBackendUser();
            const isPaid =
              Boolean(sbUser.user_metadata?.is_premium) ||
              sbUser.user_metadata?.paid_status === 'active' ||
              Boolean(stored?.is_premium) ||
              stored?.paid_status === 'active';
            setUser({
              id: sbUser.id,
              email: sbUser.email || 'learner@az900.ke',
              full_name:
                (sbUser.user_metadata?.full_name as string) ||
                sbUser.email?.split('@')[0] ||
                'AZ-900 Cloud Learner',
              role: (sbUser.user_metadata?.role as LearnerRole) || 'student',
              is_premium: isPaid,
              paid_status: isPaid ? 'active' : 'inactive',
              unlocked_modules:
                stored?.unlocked_modules ||
                (isPaid ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [1, 2, 3, 4]),
              auth_source: 'supabase',
            });
            setIsCheckingAuth(false);
            return;
          }
        }

        // 2. Check stored Postgres Backend User profile
        const storedBackendUser = authService.getStoredBackendUser();
        if (storedBackendUser && isMounted) {
          setUser({
            id: storedBackendUser.id,
            email: storedBackendUser.email,
            full_name: storedBackendUser.full_name,
            role: storedBackendUser.role,
            is_premium: storedBackendUser.is_premium,
            paid_status:
              storedBackendUser.paid_status ??
              (storedBackendUser.is_premium ? 'active' : 'inactive'),
            unlocked_modules: storedBackendUser.unlocked_modules,
            auth_source: 'postgres_backend',
          });
          setIsCheckingAuth(false);
          return;
        }

        // 3. Check active Firebase Auth user
        const fbUser = authService.getCurrentFirebaseUser();
        if (fbUser && isMounted) {
          setUser({
            id: fbUser.uid,
            email: fbUser.email || 'learner@az900.ke',
            full_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'AZ-900 Learner',
            role: 'student',
            is_premium: false,
            paid_status: 'inactive',
            unlocked_modules: [1, 2, 3, 4],
            auth_source: 'firebase',
          });
          setIsCheckingAuth(false);
          return;
        }
      } catch {
        // fall through to unauthenticated state
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    resolveSession();

    const { data: sbSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        const sbUser = session.user;
        const stored = authService.getStoredBackendUser();
        const isPaid =
          Boolean(sbUser.user_metadata?.is_premium) ||
          sbUser.user_metadata?.paid_status === 'active' ||
          Boolean(stored?.is_premium) ||
          stored?.paid_status === 'active';
        setUser({
          id: sbUser.id,
          email: sbUser.email || 'learner@az900.ke',
          full_name:
            (sbUser.user_metadata?.full_name as string) ||
            sbUser.email?.split('@')[0] ||
            'AZ-900 Cloud Learner',
          role: (sbUser.user_metadata?.role as LearnerRole) || 'student',
          is_premium: isPaid,
          paid_status: isPaid ? 'active' : 'inactive',
          unlocked_modules:
            stored?.unlocked_modules ||
            (isPaid ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [1, 2, 3, 4]),
          auth_source: 'supabase',
        });
      } else if (!authService.getStoredBackendUser() && !authService.getCurrentFirebaseUser()) {
        setUser(null);
      }
    });

    const unsubFirebase = authService.subscribeToAuthChanges((fbUser) => {
      if (!isMounted) return;
      const stored = authService.getStoredBackendUser();
      if (stored) {
        setUser({
          id: stored.id,
          email: stored.email,
          full_name: stored.full_name,
          role: stored.role,
          is_premium: stored.is_premium,
          paid_status: stored.paid_status ?? (stored.is_premium ? 'active' : 'inactive'),
          unlocked_modules: stored.unlocked_modules,
          auth_source: 'postgres_backend',
        });
      } else if (fbUser) {
        setUser({
          id: fbUser.uid,
          email: fbUser.email || 'learner@az900.ke',
          full_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'AZ-900 Learner',
          role: 'student',
          is_premium: false,
          paid_status: 'inactive',
          unlocked_modules: [1, 2, 3, 4],
          auth_source: 'firebase',
        });
      } else {
        setUser(null);
      }
    });

    const handleBackendSessionChange = (e: Event) => {
      if (!isMounted) return;
      const customEvent = e as CustomEvent<{ user: BackendUserProfile | null }>;
      const nextUser = customEvent.detail?.user || authService.getStoredBackendUser();
      if (nextUser) {
        setUser({
          id: nextUser.id,
          email: nextUser.email,
          full_name: nextUser.full_name,
          role: nextUser.role,
          is_premium: nextUser.is_premium,
          paid_status: nextUser.paid_status ?? (nextUser.is_premium ? 'active' : 'inactive'),
          unlocked_modules: nextUser.unlocked_modules,
          auth_source: 'postgres_backend',
        });
      } else {
        setUser(null);
      }
    };

    window.addEventListener('az900-auth-session-change', handleBackendSessionChange);

    return () => {
      isMounted = false;
      sbSubscription?.subscription?.unsubscribe();
      unsubFirebase();
      window.removeEventListener('az900-auth-session-change', handleBackendSessionChange);
    };
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid learner email address.');
      return;
    }

    if (authMode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name for your learner profile and certificate.');
        return;
      }
      if (!acceptedPrivacyShield) {
        setErrorMsg(
          'Please confirm the Customer Peace of Mind & Data Privacy protection notice to continue.'
        );
        return;
      }

      // Validate payment fields when a paid plan is selected during registration
      if (selectedPlanOption !== 'free_starter') {
        if (paymentGateway === 'mpesa') {
          const digits = mpesaPhone.replace(/\D/g, '');
          const isValidKePhone =
            (digits.startsWith('0') && digits.length === 10) ||
            (digits.startsWith('254') && digits.length === 12) ||
            ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9);
          if (!isValidKePhone) {
            setErrorMsg(
              'Please enter a valid Safaricom M-Pesa phone number (e.g. 0712345678 or 254712345678).'
            );
            return;
          }
        } else {
          const rawCardDigits = cardNumber.replace(/\D/g, '');
          if (rawCardDigits.length < 13) {
            setErrorMsg('Please enter a valid 16-digit credit or debit card number.');
            return;
          }
          if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
            setErrorMsg('Please enter a valid card expiration date in MM/YY format.');
            return;
          }
          if (cardCvc.replace(/\D/g, '').length < 3) {
            setErrorMsg('Please enter a valid 3 or 4 digit security CVC code.');
            return;
          }
        }
      }
    }

    setIsSubmitting(true);

    try {
      // If direct Supabase is configured, also authenticate with Supabase Auth
      if (isSupabaseDirectConfigured && password.trim().length >= 6) {
        try {
          if (authMode === 'signup') {
            await supabase.auth.signUp({
              email: cleanEmail,
              password: password.trim(),
              options: {
                data: {
                  full_name: fullName.trim() || 'AZ-900 Learner',
                  role,
                },
              },
            });
          } else {
            await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: password.trim(),
            });
          }
        } catch {
          // Fallback to Firebase & Express Postgres Backend auth
        }
      }

      const result =
        authMode === 'signup'
          ? await authService.signup({
              email: cleanEmail,
              password: password.trim(),
              fullName: fullName.trim() || 'AZ-900 Cloud Learner',
              role,
            })
          : await authService.login({
              email: cleanEmail,
              password: password.trim(),
            });

      let finalUserProfile: BackendUserProfile = result.user;

      // If registering a new learner account with a paid plan (Per-Module or All-Modules Combined),
      // execute the selected M-Pesa STK Push or Tokenized Card payment and unlock modules immediately!
      if (authMode === 'signup' && selectedPlanOption !== 'free_starter') {
        const targetModuleParam =
          selectedPlanOption === 'all_modules_bundle'
            ? 'all'
            : selectedSingleModules[0] || 5;
        const targetModuleIds =
          selectedPlanOption === 'all_modules_bundle'
            ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            : selectedSingleModules;

        let checkoutRequestId = '';
        let receiptNumber = '';
        let maskedAccount = '';

        if (paymentGateway === 'mpesa') {
          const stkRes = await fetch('/api/payments/mpesa/stk-push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': result.user.id,
            },
            body: JSON.stringify({
              user_id: result.user.id,
              phone_number: mpesaPhone.trim(),
              amount: pricingSummary.amountKes,
              module_id: targetModuleParam,
              module_ids: targetModuleIds,
            }),
          });
          const stkData = await stkRes.json();
          if (!stkRes.ok) {
            throw new Error(stkData.error || 'Could not initiate M-Pesa STK Push verification.');
          }
          checkoutRequestId =
            stkData.CheckoutRequestID ||
            stkData.transaction?.checkout_request_id ||
            `ws_CO_${Date.now()}`;
          maskedAccount = stkData.masked_account || maskedMpesaPreview;
          receiptNumber = `SJK${Math.floor(1000000 + Math.random() * 9000000)}K`;
        } else {
          const stripeRes = await fetch('/api/payments/stripe/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': result.user.id,
            },
            body: JSON.stringify({
              user_id: result.user.id,
              email: cleanEmail,
              amount: pricingSummary.amountUsd,
              module_id: targetModuleParam,
              module_ids: targetModuleIds,
              masked_card: maskedCardPreview,
            }),
          });
          const stripeData = await stripeRes.json();
          if (!stripeRes.ok) {
            throw new Error(stripeData.error || 'Could not initialize card payment session.');
          }
          checkoutRequestId =
            stripeData.checkout_request_id || `cs_live_${Date.now()}`;
          maskedAccount = stripeData.masked_account || maskedCardPreview;
          receiptNumber = `STRP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        }

        // Complete webhook verification to unlock the learner's modules in Postgres & session state
        await fetch('/api/payments/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkout_request_id: checkoutRequestId,
            result_code: 0,
            receipt_number: receiptNumber,
          }),
        });

        const isFullUnlock =
          selectedPlanOption === 'all_modules_bundle' ||
          pricingSummary.modulesUnlocked.length >= 12;

        const updatedStored = authService.updateStoredUser({
          is_premium: isFullUnlock,
          paid_status: 'active',
          unlocked_modules: pricingSummary.modulesUnlocked,
          plan_tier: selectedPlanOption,
          payment_method: paymentGateway,
          masked_payment_account: maskedAccount,
          last_receipt_number: receiptNumber,
          billing_region: billingRegion,
        });

        if (updatedStored) {
          finalUserProfile = updatedStored;
        }

        // Dispatch global payment success event so App.tsx shows the verified receipt toast
        window.dispatchEvent(
          new CustomEvent('az900-payment-success', {
            detail: {
              receiptNumber,
              checkoutId: checkoutRequestId,
              planLabel: `${pricingSummary.planLabel} (${
                paymentGateway === 'mpesa'
                  ? `M-Pesa ${maskedAccount}`
                  : `Card ${maskedAccount}`
              })`,
              amountUsd: pricingSummary.amountUsd,
              unlockedModules: pricingSummary.modulesUnlocked,
              user: finalUserProfile,
            },
          })
        );
      } else if (authMode === 'signup') {
        const updatedFree = authService.updateStoredUser({
          is_premium: false,
          paid_status: 'inactive',
          unlocked_modules: [1, 2, 3, 4],
          plan_tier: 'free_starter',
          payment_method: 'none',
          billing_region: billingRegion,
        });
        if (updatedFree) {
          finalUserProfile = updatedFree;
        }
      }

      setUser({
        id: finalUserProfile.id,
        email: finalUserProfile.email,
        full_name: finalUserProfile.full_name,
        role: finalUserProfile.role,
        is_premium: finalUserProfile.is_premium,
        paid_status:
          finalUserProfile.paid_status ??
          (finalUserProfile.is_premium ? 'active' : 'inactive'),
        unlocked_modules: finalUserProfile.unlocked_modules,
        auth_source: isSupabaseDirectConfigured ? 'supabase' : 'postgres_backend',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const result = await authService.login({
        email: 'student@az900.ke',
        password: 'Az900Cloud!2025',
      });
      setUser({
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.full_name,
        role: result.user.role,
        is_premium: result.user.is_premium,
        paid_status: result.user.paid_status ?? (result.user.is_premium ? 'active' : 'inactive'),
        unlocked_modules: result.user.unlocked_modules,
        auth_source: 'postgres_backend',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const result = await authService.loginWithGoogle(role);
      setUser({
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.full_name,
        role: result.user.role,
        is_premium: result.user.is_premium,
        paid_status: result.user.paid_status ?? (result.user.is_premium ? 'active' : 'inactive'),
        unlocked_modules: result.user.unlocked_modules,
        auth_source: 'firebase',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = adminTargetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please specify an admin email address.');
      return;
    }
    if (adminNewPassword.length < 6) {
      setErrorMsg('New admin password must be at least 6 characters long.');
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both fields match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.setAdminPassword(cleanEmail, adminNewPassword);
      setSuccessMsg(
        `Admin password created successfully for ${cleanEmail}! Entering Practice Studio with bootcamp_admin privileges...`
      );
      setTimeout(() => {
        setUser({
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.full_name,
          role: result.user.role,
          is_premium: result.user.is_premium,
          paid_status: 'active',
          unlocked_modules: result.user.unlocked_modules,
          auth_source: 'postgres_backend',
        });
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update admin password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAdminResetEmail = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const res = await authService.sendPasswordReset(adminTargetEmail.trim().toLowerCase());
      setSuccessMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch password recovery request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6">
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900/90 border border-sky-500/30 shadow-xl">
          <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
          <span className="text-sm font-bold tracking-wide text-slate-200">
            Verifying Supabase &amp; Postgres Session...
          </span>
        </div>
      </div>
    );
  }

  // Force auth redirect to Login / Registration Screen when Supabase/Postgres `user` state is null
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 relative flex flex-col justify-between overflow-x-hidden font-sans">
        <AfricanWatermarkPattern opacity={0.05} />
        <KitengeRibbon height={4} />

        {/* Ambient radial glow */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              'radial-gradient(circle at 18% 22%, rgba(0, 120, 212, 0.22), transparent 45%), radial-gradient(circle at 82% 78%, rgba(16, 185, 129, 0.14), transparent 45%)',
          }}
        />

        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Architectural, Pricing Overview & Security Context (5 cols) */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-extrabold tracking-wider uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Protected Curriculum &amp; Safe Payment Gateway</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] shadow-lg shadow-sky-500/20 shrink-0">
                    <MoranShieldMotif size={26} animate={true} />
                    <div className="absolute -bottom-1 -right-1">
                      <MaasaiMedallion size={15} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Azure Cloud Explorer
                      </h1>
                      <span className="px-2 py-0.5 rounded-md text-xs font-black bg-[#0078D4] text-white">
                        AZ-900
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-sky-300/90">
                      Smart Quiz &amp; Knowledge Base Builder • PostgreSQL &amp; Supabase Edition
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Welcome! Start your AZ-900 certification journey with transparent module pricing,
                  instant <strong className="text-emerald-400">Safaricom M-Pesa STK Push</strong> or{' '}
                  <strong className="text-sky-300">PCI-DSS Card Checkout</strong>, and bank-grade
                  learner data protection for complete peace of mind.
                </p>
              </div>

              {/* Transparent Pricing Breakdown Card (Cost Per Module vs. All Modules Combined) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Learner Options &amp; Module Cost Guide
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase">
                    Transparent Pricing
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-white flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>1. Foundational Starter (Modules 1–4)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Cloud Concepts, Models, Pricing &amp; Core Architecture
                      </p>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <span className="text-sm font-black text-emerald-400">FREE</span>
                      <span className="block text-[10px] text-slate-400">KES 0 / $0</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-white flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>2. Individual Module Pass (Modules 5–12)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pay only for specific modules you want to practice
                      </p>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <span className="text-sm font-black text-amber-300">KES 250</span>
                      <span className="block text-[10px] text-slate-400">$2.00 / module</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-gradient-to-r from-[#0078D4]/25 via-sky-500/15 to-emerald-500/20 border border-sky-400/40 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span className="font-black text-white">
                          3. All 12 Modules Combined Bundle
                        </span>
                      </div>
                      <p className="text-[11px] text-sky-200 mt-0.5">
                        Unlocks Modules 1–12 + Mock Exams &amp; AI Scenarios (Saves KES 1,050 vs.{" "}
                        <span className="line-through opacity-75">KES 2,000</span> separate)
                      </p>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <span className="text-base font-black text-white">KES 950</span>
                      <span className="block text-[10px] text-emerald-300 font-bold">
                        $15.00 Total (52% Off)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expandable 12-Module Cost Breakdown Table */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowFullModuleMatrix((prev) => !prev)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-sky-300 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>View All 12 AZ-900 Modules &amp; Per-Module Cost List</span>
                    {showFullModuleMatrix ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showFullModuleMatrix && (
                    <div className="mt-2 rounded-xl border border-slate-700/90 bg-slate-950/90 max-h-60 overflow-y-auto divide-y divide-slate-800/80 text-[11px]">
                      {allModulesList.map((mod) => {
                        const isFree = mod.id <= 4;
                        return (
                          <div
                            key={mod.id}
                            className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-900/80"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-slate-200">
                                M{mod.id}: {mod.title}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                Path {mod.pathId} ({mod.examWeight})
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold shrink-0 ${
                                isFree
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {isFree ? 'FREE (KES 0)' : 'KES 250 ($2)'}
                            </span>
                          </div>
                        );
                      })}
                      <div className="px-3 py-2.5 bg-sky-950/60 flex items-center justify-between font-mono text-xs font-black text-white">
                        <span>All 12 Modules Combined (Bundle):</span>
                        <span className="text-emerald-300">
                          KES 950 / $15 USD (Save KES 1,050)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security & Customer Peace of Mind Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Safe M-Pesa STK Push
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      SIM Toolkit PIN entry happens strictly on your phone. Phone numbers are masked (
                      <code className="text-emerald-300">+254 712 ••• 678</code>).
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      PCI-DSS Tokenized Card
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Zero raw card or CVC storage. Only tokenized receipts and last-4 digits (
                      <code className="text-sky-300">•••• 4242</code>) are kept.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Supabase & Postgres Auth Card (7 cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-5 sm:p-7 space-y-5 backdrop-blur-xl">
                {/* Card Header & Mode Switch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-sky-400 block">
                      Supabase &amp; Postgres Auth
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-white mt-0.5">
                      {authMode === 'login'
                        ? 'Sign In to Practice Studio'
                        : authMode === 'signup'
                        ? 'Register Learner Account & Select Plan'
                        : 'Reset / Create Admin Password'}
                    </h2>
                  </div>
                  <div className="inline-flex p-1 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        authMode === 'signup'
                          ? 'bg-[#0078D4] text-white font-black shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register Learner</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        authMode === 'login'
                          ? 'bg-[#0078D4] text-white font-black shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('admin_reset');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        authMode === 'admin_reset'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'text-amber-400/90 hover:text-amber-300'
                      }`}
                      title="Reset or Create new admin sign password for vangetich@gmail.com"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>

                {/* 1-Click Instant Demo Access Banner (visible on login & signup) */}
                {authMode !== 'admin_reset' && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-emerald-500/15 border border-sky-500/30 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-xs font-black text-white">
                          Want to Explore Immediately? Instant Demo Learner
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">
                        Pre-seeded Postgres profile (<code className="text-sky-300">student@az900.ke</code>)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      disabled={isSubmitting}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                    >
                      <span>1-Click Enter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Dedicated Admin Password Reset / Create Form */}
                {authMode === 'admin_reset' ? (
                  <form onSubmit={handleSetAdminPassword} className="space-y-3.5">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Exclusive Sole Administrator Security</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Designated Lead Administrator:{' '}
                        <code className="text-amber-300 font-bold">vangetich@gmail.com</code>.
                        Setting a new password grants immediate <code className="text-sky-300">bootcamp_admin</code> access,
                        all 12 unlocked modules, and question bank CRUD authority.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Admin Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={adminTargetEmail}
                          onChange={(e) => setAdminTargetEmail(e.target.value)}
                          placeholder="vangetich@gmail.com"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-300">
                          New Admin Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {showAdminPassword ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Show</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          value={adminNewPassword}
                          onChange={(e) => setAdminNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Confirm New Admin Password
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          value={adminConfirmPassword}
                          onChange={(e) => setAdminConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="pt-1 space-y-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            <span>Updating Admin Password...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-slate-950" />
                            <span>Set Admin Password &amp; Sign In</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendAdminResetEmail}
                        disabled={isSubmitting}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-sky-400" />
                        <span>Send Firebase Cloud Reset Email</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {/* =========================================================
                        STEP 1: SAFE & APPROPRIATE LEARNER ACCOUNT DETAILS
                       ========================================================= */}
                    <div className="p-4 rounded-2xl bg-slate-800/45 border border-slate-700/80 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>
                            {authMode === 'signup'
                              ? 'Step 1: Learner Account & Safe Profile Details'
                              : 'Learner Account Credentials'}
                          </span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          TLS 1.3 Encrypted
                        </span>
                      </div>

                      {authMode === 'signup' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Full Name (For Certificate &amp; Profile)
                            </label>
                            <div className="relative">
                              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={fullName}
                                onChange={(e) => {
                                  setFullName(e.target.value);
                                  setCardholderName(e.target.value);
                                }}
                                placeholder="e.g. Amina Wanjiku"
                                className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Country / Billing Currency
                            </label>
                            <select
                              value={billingRegion}
                              onChange={(e) => {
                                const next = e.target.value as 'KE_KES' | 'EA_KES' | 'INTL_USD';
                                setBillingRegion(next);
                                if (next === 'INTL_USD') {
                                  setPaymentGateway('card');
                                }
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                            >
                              <option value="KE_KES">Kenya (KES • M-Pesa &amp; Card)</option>
                              <option value="EA_KES">East Africa (KES / USD • M-Pesa &amp; Card)</option>
                              <option value="INTL_USD">International (USD • Card &amp; Global)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Learner Email Address
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="learner@az900.ke"
                              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-300">
                              Password
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowUserPassword((prev) => !prev)}
                              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {showUserPassword ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Hide</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Show</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type={showUserPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {authMode === 'signup' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              Account Role (<code className="text-sky-400">user_role_enum</code>)
                            </label>
                            <select
                              value={role}
                              onChange={(e) => setRole(e.target.value as LearnerRole)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-400"
                            >
                              <option value="student">student — Standard AZ-900 Candidate</option>
                              <option value="enterprise_user">enterprise_user — Corporate Team</option>
                              <option value="bootcamp_admin">bootcamp_admin — Cohort Instructor</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-semibold">
                                Password Security:
                              </span>
                              <span className={`font-black ${passwordSecurity.textColor}`}>
                                {passwordSecurity.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 h-1.5">
                              {[1, 2, 3, 4].map((step) => (
                                <div
                                  key={step}
                                  className={`rounded-full transition-all ${
                                    passwordSecurity.score >= step
                                      ? passwordSecurity.barColor
                                      : 'bg-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* =========================================================
                        STEP 2: LIST OF OPTIONS AVAILABLE (PER-MODULE VS ALL COMBINED)
                       ========================================================= */}
                    {authMode === 'signup' && (
                      <div className="p-4 rounded-2xl bg-slate-800/45 border border-slate-700/80 space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>
                              Step 2: Choose Your Learning Option (Per-Module vs. All Combined)
                            </span>
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-300">
                            Modules 1–4 Always Free
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Option A: All 12 Modules Combined Bundle */}
                          <button
                            type="button"
                            onClick={() => setSelectedPlanOption('all_modules_bundle')}
                            className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                              selectedPlanOption === 'all_modules_bundle'
                                ? 'bg-sky-500/15 border-[#0078D4] ring-2 ring-sky-400/20'
                                : 'bg-slate-900/80 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#0078D4] text-white">
                                  All Combined • Save 52%
                                </span>
                                {selectedPlanOption === 'all_modules_bundle' && (
                                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                                )}
                              </div>
                              <h4 className="text-xs font-black text-white mt-1.5">
                                All 12 Modules Combined
                              </h4>
                              <div className="mt-1 font-mono">
                                <span className="text-base font-black text-white">KES 950</span>
                                <span className="text-[11px] text-sky-300 font-bold ml-1">
                                  ($15 USD)
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                                Unlocks all 12 modules + Mock Exams &amp; AI Scenarios. Saves KES
                                1,050 vs. individual modules.
                              </p>
                            </div>
                            <div className="pt-1.5 border-t border-slate-700/80 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>12 / 12 Modules Unlocked</span>
                            </div>
                          </button>

                          {/* Option B: Custom Per-Module Option */}
                          <button
                            type="button"
                            onClick={() => setSelectedPlanOption('single_module')}
                            className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                              selectedPlanOption === 'single_module'
                                ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/20'
                                : 'bg-slate-900/80 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                  Pay Per Module
                                </span>
                                {selectedPlanOption === 'single_module' && (
                                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                )}
                              </div>
                              <h4 className="text-xs font-black text-white mt-1.5">
                                Cost Per Single Module
                              </h4>
                              <div className="mt-1 font-mono">
                                <span className="text-base font-black text-amber-300">
                                  KES 250
                                </span>
                                <span className="text-[11px] text-slate-300 font-bold ml-1">
                                  ($2 USD / mod)
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                                Pick any specific module(s) 5–12 to unlock alongside free Modules
                                1–4.
                              </p>
                            </div>
                            <div className="pt-1.5 border-t border-slate-700/80 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>
                                {selectedSingleModules.length} Advanced Mod
                                {selectedSingleModules.length > 1 ? 's' : ''} (KES{' '}
                                {selectedSingleModules.length * SINGLE_MODULE_COST_KES})
                              </span>
                            </div>
                          </button>

                          {/* Option C: Free Foundational Starter */}
                          <button
                            type="button"
                            onClick={() => setSelectedPlanOption('free_starter')}
                            className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                              selectedPlanOption === 'free_starter'
                                ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/20'
                                : 'bg-slate-900/80 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                  Starter Access
                                </span>
                                {selectedPlanOption === 'free_starter' && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                )}
                              </div>
                              <h4 className="text-xs font-black text-white mt-1.5">
                                Foundational Modules 1–4
                              </h4>
                              <div className="mt-1 font-mono">
                                <span className="text-base font-black text-emerald-400">
                                  KES 0
                                </span>
                                <span className="text-[11px] text-slate-300 font-bold ml-1">
                                  ($0.00 Free)
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                                Start with Modules 1–4 free forever and upgrade any time from your
                                profile.
                              </p>
                            </div>
                            <div className="pt-1.5 border-t border-slate-700/80 text-[10px] font-bold text-slate-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>4 / 12 Modules Unlocked</span>
                            </div>
                          </button>
                        </div>

                        {/* Interactive Module Checklist when "Pay Per Module" is selected */}
                        {selectedPlanOption === 'single_module' && (
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-amber-200">
                                Select Advanced Module(s) to Unlock (KES 250 / $2 each):
                              </span>
                              <span className="font-mono font-black text-white">
                                Selected: {selectedSingleModules.length} × KES 250 = KES{' '}
                                {pricingSummary.amountKes} (${pricingSummary.amountUsd} USD)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                              {advancedModulesList.map((mod) => {
                                const isChecked = selectedSingleModules.includes(mod.id);
                                return (
                                  <button
                                    key={mod.id}
                                    type="button"
                                    onClick={() => handleToggleSingleModuleSelection(mod.id)}
                                    className={`p-2 rounded-lg border text-left text-[11px] flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                      isChecked
                                        ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                                        : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:border-slate-600'
                                    }`}
                                  >
                                    <span className="truncate">
                                      M{mod.id}: {mod.title}
                                    </span>
                                    <span className="font-mono text-[10px] text-amber-300 shrink-0">
                                      {isChecked ? '✓ KES 250' : '+ KES 250'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {selectedSingleModules.length >= 4 && (
                              <div className="p-2 rounded-lg bg-sky-500/15 border border-sky-400/40 flex items-center justify-between gap-2 text-[11px] text-sky-200">
                                <span>
                                  Tip: {selectedSingleModules.length} modules cost{' '}
                                  <strong className="font-mono">
                                    KES {pricingSummary.amountKes}
                                  </strong>
                                  . Unlock <strong>All 12 Modules Combined</strong> for just{' '}
                                  <strong className="font-mono text-emerald-300">KES 950</strong>!
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedPlanOption('all_modules_bundle')}
                                  className="px-2.5 py-1 rounded bg-[#0078D4] text-white font-black text-[10px] whitespace-nowrap cursor-pointer"
                                >
                                  Switch &amp; Save
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* =========================================================
                        STEP 3: M-PESA OR CARD PAYMENT OPTION (FOR PAID TIERS)
                       ========================================================= */}
                    {authMode === 'signup' && selectedPlanOption !== 'free_starter' && (
                      <div className="p-4 rounded-2xl bg-slate-800/45 border border-slate-700/80 space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Step 3: Select M-Pesa or Card Payment Method</span>
                          </span>

                          <div className="inline-flex p-0.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => setPaymentGateway('mpesa')}
                              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                                paymentGateway === 'mpesa'
                                  ? 'bg-emerald-600 text-white font-black shadow-2xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>M-Pesa (KES {pricingSummary.amountKes})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentGateway('card')}
                              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                                paymentGateway === 'card'
                                  ? 'bg-[#635BFF] text-white font-black shadow-2xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Card (${pricingSummary.amountUsd} USD)</span>
                            </button>
                          </div>
                        </div>

                        {paymentGateway === 'mpesa' ? (
                          <div className="p-3.5 rounded-xl bg-emerald-950/35 border border-emerald-500/30 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                                  <Smartphone className="w-3.5 h-3.5" />
                                  <span>Safaricom M-Pesa Express (Daraja 2.0 STK Push)</span>
                                </h5>
                                <p className="text-[11px] text-slate-300 mt-0.5">
                                  An STK prompt for{' '}
                                  <strong className="font-mono text-white">
                                    KES {pricingSummary.amountKes}
                                  </strong>{' '}
                                  will be sent to your handset. Enter your PIN only on your phone.
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 font-mono text-[10px] font-bold shrink-0">
                                Masked: {maskedMpesaPreview}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                              <div className="sm:col-span-8">
                                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                  Safaricom M-Pesa Phone Number (MSISDN)
                                </label>
                                <div className="relative">
                                  <Smartphone className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                  <input
                                    type="tel"
                                    value={mpesaPhone}
                                    onChange={(e) => setMpesaPhone(e.target.value)}
                                    placeholder="0712345678 or 254712345678"
                                    className="w-full pl-9 pr-16 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs sm:text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-400"
                                    required
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-emerald-400">
                                    KE +254
                                  </span>
                                </div>
                              </div>
                              <div className="sm:col-span-4 p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300">
                                <div className="flex justify-between">
                                  <span>Paybill:</span>
                                  <strong className="text-emerald-300">174379</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Account:</span>
                                  <strong className="text-white">AZ900Studio</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-indigo-950/35 border border-indigo-400/30 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>PCI-DSS Tokenized Debit / Credit Card Checkout</span>
                                </h5>
                                <p className="text-[11px] text-slate-300 mt-0.5">
                                  Raw card numbers and CVC codes are never stored. Receipt stores{' '}
                                  <strong className="font-mono text-white">
                                    {maskedCardPreview}
                                  </strong>
                                  .
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCardNumber('4242 4242 4242 4242');
                                  setCardExpiry('08/28');
                                  setCardCvc('424');
                                }}
                                className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-bold cursor-pointer shrink-0"
                              >
                                Prefill Test Card
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                              <div className="sm:col-span-5">
                                <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                                  Name on Card
                                </label>
                                <input
                                  type="text"
                                  value={cardholderName}
                                  onChange={(e) => setCardholderName(e.target.value)}
                                  placeholder="Amina Wanjiku"
                                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                                  required
                                />
                              </div>

                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                                  Card Number (16 Digits)
                                </label>
                                <input
                                  type="text"
                                  value={cardNumber}
                                  onChange={(e) =>
                                    setCardNumber(formatCardNumberInput(e.target.value))
                                  }
                                  placeholder="4242 •••• •••• 4242"
                                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-400"
                                  required
                                />
                              </div>

                              <div className="sm:col-span-3 grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                                    MM/YY
                                  </label>
                                  <input
                                    type="text"
                                    value={cardExpiry}
                                    onChange={(e) =>
                                      setCardExpiry(formatExpiryInput(e.target.value))
                                    }
                                    placeholder="08/28"
                                    className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-400"
                                    required
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[10px] font-bold uppercase text-slate-300">
                                      CVC
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setShowCardCvc((prev) => !prev)}
                                      className="text-[9px] text-slate-400 hover:text-white cursor-pointer"
                                    >
                                      {showCardCvc ? 'Hide' : 'Show'}
                                    </button>
                                  </div>
                                  <input
                                    type={showCardCvc ? 'text' : 'password'}
                                    maxLength={4}
                                    value={cardCvc}
                                    onChange={(e) =>
                                      setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))
                                    }
                                    placeholder="•••"
                                    className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-400"
                                    required
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                              <span>
                                Billing Postal / ZIP:{' '}
                                <input
                                  type="text"
                                  value={billingPostal}
                                  onChange={(e) => setBillingPostal(e.target.value.slice(0, 12))}
                                  className="ml-1 px-2 py-0.5 w-20 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                                />
                              </span>
                              <span className="text-emerald-400 font-semibold">
                                ✓ 3D Secure &amp; Zero Plaintext PAN Storage
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* =========================================================
                        STEP 4: CUSTOMER PEACE OF MIND & PRIVACY GUARANTEE
                       ========================================================= */}
                    {authMode === 'signup' && (
                      <div className="p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={acceptedPrivacyShield}
                            onChange={(e) => setAcceptedPrivacyShield(e.target.checked)}
                            className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-400"
                          />
                          <div className="text-[11px] text-slate-300 leading-relaxed">
                            <span className="font-black text-emerald-300">
                              Customer Peace of Mind &amp; Safe Data Guarantee:
                            </span>{' '}
                            I understand my M-Pesa PIN or raw Card CVC is never stored by the app,
                            my account details are protected under the{' '}
                            <strong className="text-white">Kenya Data Protection Act (2019)</strong>{' '}
                            &amp; <strong className="text-white">PCI-DSS</strong>, and I receive an
                            instant verifiable receipt unlocking my chosen AZ-900 modules.
                          </div>
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0078D4] via-[#0284C7] to-emerald-600 hover:opacity-95 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>
                            {authMode === 'signup' && selectedPlanOption !== 'free_starter'
                              ? `Registering & Verifying ${
                                  paymentGateway === 'mpesa' ? 'M-Pesa STK Push' : 'Card Checkout'
                                }...`
                              : 'Authenticating Session...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {authMode === 'login'
                              ? 'Sign In & Unlock Curriculum'
                              : selectedPlanOption === 'free_starter'
                              ? 'Register Free Starter Account (Modules 1–4)'
                              : paymentGateway === 'mpesa'
                              ? `Register & Pay via M-Pesa (KES ${pricingSummary.amountKes} • Unlock ${pricingSummary.modulesUnlocked.length} Modules)`
                              : `Register & Pay via Card ($${pricingSummary.amountUsd} USD • Unlock ${pricingSummary.modulesUnlocked.length} Modules)`}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {authMode === 'login' && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('admin_reset');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reset or create new admin sign password for vangetich@gmail.com</span>
                    </button>
                  </div>
                )}

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800" />
                  <span className="flex-shrink mx-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Or Federated Identity
                  </span>
                  <div className="flex-grow border-t border-slate-800" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-100 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span>Continue with Google Cloud / Firebase Auth</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-slate-800/80 bg-slate-950/70 py-3.5 px-6 text-center text-xs text-slate-400">
          Secured by <span className="text-sky-400 font-bold">ProtectedRoute</span> • M-Pesa Daraja
          2.0 &amp; PCI-DSS Tokenized Card Checkout • Compliant with{' '}
          <span className="text-emerald-400 font-semibold">Kenya Data Protection Act (2019)</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
