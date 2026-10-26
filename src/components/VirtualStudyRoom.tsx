import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users,
  Send,
  X,
  Share2,
  Lightbulb,
  Flame,
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
  Volume2,
  Sparkles,
  Compass,
  AlertTriangle,
  BookOpen,
  Layers,
  ShieldCheck,
  ChevronRight,
  PenTool,
  Plus,
  Trash2,
  Move,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { BUILTIN_QUESTIONS } from '../data/questionBank';
import {
  VIRTUAL_STUDY_AREAS,
  VirtualStudyArea,
  getStudyAreaById,
} from '../data/virtualStudyAreas';

interface StudyMessage {
  id: string;
  senderId?: string;
  sender: string;
  avatar: string;
  location: string;
  text: string;
  timestamp: number;
  isSelf?: boolean;
  questionRef?: {
    id: string;
    title: string;
    scenarioSnippet: string;
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
  coopStats: {
    questionsSolved: number;
    consensusCorrect: number;
    currentStreak: number;
  };
  participants: Record<string, CollabParticipant>;
  messages: StudyMessage[];
}

interface VirtualStudyRoomProps {
  currentQuestion?: Question | null;
  activeModuleTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSharedQuestion?: (questionId: string) => void;
  initialRoomAreaId?: string;
}

const PEER_STUDENTS = [
  { name: 'Amara', location: 'Nairobi', avatar: '👩🏾‍💻', focus: 'Path 2: Identity & Zero Trust', color: 'bg-emerald-100 text-emerald-800' },
  { name: 'Kofi', location: 'Accra', avatar: '👨🏿‍💻', focus: 'Path 1: Cloud Economics & SLAs', color: 'bg-blue-100 text-blue-800' },
  { name: 'Zainab', location: 'Cairo', avatar: '👩🏽‍💻', focus: 'Path 2: Storage Redundancy (GRS/ZRS)', color: 'bg-amber-100 text-amber-800' },
  { name: 'Tariq', location: 'Lagos', avatar: '👨🏾‍💻', focus: 'Path 3: Policy vs Resource Locks', color: 'bg-indigo-100 text-indigo-800' },
  { name: 'Elena', location: 'Madrid', avatar: '👩🏻‍💻', focus: 'Path 2: Compute (AKS vs ACI)', color: 'bg-purple-100 text-purple-800' },
];

const INITIAL_MESSAGES: StudyMessage[] = [
  {
    id: 'm-1',
    sender: 'Amara',
    avatar: '👩🏾‍💻',
    location: 'Nairobi',
    text: 'Habari team! Quick reminder for Path 3: Resource Locks ALWAYS take precedence over Azure RBAC permissions. Even an Owner cannot delete a resource locked with CanNotDelete unless they remove the lock first.',
    timestamp: Date.now() - 1000 * 60 * 18,
  },
  {
    id: 'm-2',
    sender: 'Kofi',
    avatar: '👨🏿‍💻',
    location: 'Accra',
    text: 'Good catch Amara. Also, on Cloud Economics, remember that Serverless is true OpEx with zero idle costs, whereas reserved instances are committed spend with steep discounts.',
    timestamp: Date.now() - 1000 * 60 * 9,
  },
  {
    id: 'm-3',
    sender: 'Zainab',
    avatar: '👩🏽‍💻',
    location: 'Cairo',
    text: 'Working through storage scenarios now! If an exam question mentions disaster recovery across two secondary geographical regions at least 300 miles apart, think GRS or GZRS.',
    timestamp: Date.now() - 1000 * 60 * 3,
  },
];

const LOCAL_STORAGE_KEY = 'az900_study_room_messages_v1';
const USER_ID_STORAGE_KEY = 'az900_collab_user_id_v1';
const ROOM_ID_STORAGE_KEY = 'az900_collab_room_id_v1';

const AVATAR_CHOICES = ['👩🏾‍💻', '👨🏿‍💻', '👩🏽‍💻', '👨🏾‍💻', '🌟', '🦁', '🚀', '⚡'];

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
  isOpen,
  onClose,
  onSelectSharedQuestion,
  initialRoomAreaId,
}) => {
  // Mode tab: 'hub' (Live Co-Op Hub), 'whiteboard' (Shared Azure Concept Whiteboard), 'chat' (Peer Collaboration Chat)
  const [activeMode, setActiveMode] = useState<'hub' | 'whiteboard' | 'chat'>('hub');

  // Shared Whiteboard state
  const [newNodeTitle, setNewNodeTitle] = useState<string>('');
  const [newNodeCategory, setNewNodeCategory] = useState<WhiteboardNode['category']>('compute');
  const [newNodeNotes, setNewNodeNotes] = useState<string>('');
  const [strokeColor, setStrokeColor] = useState<string>('#0078D4');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const whiteboardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const whiteboardContainerRef = useRef<HTMLDivElement | null>(null);

  // Unique persistent session user ID per tab so two tabs or two devices have distinct identities
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

  // Active Study Hub Room Code (synchronized with detailed Study Room Area)
  const [roomId, setRoomId] = useState<string>(() => {
    try {
      if (initialRoomAreaId && initialRoomAreaId.trim()) {
        return initialRoomAreaId.trim().toUpperCase();
      }
      const params = new URLSearchParams(window.location.search);
      const urlHub = params.get('hub');
      if (urlHub) return urlHub.trim().toUpperCase();
      return localStorage.getItem(ROOM_ID_STORAGE_KEY) || 'AZ900-CONCEPTS';
    } catch {
      return 'AZ900-CONCEPTS';
    }
  });
  const [roomInput, setRoomInput] = useState<string>(roomId);

  // Sync initialRoomAreaId when updated by parent
  useEffect(() => {
    if (initialRoomAreaId && initialRoomAreaId.trim()) {
      const target = initialRoomAreaId.trim().toUpperCase();
      if (target !== roomId) {
        setRoomId(target);
        setRoomInput(target);
      }
    }
  }, [initialRoomAreaId]);

  // Current Study Room Area metadata
  const activeArea = getStudyAreaById(roomId);
  const [isAreaDossierExpanded, setIsAreaDossierExpanded] = useState<boolean>(true);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(() =>
    roomId.includes('WAR-ROOM') ? 45 * 60 : 25 * 60
  );
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [isAmbiancePlaying, setIsAmbiancePlaying] = useState<boolean>(false);

  // Re-arm timer when room area changes
  useEffect(() => {
    const isWarRoom = roomId.includes('WAR-ROOM');
    setTimerSecondsLeft(isWarRoom ? 45 * 60 : 25 * 60);
    setIsTimerActive(false);
  }, [roomId]);

  // Countdown ticker for area timer
  useEffect(() => {
    if (!isTimerActive) return;
    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerActive]);

  // Server-authoritative Study Hub state
  const [hubState, setHubState] = useState<StudyHubRoomState | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);
  const [hubChatInput, setHubChatInput] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Community chat messages (fallback/community tab)
  const [messages, setMessages] = useState<StudyMessage[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MESSAGES;
  });
  const [inputText, setInputText] = useState('');
  const [isTypingPeer, setIsTypingPeer] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Send an event to server (via WebSocket + HTTP fallback + BroadcastChannel)
  const dispatchHubEvent = useCallback(
    async (type: string, payload: any = {}) => {
      const eventObj = {
        roomId,
        userId: myUserId,
        type,
        payload,
      };

      // 1. Send via WebSocket if open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify(eventObj));
        } catch {
          // ignore
        }
      }

      // 2. Always sync via HTTP POST to server-authoritative state and update local state
      try {
        const res = await fetch(`/api/study-hub/${encodeURIComponent(roomId)}/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventObj),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            setHubState(data.room);
            if (broadcastChannelRef.current) {
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
        }
      } catch {
        // ignore network error
      }
    },
    [roomId, myUserId]
  );

  // Connect WebSocket + BroadcastChannel + Periodic Reconciliation when Study Room is open
  useEffect(() => {
    if (!isOpen) return;

    const initialQ = toQuestionSnapshot(currentQuestion || BUILTIN_QUESTIONS[0]);

    // Join room immediately via REST
    dispatchHubEvent('room:join', {
      name: myName,
      avatar: myAvatar,
      location: 'Study Hub',
      initialQuestion: initialQ,
    });

    // Setup BroadcastChannel for instant multi-tab sync on the same device
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

    // Setup WebSocket connection to /api/collab-ws
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
              location: 'Study Hub',
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

    // Lightweight state sync every 2.5s to guarantee cross-user consistency
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/study-hub/${encodeURIComponent(roomId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            setHubState(data.room);
          }
        }
      } catch {
        // ignore
      }
    }, 2500);

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

  // Auto-scroll chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, hubState?.messages, isOpen, isTypingPeer, activeMode]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = roomInput.trim().toUpperCase() || 'AZ900-HUB';
    setRoomId(cleaned);
    setRoomInput(cleaned);
    try {
      localStorage.setItem(ROOM_ID_STORAGE_KEY, cleaned);
    } catch {
      // ignore
    }
  };

  const handleSyncMyQuestionToHub = () => {
    if (!currentQuestion) return;
    dispatchHubEvent('question:sync', {
      question: toQuestionSnapshot(currentQuestion),
    });
  };

  const handleNextSharedQuestion = () => {
    const currentId = hubState?.activeQuestion?.id || currentQuestion?.id;
    const idx = BUILTIN_QUESTIONS.findIndex((q) => q.id === currentId);
    const nextQ = BUILTIN_QUESTIONS[(idx + 1) % BUILTIN_QUESTIONS.length];
    dispatchHubEvent('question:sync', {
      question: toQuestionSnapshot(nextQ),
    });
    if (onSelectSharedQuestion) {
      onSelectSharedQuestion(nextQ.id);
    }
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

  const handleSendHubMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = hubChatInput.trim();
    if (!trimmed) return;
    const msg: StudyMessage = {
      id: `hubmsg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: myUserId,
      sender: myName,
      avatar: myAvatar,
      location: 'Study Hub',
      text: trimmed,
      timestamp: Date.now(),
    };
    setHubChatInput('');
    dispatchHubEvent('chat:message', { message: msg });
  };

  // Community chat handlers
  const saveMessages = (newMessages: StudyMessage[]) => {
    setMessages(newMessages);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newMessages));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const userMsg: StudyMessage = {
      id: `self-${Date.now()}`,
      sender: myName,
      avatar: myAvatar,
      location: 'Local',
      text: trimmed,
      timestamp: Date.now(),
      isSelf: true,
    };

    const updated = [...messages, userMsg];
    saveMessages(updated);
    setInputText('');
    triggerPeerReply(trimmed, updated);
  };

  const handleShareQuestion = () => {
    if (!currentQuestion) return;

    const questionMsg: StudyMessage = {
      id: `share-${Date.now()}`,
      sender: myName,
      avatar: myAvatar,
      location: 'Local',
      text: `Let's discuss this scenario: "${currentQuestion.question}"`,
      timestamp: Date.now(),
      isSelf: true,
      questionRef: {
        id: currentQuestion.id,
        title: currentQuestion.moduleTitle,
        scenarioSnippet: currentQuestion.scenario.slice(0, 140) + '...',
      },
    };

    const updated = [...messages, questionMsg];
    saveMessages(updated);

    setTimeout(() => {
      const peer = PEER_STUDENTS[Math.floor(Math.random() * PEER_STUDENTS.length)];
      setIsTypingPeer(peer.name);

      setTimeout(() => {
        setIsTypingPeer(null);
        const peerReply: StudyMessage = {
          id: `reply-${Date.now()}`,
          sender: peer.name,
          avatar: peer.avatar,
          location: peer.location,
          text: `Exam Anchor for this scenario: Focus on the key requirement! If it's about "${currentQuestion.moduleTitle}", the correct option is usually ${currentQuestion.correctAnswer}. Remember: ${currentQuestion.examTip}`,
          timestamp: Date.now(),
        };
        saveMessages([...updated, peerReply]);
      }, 2000);
    }, 1200);
  };

  const triggerPeerReply = (userText: string, currentList: StudyMessage[]) => {
    const lower = userText.toLowerCase();
    const peer = PEER_STUDENTS[Math.floor(Math.random() * PEER_STUDENTS.length)];

    let reply = `Great point on AZ-900! Keep testing scenarios to lock in the key concepts.`;
    if (lower.includes('lock') || lower.includes('rbac') || lower.includes('policy')) {
      reply = `Remember: Azure Policy handles compliance and enforces standards, RBAC governs user permissions, and Locks protect against accidental deletion.`;
    } else if (lower.includes('storage') || lower.includes('blob') || lower.includes('tier')) {
      reply = `Storage tip: Hot = frequent access, Cool = 30+ days, Cold = 90+ days, Archive = hours of latency but cheapest storage!`;
    } else if (lower.includes('sla') || lower.includes('ha') || lower.includes('availability')) {
      reply = `For SLAs: 99.9% = ~8.7 hrs downtime/yr, 99.99% (four nines) = ~52 mins downtime/yr. Multiple services composite SLA is multiplied (99.9% * 99.9% = 99.8%)!`;
    } else if (lower.includes('vm') || lower.includes('compute') || lower.includes('container')) {
      reply = `Compute quick rule: ACI is serverless container execution; AKS is enterprise container orchestration with full Kubernetes capabilities.`;
    }

    setTimeout(() => {
      setIsTypingPeer(peer.name);
      setTimeout(() => {
        setIsTypingPeer(null);
        const peerMsg: StudyMessage = {
          id: `peer-${Date.now()}`,
          sender: peer.name,
          avatar: peer.avatar,
          location: peer.location,
          text: reply,
          timestamp: Date.now(),
        };
        saveMessages([...currentList, peerMsg]);
      }, 2200);
    }, 1500);
  };

  const handleLoadAreaQuestion = () => {
    const area = getStudyAreaById(roomId);
    let matchedQs = BUILTIN_QUESTIONS;
    if (area.pathId) {
      matchedQs = BUILTIN_QUESTIONS.filter((q) => q.learningPathId === area.pathId);
    } else if (roomId.includes('WAR-ROOM')) {
      matchedQs = BUILTIN_QUESTIONS.filter(
        (q) => q.difficulty === 'Intermediate' || q.difficulty === 'Advanced'
      );
    } else if (roomId.includes('CLINIC')) {
      matchedQs = BUILTIN_QUESTIONS.filter(
        (q) => Object.keys(q.distractorBreakdown || {}).length >= 3
      );
    }
    if (matchedQs.length === 0) matchedQs = BUILTIN_QUESTIONS;
    const randomPick = matchedQs[Math.floor(Math.random() * matchedQs.length)];
    const snapshot = toQuestionSnapshot(randomPick);
    dispatchHubEvent('question:set', { question: snapshot });
  };

  // Render Whiteboard Canvas strokes whenever hubState.whiteboardStrokes or currentPoints change
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
  }, [hubState?.whiteboardStrokes, currentPoints, strokeColor, activeMode]);

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

  const handleAddQuickTemplateNode = (
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
  };

  const handleWhiteboardContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingNodeId || !whiteboardContainerRef.current) return;
    const rect = whiteboardContainerRef.current.getBoundingClientRect();
    const x = Math.max(2, Math.min(72, ((e.clientX - rect.left - 60) / rect.width) * 100));
    const y = Math.max(4, Math.min(75, ((e.clientY - rect.top - 25) / rect.height) * 100));
    dispatchHubEvent('whiteboard:node:move', { nodeId: draggingNodeId, x, y });
  };

  if (!isOpen) return null;

  const activeHubQuestion =
    hubState?.activeQuestion ||
    (currentQuestion ? toQuestionSnapshot(currentQuestion) : toQuestionSnapshot(BUILTIN_QUESTIONS[0]));

  const participantList = Object.values(hubState?.participants || {}).filter(
    (p) => Date.now() - p.lastSeen < 1000 * 60 * 30
  );
  const myParticipant = hubState?.participants?.[myUserId];
  const partnerParticipants = participantList.filter((p) => p.userId !== myUserId);
  const otherCohortMembersInAreaCount = activeArea.onlineCount + partnerParticipants.length;

  const timerMinutes = Math.floor(timerSecondsLeft / 60);
  const timerSecs = timerSecondsLeft % 60;
  const formattedTimer = `${String(timerMinutes).padStart(2, '0')}:${String(timerSecs).padStart(2, '0')}`;

  return (
    <div className="fixed inset-y-0 right-0 z-[120] w-full max-w-[100vw] sm:w-[500px] md:w-[600px] h-[100dvh] max-h-[100dvh] bg-white/98 backdrop-blur-xl border-l border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 font-sans">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/15 border border-white/20 text-amber-300 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white">
                Virtual Study Room • Study Hub
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{otherCohortMembersInAreaCount} Cohort Members in Area</span>
              </span>
            </div>
            <p className="text-[11px] text-sky-100/80 truncate max-w-[280px]">
              {activeArea.name} ({activeArea.examWeight})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Close Virtual Study Room"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 6 Detailed Virtual Study Room Areas Selector Strip */}
      <div className="bg-slate-900 text-white px-3 py-2 border-b border-slate-800 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Compass className="w-3 h-3 text-sky-400" />
            <span>Select Study Room Area:</span>
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-extrabold"
            title="Live count of other cohort members currently active in this study area"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{otherCohortMembersInAreaCount} other cohort members in this area</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {VIRTUAL_STUDY_AREAS.map((area) => {
            const isSelected = area.id.toUpperCase() === roomId.toUpperCase();
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => {
                  setRoomId(area.id);
                  setRoomInput(area.id);
                  localStorage.setItem(ROOM_ID_STORAGE_KEY, area.id);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                }`}
              >
                <span>{area.shortCode}</span>
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-sky-700 text-sky-100' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {area.examWeight}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Area Interactive Dossier (Mission, Key Topics & Focus Timer) */}
      <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200 p-3 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 truncate">
                {activeArea.name}
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${activeArea.badgeBg}`}>
                {activeArea.examWeight}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 truncate mt-0.5">
              {activeArea.mission}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAreaDossierExpanded(!isAreaDossierExpanded)}
            className="text-[10px] font-bold text-sky-700 hover:text-sky-900 px-2 py-1 rounded-lg bg-sky-50 border border-sky-200 shrink-0 cursor-pointer"
          >
            {isAreaDossierExpanded ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        {/* Focus Timer & Soundscape Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 shadow-2xs">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{formattedTimer}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsTimerActive(!isTimerActive)}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
              title={isTimerActive ? 'Pause Study Timer' : 'Start Study Timer'}
            >
              {isTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                const isWarRoom = roomId.includes('WAR-ROOM');
                setTimerSecondsLeft(isWarRoom ? 45 * 60 : 25 * 60);
                setIsTimerActive(false);
              }}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
              title="Reset Study Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span className="hidden xs:inline text-[10px] text-slate-500 font-medium">
              {activeArea.ambianceLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLoadAreaQuestion}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            title="Load an official exam question for this study area into the co-op board"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Load Area Question</span>
          </button>
        </div>

        {/* Expanded Area Topic Cues & Cohort Peers */}
        {isAreaDossierExpanded && (
          <div className="pt-2 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1">
                Area Objectives:
              </span>
              {activeArea.keyTopics.map((topic, i) => (
                <span
                  key={i}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                >
                  {topic}
                </span>
              ))}
            </div>

            {/* Active Peers in this Room Area */}
            <div className="flex items-center justify-between text-[11px] bg-sky-50/70 p-2 rounded-xl border border-sky-100">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {activeArea.activePeers.map((peer, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-300 text-xs shadow-2xs"
                      title={`${peer.name} (${peer.location}) • ${peer.role}`}
                    >
                      {peer.avatar}
                    </span>
                  ))}
                </div>
                <span className="text-slate-700 font-semibold text-[10px] truncate">
                  Studying with {activeArea.activePeers.map((p) => p.name).join(', ')}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-sky-700">
                {activeArea.recommendedDuration}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mode Switcher Tabs: Co-Op Hub | Shared Whiteboard | Peer Chat */}
      <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-200 grid grid-cols-3 gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveMode('hub')}
          className={`py-2 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeMode === 'hub'
              ? 'bg-[#0078D4] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <Radio className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Co-Op Hub</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('whiteboard')}
          className={`py-2 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeMode === 'whiteboard'
              ? 'bg-[#0078D4] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <PenTool className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Shared Whiteboard</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/15">
            {(hubState?.whiteboardNodes || []).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('chat')}
          className={`py-2 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeMode === 'chat'
              ? 'bg-[#0078D4] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Peer Chat</span>
        </button>
      </div>

      {/* =====================================================================
          MODE 1: LIVE COLLABORATIVE STUDY HUB (2+ USERS REAL-TIME CO-OP)
         ===================================================================== */}
      {activeMode === 'hub' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Room Code & Partner Presence Bar */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <form onSubmit={handleJoinRoom} className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Hub ID:
                </span>
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  className="w-28 px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-mono font-black text-xs text-slate-900 focus:outline-none focus:border-[#0078D4]"
                  placeholder="AZ900-HUB"
                  maxLength={14}
                />
                {roomInput.trim().toUpperCase() !== roomId && (
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg bg-[#0078D4] text-white text-[11px] font-extrabold cursor-pointer"
                  >
                    Join
                  </button>
                )}
              </form>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyHubInvite}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border flex items-center gap-1 transition-all cursor-pointer ${
                    copiedInvite
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white hover:bg-sky-50 text-[#0078D4] border-sky-200'
                  }`}
                  title="Copy shareable Study Hub link for your study partner"
                >
                  {copiedInvite ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Invite Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Invite Partner</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active Co-Op Participants Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Current User Pill */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-extrabold text-blue-950">
                  <span>{myAvatar}</span>
                  <span>{myName} (You)</span>
                  {myParticipant?.selectedOption && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        myParticipant.lockedIn
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#0078D4] text-white'
                      }`}
                    >
                      {myParticipant.lockedIn ? `🔒 ${myParticipant.selectedOption}` : myParticipant.selectedOption}
                    </span>
                  )}
                </div>

                {/* Connected Study Partners */}
                {partnerParticipants.length > 0 ? (
                  partnerParticipants.map((part) => (
                    <div
                      key={part.userId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-xs font-extrabold text-amber-950"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>{part.avatar}</span>
                      <span>{part.name}</span>
                      {part.selectedOption ? (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            part.lockedIn
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {hubState?.isAnswerRevealed || part.lockedIn
                            ? `🔒 ${part.selectedOption}`
                            : `Picked ${part.selectedOption}`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-semibold italic">
                          Thinking...
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500 italic">
                    Share Hub ID <strong className="text-slate-700 font-mono">{roomId}</strong> with a partner (or open a 2nd browser tab) to co-solve live!
                  </span>
                )}
              </div>

              {/* Co-Op Scoreboard Pill */}
              {hubState && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-extrabold">
                  <span>
                    Co-Op: {hubState.coopStats.consensusCorrect}/{hubState.coopStats.questionsSolved}
                  </span>
                  {hubState.coopStats.currentStreak > 0 && (
                    <span className="text-amber-300 flex items-center gap-0.5">
                      <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {hubState.coopStats.currentStreak}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Shared Scenario Workspace */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
            {/* Shared Question Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-[#0078D4]">
                  Path {activeHubQuestion.learningPathId} • M{activeHubQuestion.moduleId}
                </span>
                <span className="text-xs font-extrabold text-slate-800 truncate max-w-[180px]">
                  {activeHubQuestion.moduleTitle}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {currentQuestion && currentQuestion.id !== activeHubQuestion.id && (
                  <button
                    type="button"
                    onClick={handleSyncMyQuestionToHub}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0078D4] border border-sky-200 text-[11px] font-bold cursor-pointer"
                    title="Push your currently viewed quiz card question into this shared Study Hub"
                  >
                    Sync My Card
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNextSharedQuestion}
                  className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <span>Next Scenario</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Shared Scenario & Question Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-[#0078D4] text-xs text-slate-700 leading-relaxed">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4] block mb-1">
                  Shared Scenario Context
                </span>
                {activeHubQuestion.scenario}
              </div>

              <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                {activeHubQuestion.question}
              </h4>

              {/* Collaborative 4 Options with Live Partner Votes & Distractor Elimination */}
              <div className="space-y-2 pt-1">
                {activeHubQuestion.options.map((opt) => {
                  const letter = opt.letter as 'A' | 'B' | 'C' | 'D';
                  const isMyPick = myParticipant?.selectedOption === letter;
                  const partnersOnThisOption = partnerParticipants.filter(
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
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                            : isMyPick || partnersOnThisOption.length > 0
                            ? 'bg-rose-50 border-rose-400'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                          : isMyPick
                          ? 'bg-blue-50/90 border-[#0078D4] ring-2 ring-[#0078D4]/20'
                          : partnersOnThisOption.length > 0
                          ? 'bg-amber-50/70 border-amber-400'
                          : isEliminated
                          ? 'bg-slate-100 border-slate-200 opacity-45 line-through'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                            isRevealed && isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isMyPick
                              ? 'bg-[#0078D4] text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 leading-relaxed">
                          {opt.text}
                        </span>
                      </div>

                      {/* Right Badges: My Vote, Partner Vote, Eliminate Toggle */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isMyPick && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#0078D4] text-white">
                            {myParticipant?.lockedIn ? '🔒 You' : 'You'}
                          </span>
                        )}
                        {partnersOnThisOption.map((p) => (
                          <span
                            key={p.userId}
                            className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950"
                            title={`${p.name} selected Option ${letter}`}
                          >
                            {p.avatar} {p.name.slice(0, 6)}
                          </span>
                        ))}
                        {!isRevealed && (
                          <button
                            type="button"
                            onClick={(e) => handleEliminateOption(e, letter)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Strike out / eliminate distractor for the room"
                          >
                            {isEliminated ? 'Restore' : '✕'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Co-Op Action Bar: Lock In Vote & Reveal Shared Solution */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                {!hubState?.isAnswerRevealed ? (
                  <>
                    <button
                      type="button"
                      onClick={handleToggleLockVote}
                      disabled={!myParticipant?.selectedOption}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 ${
                        myParticipant?.lockedIn
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {myParticipant?.lockedIn ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Vote Locked ({myParticipant.selectedOption})</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Lock In My Choice</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => dispatchHubEvent('vote:reveal')}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reveal Shared Answer</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full space-y-2.5">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between font-black">
                        <span>
                          ✓ Official Answer: Option {activeHubQuestion.correctAnswer}
                        </span>
                        <button
                          type="button"
                          onClick={() => dispatchHubEvent('vote:reset')}
                          className="text-[11px] text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Round</span>
                        </button>
                      </div>
                      <p className="leading-relaxed">{activeHubQuestion.whyCorrect}</p>
                      <p className="text-[11px] font-bold text-amber-900 pt-1">
                        💡 Exam Anchor: {activeHubQuestion.examTip}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Collaborative Shared Scratchpad */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">
                <span>📝 Shared Co-Op Scratchpad (Real-Time Sync)</span>
                <span className="text-[10px] font-semibold text-amber-700">
                  Both partners can type here
                </span>
              </div>
              <textarea
                rows={2}
                value={hubState?.sharedScratchpad || ''}
                onChange={(e) =>
                  dispatchHubEvent('scratchpad:update', { text: e.target.value })
                }
                placeholder="Jot down clues, SLA math, or eliminate distractors together in real-time..."
                className="w-full p-2.5 rounded-xl bg-white border border-amber-200 text-xs text-slate-800 focus:outline-none focus:border-[#0078D4]"
              />
            </div>

            {/* Live Room Chat Feed */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Study Hub Live Discussion ({hubState?.messages?.length || 0})
              </div>
              <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                {(hubState?.messages || []).map((msg) => {
                  const isMe = msg.senderId === myUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        isMe
                          ? 'bg-blue-50 border border-blue-200 text-slate-900 ml-6'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-0.5">
                        <span>
                          {msg.avatar} {msg.sender}
                        </span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="leading-snug">{msg.text}</p>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendHubMessage} className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={hubChatInput}
                  onChange={(e) => setHubChatInput(e.target.value)}
                  placeholder={`Message Study Hub #${roomId}...`}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0078D4]"
                />
                <button
                  type="submit"
                  disabled={!hubChatInput.trim()}
                  className="p-2 rounded-xl bg-[#0078D4] hover:bg-blue-600 disabled:opacity-40 text-white cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : activeMode === 'whiteboard' ? (
        /* ===================================================================
           MODE 2: SHARED WHITEBOARD FOR BRAINSTORMING AZURE CONCEPTS
           =================================================================== */
        <div className="flex-1 flex flex-col overflow-y-auto p-3.5 space-y-3 bg-slate-50/70">
          {/* Whiteboard Toolbar & Quick Concept Blueprints */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-50 text-[#0078D4] border border-sky-200">
                  <PenTool className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    Shared Azure Concept Whiteboard ({roomId})
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Sketch diagrams &amp; drag Azure architecture cards with{' '}
                    <strong className="text-emerald-700">
                      {otherCohortMembersInAreaCount} cohort peers
                    </strong>
                  </p>
                </div>
              </div>

              {/* Pen Color & Clear Controls */}
              <div className="flex items-center gap-1.5">
                {[
                  { color: '#0078D4', label: 'Azure Blue' },
                  { color: '#10b981', label: 'Emerald' },
                  { color: '#f59e0b', label: 'Amber' },
                  { color: '#f43f5e', label: 'Rose' },
                ].map((pen) => (
                  <button
                    key={pen.color}
                    type="button"
                    onClick={() => setStrokeColor(pen.color)}
                    style={{ backgroundColor: pen.color }}
                    className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${
                      strokeColor === pen.color ? 'scale-125 ring-2 ring-slate-900' : 'opacity-75'
                    }`}
                    title={`Sketch with ${pen.label}`}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => dispatchHubEvent('whiteboard:clear', { resetNodes: false })}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                  title="Clear freehand ink strokes"
                >
                  Clear Ink
                </button>
                <button
                  type="button"
                  onClick={() => dispatchHubEvent('whiteboard:clear', { resetNodes: true })}
                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold cursor-pointer"
                  title="Reset whiteboard cards to area defaults"
                >
                  Reset Board
                </button>
              </div>
            </div>

            {/* 1-Click Quick Concept Blueprint Stampers */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Quick Add:
              </span>
              <button
                type="button"
                onClick={() =>
                  handleAddQuickTemplateNode(
                    'Zero Trust Identity Flow',
                    'identity',
                    'Entra ID -> Conditional Access -> MFA -> Least Privilege RBAC'
                  )
                }
                className="px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold cursor-pointer"
              >
                + Zero Trust Flow
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddQuickTemplateNode(
                    'Storage Redundancy Matrix',
                    'storage',
                    'LRS (11 9s) -> ZRS (12 9s, 3 AZs) -> GRS/GZRS (16 9s, Cross-Region >= 300mi)'
                  )
                }
                className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold cursor-pointer"
              >
                + Storage Redundancy
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddQuickTemplateNode(
                    'Governance Precedence',
                    'governance',
                    'Management Group -> Subscription -> Resource Group -> Resource (Locks override Owner RBAC)'
                  )
                }
                className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold cursor-pointer"
              >
                + Governance Hierarchy
              </button>
            </div>
          </div>

          {/* Interactive Shared Whiteboard Canvas + Concept Cards Surface */}
          <div
            ref={whiteboardContainerRef}
            onMouseMove={handleWhiteboardContainerMouseMove}
            onMouseUp={() => setDraggingNodeId(null)}
            className="relative w-full h-[310px] rounded-2xl bg-slate-950 border-2 border-slate-800 shadow-inner overflow-hidden select-none"
            style={{
              backgroundImage:
                'radial-gradient(rgba(56, 189, 248, 0.18) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          >
            {/* Freehand HTML5 Drawing Layer */}
            <canvas
              ref={whiteboardCanvasRef}
              width={640}
              height={340}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerUp}
              className="absolute inset-0 w-full h-full cursor-crosshair"
            />

            {/* Floating Draggable Azure Concept Cards */}
            {(hubState?.whiteboardNodes || []).map((node) => {
              const categoryStyles: Record<
                WhiteboardNode['category'],
                { badge: string; border: string }
              > = {
                compute: {
                  badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                  border: 'border-sky-500/50',
                },
                networking: {
                  badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
                  border: 'border-indigo-500/50',
                },
                storage: {
                  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  border: 'border-amber-500/50',
                },
                identity: {
                  badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                  border: 'border-purple-500/50',
                },
                governance: {
                  badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                  border: 'border-emerald-500/50',
                },
              };
              const style = categoryStyles[node.category] || categoryStyles.compute;

              return (
                <div
                  key={node.id}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                  }}
                  className={`absolute z-10 w-48 p-2.5 rounded-xl bg-slate-900/95 backdrop-blur-md border ${style.border} text-slate-100 shadow-xl transition-shadow`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingNodeId(node.id);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 cursor-grab active:cursor-grabbing ${style.badge}`}
                      title="Drag to reposition concept card on shared whiteboard"
                    >
                      <Move className="w-2.5 h-2.5" />
                      <span>{node.category}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        dispatchHubEvent('whiteboard:node:delete', { nodeId: node.id })
                      }
                      className="text-slate-400 hover:text-rose-400 p-0.5 cursor-pointer"
                      title="Remove concept card"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <h5 className="text-[11px] font-black text-white leading-snug">
                    {node.title}
                  </h5>
                  <p className="text-[10px] text-slate-300 leading-relaxed mt-1">
                    {node.notes}
                  </p>
                  <div className="mt-1.5 pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                    <span>By {node.authorName}</span>
                    <span>Live</span>
                  </div>
                </div>
              );
            })}

            <div className="absolute bottom-2 right-2.5 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-[10px] text-slate-300 pointer-events-none">
              Draw directly on canvas or drag cards to brainstorm
            </div>
          </div>

          {/* Add Custom Concept Card Form */}
          <form
            onSubmit={handleAddWhiteboardNode}
            className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2"
          >
            <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>Pin New Azure Concept Card to Shared Whiteboard</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newNodeTitle}
                onChange={(e) => setNewNodeTitle(e.target.value)}
                placeholder="Concept title (e.g., ExpressRoute)"
                className="sm:col-span-2 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0078D4]"
              />
              <select
                value={newNodeCategory}
                onChange={(e) =>
                  setNewNodeCategory(e.target.value as WhiteboardNode['category'])
                }
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-[#0078D4]"
              >
                <option value="compute">Compute</option>
                <option value="networking">Networking</option>
                <option value="storage">Storage</option>
                <option value="identity">Identity</option>
                <option value="governance">Governance</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newNodeNotes}
                onChange={(e) => setNewNodeNotes(e.target.value)}
                placeholder="Key exam anchor or architecture note..."
                className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0078D4]"
              />
              <button
                type="submit"
                disabled={!newNodeTitle.trim()}
                className="px-3 py-1.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] disabled:opacity-40 text-white text-xs font-black shrink-0 cursor-pointer"
              >
                Add Card
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ===================================================================
           MODE 3: COMMUNITY PEER STUDY CIRCLE CHAT
           =================================================================== */
        <>
          {/* Peer Avatars Bar */}
          <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none shrink-0 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Circle:
            </span>
            <div className="flex items-center gap-2">
              {PEER_STUDENTS.map((peer, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-2xs shrink-0"
                  title={`${peer.name} (${peer.location}) - ${peer.focus}`}
                >
                  <span>{peer.avatar}</span>
                  <span>{peer.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Question Quick-Share Action Bar */}
          {currentQuestion && (
            <div className="px-4 py-2 bg-sky-50/80 border-b border-sky-100 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Lightbulb className="w-4 h-4 text-[#0078D4] shrink-0" />
                <span className="text-[11px] font-semibold text-slate-700 truncate">
                  Discuss Active Question ({currentQuestion.moduleTitle})
                </span>
              </div>
              <button
                type="button"
                onClick={handleShareQuestion}
                className="px-2.5 py-1 rounded-lg bg-[#0078D4] hover:bg-blue-600 text-white text-[10px] font-black flex items-center gap-1 shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium px-1">
                  {!msg.isSelf && <span className="text-base">{msg.avatar}</span>}
                  <span className="font-bold text-slate-700">{msg.sender}</span>
                  {!msg.isSelf && <span>({msg.location})</span>}
                  <span>•</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                    msg.isSelf
                      ? 'bg-[#0078D4] text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {msg.questionRef && (
                    <div
                      className={`mb-2 p-2 rounded-xl text-[11px] border ${
                        msg.isSelf
                          ? 'bg-blue-800/40 border-blue-400/40 text-blue-100'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="font-black block uppercase tracking-wider text-[9px]">
                        Scenario Question Reference
                      </span>
                      <p className="font-semibold mt-0.5">{msg.questionRef.title}</p>
                      <p className="italic text-[10px] opacity-90 mt-0.5">
                        &ldquo;{msg.questionRef.scenarioSnippet}&rdquo;
                      </p>
                    </div>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

            {isTypingPeer && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1 px-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
                <span>{isTypingPeer} is typing an Azure tip...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question or share a mnemonic..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#0078D4] text-slate-900 bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-[#0078D4] hover:bg-blue-600 disabled:opacity-40 text-white shadow-2xs transition-all cursor-pointer"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
