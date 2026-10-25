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
} from 'lucide-react';
import { Question } from '../types/quiz';
import { BUILTIN_QUESTIONS } from '../data/questionBank';

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

interface StudyHubRoomState {
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
  messages: StudyMessage[];
}

interface VirtualStudyRoomProps {
  currentQuestion?: Question | null;
  activeModuleTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSharedQuestion?: (questionId: string) => void;
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
}) => {
  // Mode tab: 'hub' (Live 2-User Collaborative Study Hub) vs 'chat' (Community Peer Circle)
  const [activeMode, setActiveMode] = useState<'hub' | 'chat'>('hub');

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

  // Active Study Hub Room Code
  const [roomId, setRoomId] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlHub = params.get('hub');
      if (urlHub) return urlHub.trim().toUpperCase();
      return localStorage.getItem(ROOM_ID_STORAGE_KEY) || 'AZ900-HUB';
    } catch {
      return 'AZ900-HUB';
    }
  });
  const [roomInput, setRoomInput] = useState<string>(roomId);

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

  if (!isOpen) return null;

  const activeHubQuestion =
    hubState?.activeQuestion ||
    (currentQuestion ? toQuestionSnapshot(currentQuestion) : toQuestionSnapshot(BUILTIN_QUESTIONS[0]));

  const participantList = Object.values(hubState?.participants || {}).filter(
    (p) => Date.now() - p.lastSeen < 1000 * 60 * 30
  );
  const myParticipant = hubState?.participants?.[myUserId];
  const partnerParticipants = participantList.filter((p) => p.userId !== myUserId);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[540px] bg-white/98 backdrop-blur-xl border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/15 border border-white/20 text-amber-300 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white">
                Virtual Study Room &amp; Live Hub
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{wsConnected ? 'Live Sync' : 'Synced'}</span>
              </span>
            </div>
            <p className="text-[11px] text-sky-100/80 truncate max-w-[260px]">
              Solve scenario questions together in real-time
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 grid grid-cols-2 gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveMode('hub')}
          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'hub'
              ? 'bg-[#0078D4] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Live Study Hub (Co-Op)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
            {Math.max(1, participantList.length)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('chat')}
          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'chat'
              ? 'bg-[#0078D4] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Community Study Circle</span>
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
      ) : (
        /* ===================================================================
           MODE 2: COMMUNITY PEER STUDY CIRCLE CHAT
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
