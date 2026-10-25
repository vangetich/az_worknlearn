import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import { backendDb, UserRole } from './src/backend/store.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
(globalThis as any).__dirname = path.resolve(__dirname, 'node_modules/vite-plugin-pwa/dist');

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// ============================================================================
// REAL-TIME COLLABORATIVE STUDY HUB STATE (Server-Authoritative)
// ============================================================================

export interface CollabParticipant {
  userId: string;
  name: string;
  avatar: string;
  location: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  lockedIn: boolean;
  confidence: number | null;
  isOnline: boolean;
  lastSeen: number;
}

export interface CollabChatMessage {
  id: string;
  senderId: string;
  sender: string;
  avatar: string;
  location: string;
  text: string;
  timestamp: number;
  questionRef?: {
    id: string;
    title: string;
    scenarioSnippet: string;
  };
}

export interface SharedQuestionSnapshot {
  id: string;
  learningPathId: 1 | 2 | 3;
  moduleId: number;
  moduleTitle: string;
  difficulty: 'Fundamental' | 'Intermediate' | 'Advanced';
  scenario: string;
  question: string;
  options: { letter: string; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  whyCorrect: string;
  examTip: string;
}

export interface StudyHubRoomState {
  roomId: string;
  createdAt: number;
  updatedAt: number;
  activeQuestion: SharedQuestionSnapshot | null;
  isAnswerRevealed: boolean;
  sharedScratchpad: string;
  eliminatedOptions: string[];
  coopStats: {
    questionsSolved: number;
    consensusCorrect: number;
    currentStreak: number;
  };
  participants: Record<string, CollabParticipant>;
  messages: CollabChatMessage[];
}

const studyHubRooms = new Map<string, StudyHubRoomState>();

function getOrCreateRoom(roomId: string): StudyHubRoomState {
  const normalizedId = roomId.trim().toUpperCase();
  let room = studyHubRooms.get(normalizedId);
  if (!room) {
    room = {
      roomId: normalizedId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeQuestion: null,
      isAnswerRevealed: false,
      sharedScratchpad: '',
      eliminatedOptions: [],
      coopStats: {
        questionsSolved: 0,
        consensusCorrect: 0,
        currentStreak: 0,
      },
      participants: {},
      messages: [
        {
          id: `sys-welcome-${normalizedId}`,
          senderId: 'system',
          sender: 'Study Hub Host',
          avatar: '🤝',
          location: 'Live Hub',
          text: `Welcome to Collaborative Study Hub #${normalizedId}! Share this room code with a study partner to solve scenario-based AZ-900 questions together in real-time.`,
          timestamp: Date.now(),
        },
      ],
    };
    studyHubRooms.set(normalizedId, room);
  }
  return room;
}

// Track WebSocket connections per room
const roomSockets = new Map<string, Set<{ ws: WebSocket; userId: string }>>();

function broadcastRoomState(roomId: string) {
  const normalizedId = roomId.trim().toUpperCase();
  const room = studyHubRooms.get(normalizedId);
  if (!room) return;

  const payload = JSON.stringify({
    type: 'room:state',
    room,
  });

  const clients = roomSockets.get(normalizedId);
  if (!clients) return;

  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(payload);
      } catch {
        // ignore broken socket
      }
    }
  }
}

// Apply an event idempotently to the room state
function applyRoomEvent(roomId: string, event: any): StudyHubRoomState {
  const room = getOrCreateRoom(roomId);
  const now = Date.now();
  room.updatedAt = now;

  const { type, userId, payload } = event;

  switch (type) {
    case 'room:join': {
      if (userId && payload) {
        const existing = room.participants[userId];
        room.participants[userId] = {
          userId,
          name: payload.name || existing?.name || 'Cloud Partner',
          avatar: payload.avatar || existing?.avatar || '👩🏾‍💻',
          location: payload.location || existing?.location || 'Online',
          selectedOption: existing?.selectedOption || null,
          lockedIn: existing?.lockedIn || false,
          confidence: existing?.confidence || null,
          isOnline: true,
          lastSeen: now,
        };
        if (payload.initialQuestion && !room.activeQuestion) {
          room.activeQuestion = payload.initialQuestion;
        }
      }
      break;
    }

    case 'room:leave': {
      if (userId && room.participants[userId]) {
        room.participants[userId].isOnline = false;
        room.participants[userId].lastSeen = now;
      }
      break;
    }

    case 'question:sync': {
      if (payload?.question) {
        room.activeQuestion = payload.question;
        room.isAnswerRevealed = false;
        room.eliminatedOptions = [];
        room.sharedScratchpad = '';
        Object.values(room.participants).forEach((p) => {
          p.selectedOption = null;
          p.lockedIn = false;
          p.confidence = null;
        });
      }
      break;
    }

    case 'vote:select': {
      if (userId && room.participants[userId]) {
        const p = room.participants[userId];
        p.lastSeen = now;
        p.isOnline = true;
        if (payload.option !== undefined) {
          p.selectedOption = payload.option;
        }
        if (payload.lockedIn !== undefined) {
          p.lockedIn = Boolean(payload.lockedIn);
        }
        if (payload.confidence !== undefined) {
          p.confidence = payload.confidence;
        }

        // Auto-reveal if at least 2 active participants have locked in their votes
        const activeParticipants = Object.values(room.participants).filter(
          (part) => part.isOnline && now - part.lastSeen < 1000 * 60 * 10
        );
        if (
          !room.isAnswerRevealed &&
          activeParticipants.length >= 2 &&
          activeParticipants.every((part) => part.lockedIn && part.selectedOption !== null)
        ) {
          room.isAnswerRevealed = true;
          room.coopStats.questionsSolved += 1;
          const allCorrect = activeParticipants.every(
            (part) => part.selectedOption === room.activeQuestion?.correctAnswer
          );
          if (allCorrect) {
            room.coopStats.consensusCorrect += 1;
            room.coopStats.currentStreak += 1;
          } else {
            room.coopStats.currentStreak = 0;
          }
        }
      }
      break;
    }

    case 'option:eliminate': {
      if (payload?.letter) {
        const letter = payload.letter;
        if (room.eliminatedOptions.includes(letter)) {
          room.eliminatedOptions = room.eliminatedOptions.filter((l) => l !== letter);
        } else {
          room.eliminatedOptions = [...room.eliminatedOptions, letter];
        }
      }
      break;
    }

    case 'vote:reveal': {
      if (!room.isAnswerRevealed && room.activeQuestion) {
        room.isAnswerRevealed = true;
        room.coopStats.questionsSolved += 1;
        const voters = Object.values(room.participants).filter((p) => p.selectedOption !== null);
        const anyCorrect =
          voters.length > 0 &&
          voters.every((p) => p.selectedOption === room.activeQuestion?.correctAnswer);
        if (anyCorrect) {
          room.coopStats.consensusCorrect += 1;
          room.coopStats.currentStreak += 1;
        } else {
          room.coopStats.currentStreak = 0;
        }
      }
      break;
    }

    case 'vote:reset': {
      room.isAnswerRevealed = false;
      room.eliminatedOptions = [];
      Object.values(room.participants).forEach((p) => {
        p.selectedOption = null;
        p.lockedIn = false;
        p.confidence = null;
      });
      break;
    }

    case 'scratchpad:update': {
      if (typeof payload?.text === 'string') {
        room.sharedScratchpad = payload.text.slice(0, 1200);
      }
      break;
    }

    case 'chat:message': {
      if (payload?.message && payload.message.id) {
        // Idempotency guard: prevent duplicate messages
        const exists = room.messages.some((m) => m.id === payload.message.id);
        if (!exists) {
          room.messages.push(payload.message);
          if (room.messages.length > 80) {
            room.messages = room.messages.slice(-80);
          }
        }
      }
      break;
    }

    default:
      break;
  }

  broadcastRoomState(room.roomId);
  return room;
}

// Attach WebSocketServer on /api/collab-ws
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/api/collab-ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', (ws) => {
  let boundRoomId: string | null = null;
  let boundUserId: string | null = null;

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const roomId = (data.roomId || 'AZ900-HUB').toUpperCase();
      const userId = data.userId || 'anon';

      if (!boundRoomId || boundRoomId !== roomId) {
        if (boundRoomId && roomSockets.has(boundRoomId)) {
          const prevSet = roomSockets.get(boundRoomId)!;
          for (const item of prevSet) {
            if (item.ws === ws) prevSet.delete(item);
          }
        }
        boundRoomId = roomId;
        boundUserId = userId;
        if (!roomSockets.has(roomId)) {
          roomSockets.set(roomId, new Set());
        }
        roomSockets.get(roomId)!.add({ ws, userId });
      }

      applyRoomEvent(roomId, data);
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    if (boundRoomId && boundUserId) {
      const set = roomSockets.get(boundRoomId);
      if (set) {
        for (const item of set) {
          if (item.ws === ws) set.delete(item);
        }
      }
      applyRoomEvent(boundRoomId, {
        type: 'room:leave',
        userId: boundUserId,
      });
    }
  });
});

// REST endpoints for Study Hub state & events (enables instant sync & fallback)
app.get('/api/study-hub/:roomId', (req, res) => {
  const room = getOrCreateRoom(req.params.roomId);
  res.json({ room });
});

app.post('/api/study-hub/:roomId/event', (req, res) => {
  const room = applyRoomEvent(req.params.roomId, req.body);
  res.json({ room });
});

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// AZ-900 BACKEND ARCHITECTURE: AUTH, CURRICULUM, PROGRESS & M-PESA/STRIPE API
// ============================================================================

function decodeFirebaseJwtClaims(token: string): {
  uid?: string;
  email?: string;
  name?: string;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);
    const uid = payload.user_id || payload.sub;
    if (!uid || typeof uid !== 'string') return null;
    return {
      uid,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}

function resolveRequestUserId(req: express.Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const mappedUser = backendDb.tokens.get(token);
    if (mappedUser) return mappedUser;

    // Also inspect Firebase Auth JWT token claims if present
    const fbClaims = decodeFirebaseJwtClaims(token);
    if (fbClaims?.uid) {
      if (!backendDb.users.has(fbClaims.uid) && fbClaims.email) {
        backendDb.upsertUser({
          id: fbClaims.uid,
          email: fbClaims.email,
          full_name: fbClaims.name || fbClaims.email.split('@')[0],
          role: 'student',
        });
      }
      backendDb.tokens.set(token, fbClaims.uid);
      return fbClaims.uid;
    }
  }
  const firebaseUidHeader = req.headers['x-firebase-uid'] as string;
  if (firebaseUidHeader && backendDb.users.has(firebaseUidHeader)) {
    return firebaseUidHeader;
  }
  const queryUserId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  if (queryUserId) return queryUserId;
  if (req.body && typeof req.body.user_id === 'string') return req.body.user_id;
  if (req.body && typeof req.body.userId === 'string') return req.body.userId;
  return 'usr-default-learner';
}

// 1. Authentication & Profile Endpoints (Linked with Firebase Auth)
app.post('/api/auth/signup', (req, res) => {
  try {
    const { email, full_name, fullName, role, uid, firebase_uid, firebase_token } = req.body || {};
    const bearerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : firebase_token;
    const fbClaims = bearerToken ? decodeFirebaseJwtClaims(bearerToken) : null;

    const effectiveEmail = email || fbClaims?.email;
    if (!effectiveEmail || typeof effectiveEmail !== 'string' || !effectiveEmail.includes('@')) {
      return res.status(400).json({ error: 'A valid learner email address is required.' });
    }
    const validRoles: UserRole[] = ['student', 'bootcamp_admin', 'enterprise_user'];
    const normalizedRole: UserRole = validRoles.includes(role) ? role : 'student';
    const effectiveUid = fbClaims?.uid || firebase_uid || uid;

    const { user, token } = backendDb.upsertUser({
      id: typeof effectiveUid === 'string' && effectiveUid.trim() ? effectiveUid.trim() : undefined,
      email: effectiveEmail,
      full_name: full_name || fullName || fbClaims?.name || effectiveEmail.split('@')[0],
      role: normalizedRole,
    });

    if (bearerToken) {
      backendDb.tokens.set(bearerToken, user.id);
    }

    const progressReport = backendDb.getUserProgressReport(user.id);
    res.status(201).json({
      message: 'Learner registered successfully',
      user,
      token: bearerToken || token,
      firebase_linked: Boolean(effectiveUid),
      progress_summary: progressReport.summary,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to register learner account.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, full_name, fullName, role, uid, firebase_uid, firebase_token } = req.body || {};
    const bearerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : firebase_token;
    const fbClaims = bearerToken ? decodeFirebaseJwtClaims(bearerToken) : null;

    const effectiveEmail = email || fbClaims?.email;
    if (!effectiveEmail || typeof effectiveEmail !== 'string') {
      return res.status(400).json({ error: 'Email is required to authenticate.' });
    }

    const effectiveUid = fbClaims?.uid || firebase_uid || uid;

    const { user, token } = backendDb.upsertUser({
      id: typeof effectiveUid === 'string' && effectiveUid.trim() ? effectiveUid.trim() : undefined,
      email: effectiveEmail,
      full_name: full_name || fullName || fbClaims?.name,
      role,
    });

    if (bearerToken) {
      backendDb.tokens.set(bearerToken, user.id);
    }

    const progressReport = backendDb.getUserProgressReport(user.id);
    res.json({
      message: 'Authenticated successfully',
      user,
      token: bearerToken || token,
      firebase_linked: Boolean(effectiveUid),
      progress_summary: progressReport.summary,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate learner.' });
  }
});

app.get('/api/user/progress', (req, res) => {
  try {
    const userId = resolveRequestUserId(req);
    const report = backendDb.getUserProgressReport(userId);
    res.json(report);
  } catch (error: any) {
    console.error('Fetch user progress error:', error);
    res.status(500).json({ error: 'Failed to fetch learner mastery progress.' });
  }
});

app.post('/api/user/progress/sync', (req, res) => {
  try {
    const userId = resolveRequestUserId(req);
    const { moduleMastery, session } = req.body || {};
    if (session && typeof session.questionsAnswered === 'number') {
      backendDb.recordQuizSession({
        user_id: userId,
        questions_answered: session.questionsAnswered,
        correct_count: session.correctCount || 0,
      });
    }
    const report = backendDb.syncClientMastery({
      user_id: userId,
      module_mastery: moduleMastery || {},
    });
    res.json(report);
  } catch (error: any) {
    console.error('Sync user progress error:', error);
    res.status(500).json({ error: 'Failed to synchronize learner progress.' });
  }
});

// 2. Quiz & Module Management Endpoints
app.get('/api/modules', (req, res) => {
  try {
    const userId = resolveRequestUserId(req);
    const user = backendDb.getUserByIdOrDefault(userId);
    const learningPaths = Array.from(backendDb.learningPaths.values());
    const allQuestions = Array.from(backendDb.questions.values());

    const modules = Array.from(backendDb.modules.values()).map((mod) => {
      const modQuestions = allQuestions.filter((q) => q.module_id === mod.id);
      const progKey = `${user.id}::${mod.id}`;
      const progress = backendDb.userProgress.get(progKey) || {
        score: 0,
        status: 'not_started',
        attempts_count: 0,
        correct_count: 0,
        last_attempted: null,
      };
      return {
        ...mod,
        question_count: modQuestions.length,
        is_unlocked: user.is_premium || user.unlocked_modules.includes(mod.id),
        user_progress: progress,
      };
    });

    res.json({
      learning_paths: learningPaths.map((lp) => ({
        ...lp,
        modules: modules.filter((m) => m.path_id === lp.id),
      })),
      modules,
      total_learning_paths: learningPaths.length,
      total_modules: modules.length,
      total_questions: allQuestions.length,
    });
  } catch (error: any) {
    console.error('Fetch modules error:', error);
    res.status(500).json({ error: 'Failed to retrieve curriculum paths and modules.' });
  }
});

app.get('/api/modules/:id/questions', (req, res) => {
  try {
    const paramId = req.params.id;
    const protectAnswers = req.query.protect === 'true';
    const allQuestions = Array.from(backendDb.questions.values());

    const filtered =
      paramId === 'all'
        ? allQuestions
        : allQuestions.filter((q) => q.module_id === Number(paramId));

    const moduleInfo =
      paramId === 'all' ? null : backendDb.modules.get(Number(paramId)) || null;

    const questionsPayload = filtered.map((q) => {
      if (protectAnswers) {
        const {
          correct_answer: _ca,
          explanation_correct: _ec,
          explanation_distractors: _ed,
          ...protectedQuestion
        } = q;
        return protectedQuestion;
      }
      return q;
    });

    res.json({
      module: moduleInfo,
      count: questionsPayload.length,
      protected_mode: protectAnswers,
      questions: questionsPayload,
    });
  } catch (error: any) {
    console.error('Fetch module questions error:', error);
    res.status(500).json({ error: 'Failed to fetch module scenario questions.' });
  }
});

app.post('/api/quiz/submit', (req, res) => {
  try {
    const userId = resolveRequestUserId(req);
    const { question_id, questionId, selected_answer, selectedAnswer, answers, record_session } =
      req.body || {};

    // Support both single-question instant evaluation and batch quiz session evaluation
    if (Array.isArray(answers) && answers.length > 0) {
      const evaluations = answers
        .map((ans: any) =>
          backendDb.recordAnswerSubmission({
            user_id: userId,
            question_id: ans.question_id || ans.questionId,
            selected_answer: ans.selected_answer || ans.selectedAnswer,
          })
        )
        .filter(Boolean);

      const correctCount = evaluations.filter((e) => e?.is_correct).length;
      const session = backendDb.recordQuizSession({
        user_id: userId,
        questions_answered: evaluations.length,
        correct_count: correctCount,
      });

      return res.json({
        mode: 'batch',
        questions_answered: evaluations.length,
        correct_count: correctCount,
        score_percentage:
          evaluations.length > 0 ? Math.round((correctCount / evaluations.length) * 100) : 0,
        session,
        evaluations,
      });
    }

    const targetQuestionId = question_id || questionId;
    const targetAnswer = (selected_answer || selectedAnswer) as 'A' | 'B' | 'C' | 'D';

    if (!targetQuestionId || !['A', 'B', 'C', 'D'].includes(targetAnswer)) {
      return res.status(400).json({
        error: 'Both question_id and a valid selected_answer (A, B, C, or D) are required.',
      });
    }

    const feedback = backendDb.recordAnswerSubmission({
      user_id: userId,
      question_id: targetQuestionId,
      selected_answer: targetAnswer,
    });

    if (!feedback) {
      return res.status(404).json({ error: `Question '${targetQuestionId}' not found in bank.` });
    }

    let sessionRecord = null;
    if (record_session) {
      sessionRecord = backendDb.recordQuizSession({
        user_id: userId,
        questions_answered: 1,
        correct_count: feedback.is_correct ? 1 : 0,
      });
    }

    res.json({
      mode: 'single',
      ...feedback,
      session: sessionRecord,
    });
  } catch (error: any) {
    console.error('Quiz submit error:', error);
    res.status(500).json({ error: 'Failed to evaluate quiz submission.' });
  }
});

// 3. Monetization & Integrations (M-Pesa Daraja STK Push & Stripe API)
app.post('/api/payments/mpesa/stk-push', async (req, res) => {
  try {
    const userId = resolveRequestUserId(req);
    const {
      phone_number,
      phoneNumber,
      amount = 250,
      module_id = 'all',
      moduleId,
    } = req.body || {};

    const rawPhone = String(phone_number || phoneNumber || '').trim();
    // Normalize Kenyan MSISDN (+2547XXXXXXXX, 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX)
    const digits = rawPhone.replace(/\D/g, '');
    let formattedPhone = digits;
    if (digits.startsWith('0') && digits.length === 10) {
      formattedPhone = `254${digits.slice(1)}`;
    } else if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) {
      formattedPhone = `254${digits}`;
    }

    if (!/^254(7|1)\d{8}$/.test(formattedPhone)) {
      return res.status(400).json({
        error:
          'Please provide a valid M-Pesa phone number (e.g. 0712345678 or 254712345678).',
      });
    }

    const targetModule = moduleId !== undefined ? moduleId : module_id;
    const numericAmount = Math.max(1, Number(amount) || 250);

    // Check if live Safaricom Daraja credentials are configured
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const passkey = process.env.MPESA_PASSKEY;
    const shortcode = process.env.MPESA_SHORTCODE || '174379';

    let darajaCheckoutId: string | undefined;
    let darajaMerchantId: string | undefined;
    let liveDarajaUsed = false;

    if (consumerKey && consumerSecret && passkey) {
      try {
        const baseUrl =
          process.env.MPESA_ENVIRONMENT === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
        const basicAuth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        const tokenRes = await fetch(
          `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
          {
            headers: { Authorization: `Basic ${basicAuth}` },
          }
        );
        if (tokenRes.ok) {
          const tokenData = (await tokenRes.json()) as { access_token?: string };
          if (tokenData.access_token) {
            const timestamp = new Date()
              .toISOString()
              .replace(/[-:TZ.]/g, '')
              .slice(0, 14);
            const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
            const callbackUrl = `${
              process.env.APP_URL || 'https://az900-studio.run.app'
            }/api/payments/webhook`;

            const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: numericAmount,
                PartyA: formattedPhone,
                PartyB: shortcode,
                PhoneNumber: formattedPhone,
                CallBackURL: callbackUrl,
                AccountReference: 'AZ900Studio',
                TransactionDesc:
                  targetModule === 'all'
                    ? 'AZ-900 Full Curriculum Unlock'
                    : `AZ-900 Module ${targetModule} Unlock`,
              }),
            });

            if (stkRes.ok) {
              const stkData = (await stkRes.json()) as {
                CheckoutRequestID?: string;
                MerchantRequestID?: string;
              };
              darajaCheckoutId = stkData.CheckoutRequestID;
              darajaMerchantId = stkData.MerchantRequestID;
              liveDarajaUsed = true;
            }
          }
        }
      } catch (darajaErr) {
        console.warn('Daraja API fallback to sandbox simulator:', darajaErr);
      }
    }

    const tx = backendDb.createPaymentTransaction({
      user_id: userId,
      gateway: 'mpesa',
      phone_number: formattedPhone,
      amount: numericAmount,
      currency: 'KES',
      module_id: targetModule === 'all' ? 'all' : Number(targetModule),
      checkout_request_id: darajaCheckoutId,
      merchant_request_id: darajaMerchantId,
    });

    res.json({
      ResponseCode: '0',
      ResponseDescription: 'Success. Request accepted for processing',
      CustomerMessage: 'Success. Request accepted for processing. Enter M-Pesa PIN on your phone.',
      MerchantRequestID: tx.merchant_request_id,
      CheckoutRequestID: tx.checkout_request_id,
      live_daraja: liveDarajaUsed,
      transaction: tx,
    });
  } catch (error: any) {
    console.error('M-Pesa STK Push error:', error);
    res.status(500).json({ error: 'Failed to initiate M-Pesa STK Push request.' });
  }
});

app.post('/api/payments/stripe/checkout', (req, res) => {
  try {
    const userId = resolveRequestUserId(req);
    const { email, amount = 15, module_id = 'all', moduleId } = req.body || {};
    const targetModule = moduleId !== undefined ? moduleId : module_id;

    const tx = backendDb.createPaymentTransaction({
      user_id: userId,
      gateway: 'stripe',
      phone_number: String(email || 'card@stripe.checkout'),
      amount: Math.max(1, Number(amount) || 15),
      currency: 'USD',
      module_id: targetModule === 'all' ? 'all' : Number(targetModule),
    });

    res.json({
      message: 'Stripe Checkout Session initialized',
      checkout_request_id: tx.checkout_request_id,
      transaction: tx,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create Stripe payment session.' });
  }
});

app.post('/api/payments/webhook', (req, res) => {
  try {
    const body = req.body || {};

    // Support official Safaricom Daraja STK Callback payload structure (Body.stkCallback)
    if (body?.Body?.stkCallback) {
      const stkCallback = body.Body.stkCallback;
      const checkoutRequestId = stkCallback.CheckoutRequestID;
      const resultCode = Number(stkCallback.ResultCode ?? 0);
      const metadataItems: any[] = stkCallback.CallbackMetadata?.Item || [];
      const receiptItem = metadataItems.find((i) => i.Name === 'MpesaReceiptNumber');
      const receiptNumber = receiptItem?.Value ? String(receiptItem.Value) : undefined;

      const result = backendDb.completePaymentWebhook({
        checkout_request_id: checkoutRequestId,
        result_code: resultCode,
        receipt_number: receiptNumber,
      });

      return res.json({
        ResultCode: 0,
        ResultDesc: 'Accepted',
        transaction: result.transaction,
        user: result.user,
      });
    }

    // Support direct webhook / Stripe confirmation payload
    const checkoutRequestId =
      body.checkout_request_id || body.CheckoutRequestID || body.data?.object?.id;
    const resultCode = body.result_code !== undefined ? Number(body.result_code) : 0;
    const receiptNumber = body.receipt_number || body.MpesaReceiptNumber;

    if (!checkoutRequestId) {
      return res.status(400).json({ error: 'Missing checkout_request_id in webhook payload.' });
    }

    const result = backendDb.completePaymentWebhook({
      checkout_request_id: checkoutRequestId,
      result_code: resultCode,
      receipt_number: receiptNumber,
    });

    if (!result.transaction) {
      return res.status(404).json({ error: 'Transaction not found for webhook confirmation.' });
    }

    res.json({
      status: 'confirmed',
      transaction: result.transaction,
      user: result.user,
    });
  } catch (error: any) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ error: 'Failed to process payment webhook callback.' });
  }
});

app.get('/api/backend/architecture', (req, res) => {
  const userId = resolveRequestUserId(req);
  const report = backendDb.getUserProgressReport(userId);
  res.json({
    engine: 'Node.js Express + Cloud Firestore + Relational Curriculum Store',
    tables: [
      {
        name: 'users',
        columns: ['id (UUID PK)', 'email (UNIQUE)', 'full_name', 'role (ENUM)', 'created_at'],
        row_count: backendDb.users.size,
      },
      {
        name: 'learning_paths',
        columns: ['id (PK)', 'title', 'weight_percentage'],
        row_count: backendDb.learningPaths.size,
      },
      {
        name: 'modules',
        columns: ['id (PK)', 'path_id (FK)', 'title', 'module_number'],
        row_count: backendDb.modules.size,
      },
      {
        name: 'questions',
        columns: [
          'id (PK)',
          'module_id (FK)',
          'scenario_text',
          'options (JSONB)',
          'correct_answer (CHAR)',
          'explanation_correct',
          'explanation_distractors (JSONB)',
          'exam_tip',
        ],
        row_count: backendDb.questions.size,
      },
      {
        name: 'user_progress',
        columns: [
          'id (UUID PK)',
          'user_id (FK)',
          'module_id (FK)',
          'score',
          'status (ENUM)',
          'last_attempted',
        ],
        row_count: backendDb.userProgress.size,
      },
      {
        name: 'quiz_sessions',
        columns: [
          'id (UUID PK)',
          'user_id (FK)',
          'questions_answered',
          'correct_count',
          'completed_at',
        ],
        row_count: backendDb.quizSessions.length,
      },
      {
        name: 'payment_transactions',
        columns: [
          'id (UUID PK)',
          'user_id (FK)',
          'gateway',
          'phone_number',
          'amount',
          'checkout_request_id',
          'status',
        ],
        row_count: backendDb.paymentTransactions.size,
      },
    ],
    active_user_report: report,
  });
});

app.get('/api/supabase/migrations', (_req, res) => {
  try {
    const supabaseDir = path.resolve(__dirname, 'supabase');
    const migrationsDir = path.join(supabaseDir, 'migrations');
    const configPath = path.join(supabaseDir, 'config.toml');
    const seedPath = path.join(supabaseDir, 'seed.sql');

    const configToml = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';
    const seedSql = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, 'utf8') : '';

    const migrationFiles = fs.existsSync(migrationsDir)
      ? fs
          .readdirSync(migrationsDir)
          .filter((f) => f.endsWith('.sql'))
          .sort()
          .map((filename) => ({
            filename,
            path: `supabase/migrations/${filename}`,
            sql: fs.readFileSync(path.join(migrationsDir, filename), 'utf8'),
          }))
      : [];

    res.json({
      project_id: 'az900-smart-quiz-builder',
      config_path: 'supabase/config.toml',
      config_toml: configToml,
      migrations: migrationFiles,
      seed_path: 'supabase/seed.sql',
      seed_sql: seedSql,
    });
  } catch (error: any) {
    console.error('Error reading Supabase migrations:', error);
    res.status(500).json({ error: 'Failed to load Supabase migration files.' });
  }
});


// API: Generate scenario-based AZ-900 quiz question(s)
app.post('/api/generate-scenario', async (req, res) => {
  try {
    const {
      pathId,
      moduleId,
      difficulty = 'Intermediate',
      customPrompt = '',
      count = 1,
      weakModules = [],
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const systemInstruction = `You are the AZ-900 Smart Quiz Builder & Knowledge Assistant, an elite Microsoft Certified Trainer for the AZ-900 Microsoft Azure Fundamentals exam.
Your task is to write authentic, scenario-based practice questions that strictly mirror Microsoft Learn's real AZ-900 exam format.

Question requirements:
1. Scenario-based: Real enterprise/business scenario (e.g., e-commerce migrating workloads, financial compliance, hybrid network setup, cost optimization).
2. Exactly 4 distinct choices: A, B, C, D. All choices must be real Azure concepts or services.
3. Instant Feedback Engine:
   - "correctAnswer": Exact letter ("A", "B", "C", or "D").
   - "correctAnswerText": The exact text of the correct option.
   - "whyCorrect": Clear 2-3 sentence explanation of the Azure concept and why it satisfies the scenario constraints.
   - "whyIncorrect": A mapped explanation object with entries for each distractor letter explaining in 1 clear sentence why that choice is incorrect or doesn't meet requirements.
   - "examTip": A punchy, memorable keyword or shortcut rule for quick memory retention during the exam (e.g. "Whenever the exam mentions...", "Remember: LRS = 3 copies in single datacenter...").
4. Metadata:
   - "learningPathId": 1, 2, or 3.
   - "learningPathTitle": Official Path title.
   - "moduleId": 1 to 12.
   - "moduleTitle": Official Module title.
   - "difficulty": "Fundamental", "Intermediate", or "Advanced".`;

    const weakModulesText =
      Array.isArray(weakModules) && weakModules.length > 0
        ? `\nTargeted Weak Modules from User's Recent Quiz Session (distribute questions across these lowest-scoring modules):\n` +
          weakModules
            .map(
              (wm: any) =>
                `- Module ${wm.moduleId}: ${wm.moduleTitle} (Path ${wm.pathId}: ${wm.pathTitle}, Current Score: ${wm.accuracy}%)`
            )
            .join('\n')
        : '';

    const promptText = `Generate ${count} scenario-based AZ-900 exam question(s).
Focus:
- Learning Path: ${pathId ? `Path ${pathId}` : 'Official AZ-900 paths'}
- Module: ${moduleId ? `Module ${moduleId}` : 'Targeted weak modules listed below'}
- Target Difficulty: ${difficulty}
${customPrompt ? `- Specific Scenario/Topic focus: "${customPrompt}"` : ''}${weakModulesText}

Ensure distractors are plausible real Azure services that test genuine conceptual understanding.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'Unique slug ID' },
              learningPathId: { type: Type.INTEGER },
              learningPathTitle: { type: Type.STRING },
              moduleId: { type: Type.INTEGER },
              moduleTitle: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              scenario: { type: Type.STRING, description: 'The scenario context and problem' },
              question: { type: Type.STRING, description: 'The specific question being asked' },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    letter: { type: Type.STRING, description: 'A, B, C, or D' },
                    text: { type: Type.STRING, description: 'Option text' },
                  },
                  required: ['letter', 'text'],
                },
              },
              correctAnswer: { type: Type.STRING, description: 'Letter A, B, C, or D' },
              whyCorrect: { type: Type.STRING, description: 'Why this option is correct' },
              distractorBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    letter: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['letter', 'reason'],
                },
              },
              examTip: { type: Type.STRING, description: 'Key memory tip / rule' },
            },
            required: [
              'scenario',
              'question',
              'options',
              'correctAnswer',
              'whyCorrect',
              'distractorBreakdown',
              'examTip',
            ],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    res.json({ questions: parsed });
  } catch (error: any) {
    console.error('Error generating scenario:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate question with AI',
    });
  }
});

// API: AZ-900 Knowledge Assistant interactive tutor chat
app.post('/api/ask-assistant', async (req, res) => {
  try {
    const { query, history = [], currentContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const systemInstruction = `You are the AZ-900 Knowledge Assistant, a warm, authoritative, and encouraging Microsoft Certified Azure tutor with deep expertise in the AZ-900 curriculum and official Microsoft Learn documentation.
Your visual and pedagogical identity blends high-tech Microsoft Azure precision with warm African hospitality, wisdom, and clarity.

Curriculum Structure:
- Learning Path 1: Cloud Concepts (Cloud Models, Shared Responsibility, Cloud Benefits, CapEx vs OpEx, Consumption)
- Learning Path 2: Azure Architecture & Services (Regions, Availability Zones, Resource Groups, Compute VMs/App Service/Containers/AKS, Networking VNets/Gateways/ExpressRoute, Storage Tiers & Redundancy LRS/ZRS/GRS, Entra ID, RBAC, Zero Trust)
- Learning Path 3: Azure Management & Governance (Cost Management & Pricing Calculator, Policy & Initiatives, Locks, ARM/Bicep/Cloud Shell/Arc, Advisor/Monitor/Service Health)

Guidelines:
1. Provide razor-sharp, exam-focused answers grounded strictly in official Microsoft Azure documentation (learn.microsoft.com). Keep concepts intuitive with relatable real-world analogies.
2. When comparing concepts (e.g. ExpressRoute vs VPN Gateway, Azure Policy vs RBAC, Blob Hot vs Cool vs Archive), provide clear side-by-side differentiation.
3. Always include an "💡 Exam Anchor Tip" summarizing the exact keyword trigger Microsoft uses on the exam.
4. Always include a "📚 Official Microsoft Azure Documentation References" section at the end with 1–2 relevant official Microsoft Learn documentation URLs (e.g. https://learn.microsoft.com/en-us/azure/...).
5. Use clean markdown formatting with bold terms, bullet points, and code/quote blocks where appropriate.`;

    const contents = [
      ...history.map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }],
      })),
      {
        role: 'user',
        parts: [
          {
            text: `${currentContext ? `[Context: Current Study Module: ${currentContext}]\n` : ''}${query}`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    res.json({
      answer: response.text || 'I could not generate an answer at this moment.',
    });
  } catch (error: any) {
    console.error('Error in Knowledge Assistant:', error);
    res.status(500).json({
      error: error.message || 'Failed to process inquiry with Knowledge Assistant',
    });
  }
});

// Mount Vite or static server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });

    // Provide clean /@vite/client module with inert transport for AI Studio cloud environment
    app.get('/@vite/client', async (req, res, next) => {
      try {
        const mod = await vite.transformRequest('/@vite/client');
        if (mod) {
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-cache');
          let code = mod.code;
          if (code.includes('const createWebSocketModuleRunnerTransport = (options) => {')) {
            code = code.replace(
              'const createWebSocketModuleRunnerTransport = (options) => {',
              'const createWebSocketModuleRunnerTransport = () => ({ async connect() {}, send() {}, async disconnect() {} }); const _unused_ws = (options) => {'
            );
          }
          return res.send(code);
        }
        next();
      } catch (err) {
        next(err);
      }
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`AZ-900 Quiz Builder & Collaborative Study Hub running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
