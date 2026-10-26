import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
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
  ShieldAlert,
  Send,
} from 'lucide-react';
import { supabase, isSupabaseDirectConfigured } from '../lib/supabase';
import {
  authService,
  BackendUserProfile,
  LearnerRole,
} from '../services/authService';
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
  unlocked_modules?: number[];
  auth_source: 'supabase' | 'firebase' | 'postgres_backend';
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  onUserChange?: (user: AuthenticatedSupabaseUser | null) => void;
}

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
        unlocked_modules: stored.unlocked_modules,
        auth_source: 'postgres_backend',
      };
    }
    return null;
  });

  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'admin_reset'>('login');
  const [email, setEmail] = useState<string>('student@az900.ke');
  const [password, setPassword] = useState<string>('Az900Cloud!2025');
  const [fullName, setFullName] = useState<string>('Nairobi Cloud Scholar');
  const [role, setRole] = useState<LearnerRole>('student');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin password reset & creation for vangetich@gmail.com
  const [adminTargetEmail, setAdminTargetEmail] = useState<string>('vangetich@gmail.com');
  const [adminNewPassword, setAdminNewPassword] = useState<string>('Az900Admin!2026');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState<string>('Az900Admin!2026');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);

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
            setUser({
              id: sbUser.id,
              email: sbUser.email || 'learner@az900.ke',
              full_name:
                (sbUser.user_metadata?.full_name as string) ||
                sbUser.email?.split('@')[0] ||
                'AZ-900 Cloud Learner',
              role: (sbUser.user_metadata?.role as LearnerRole) || 'student',
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

    // Listen to Supabase Auth state changes
    const { data: sbSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        const sbUser = session.user;
        setUser({
          id: sbUser.id,
          email: sbUser.email || 'learner@az900.ke',
          full_name:
            (sbUser.user_metadata?.full_name as string) ||
            sbUser.email?.split('@')[0] ||
            'AZ-900 Cloud Learner',
          role: (sbUser.user_metadata?.role as LearnerRole) || 'student',
          auth_source: 'supabase',
        });
      } else if (!authService.getStoredBackendUser() && !authService.getCurrentFirebaseUser()) {
        setUser(null);
      }
    });

    // Listen to Firebase Auth state changes
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
          unlocked_modules: stored.unlocked_modules,
          auth_source: 'postgres_backend',
        });
      } else if (fbUser) {
        setUser({
          id: fbUser.uid,
          email: fbUser.email || 'learner@az900.ke',
          full_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'AZ-900 Learner',
          role: 'student',
          auth_source: 'firebase',
        });
      } else {
        setUser(null);
      }
    });

    // Listen to custom Backend Auth session changes dispatched by authService
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
    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        throw new Error('Please enter your email address.');
      }

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

      setUser({
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.full_name,
        role: result.user.role,
        is_premium: result.user.is_premium,
        unlocked_modules: result.user.unlocked_modules,
        auth_source: isSupabaseDirectConfigured ? 'supabase' : 'postgres_backend',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
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

  // Force auth redirect to Login Screen when Supabase/Postgres `user` state is null
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 relative flex flex-col justify-between overflow-hidden font-sans">
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

        <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Architectural & Security Context (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-extrabold tracking-wider uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Protected Curriculum &amp; Telemetry Gateway</span>
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

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                  Sign in to access the 3 official AZ-900 Learning Paths, 12 relational service
                  modules, scenario-based JSONB question banks, and real-time PostgreSQL mastery
                  synchronization across all your devices.
                </p>
              </div>

              {/* Security & Relational Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      PostgreSQL Progress Sync
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Every quiz attempt, module mastery score, and weak-area metric is persisted
                      to <code className="text-sky-300">user_progress</code> and{' '}
                      <code className="text-sky-300">quiz_sessions</code>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Anti-Scrape Question Bank
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Proprietary scenario questions and distractor breakdowns are protected via
                      authenticated server-side evaluation.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      12 Structured AZ-900 Modules
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Covers Cloud Concepts (25–30%), Core Architecture (35–40%), and Management
                      &amp; Governance (30–35%).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      M-Pesa Daraja &amp; Cloud Auth
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Supports M-Pesa STK Push premium module unlocks and multi-role RBAC (
                      <code className="text-purple-300">student</code>,{' '}
                      <code className="text-purple-300">bootcamp_admin</code>).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Authentication Card (5 cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-6 sm:p-7 space-y-5 backdrop-blur-xl">
                {/* Card Header & Mode Switch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-sky-400 block">
                      Supabase &amp; Postgres Auth
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                      {authMode === 'login'
                        ? 'Sign In to Practice Studio'
                        : authMode === 'signup'
                        ? 'Register Learner Account'
                        : 'Reset / Create Admin Password'}
                    </h2>
                  </div>
                  <div className="inline-flex p-1 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
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
                        setAuthMode('signup');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        authMode === 'signup'
                          ? 'bg-[#0078D4] text-white font-black shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Sign Up</span>
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
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-emerald-500/15 border border-sky-500/30 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-xs font-black text-white">
                          Instant Demo Cloud Learner
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
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Minimum 6 characters. Use letters, numbers, and symbols.
                      </span>
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

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-xs text-sky-400 hover:text-sky-300 underline cursor-pointer"
                        >
                          Return to Standard Sign In
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                <form onSubmit={handleFormSubmit} className="space-y-3.5">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Amina Wanjiku"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                          required
                        />
                      </div>
                    </div>
                  )}

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
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                        required
                      />
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        PostgreSQL Role (<code className="text-sky-400">user_role_enum</code>)
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as LearnerRole)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-400"
                      >
                        <option value="student">student — Standard AZ-900 Candidate</option>
                        <option value="bootcamp_admin">bootcamp_admin — Cohort Instructor</option>
                        <option value="enterprise_user">enterprise_user — Full Enterprise Access</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0078D4] to-[#005A9E] hover:from-[#0284C7] hover:to-[#0078D4] disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Authenticating Session...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {authMode === 'login'
                            ? 'Sign In & Unlock Curriculum'
                            : 'Create Account & Sync Postgres'}
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

                {/* Concise KDPA 2019, Simultaneous Cross-Platform & M-Pesa Security Disclaimer */}
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed space-y-1">
                  <p>
                    <strong className="text-slate-200">Cross-Platform &amp; Long-Hour Security:</strong>{' '}
                    Stay signed in on your mobile phone and laptop simultaneously with real-time cloud
                    progress merging and automatic 25-min token renewal.
                  </p>
                  <p>
                    <strong className="text-emerald-400">Kenya Data Protection Act (2019):</strong>{' '}
                    Your data is used strictly for AZ-900 learning analytics (never sold), with full
                    JSON/PDF export &amp; reset control. M-Pesa STK Push PINs are entered only on your
                    phone SIM Toolkit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-slate-800/80 bg-slate-950/70 py-3.5 px-6 text-center text-xs text-slate-400">
          Secured by <span className="text-sky-400 font-bold">ProtectedRoute</span> • Simultaneous
          Mobile &amp; Laptop Cloud Sync • Compliant with{' '}
          <span className="text-emerald-400 font-semibold">Kenya Data Protection Act (2019)</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
