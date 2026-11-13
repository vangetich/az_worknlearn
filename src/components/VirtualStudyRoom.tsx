import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Users,
  Send,
  X,
  Share2,
  Copy,
  Check,
  Lock,
  Unlock,
  Eye,
  RotateCcw,
  ArrowRight,
  MessageSquare,
  Radio,
  Clock,
  Play,
  Pause,
  Sparkles,
  Compass,
  BookOpen,
  Layers,
  PenTool,
  Plus,
  Trash2,
  Move,
  Network,
  Flame,
  Heart,
  CheckCircle2,
  Link2,
  Bot,
  Save,
  LayoutGrid,
} from 'lucide-react';
import { Question, UserStats } from '../types/quiz';
import { BUILTIN_QUESTIONS } from '../data/questionBank';
import {
  CanonicalChamberId,
  VIRTUAL_STUDY_AREAS,
  computeChamberMasteryPct,
  getQuestionsForStudyArea,
  getStudyAreaById,
} from '../data/virtualStudyAreas';
import {
  ChamberHandoffItem,
  StudyChamberWorkbench,
} from './StudyChamberWorkbench';
import {
  auth,
  FirestoreStudyChamberCheckin,
  saveStudyChamberHandoffToFirestore,
  subscribeToStudyChamberCheckins,
  syncStudyChamberCheckinToFirestore,
} from '../lib/firebase';

interface StudyMessage {
  id: string;
  senderId?: string;
  sender: string;
  avatar: string;
  location: string;
  text: string;
  timestamp: number;
  isCoach?: boolean;
  questionRef?: {
    id: string;
    title: string;
    scenarioSnippet: string;
  };
  handoffRef?: {
    fromRoomId: string;
    toRoomId: string;
    title: string;
  };
}

interface CollabParticipant {
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

interface SharedQuestionSnapshot {
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

interface WhiteboardNode {
  id: string;
  title: string;
  category: 'compute' | 'networking' | 'storage' | 'identity' | 'governance';
  notes: string;
  x: number;
  y: number;
  authorName: string;
  updatedAt: number;
}

interface WhiteboardStroke {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  authorName: string;
}

interface StudyChamberTimerState {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  startedAtEpochMs: number | null;
}

interface StudyHubRoomState {
  roomId: string;
  createdAt: number;
  updatedAt: number;
  activeQuestion: SharedQuestionSnapshot | null;
  isAnswerRevealed: boolean;
  sharedScratchpad: string;
  eliminatedOptions: string[];
  whiteboardNodes?: WhiteboardNode[];
  whiteboardStrokes?: WhiteboardStroke[];
  handoffQueue?: ChamberHandoffItem[];
  timerState?: StudyChamberTimerState;
  coopStats: {
    questionsSolved: number;
    consensusCorrect: number;
    currentStreak: number;
  };
  participants: Record<string, CollabParticipant>;
  messages: StudyMessage[];
}

export interface ChamberSummaryItem {
  roomId: CanonicalChamberId;
  onlineCount: number;
  participants: Array<{
    userId: string;
    name: string;
    avatar: string;
    location: string;
  }>;
  questionsSolved: number;
  consensusCorrect: number;
  currentStreak: number;
  activeQuestionTitle: string | null;
  activeQuestionId: string | null;
  whiteboardNodesCount: number;
  messagesCount: number;
  pendingHandoffsCount: number;
  totalHandoffsCount: number;
  timerRunning: boolean;
  updatedAt: number;
}

interface CohortPeerItem {
  id: string;
  fullName: string;
  avatar?: string;
  region?: string;
  readinessScore?: number;
  streakDays?: number;
  kudosCount?: number;
  recentActivity?: string;
}

interface VirtualStudyRoomProps {
  currentQuestion?: Question | null;
  activeModuleTitle?: string;
  allQuestions?: Question[];
  stats?: UserStats;
  isOpen: boolean;
  onClose: () => void;
  onSelectSharedQuestion?: (questionId: string) => void;
  onRecordAnswer?: (question: Question, selectedOption: string) => void;
  onPracticeModule?: (moduleId: number) => void;
  onOpenStudyDecksModule?: (moduleId: number, pathId: 1 | 2 | 3) => void;
  onOpenAzureThemes?: (moduleId?: number) => void;
  onOpenMockExam?: () => void;
  initialRoomAreaId?: string;
}

const USER_ID_STORAGE_KEY = 'az900_collab_user_id_v1';
const ROOM_ID_STORAGE_KEY = 'az900_collab_room_id_v1';
const AVATAR_CHOICES = ['👩🏾‍💻', '👨🏿‍💻', '👩🏽‍💻', '👨🏾‍💻', '🌟', '🦁', '🚀', '⚡'];

const DEFAULT_EMPTY_STATS: UserStats = {
  totalAnswered: 0,
  totalCorrect: 0,
  streakDays: 0,
  lastActiveDate: '',
  bookmarks: [],
  attempts: {},
  moduleMastery: {},
  pathMastery: {},
};

function toQuestionSnapshot(q: Question): SharedQuestionSnapshot {
  return {
    id: q.id,
    learningPathId: q.learningPathId,
    moduleId: q.moduleId,
    moduleTitle: q.moduleTitle,
    difficulty: q.difficulty,
    scenario: q.scenario,
    question: q.question,
    options: q.options.map((o) => ({ letter: o.letter, text: o.text })),
    correctAnswer: q.correctAnswer,
    whyCorrect: q.whyCorrect,
    examTip: q.examTip,
  };
}

export const VirtualStudyRoom: React.FC<VirtualStudyRoomProps> = ({
  currentQuestion,
  allQuestions = BUILTIN_QUESTIONS,
  stats = DEFAULT_EMPTY_STATS,
  isOpen,
  onClose,
  onSelectSharedQuestion,
  onRecordAnswer,
  onPracticeModule,
  onOpenStudyDecksModule,
  onOpenAzureThemes,
  onOpenMockExam,
  initialRoomAreaId,
}) => {
  const isLobbySentinel = (id?: string) => {
    const u = (id || '').trim().toUpperCase();
    return u === 'HUB-LOBBY' || u === 'AZ900-HUB' || u === 'LOBBY';
  };

  // Top-level Hub View: 'lobby' (All 6 Interconnected Chambers Map) vs 'chamber' (Inside an Active Chamber)
  const [hubSurface, setHubSurface] = useState<'lobby' | 'chamber'>(() =>
    isLobbySentinel(initialRoomAreaId) ? 'lobby' : 'chamber'
  );

  // Inside Chamber mode tab: 'hub' (Co-Op Solver + Domain Lab), 'whiteboard', 'chat'
  const [activeMode, setActiveMode] = useState<'hub' | 'whiteboard' | 'chat'>('hub');
  const [showDomainLab, setShowDomainLab] = useState<boolean>(true);
  const [showHandoffDrawer, setShowHandoffDrawer] = useState<boolean>(false);
  const [handoffTargetRoom, setHandoffTargetRoom] = useState<CanonicalChamberId>('AZ900-CLINIC');
  const [handoffNote, setHandoffNote] = useState<string>('');
  const [handoffStatusBanner, setHandoffStatusBanner] = useState<string | null>(null);

  // Whiteboard UI state
  const [newNodeTitle, setNewNodeTitle] = useState<string>('');
  const [newNodeCategory, setNewNodeCategory] = useState<WhiteboardNode['category']>('compute');
  const [newNodeNotes, setNewNodeNotes] = useState<string>('');
  const [strokeColor, setStrokeColor] = useState<string>('#0078D4');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const whiteboardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const whiteboardContainerRef = useRef<HTMLDivElement | null>(null);

  // Session Identity
  const [myUserId] = useState<string>(() => {
    try {
      const existing = sessionStorage.getItem(USER_ID_STORAGE_KEY);
      if (existing) return existing;
      const created = `user-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(USER_ID_STORAGE_KEY, created);
      return created;
    } catch {
      return `user-${Math.random().toString(36).slice(2, 8)}`;
    }
  });

  const [myName] = useState<string>(() => {
    try {
      return (
        auth.currentUser?.displayName ||
        sessionStorage.getItem('az900_collab_user_name') ||
        localStorage.getItem('az900_candidate_name') ||
        `Explorer-${myUserId.slice(-3).toUpperCase()}`
      );
    } catch {
      return 'Cloud Explorer';
    }
  });

  const [myAvatar] = useState<string>(() => {
    try {
      return (
        sessionStorage.getItem('az900_collab_user_avatar') ||
        AVATAR_CHOICES[Math.floor(Math.random() * AVATAR_CHOICES.length)]
      );
    } catch {
      return '🌟';
    }
  });

  // Active Chamber ID (Always resolves to one of the 6 canonical IDs)
  const [roomId, setRoomId] = useState<CanonicalChamberId>(() => {
    try {
      if (initialRoomAreaId && !isLobbySentinel(initialRoomAreaId)) {
        return getStudyAreaById(initialRoomAreaId).id;
      }
      const params = new URLSearchParams(window.location.search);
      const urlHub = params.get('hub');
      if (urlHub && !isLobbySentinel(urlHub)) return getStudyAreaById(urlHub).id;
      const stored = localStorage.getItem(ROOM_ID_STORAGE_KEY);
      return getStudyAreaById(stored || 'AZ900-CONCEPTS').id;
    } catch {
      return 'AZ900-CONCEPTS';
    }
  });

  // Respond cleanly when parent opens with a specific chamber vs Enter Hub lobby
  useEffect(() => {
    if (!isOpen) return;
    if (isLobbySentinel(initialRoomAreaId)) {
      setHubSurface('lobby');
    } else if (initialRoomAreaId && initialRoomAreaId.trim()) {
      const resolved = getStudyAreaById(initialRoomAreaId).id;
      setRoomId(resolved);
      setHubSurface('chamber');
    }
  }, [initialRoomAreaId, isOpen]);

  const activeArea = getStudyAreaById(roomId);

  // Set smart default handoff target whenever room changes
  useEffect(() => {
    const defaultLink = activeArea.linkedChambers[0]?.targetId || 'AZ900-CLINIC';
    setHandoffTargetRoom(defaultLink);
  }, [roomId]);

  // Live 6-Chamber Network Summary + Harambee Cohort Peers
  const [chambersSummary, setChambersSummary] = useState<ChamberSummaryItem[]>([]);
  const [cohortPeers, setCohortPeers] = useState<CohortPeerItem[]>([]);
  const [kudosSentIds, setKudosSentIds] = useState<Record<string, boolean>>({});
  const [firestoreCheckins, setFirestoreCheckins] = useState<
    Record<string, FirestoreStudyChamberCheckin>
  >({});
  const [savedNoteToast, setSavedNoteToast] = useState<boolean>(false);

  // Server-authoritative Study Hub state for current chamber
  const [hubState, setHubState] = useState<StudyHubRoomState | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);
  const [hubChatInput, setHubChatInput] = useState<string>('');
  const [coachPrompt, setCoachPrompt] = useState<string>('');
  const [isAskingCoach, setIsAskingCoach] = useState<boolean>(false);
  const recordedRevealKeysRef = useRef<Set<string>>(new Set());

  const wsRef = useRef<WebSocket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live Synchronized Timer derived from server `timerState`
  const [displaySecondsLeft, setDisplaySecondsLeft] = useState<number>(
    activeArea.defaultDurationSeconds
  );

  useEffect(() => {
    const computeRemaining = () => {
      const ts = hubState?.timerState;
      if (!ts) return activeArea.defaultDurationSeconds;
      if (!ts.isRunning || !ts.startedAtEpochMs) {
        return Math.max(0, ts.remainingSeconds);
      }
      const elapsedSec = Math.floor((Date.now() - ts.startedAtEpochMs) / 1000);
      return Math.max(0, ts.remainingSeconds - elapsedSec);
    };

    setDisplaySecondsLeft(computeRemaining());
    if (!hubState?.timerState?.isRunning) return;

    const timer = setInterval(() => {
      setDisplaySecondsLeft(computeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, [hubState?.timerState, activeArea.defaultDurationSeconds]);

  // Subscribe to Firestore chamber check-ins if user is signed in with Firebase Auth
  useEffect(() => {
    if (!isOpen) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const unsub = subscribeToStudyChamberCheckins(uid, (records) => {
        setFirestoreCheckins(records);
      });
      return () => unsub();
    } catch {
      return undefined;
    }
  }, [isOpen]);

  // Fetch initial 6-chamber summary & Harambee Cohort roster when modal opens
  const refreshNetworkOverview = useCallback(async () => {
    try {
      const [sumRes, cohortRes] = await Promise.all([
        fetch('/api/study-hub/chambers/summary'),
        fetch('/api/cohort/leaderboard'),
      ]);
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        if (Array.isArray(sumData.chambers)) {
          setChambersSummary(sumData.chambers);
        }
      }
      if (cohortRes.ok) {
        const cData = await cohortRes.json();
        if (Array.isArray(cData.leaderboard)) {
          setCohortPeers(cData.leaderboard.slice(0, 8));
        }
      }
    } catch {
      // ignore offline
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refreshNetworkOverview();
  }, [isOpen, refreshNetworkOverview]);

  // Send an event to server (via WebSocket + HTTP POST + BroadcastChannel)
  const dispatchHubEvent = useCallback(
    async (type: string, payload: any = {}, targetRoomOverride?: string) => {
      const targetRoom = (targetRoomOverride || roomId).toUpperCase();
      const eventObj = {
        roomId: targetRoom,
        userId: myUserId,
        type,
        payload,
      };

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify(eventObj));
        } catch {
          // ignore
        }
      }

      try {
        const res = await fetch(`/api/study-hub/${encodeURIComponent(targetRoom)}/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventObj),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.room && targetRoom === roomId) {
            setHubState(data.room);
          }
          if (Array.isArray(data.chambers)) {
            setChambersSummary(data.chambers);
          }
          if (broadcastChannelRef.current && data.room) {
            try {
              broadcastChannelRef.current.postMessage({
                type: 'room:state',
                room: data.room,
              });
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore network error
      }
    },
    [roomId, myUserId]
  );

  // Domain-matched default question for active chamber
  const chamberDomainQuestions = useMemo(
    () => getQuestionsForStudyArea(roomId, allQuestions, stats),
    [roomId, allQuestions, stats]
  );

  // Connect WebSocket + BroadcastChannel + Periodic Reconciliation when open
  useEffect(() => {
    if (!isOpen) return;

    const preferredInitialQ =
      chamberDomainQuestions[0] || currentQuestion || allQuestions[0] || BUILTIN_QUESTIONS[0];
    const initialQ = toQuestionSnapshot(preferredInitialQ);

    dispatchHubEvent('room:join', {
      name: myName,
      avatar: myAvatar,
      location: 'Harambee Hub',
      initialQuestion: initialQ,
    });

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('az900_study_hub_channel');
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'room:state' && ev.data?.room?.roomId === roomId) {
            setHubState(ev.data.room);
          }
        };
        broadcastChannelRef.current = bc;
      } catch {
        // ignore
      }
    }

    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/api/collab-ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        ws?.send(
          JSON.stringify({
            roomId,
            userId: myUserId,
            type: 'room:join',
            payload: {
              name: myName,
              avatar: myAvatar,
              location: 'Harambee Hub',
              initialQuestion: initialQ,
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'room:state' && parsed.room?.roomId === roomId) {
            setHubState(parsed.room);
          } else if (parsed.type === 'chambers:summary' && Array.isArray(parsed.chambers)) {
            setChambersSummary(parsed.chambers);
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };
    } catch {
      setWsConnected(false);
    }

    const pollInterval = setInterval(async () => {
      try {
        const [roomRes, sumRes] = await Promise.all([
          fetch(`/api/study-hub/${encodeURIComponent(roomId)}`),
          fetch('/api/study-hub/chambers/summary'),
        ]);
        if (roomRes.ok) {
          const data = await roomRes.json();
          if (data.room) setHubState(data.room);
        }
        if (sumRes.ok) {
          const sData = await sumRes.json();
          if (Array.isArray(sData.chambers)) setChambersSummary(sData.chambers);
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      if (ws) {
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, roomId, myUserId, myName, myAvatar]);

  // Sync revealed Co-Op answer to real UserStats + Firestore chamber check-in
  useEffect(() => {
    if (!hubState?.isAnswerRevealed || !hubState.activeQuestion) return;
    const myVote = hubState.participants?.[myUserId]?.selectedOption;
    if (!myVote) return;

    const roundKey = `${roomId}:${hubState.activeQuestion.id}:${hubState.coopStats.questionsSolved}`;
    if (recordedRevealKeysRef.current.has(roundKey)) return;
    recordedRevealKeysRef.current.add(roundKey);

    const fullQ = allQuestions.find((q) => q.id === hubState.activeQuestion?.id);
    if (fullQ && onRecordAnswer) {
      onRecordAnswer(fullQ, myVote);
    }

    const uid = auth.currentUser?.uid;
    if (uid) {
      const isCorrect = myVote === hubState.activeQuestion.correctAnswer;
      syncStudyChamberCheckinToFirestore(uid, roomId, {
        solvedDelta: 1,
        correctDelta: isCorrect ? 1 : 0,
        lastNotes: hubState.sharedScratchpad || undefined,
      }).catch(() => {
        // logged cleanly inside helper
      });
    }
  }, [hubState?.isAnswerRevealed, hubState?.activeQuestion, hubState?.coopStats.questionsSolved]);

  // Auto-scroll chat
  useEffect(() => {
    if (isOpen && activeMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [hubState?.messages, isOpen, activeMode]);

  const handleEnterChamber = (targetId: CanonicalChamberId) => {
    setRoomId(targetId);
    setHubSurface('chamber');
    try {
      localStorage.setItem(ROOM_ID_STORAGE_KEY, targetId);
    } catch {
      // ignore
    }
  };

  const handleLoadQuestionToBoard = (q: Question) => {
    dispatchHubEvent('question:sync', {
      question: toQuestionSnapshot(q),
    });
  };

  const handleLoadAreaQuestion = () => {
    const pool = chamberDomainQuestions.length > 0 ? chamberDomainQuestions : allQuestions;
    const currentId = hubState?.activeQuestion?.id;
    const candidates = pool.filter((q) => q.id !== currentId);
    const source = candidates.length > 0 ? candidates : pool;
    const pick = source[Math.floor(Math.random() * source.length)] || BUILTIN_QUESTIONS[0];
    dispatchHubEvent('question:sync', { question: toQuestionSnapshot(pick) });
  };

  const handleNextSharedQuestion = () => {
    const pool = chamberDomainQuestions.length > 0 ? chamberDomainQuestions : allQuestions;
    const currentId = hubState?.activeQuestion?.id;
    const idx = pool.findIndex((q) => q.id === currentId);
    const nextQ = pool[(idx + 1) % pool.length] || BUILTIN_QUESTIONS[0];
    dispatchHubEvent('question:sync', { question: toQuestionSnapshot(nextQ) });
  };

  const handleSyncMyQuestionToHub = () => {
    if (!currentQuestion) return;
    dispatchHubEvent('question:sync', {
      question: toQuestionSnapshot(currentQuestion),
    });
  };

  const handleSelectOptionVote = (letter: 'A' | 'B' | 'C' | 'D') => {
    if (hubState?.isAnswerRevealed) return;
    const myParticipant = hubState?.participants?.[myUserId];
    const isSame = myParticipant?.selectedOption === letter;
    dispatchHubEvent('vote:select', {
      option: letter,
      lockedIn: isSame ? !myParticipant?.lockedIn : false,
    });
  };

  const handleToggleLockVote = () => {
    const myParticipant = hubState?.participants?.[myUserId];
    if (!myParticipant?.selectedOption || hubState?.isAnswerRevealed) return;
    dispatchHubEvent('vote:select', {
      option: myParticipant.selectedOption,
      lockedIn: !myParticipant.lockedIn,
    });
  };

  const handleEliminateOption = (e: React.MouseEvent, letter: string) => {
    e.stopPropagation();
    dispatchHubEvent('option:eliminate', { letter });
  };

  const handleCopyHubInvite = async () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?hub=${encodeURIComponent(
      roomId
    )}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleSendInterChamberHandoff = async (params: {
    toRoomId: CanonicalChamberId;
    type: 'question' | 'trap' | 'concept' | 'warroom-miss';
    title: string;
    note: string;
    question?: Question;
  }) => {
    const snap = params.question
      ? toQuestionSnapshot(params.question)
      : hubState?.activeQuestion || undefined;

    try {
      const res = await fetch(`/api/study-hub/${encodeURIComponent(roomId)}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toRoomId: params.toRoomId,
          type: params.type,
          title: params.title,
          note: params.note,
          senderName: myName,
          senderAvatar: myAvatar,
          questionSnapshot: snap,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sourceRoom && data.sourceRoom.roomId === roomId) {
          setHubState(data.sourceRoom);
        }
        if (Array.isArray(data.chambers)) {
          setChambersSummary(data.chambers);
        }
        if (auth.currentUser?.uid && data.handoff?.id) {
          saveStudyChamberHandoffToFirestore(auth.currentUser.uid, {
            id: data.handoff.id,
            fromRoomId: roomId,
            toRoomId: params.toRoomId,
            questionId: snap?.id || 'general',
            title: params.title,
            note: params.note,
          }).catch(() => {});
        }
        setHandoffStatusBanner(`Linked "${params.title}" into ${params.toRoomId}!`);
        setShowHandoffDrawer(false);
        setHandoffNote('');
        setTimeout(() => setHandoffStatusBanner(null), 3500);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveNotesToFirestore = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setSavedNoteToast(true);
      setTimeout(() => setSavedNoteToast(false), 2500);
      return;
    }
    try {
      await syncStudyChamberCheckinToFirestore(uid, roomId, {
        lastNotes: hubState?.sharedScratchpad || '',
      });
      setSavedNoteToast(true);
      setTimeout(() => setSavedNoteToast(false), 2500);
    } catch {
      // handled cleanly
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = hubChatInput.trim();
    if (!trimmed) return;
    const msg: StudyMessage = {
      id: `hubmsg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: myUserId,
      sender: myName,
      avatar: myAvatar,
      location: roomId,
      text: trimmed,
      timestamp: Date.now(),
    };
    setHubChatInput('');
    dispatchHubEvent('chat:message', { message: msg });
  };

  const handleShareQuestionInChat = () => {
    const q = activeHubQuestion;
    const msg: StudyMessage = {
      id: `qshare-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: myUserId,
      sender: myName,
      avatar: myAvatar,
      location: roomId,
      text: `Let's analyze this ${activeArea.shortCode} scenario together:`,
      timestamp: Date.now(),
      questionRef: {
        id: q.id,
        title: `M${q.moduleId} · ${q.moduleTitle}`,
        scenarioSnippet: `${q.scenario.slice(0, 140)}...`,
      },
    };
    dispatchHubEvent('chat:message', { message: msg });
    setActiveMode('chat');
  };

  const handleAskDomainCoach = async (customPrompt?: string) => {
    if (isAskingCoach) return;
    setIsAskingCoach(true);
    try {
      const res = await fetch(`/api/study-hub/${encodeURIComponent(roomId)}/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt || coachPrompt || 'Explain the core AZ-900 rule behind this scenario and contrast the main distractor.',
          userName: myName,
          areaName: activeArea.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.room) setHubState(data.room);
        setCoachPrompt('');
        setActiveMode('chat');
      }
    } finally {
      setIsAskingCoach(false);
    }
  };

  const handleSendKudos = async (peerId: string) => {
    if (kudosSentIds[peerId]) return;
    setKudosSentIds((prev) => ({ ...prev, [peerId]: true }));
    try {
      await fetch('/api/cohort/kudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: peerId }),
      });
      refreshNetworkOverview();
    } catch {
      // ignore
    }
  };

  // Whiteboard Canvas Rendering
  useEffect(() => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const strokes = hubState?.whiteboardStrokes || [];

    const drawPath = (pts: { x: number; y: number }[], color: string, width: number) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo((pts[0].x / 100) * canvas.width, (pts[0].y / 100) * canvas.height);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo((pts[i].x / 100) * canvas.width, (pts[i].y / 100) * canvas.height);
      }
      ctx.stroke();
    };

    strokes.forEach((s) => drawPath(s.points, s.color, s.width || 3));
    if (currentPoints.length >= 2) {
      drawPath(currentPoints, strokeColor, 3);
    }
  }, [hubState?.whiteboardStrokes, currentPoints, strokeColor, activeMode, hubSurface]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingNodeId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setCurrentPoints((prev) => [...prev, { x, y }]);
  };

  const handleCanvasPointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length >= 2) {
      dispatchHubEvent('whiteboard:stroke:add', {
        stroke: {
          id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          color: strokeColor,
          width: 3,
          points: currentPoints,
          authorName: myName,
        },
      });
    }
    setCurrentPoints([]);
  };

  const handleAddWhiteboardNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim()) return;
    const node: WhiteboardNode = {
      id: `wb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newNodeTitle.trim(),
      category: newNodeCategory,
      notes:
        newNodeNotes.trim() ||
        'Shared AZ-900 concept node added for cohort architectural brainstorming.',
      x: Math.floor(10 + Math.random() * 55),
      y: Math.floor(12 + Math.random() * 55),
      authorName: myName,
      updatedAt: Date.now(),
    };
    dispatchHubEvent('whiteboard:node:add', { node });
    setNewNodeTitle('');
    setNewNodeNotes('');
  };

  const handlePinToWhiteboard = (
    title: string,
    category: WhiteboardNode['category'],
    notes: string
  ) => {
    const node: WhiteboardNode = {
      id: `wb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      category,
      notes,
      x: Math.floor(8 + Math.random() * 58),
      y: Math.floor(10 + Math.random() * 58),
      authorName: myName,
      updatedAt: Date.now(),
    };
    dispatchHubEvent('whiteboard:node:add', { node });
    setHandoffStatusBanner(`Pinned "${title}" onto ${activeArea.shortCode} Whiteboard!`);
    setTimeout(() => setHandoffStatusBanner(null), 2800);
  };

  const handleWhiteboardContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingNodeId || !whiteboardContainerRef.current) return;
    const rect = whiteboardContainerRef.current.getBoundingClientRect();
    const x = Math.max(2, Math.min(72, ((e.clientX - rect.left - 60) / rect.width) * 100));
    const y = Math.max(4, Math.min(75, ((e.clientY - rect.top - 25) / rect.height) * 100));
    dispatchHubEvent('whiteboard:node:move', { nodeId: draggingNodeId, x, y });
  };

  if (!isOpen) return null;

  const fallbackQ =
    chamberDomainQuestions[0] || currentQuestion || allQuestions[0] || BUILTIN_QUESTIONS[0];
  const activeHubQuestion = hubState?.activeQuestion || toQuestionSnapshot(fallbackQ);

  const participantList = Object.values(hubState?.participants || {}).filter(
    (p) => p.isOnline && Date.now() - p.lastSeen < 1000 * 60 * 30
  );
  const myParticipant = hubState?.participants?.[myUserId];
  const partnerParticipants = participantList.filter((p) => p.userId !== myUserId);

  const totalOnlineAcrossAllChambers = chambersSummary.reduce(
    (acc, c) => acc + c.onlineCount,
    0
  );
  const totalSolvedAcrossChambers = chambersSummary.reduce(
    (acc, c) => acc + c.questionsSolved,
    0
  );
  const totalPendingHandoffs = chambersSummary.reduce(
    (acc, c) => acc + c.pendingHandoffsCount,
    0
  );

  const unresolvedIncomingHandoffs = (hubState?.handoffQueue || []).filter((h) => !h.resolved);
  const activeChamberMastery = computeChamberMasteryPct(roomId, stats);

  const timerMinutes = Math.floor(displaySecondsLeft / 60);
  const timerSecs = displaySecondsLeft % 60;
  const formattedTimer = `${String(timerMinutes).padStart(2, '0')}:${String(timerSecs).padStart(2, '0')}`;
  const isTimerRunning = Boolean(hubState?.timerState?.isRunning);

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 font-sans"
      role="dialog"
      aria-modal="true"
      aria-label="Virtual Study Room Areas & Harambee Cohort Hub"
    >
      <div className="w-full max-w-7xl h-[94dvh] max-h-[94dvh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* TOP HUB COMMAND BAR */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-[#0078D4] text-white shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-white truncate">
                  Virtual Study Room Areas · 6 Interoperable Domain Chambers
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold tabular-nums">
                  {wsConnected ? 'Live Sync' : 'REST Sync'} · {Math.max(1, totalOnlineAcrossAllChambers)} Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Harambee Cohort Network · {totalSolvedAcrossChambers} chamber solves · {totalPendingHandoffs} cross-chamber handoffs queued
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className="flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700"
              role="tablist"
              aria-label="Study Hub Surface"
            >
              <button
                type="button"
                role="tab"
                aria-selected={hubSurface === 'lobby'}
                onClick={() => setHubSurface('lobby')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  hubSurface === 'lobby'
                    ? 'bg-[#0078D4] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>All 6 Chambers Hub</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={hubSurface === 'chamber'}
                onClick={() => setHubSurface('chamber')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  hubSurface === 'chamber'
                    ? 'bg-[#0078D4] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{activeArea.shortCode}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close Virtual Study Room Hub"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ===================================================================
            VIEW A: 6-CHAMBER INTEROPERABLE HUB LOBBY ("Enter Hub")
           =================================================================== */}
        {hubSurface === 'lobby' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/60 space-y-6">
            {/* Interoperability Pipeline Strip */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50">
                    Connected 6-Chamber Study Pipeline
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Every chamber filters domain questions, tracks your mastery, syncs notes to Firestore, and passes tricky scenarios directly between chambers.
                  </p>
                </div>
                {onOpenAzureThemes && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAzureThemes();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0078D4] dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer"
                  >
                    Open Themes &amp; Concept Map
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                {VIRTUAL_STUDY_AREAS.map((area, idx) => (
                  <React.Fragment key={area.id}>
                    <button
                      type="button"
                      onClick={() => handleEnterChamber(area.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#0078D4] hover:text-white text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      {idx + 1}. {area.shortCode}
                    </button>
                    {idx < VIRTUAL_STUDY_AREAS.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>

            {/* 6 Live Domain Chambers Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {VIRTUAL_STUDY_AREAS.map((area) => {
                const liveSummary = chambersSummary.find((s) => s.roomId === area.id);
                const mastery = computeChamberMasteryPct(area.id, stats);
                const domainPoolCount = getQuestionsForStudyArea(area.id, allQuestions, stats).length;
                const fsRecord = firestoreCheckins[area.id];

                return (
                  <article
                    key={area.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                      area.id === roomId
                        ? 'border-[#0078D4] ring-2 ring-[#0078D4]/15'
                        : 'border-slate-200 dark:border-slate-800'
                    } p-5 flex flex-col justify-between gap-4 shadow-2xs`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {area.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${area.badgeBg}`}
                            >
                              {area.examWeight}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-slate-50 leading-snug">
                            {area.name}
                          </h4>
                        </div>

                        <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold tabular-nums shrink-0">
                          {liveSummary?.onlineCount ?? 0} live
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {area.mission}
                      </p>

                      {/* Chamber Live Telemetry Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-xs tabular-nums">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Mastery</div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {mastery.masteryPct !== null ? `${mastery.masteryPct}%` : 'New'}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Questions</div>
                          <div className="font-bold text-[#0078D4] dark:text-sky-400">
                            {domainPoolCount}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Queued</div>
                          <div className="font-bold text-amber-600 dark:text-amber-400">
                            {liveSummary?.pendingHandoffsCount ?? 0} traps
                          </div>
                        </div>
                      </div>

                      {fsRecord && fsRecord.questionsSolved > 0 && (
                        <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Cloud Synced: {fsRecord.correctCount}/{fsRecord.questionsSolved} chamber solves saved
                          </span>
                        </div>
                      )}

                      {/* Interoperable Outbound Links */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Connected Chambers:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {area.linkedChambers.map((link) => (
                            <span
                              key={link.targetId}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                            >
                              → {getStudyAreaById(link.targetId).shortCode}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200/70 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleEnterChamber(area.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#0078D4] hover:bg-[#0066B5] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Enter {area.shortCode}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {onPracticeModule && (
                        <button
                          type="button"
                          onClick={() => {
                            onPracticeModule(area.moduleIds[0]);
                            onClose();
                          }}
                          className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#0078D4] text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          Practice M{area.moduleIds[0]}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>

            {/* Live Harambee Cohort Peers Section */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0078D4] dark:text-sky-400" />
                    <span>Global Harambee Azure Cohort Peers</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Send Kudos to cohort learners or copy a live chamber invite link to co-solve together in real time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyHubInvite}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-sky-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInvite ? 'Copied Chamber Link!' : `Copy Invite (#${roomId})`}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {cohortPeers.map((peer) => {
                  const sent = Boolean(kudosSentIds[peer.id]);
                  return (
                    <div
                      key={peer.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {peer.avatar || '👩🏾‍💻'} {peer.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                          {peer.region || 'Global'} · {peer.readinessScore ?? 80}% ready
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={sent}
                        onClick={() => handleSendKudos(peer.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0 ${
                          sent
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-rose-300 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${sent ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{peer.kudosCount ?? 0}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          /* ===================================================================
             VIEW B: ACTIVE CHAMBER WORKSPACE (ALL 6 LINKED & FUNCTIONAL)
             =================================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 6-Chamber Instant Switcher Strip */}
            <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
              {VIRTUAL_STUDY_AREAS.map((area) => {
                const isSelected = area.id === roomId;
                const live = chambersSummary.find((s) => s.roomId === area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => handleEnterChamber(area.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-[#0078D4] text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>{area.shortCode}</span>
                    <span className="text-[10px] tabular-nums opacity-80">
                      ({live?.onlineCount ?? 0})
                    </span>
                    {(live?.pendingHandoffsCount ?? 0) > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black tabular-nums">
                        {live?.pendingHandoffsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Chamber Dossier, Timer & Cross-App Study Links */}
            <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shrink-0 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50">
                      {activeArea.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${activeArea.badgeBg}`}
                    >
                      {activeArea.examWeight}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                      · Domain Mastery:{' '}
                      {activeChamberMastery.masteryPct !== null
                        ? `${activeChamberMastery.masteryPct}%`
                        : 'Unattempted'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                    {activeArea.mission}
                  </p>
                </div>

                {/* Server-Synced Chamber Timer + Cross-App Deep Links */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="tabular-nums">{formattedTimer}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      dispatchHubEvent('timer:sync', {
                        action: isTimerRunning ? 'pause' : 'start',
                        remainingSeconds: displaySecondsLeft,
                      })
                    }
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title={isTimerRunning ? 'Pause shared timer' : 'Start shared timer'}
                  >
                    {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatchHubEvent('timer:sync', {
                        action: 'reset',
                        durationSeconds: activeArea.defaultDurationSeconds,
                      })
                    }
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Reset shared timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {onPracticeModule && (
                    <button
                      type="button"
                      onClick={() => {
                        onPracticeModule(activeHubQuestion.moduleId || activeArea.moduleIds[0]);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0078D4] text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#0078D4]" />
                      <span>Practice M{activeHubQuestion.moduleId}</span>
                    </button>
                  )}

                  {onOpenStudyDecksModule && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenStudyDecksModule(
                          activeHubQuestion.moduleId,
                          activeHubQuestion.learningPathId
                        );
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0078D4] text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Study Deck</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleLoadAreaQuestion}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Next {activeArea.shortCode} Q</span>
                  </button>
                </div>
              </div>

              {/* Interoperable Linked Chambers Row + Invite */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    Linked Chambers:
                  </span>
                  {activeArea.linkedChambers.map((link) => (
                    <button
                      key={link.targetId}
                      type="button"
                      onClick={() => handleEnterChamber(link.targetId)}
                      title={link.relationship}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0078D4] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{getStudyAreaById(link.targetId).shortCode}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-[#0078D4]" />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCopyHubInvite}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-[#0078D4] dark:text-sky-400 inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedInvite ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedInvite ? 'Copied Link!' : 'Invite Cohort Partner'}</span>
                </button>
              </div>
            </div>

            {handoffStatusBanner && (
              <div className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shrink-0">
                <span>{handoffStatusBanner}</span>
                <button
                  type="button"
                  onClick={() => setHandoffStatusBanner(null)}
                  className="underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Mode Switcher Tabs inside Chamber */}
            <div className="px-4 sm:px-6 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveMode('hub')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  activeMode === 'hub'
                    ? 'bg-[#0078D4] text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Co-Op Solver &amp; Domain Lab</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('whiteboard')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  activeMode === 'whiteboard'
                    ? 'bg-[#0078D4] text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Shared Whiteboard</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 tabular-nums">
                  {(hubState?.whiteboardNodes || []).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('chat')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  activeMode === 'chat'
                    ? 'bg-[#0078D4] text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Cohort Chat &amp; Coach</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 tabular-nums">
                  {(hubState?.messages || []).length}
                </span>
              </button>
            </div>

            {/* =================================================================
                TAB 1: CO-OP SOLVER & INTERACTIVE CHAMBER LAB WORKBENCH
               ================================================================= */}
            {activeMode === 'hub' ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
                {/* Incoming Cross-Chamber Handoffs Notification Bar */}
                {unresolvedIncomingHandoffs.length > 0 && roomId !== 'AZ900-CLINIC' && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <strong className="text-amber-900 dark:text-amber-200">
                        Incoming Study Handoff from {unresolvedIncomingHandoffs[0].fromRoomId}:
                      </strong>{' '}
                      <span className="text-amber-800 dark:text-amber-300">
                        {unresolvedIncomingHandoffs[0].title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unresolvedIncomingHandoffs[0].questionSnapshot && (
                        <button
                          type="button"
                          onClick={() =>
                            dispatchHubEvent('handoff:load', {
                              handoffId: unresolvedIncomingHandoffs[0].id,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#0078D4] text-white font-bold cursor-pointer"
                        >
                          Load onto Board
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          dispatchHubEvent('handoff:resolve', {
                            handoffId: unresolvedIncomingHandoffs[0].id,
                            resolved: true,
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 text-amber-900 dark:text-amber-200 font-bold cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Collapsible Chamber-Specific Interactive Lab */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Interactive Chamber Workbench
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDomainLab((v) => !v)}
                      className="text-xs font-bold text-[#0078D4] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {showDomainLab ? 'Collapse Workbench' : 'Expand Workbench'}
                    </button>
                  </div>
                  {showDomainLab && (
                    <StudyChamberWorkbench
                      roomId={roomId}
                      stats={stats}
                      allQuestions={allQuestions}
                      handoffQueue={hubState?.handoffQueue || []}
                      onLoadQuestionToBoard={handleLoadQuestionToBoard}
                      onLoadHandoff={(handoffId) =>
                        dispatchHubEvent('handoff:load', { handoffId })
                      }
                      onResolveHandoff={(handoffId, resolved) =>
                        dispatchHubEvent('handoff:resolve', { handoffId, resolved })
                      }
                      onSendHandoff={handleSendInterChamberHandoff}
                      onRecordAnswer={onRecordAnswer}
                      onPinToWhiteboard={handlePinToWhiteboard}
                      onSwitchChamber={handleEnterChamber}
                      onOpenFullMockExam={
                        onOpenMockExam
                          ? () => {
                              onOpenMockExam();
                              onClose();
                            }
                          : undefined
                      }
                    />
                  )}
                </div>

                {/* Live Participant Presence & Co-Op Scoreboard */}
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-950 dark:text-blue-200">
                      <span>{myAvatar}</span>
                      <span>{myName} (You)</span>
                      {myParticipant?.selectedOption && (
                        <span className="px-1.5 py-0.2 rounded bg-[#0078D4] text-white text-[10px]">
                          {myParticipant.lockedIn
                            ? `Locked ${myParticipant.selectedOption}`
                            : myParticipant.selectedOption}
                        </span>
                      )}
                    </div>

                    {partnerParticipants.map((part) => (
                      <div
                        key={part.userId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-950 dark:text-amber-200"
                      >
                        <span>{part.avatar}</span>
                        <span>{part.name}</span>
                        {part.selectedOption ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[10px]">
                            {hubState?.isAnswerRevealed || part.lockedIn
                              ? `Locked ${part.selectedOption}`
                              : `Picked ${part.selectedOption}`}
                          </span>
                        ) : (
                          <span className="text-[10px] opacity-75">Active</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {hubState && (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold tabular-nums">
                      <span>
                        Co-Op: {hubState.coopStats.consensusCorrect}/
                        {hubState.coopStats.questionsSolved}
                      </span>
                      {hubState.coopStats.currentStreak > 0 && (
                        <span className="text-amber-300 inline-flex items-center gap-0.5">
                          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {hubState.coopStats.currentStreak}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Shared Question Co-Op Card + Inter-Chamber Handoff Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-[#0078D4] dark:text-sky-300">
                          Path {activeHubQuestion.learningPathId} · M{activeHubQuestion.moduleId}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {activeHubQuestion.moduleTitle}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {currentQuestion && currentQuestion.id !== activeHubQuestion.id && (
                          <button
                            type="button"
                            onClick={handleSyncMyQuestionToHub}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-[11px] font-bold text-[#0078D4] dark:text-sky-300 cursor-pointer"
                          >
                            Pull Active Practice Card
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleNextSharedQuestion}
                          className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-[#0066B5] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Next {activeArea.shortCode} Scenario</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0078D4] dark:text-sky-400 block mb-1">
                        Shared Scenario
                      </span>
                      {activeHubQuestion.scenario}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-50 leading-snug">
                      {activeHubQuestion.question}
                    </h4>

                    <div className="space-y-2">
                      {activeHubQuestion.options.map((opt) => {
                        const letter = opt.letter as 'A' | 'B' | 'C' | 'D';
                        const isMyPick = myParticipant?.selectedOption === letter;
                        const partnersOnOption = partnerParticipants.filter(
                          (p) => p.selectedOption === letter
                        );
                        const isEliminated = hubState?.eliminatedOptions?.includes(letter);
                        const isRevealed = Boolean(hubState?.isAnswerRevealed);
                        const isCorrect = activeHubQuestion.correctAnswer === letter;

                        return (
                          <div
                            key={letter}
                            onClick={() => handleSelectOptionVote(letter)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                              isRevealed
                                ? isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                                  : isMyPick || partnersOnOption.length > 0
                                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400'
                                  : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                                : isMyPick
                                ? 'bg-blue-50 dark:bg-blue-950/40 border-[#0078D4]'
                                : isEliminated
                                ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-45 line-through'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <span
                                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                  isRevealed && isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : isMyPick
                                    ? 'bg-[#0078D4] text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {letter}
                              </span>
                              <span className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                                {opt.text}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {isMyPick && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0078D4] text-white">
                                  You
                                </span>
                              )}
                              {partnersOnOption.map((p) => (
                                <span
                                  key={p.userId}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950"
                                >
                                  {p.avatar} {p.name.slice(0, 6)}
                                </span>
                              ))}
                              {!isRevealed && (
                                <button
                                  type="button"
                                  onClick={(e) => handleEliminateOption(e, letter)}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Strike out distractor"
                                >
                                  {isEliminated ? 'Restore' : '✕'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Voting + Reveal + Cross-Chamber Escalation Row */}
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      {!hubState?.isAnswerRevealed ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleToggleLockVote}
                            disabled={!myParticipant?.selectedOption}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            {myParticipant?.lockedIn ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Locked ({myParticipant.selectedOption})</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Lock Vote</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => dispatchHubEvent('vote:reveal')}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Reveal Answer</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-100 space-y-1.5">
                          <div className="flex items-center justify-between font-bold">
                            <span>
                              ✓ Official Answer: Option {activeHubQuestion.correctAnswer}
                            </span>
                            <button
                              type="button"
                              onClick={() => dispatchHubEvent('vote:reset')}
                              className="text-emerald-800 dark:text-emerald-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset Round</span>
                            </button>
                          </div>
                          <p className="leading-relaxed">{activeHubQuestion.whyCorrect}</p>
                          <p className="font-bold text-amber-800 dark:text-amber-300">
                            Exam Tip: {activeHubQuestion.examTip}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowHandoffDrawer((v) => !v)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#0078D4] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#0078D4]" />
                          <span>Send to Linked Chamber</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAskDomainCoach()}
                          disabled={isAskingCoach}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span>{isAskingCoach ? 'Thinking...' : 'Ask AI Coach'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Cross-Chamber Handoff Drawer */}
                    {showHandoffDrawer && (
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Forward This Question &amp; Study Note to Another Chamber
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <select
                            value={handoffTargetRoom}
                            onChange={(e) =>
                              setHandoffTargetRoom(e.target.value as CanonicalChamberId)
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                          >
                            {VIRTUAL_STUDY_AREAS.filter((a) => a.id !== roomId).map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.shortCode} ({a.id})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={handoffNote}
                            onChange={(e) => setHandoffNote(e.target.value)}
                            placeholder="Optional trap or study note..."
                            className="sm:col-span-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowHandoffDrawer(false)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSendInterChamberHandoff({
                                toRoomId: handoffTargetRoom,
                                type: handoffTargetRoom === 'AZ900-CLINIC' ? 'trap' : 'question',
                                title: `M${activeHubQuestion.moduleId}: ${activeHubQuestion.question.slice(0, 60)}`,
                                note: handoffNote || `Escalated from ${activeArea.shortCode}`,
                              })
                            }
                            className="px-3 py-1 rounded-lg bg-[#0078D4] text-white text-xs font-bold cursor-pointer"
                          >
                            Send Handoff Packet
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Shared Scratchpad & Chamber Topic Cues */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/70 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                          Shared Chamber Scratchpad
                        </span>
                        <button
                          type="button"
                          onClick={handleSaveNotesToFirestore}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-[10px] font-bold text-amber-900 dark:text-amber-200 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3 h-3" />
                          <span>{savedNoteToast ? 'Saved!' : 'Save Note'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={hubState?.sharedScratchpad || ''}
                        onChange={(e) =>
                          dispatchHubEvent('scratchpad:update', { text: e.target.value })
                        }
                        placeholder="Jot down SLA math, distractor reasoning, or notes synced with chamber peers..."
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0078D4]"
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {activeArea.shortCode} Exam Anchors
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {activeArea.topicCues.map((cue, idx) => (
                          <li key={idx} className="leading-relaxed">
                            • {cue}
                          </li>
                        ))}
                      </ul>
                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap gap-1.5">
                        {onSelectSharedQuestion && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectSharedQuestion(activeHubQuestion.id);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-sky-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Open Exact Card in Quiz
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleShareQuestionInChat}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          Discuss in Chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeMode === 'whiteboard' ? (
              /* =================================================================
                 TAB 2: DOMAIN-TAILORED SHARED WHITEBOARD
                 ================================================================= */
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/70 dark:bg-slate-950/40">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-50">
                      {activeArea.shortCode} Architecture Whiteboard ({roomId})
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sketch diagrams and arrange concept cards with live chamber peers.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {['#0078D4', '#10b981', '#f59e0b', '#f43f5e'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setStrokeColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-5 h-5 rounded-full cursor-pointer ${
                          strokeColor === color ? 'ring-2 ring-slate-900 dark:ring-white scale-110' : 'opacity-75'
                        }`}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => dispatchHubEvent('whiteboard:clear', { resetNodes: false })}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      Clear Ink
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchHubEvent('whiteboard:clear', { resetNodes: true })}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] font-bold text-rose-700 dark:text-rose-300 cursor-pointer"
                    >
                      Reset Cards
                    </button>
                  </div>
                </div>

                <div
                  ref={whiteboardContainerRef}
                  onMouseMove={handleWhiteboardContainerMouseMove}
                  onMouseUp={() => setDraggingNodeId(null)}
                  className="relative w-full h-[340px] rounded-2xl bg-slate-950 border-2 border-slate-800 overflow-hidden select-none"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(56, 189, 248, 0.18) 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                  }}
                >
                  <canvas
                    ref={whiteboardCanvasRef}
                    width={960}
                    height={360}
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                    onPointerLeave={handleCanvasPointerUp}
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                  />

                  {(hubState?.whiteboardNodes || []).map((node) => (
                    <div
                      key={node.id}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      className="absolute z-10 w-52 p-2.5 rounded-xl bg-slate-900/95 backdrop-blur-md border border-sky-500/40 text-slate-100 shadow-lg"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggingNodeId(node.id);
                          }}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1 cursor-grab"
                        >
                          <Move className="w-2.5 h-2.5" />
                          <span>{node.category}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Forward card to Traps Clinic"
                            onClick={() =>
                              handleSendInterChamberHandoff({
                                toRoomId: 'AZ900-CLINIC',
                                type: 'concept',
                                title: `Concept Card: ${node.title}`,
                                note: node.notes,
                              })
                            }
                            className="text-slate-400 hover:text-amber-300 p-0.5 cursor-pointer"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              dispatchHubEvent('whiteboard:node:delete', { nodeId: node.id })
                            }
                            className="text-slate-400 hover:text-rose-400 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <h5 className="text-[11px] font-bold text-white leading-snug">{node.title}</h5>
                      <p className="text-[10px] text-slate-300 leading-relaxed mt-1">{node.notes}</p>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleAddWhiteboardNode}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Add Concept Card to {activeArea.shortCode} Whiteboard</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newNodeTitle}
                      onChange={(e) => setNewNodeTitle(e.target.value)}
                      placeholder="Card title (e.g., ExpressRoute)"
                      className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <select
                      value={newNodeCategory}
                      onChange={(e) =>
                        setNewNodeCategory(e.target.value as WhiteboardNode['category'])
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      <option value="compute">Compute</option>
                      <option value="networking">Networking</option>
                      <option value="storage">Storage</option>
                      <option value="identity">Identity</option>
                      <option value="governance">Governance</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!newNodeTitle.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[#0078D4] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                    >
                      Pin Card
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newNodeNotes}
                    onChange={(e) => setNewNodeNotes(e.target.value)}
                    placeholder="Architecture takeaway or AZ-900 exam rule..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </form>
              </div>
            ) : (
              /* =================================================================
                 TAB 3: REAL-TIME COHORT CHAT & GEMINI DOMAIN COACH
                 ================================================================= */
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/60 dark:bg-slate-950/40">
                <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      Real-Time WebSocket Channel: #{roomId}
                    </span>
                    <span>· {participantList.length} connected in room</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShareQuestionInChat}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      Share Board Question
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAskDomainCoach(coachPrompt)}
                      disabled={isAskingCoach}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>{isAskingCoach ? 'Asking Coach...' : 'Ask AI Domain Coach'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3">
                  {(hubState?.messages || []).map((msg) => {
                    const isMe = msg.senderId === myUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 px-1">
                          <span>{msg.avatar}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {msg.sender}
                          </span>
                          <span>· {msg.location}</span>
                          <span>·</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs ${
                            isMe
                              ? 'bg-[#0078D4] text-white'
                              : msg.isCoach
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-indigo-100'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {msg.questionRef && (
                            <div className="mb-2 p-2 rounded-xl bg-black/10 text-[11px]">
                              <div className="font-bold">{msg.questionRef.title}</div>
                              <p className="opacity-90 mt-0.5">{msg.questionRef.scenarioSnippet}</p>
                            </div>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSendChatMessage}
                  className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={hubChatInput}
                    onChange={(e) => setHubChatInput(e.target.value)}
                    placeholder={`Send live message to ${activeArea.shortCode} cohort...`}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078D4]"
                  />
                  <button
                    type="submit"
                    disabled={!hubChatInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#0066B5] disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
