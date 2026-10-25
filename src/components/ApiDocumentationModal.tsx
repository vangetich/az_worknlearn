import React, { useState, useEffect } from 'react';
import {
  X,
  FileCode,
  Copy,
  CheckCircle2,
  Play,
  Terminal,
  Server,
  ShieldCheck,
  Code2,
  RefreshCw,
  Activity,
  AlertTriangle,
  Gauge,
  Zap,
} from 'lucide-react';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';
import { BackendTelemetryLineChart } from './BackendTelemetryLineChart';
import {
  postgresBackendService,
  EndpointTelemetryPoint,
  EndpointSummaryMetrics,
  MonitoredEndpointPath,
} from '../services/postgresBackendService';

interface ApiDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ApiEndpointDoc {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  category: 'Quiz Evaluation' | 'Authentication & Progress' | 'Curriculum & Questions' | 'Payments & Webhooks';
  summary: string;
  description: string;
  headers: Record<string, string>;
  requestPayload?: any;
  secondaryPayload?: {
    label: string;
    payload: any;
  };
  expectedResponse: any;
  errorResponses: { status: number; reason: string; body: any }[];
  frontendSnippet: string;
}

const ENDPOINT_DOCS: ApiEndpointDoc[] = [
  {
    id: 'quiz-submit',
    method: 'POST',
    path: '/api/quiz/submit',
    category: 'Quiz Evaluation',
    summary: 'Submit answer(s), evaluate scores server-side, and return instant feedback payload',
    description:
      'Evaluates a learner’s selected answer on the server (protecting the answer bank from client-side scraping), updates the PostgreSQL user_progress table, and returns the verified correct answer, detailed explanation, distractor breakdown, exam tip, and updated module mastery telemetry. Supports both single-question instant evaluation and batch session submission.',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <firebase_jwt_or_session_token>',
      'x-user-id': 'usr-default-learner',
    },
    requestPayload: {
      user_id: 'usr-default-learner',
      question_id: 'az900-m1-q1',
      selected_answer: 'B',
      record_session: true,
    },
    secondaryPayload: {
      label: 'Batch Quiz Session Payload (Optional Mode)',
      payload: {
        user_id: 'usr-default-learner',
        answers: [
          { question_id: 'az900-m1-q1', selected_answer: 'B' },
          { question_id: 'az900-m2-q1', selected_answer: 'A' },
        ],
      },
    },
    expectedResponse: {
      mode: 'single',
      question_id: 'az900-m1-q1',
      module_id: 1,
      selected_answer: 'B',
      correct_answer: 'B',
      is_correct: true,
      explanation_correct:
        'Under the Shared Responsibility Model for SaaS (Software as a Service), the customer remains responsible for their own data, endpoints, accounts, and access management.',
      explanation_distractors: {
        A: 'Physical datacenter security is strictly Microsoft’s responsibility across IaaS, PaaS, and SaaS.',
        C: 'Host infrastructure and hypervisor patching are managed by Microsoft.',
        D: 'Network fabric and physical routers are maintained by the cloud provider.',
      },
      exam_tip:
        'Remember: No matter the cloud service model (IaaS, PaaS, or SaaS), the customer is ALWAYS responsible for Data, Endpoints, Account, and Access Management.',
      module_progress: {
        id: 'prog-usr-default-learner-1',
        user_id: 'usr-default-learner',
        module_id: 1,
        score: 85,
        status: 'mastered',
        attempts_count: 7,
        correct_count: 6,
        last_attempted: '2026-10-25T11:45:00.000Z',
      },
      session: {
        id: 'sess-982341',
        user_id: 'usr-default-learner',
        questions_answered: 1,
        correct_count: 1,
        completed_at: '2026-10-25T11:45:00.000Z',
      },
    },
    errorResponses: [
      {
        status: 400,
        reason: 'Missing question_id or invalid selected_answer (must be A, B, C, or D)',
        body: {
          error: 'Both question_id and a valid selected_answer (A, B, C, or D) are required.',
        },
      },
      {
        status: 404,
        reason: 'Requested question_id does not exist in the PostgreSQL questions table',
        body: {
          error: "Question 'az900-invalid-id' not found in bank.",
        },
      },
    ],
    frontendSnippet: `// Frontend consumption example for POST /api/quiz/submit
const submitQuizAnswer = async (
  questionId: string,
  selectedAnswer: 'A' | 'B' | 'C' | 'D'
) => {
  const response = await fetch('/api/quiz/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': currentUserId,
    },
    body: JSON.stringify({
      user_id: currentUserId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      record_session: true,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Quiz evaluation failed');
  }

  const feedback = await response.json();
  // Consume feedback.is_correct, feedback.explanation_correct,
  // feedback.explanation_distractors, feedback.exam_tip, and feedback.module_progress
  return feedback;
};`,
  },
  {
    id: 'modules-list',
    method: 'GET',
    path: '/api/modules',
    category: 'Curriculum & Questions',
    summary: 'Retrieve all 3 AZ-900 learning paths and 12 curriculum modules with unlock status',
    description:
      'Returns the hierarchical AZ-900 curriculum structure (3 Learning Paths with exam weight percentages and 12 Modules) enriched with the authenticated learner’s current mastery score, status (not_started, in_progress, mastered), and premium unlock state.',
    headers: {
      Authorization: 'Bearer <firebase_jwt_or_session_token>',
      'x-user-id': 'usr-default-learner',
    },
    expectedResponse: {
      learning_paths: [
        {
          id: 1,
          title: 'Describe Cloud Concepts',
          weight_percentage: '25-30%',
          modules: [
            {
              id: 1,
              path_id: 1,
              title: 'Cloud Computing & Shared Responsibility',
              module_number: 1,
              is_premium: false,
              question_count: 8,
              is_unlocked: true,
              user_progress: {
                score: 80,
                status: 'mastered',
                attempts_count: 5,
                correct_count: 4,
              },
            },
          ],
        },
      ],
      total_learning_paths: 3,
      total_modules: 12,
      total_questions: 45,
    },
    errorResponses: [
      {
        status: 500,
        reason: 'Internal relational store error',
        body: { error: 'Failed to retrieve curriculum paths and modules.' },
      },
    ],
    frontendSnippet: `const res = await fetch('/api/modules?userId=' + encodeURIComponent(userId));
const { learning_paths, modules } = await res.json();`,
  },
  {
    id: 'module-questions',
    method: 'GET',
    path: '/api/modules/:id/questions?protect=true',
    category: 'Curriculum & Questions',
    summary: 'Fetch scenario-based questions for a specific module with anti-scraping protection',
    description:
      'Fetches all scenario questions belonging to a module (1–12 or "all"). When ?protect=true is passed, the server strips correct_answer, explanation_correct, and explanation_distractors from the payload so answers can only be revealed via POST /api/quiz/submit.',
    headers: {
      'x-user-id': 'usr-default-learner',
    },
    expectedResponse: {
      module: {
        id: 1,
        path_id: 1,
        title: 'Cloud Computing & Shared Responsibility',
        module_number: 1,
      },
      count: 4,
      protected_mode: true,
      questions: [
        {
          id: 'az900-m1-q1',
          module_id: 1,
          difficulty: 'Fundamental',
          scenario_text:
            'A Nairobi fintech startup is migrating its legacy on-premises ERP to Microsoft 365 (SaaS)...',
          question_text:
            'Which layer remains strictly the responsibility of the fintech customer?',
          options: [
            { letter: 'A', text: 'Physical datacenter biometric access' },
            { letter: 'B', text: 'Customer data, endpoints, and access management' },
            { letter: 'C', text: 'Hypervisor host patching' },
            { letter: 'D', text: 'Fiber optic network redundancy' },
          ],
          exam_tip:
            'Customer is always responsible for Data, Endpoints, and Access.',
        },
      ],
    },
    errorResponses: [
      {
        status: 500,
        reason: 'Failed to fetch module questions',
        body: { error: 'Failed to fetch module scenario questions.' },
      },
    ],
    frontendSnippet: `const res = await fetch('/api/modules/1/questions?protect=true');
const { questions, protected_mode } = await res.json();`,
  },
  {
    id: 'auth-signup',
    method: 'POST',
    path: '/api/auth/signup',
    category: 'Authentication & Progress',
    summary: 'Register a new learner account and link with Firebase Auth UID',
    description:
      'Registers a learner in the PostgreSQL users table with role-based access (student, bootcamp_admin, enterprise_user), links their Firebase Auth UID/JWT, and initializes their 12-module mastery profile.',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <firebase_id_token>',
    },
    requestPayload: {
      email: 'learner@harambee.cloud',
      full_name: 'Amina Wanjiku',
      role: 'student',
      firebase_uid: 'fb-uid-99281',
    },
    expectedResponse: {
      message: 'Learner registered successfully',
      user: {
        id: 'fb-uid-99281',
        email: 'learner@harambee.cloud',
        full_name: 'Amina Wanjiku',
        role: 'student',
        is_premium: false,
        unlocked_modules: [1, 2, 3, 4],
        created_at: '2026-10-25T10:00:00.000Z',
      },
      token: 'sess_fb-uid-99281_1729850000',
      firebase_linked: true,
      progress_summary: {
        average_score: 0,
        mastered_modules: 0,
        in_progress_modules: 0,
        not_started_modules: 12,
      },
    },
    errorResponses: [
      {
        status: 400,
        reason: 'Missing or invalid email address',
        body: { error: 'A valid learner email address is required.' },
      },
    ],
    frontendSnippet: `const res = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'learner@harambee.cloud',
    full_name: 'Amina Wanjiku',
    role: 'student',
  }),
});`,
  },
  {
    id: 'auth-login',
    method: 'POST',
    path: '/api/auth/login',
    category: 'Authentication & Progress',
    summary: 'Authenticate existing learner and retrieve session token & progress summary',
    description:
      'Authenticates a learner via email or Firebase JWT bearer token and returns their user profile, unlocked modules, and overall progress summary across the 12 AZ-900 modules.',
    headers: {
      'Content-Type': 'application/json',
    },
    requestPayload: {
      email: 'vangetich@gmail.com',
      role: 'student',
    },
    expectedResponse: {
      message: 'Authenticated successfully',
      user: {
        id: 'usr-default-learner',
        email: 'vangetich@gmail.com',
        full_name: 'Cloud Architect Learner',
        role: 'student',
        is_premium: false,
        unlocked_modules: [1, 2, 3, 4],
      },
      token: 'sess_usr-default-learner_1729850120',
      firebase_linked: true,
    },
    errorResponses: [
      {
        status: 400,
        reason: 'Missing email',
        body: { error: 'Email is required to authenticate.' },
      },
    ],
    frontendSnippet: `const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'vangetich@gmail.com' }),
});`,
  },
  {
    id: 'user-progress',
    method: 'GET',
    path: '/api/user/progress',
    category: 'Authentication & Progress',
    summary: 'Fetch learner’s overall mastery across all 12 modules and payment ledger',
    description:
      'Returns the learner’s complete telemetry report including per-module mastery scores, quiz session history, and M-Pesa/Stripe payment transaction records.',
    headers: {
      Authorization: 'Bearer <token>',
      'x-user-id': 'usr-default-learner',
    },
    expectedResponse: {
      user: {
        id: 'usr-default-learner',
        email: 'vangetich@gmail.com',
        role: 'student',
        is_premium: false,
        unlocked_modules: [1, 2, 3, 4],
      },
      summary: {
        average_score: 76,
        mastered_modules: 3,
        in_progress_modules: 2,
        not_started_modules: 7,
        total_sessions: 4,
      },
      module_progress: [
        {
          module_id: 1,
          module_title: 'Cloud Computing & Shared Responsibility',
          score: 85,
          status: 'mastered',
          attempts_count: 7,
          correct_count: 6,
        },
      ],
      recent_sessions: [],
      payment_transactions: [],
    },
    errorResponses: [
      {
        status: 500,
        reason: 'Failed to load user progress report',
        body: { error: 'Failed to fetch learner mastery progress.' },
      },
    ],
    frontendSnippet: `const res = await fetch('/api/user/progress?userId=usr-default-learner');
const progressReport = await res.json();`,
  },
  {
    id: 'mpesa-stk-push',
    method: 'POST',
    path: '/api/payments/mpesa/stk-push',
    category: 'Payments & Webhooks',
    summary: 'Initiate Safaricom M-Pesa Daraja STK Push prompt for premium module unlocks',
    description:
      'Validates and normalizes Kenyan MSISDN phone numbers (07XXXXXXXX or 2547XXXXXXXX), initiates an M-Pesa Express (Daraja 2.0 CustomerPayBillOnline) STK Push prompt, and creates a pending transaction record awaiting /api/payments/webhook confirmation.',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'usr-default-learner',
    },
    requestPayload: {
      user_id: 'usr-default-learner',
      phone_number: '0712345678',
      amount: 950,
      module_id: 'all',
    },
    expectedResponse: {
      ResponseCode: '0',
      ResponseDescription: 'Success. Request accepted for processing',
      CustomerMessage:
        'Success. Request accepted for processing. Enter M-Pesa PIN on your phone.',
      MerchantRequestID: '29115-34620561-1',
      CheckoutRequestID: 'ws_CO_2510202611450012345',
      live_daraja: false,
      transaction: {
        id: 'tx-99182',
        user_id: 'usr-default-learner',
        gateway: 'mpesa',
        phone_number: '254712345678',
        amount: 950,
        currency: 'KES',
        module_id: 'all',
        checkout_request_id: 'ws_CO_2510202611450012345',
        status: 'pending',
      },
    },
    errorResponses: [
      {
        status: 400,
        reason: 'Invalid Kenyan M-Pesa phone number format',
        body: {
          error:
            'Please provide a valid M-Pesa phone number (e.g. 0712345678 or 254712345678).',
        },
      },
    ],
    frontendSnippet: `const res = await fetch('/api/payments/mpesa/stk-push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: currentUserId,
    phone_number: '0712345678',
    amount: 950,
    module_id: 'all',
  }),
});`,
  },
  {
    id: 'payments-webhook',
    method: 'POST',
    path: '/api/payments/webhook',
    category: 'Payments & Webhooks',
    summary: 'Handle Safaricom Daraja & Stripe payment confirmation callbacks securely',
    description:
      'Receives asynchronous payment confirmation callbacks from Safaricom Daraja (Body.stkCallback) or Stripe webhooks. Marks the pending transaction as completed, stores the M-Pesa receipt number, and unlocks either the specified module (5–12) or all 12 premium modules.',
    headers: {
      'Content-Type': 'application/json',
    },
    requestPayload: {
      Body: {
        stkCallback: {
          MerchantRequestID: '29115-34620561-1',
          CheckoutRequestID: 'ws_CO_2510202611450012345',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 950 },
              { Name: 'MpesaReceiptNumber', Value: 'SJK8492019Z' },
              { Name: 'PhoneNumber', Value: '254712345678' },
            ],
          },
        },
      },
    },
    expectedResponse: {
      ResultCode: 0,
      ResultDesc: 'Accepted',
      transaction: {
        id: 'tx-99182',
        checkout_request_id: 'ws_CO_2510202611450012345',
        status: 'completed',
        receipt_number: 'SJK8492019Z',
      },
      user: {
        id: 'usr-default-learner',
        is_premium: true,
        unlocked_modules: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
    },
    errorResponses: [
      {
        status: 400,
        reason: 'Missing CheckoutRequestID in webhook payload',
        body: { error: 'Missing checkout_request_id in webhook payload.' },
      },
    ],
    frontendSnippet: `const res = await fetch('/api/payments/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    checkout_request_id: 'ws_CO_2510202611450012345',
    result_code: 0,
    receipt_number: 'SJK8492019Z',
  }),
});`,
  },
];

export const ApiDocumentationModal: React.FC<ApiDocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('quiz-submit');
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  const [liveTestResponse, setLiveTestResponse] = useState<any>(null);
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [testQuestionAnswer, setTestQuestionAnswer] = useState<'A' | 'B' | 'C' | 'D'>('B');

  const [isProbingTelemetry, setIsProbingTelemetry] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeDoc =
    ENDPOINT_DOCS.find((doc) => doc.id === selectedEndpointId) || ENDPOINT_DOCS[0];

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(key);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  // Probe live /api/quiz/submit endpoint and record real round-trip latency
  const handleProbeQuizSubmit = async () => {
    setIsProbingTelemetry(true);
    try {
      const qRes = await fetch('/api/modules/1/questions?protect=true');
      const qData = await qRes.json();
      const firstQuestionId = qData?.questions?.[0]?.id || 'q1';
      await postgresBackendService.submitQuizAnswer({
        userId: 'usr-default-learner',
        questionId: firstQuestionId,
        selectedAnswer: 'B',
        recordSession: false,
      });
    } catch {
      // telemetry is recorded inside submitQuizAnswer
    } finally {
      setIsProbingTelemetry(false);
    }
  };

  // Probe live /api/payments/webhook endpoint and record real round-trip latency
  const handleProbePaymentWebhook = async () => {
    setIsProbingTelemetry(true);
    try {
      await postgresBackendService.triggerPaymentWebhook({
        Body: {
          stkCallback: {
            MerchantRequestID: `m-${Date.now()}`,
            CheckoutRequestID: `ws_CO_${Date.now()}`,
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [{ Name: 'MpesaReceiptNumber', Value: 'SJK99201KL' }],
            },
          },
        },
      });
    } catch {
      // telemetry recorded inside triggerPaymentWebhook
    } finally {
      setIsProbingTelemetry(false);
    }
  };

  // Simulate a 400 validation error on either endpoint to test real-time error rate visualization
  const handleInjectValidationError = async (endpoint: MonitoredEndpointPath) => {
    setIsProbingTelemetry(true);
    const start = Date.now();
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const elapsed = Math.max(2, Date.now() - start);
      postgresBackendService.recordEndpointSample(endpoint, elapsed, res.status || 400);
    } catch {
      postgresBackendService.recordEndpointSample(endpoint, 12, 500);
    } finally {
      setIsProbingTelemetry(false);
    }
  };

  const handleRunLiveEndpointTest = async () => {
    setIsTestingEndpoint(true);
    setLiveTestResponse(null);
    const startTime = Date.now();
    try {
      if (activeDoc.id === 'quiz-submit') {
        const qRes = await fetch('/api/modules/1/questions?protect=true');
        const qData = await qRes.json();
        const firstQuestionId = qData?.questions?.[0]?.id || 'q1';

        const res = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'usr-default-learner',
          },
          body: JSON.stringify({
            user_id: 'usr-default-learner',
            question_id: firstQuestionId,
            selected_answer: testQuestionAnswer,
            record_session: true,
          }),
        });
        const elapsed = Math.max(1, Date.now() - startTime);
        postgresBackendService.recordEndpointSample('/api/quiz/submit', elapsed, res.status);
        const data = await res.json();
        setLiveTestResponse({ status: res.status, latencyMs: elapsed, payload: data });
      } else if (activeDoc.method === 'GET') {
        const targetPath = activeDoc.path.replace(':id', '1');
        const res = await fetch(targetPath);
        const elapsed = Math.max(1, Date.now() - startTime);
        const data = await res.json();
        setLiveTestResponse({ status: res.status, latencyMs: elapsed, payload: data });
      } else {
        const res = await fetch(activeDoc.path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activeDoc.requestPayload || {}),
        });
        const elapsed = Math.max(1, Date.now() - startTime);
        if (activeDoc.path === '/api/payments/webhook') {
          postgresBackendService.recordEndpointSample(
            '/api/payments/webhook',
            elapsed,
            res.status
          );
        }
        const data = await res.json();
        setLiveTestResponse({ status: res.status, latencyMs: elapsed, payload: data });
      }
    } catch (err: any) {
      setLiveTestResponse({
        status: 500,
        payload: { error: err.message || 'Live request failed' },
      });
    } finally {
      setIsTestingEndpoint(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <KitengeRibbon height={4} />

        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#003E6B] to-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <MaasaiMedallion size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                  AZ-900 Backend API Documentation &amp; Real-Time Telemetry Monitor
                </h2>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-sky-400/20 text-sky-200 border border-sky-400/40">
                  REST API v1.0 · Recharts Live APM
                </span>
              </div>
              <p className="text-xs text-blue-100/80">
                Real-time latency &amp; error rate monitoring for{' '}
                <code className="font-mono font-bold text-white">/api/quiz/submit</code> and{' '}
                <code className="font-mono font-bold text-white">/api/payments/webhook</code> +
                OpenAPI payload specifications
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close API Documentation Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body: Left Sidebar (Endpoint Directory) + Right Panel (Real-Time Monitoring Dashboard + Detailed Spec) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Sidebar: Endpoint Directory */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/80 overflow-y-auto p-4 space-y-4 max-h-60 lg:max-h-none">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>Available Backend Endpoints ({ENDPOINT_DOCS.length})</span>
              </span>
            </div>

            <div className="space-y-1.5">
              {ENDPOINT_DOCS.map((doc) => {
                const isSelected = doc.id === activeDoc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setSelectedEndpointId(doc.id);
                      setLiveTestResponse(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#0078D4] shadow-xs ring-1 ring-[#0078D4]/30'
                        : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                          doc.method === 'POST'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-sky-100 text-sky-800 border border-sky-300'
                        }`}
                      >
                        {doc.method}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {doc.category}
                      </span>
                    </div>
                    <div className="font-mono text-xs font-extrabold text-slate-900 truncate">
                      {doc.path}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                      {doc.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Real-Time Monitoring Dashboard + Selected Endpoint Spec */}
          <div className="lg:col-span-8 overflow-y-auto p-5 sm:p-6 space-y-6 bg-white">
            {/* =================================================================
                REAL-TIME MONITORING DASHBOARD (Recharts Telemetry Line Chart)
               ================================================================= */}
            <BackendTelemetryLineChart
              onProbeQuizSubmit={handleProbeQuizSubmit}
              onProbePaymentWebhook={handleProbePaymentWebhook}
              onInjectError={handleInjectValidationError}
            />

            {/* Endpoint Header Banner */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2.5 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-black uppercase ${
                      activeDoc.method === 'POST'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-sky-400 text-slate-950'
                    }`}
                  >
                    {activeDoc.method}
                  </span>
                  <code className="font-mono text-sm sm:text-base font-extrabold text-emerald-300">
                    {activeDoc.path}
                  </code>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold">
                  {activeDoc.category}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeDoc.description}
              </p>
            </div>

            {/* Request Headers */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0078D4]" />
                <span>Required &amp; Supported HTTP Headers</span>
              </h3>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs space-y-1">
                {Object.entries(activeDoc.headers).map(([k, v]) => (
                  <div key={k} className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-800">{k}:</span>
                    <span className="text-slate-600">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Payload Section (for POST routes, highlighted for /api/quiz/submit) */}
            {activeDoc.requestPayload && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Request Payload Format (JSON Body for{' '}
                      <code className="font-mono text-emerald-700">{activeDoc.path}</code>)
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'req-primary',
                        JSON.stringify(activeDoc.requestPayload, null, 2)
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>
                      {copiedBlock === 'req-primary' ? 'Copied JSON!' : 'Copy Payload'}
                    </span>
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                  {JSON.stringify(activeDoc.requestPayload, null, 2)}
                </pre>

                {activeDoc.secondaryPayload && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-600">
                        {activeDoc.secondaryPayload.label}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            'req-secondary',
                            JSON.stringify(
                              activeDoc.secondaryPayload?.payload,
                              null,
                              2
                            )
                          )
                        }
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>
                          {copiedBlock === 'req-secondary' ? 'Copied!' : 'Copy Batch Payload'}
                        </span>
                      </button>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-slate-900 text-sky-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                      {JSON.stringify(activeDoc.secondaryPayload.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Expected Response Format (200 OK) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Expected Response Format (HTTP 200 OK — Frontend Contract)</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      'res-expected',
                      JSON.stringify(activeDoc.expectedResponse, null, 2)
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>
                    {copiedBlock === 'res-expected' ? 'Copied Response!' : 'Copy Response JSON'}
                  </span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-amber-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-80">
                {JSON.stringify(activeDoc.expectedResponse, null, 2)}
              </pre>
            </div>

            {/* Frontend Consumption Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-[#0078D4]" />
                  <span>Frontend TypeScript Consumption Pattern</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy('ts-snippet', activeDoc.frontendSnippet)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedBlock === 'ts-snippet' ? 'Copied Code!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-sky-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {activeDoc.frontendSnippet}
              </pre>
            </div>

            {/* Error Response Codes */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Error Status Codes &amp; Validation Responses
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeDoc.errorResponses.map((errItem) => (
                  <div
                    key={errItem.status}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-mono text-[10px] font-black">
                        HTTP {errItem.status}
                      </span>
                      <span className="text-[11px] font-bold text-rose-900">
                        {errItem.reason}
                      </span>
                    </div>
                    <pre className="p-2 rounded bg-slate-900 text-rose-300 font-mono text-[11px] overflow-x-auto">
                      {JSON.stringify(errItem.body, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Live Endpoint Sandbox */}
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#0078D4]" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Interactive API Sandbox — Test <code className="font-mono">{activeDoc.path}</code> Live
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Execute a real request against the running Express + Postgres backend server
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeDoc.id === 'quiz-submit' && (
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-600 text-[11px]">Option:</span>
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setTestQuestionAnswer(opt)}
                          className={`w-6 h-6 rounded font-mono font-black text-xs cursor-pointer ${
                            testQuestionAnswer === opt
                              ? 'bg-[#0078D4] text-white'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isTestingEndpoint}
                    onClick={handleRunLiveEndpointTest}
                    className="px-3.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    {isTestingEndpoint ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Send Live {activeDoc.method} Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {liveTestResponse && (
                <div className="rounded-xl bg-slate-950 text-slate-100 p-3.5 font-mono text-xs space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-emerald-400 font-bold">
                      Live Server Response (HTTP {liveTestResponse.status}
                      {liveTestResponse.latencyMs ? ` • ${liveTestResponse.latencyMs}ms` : ''})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="overflow-x-auto max-h-64 text-[11px] text-emerald-200 leading-relaxed">
                    {JSON.stringify(liveTestResponse.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

