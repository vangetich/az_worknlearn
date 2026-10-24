import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Send,
  MessageSquare,
  Sparkles,
  X,
  Share2,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Minimize2,
  Maximize2,
  Flame,
  Globe,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';

interface StudyMessage {
  id: string;
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

interface VirtualStudyRoomProps {
  currentQuestion?: Question | null;
  activeModuleTitle?: string;
  isOpen: boolean;
  onClose: () => void;
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

export const VirtualStudyRoom: React.FC<VirtualStudyRoomProps> = ({
  currentQuestion,
  activeModuleTitle = 'All AZ-900 Modules',
  isOpen,
  onClose,
}) => {
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
  const [activeChannel, setActiveChannel] = useState<'all' | 'p1' | 'p2' | 'p3'>('all');
  const [isTypingPeer, setIsTypingPeer] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTypingPeer]);

  // Save messages to localStorage
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
      sender: 'You',
      avatar: '🌟',
      location: 'Local',
      text: trimmed,
      timestamp: Date.now(),
      isSelf: true,
    };

    const updated = [...messages, userMsg];
    saveMessages(updated);
    setInputText('');

    // Trigger realistic contextual peer reply
    triggerPeerReply(trimmed, updated);
  };

  const handleShareQuestion = () => {
    if (!currentQuestion) return;

    const questionMsg: StudyMessage = {
      id: `share-${Date.now()}`,
      sender: 'You',
      avatar: '🌟',
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

    // Peer answers with helpful insight about the question
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
      reply = `Remember: Azure Policy handles compliance and enforce standards, RBAC governs user permissions, and Locks protect against accidental deletion.`;
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

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-104 bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Room Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#0078D4] to-blue-700 text-white shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-slate-900">
                Virtual Study Room
              </h3>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>5 Peers Live</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
              {activeModuleTitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

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
                    "{msg.questionRef.scenarioSnippet}"
                  </p>
                </div>
              )}
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Real-time typing indicator */}
        {isTypingPeer && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1 px-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
            <span>{isTypingPeer} is typing an Azure tip...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <button
          type="button"
          onClick={() => setInputText('How do I remember the difference between Azure Policy and RBAC?')}
          className="px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold whitespace-nowrap transition-colors"
        >
          Policy vs RBAC?
        </button>
        <button
          type="button"
          onClick={() => setInputText('What is the formula for calculating composite SLAs?')}
          className="px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold whitespace-nowrap transition-colors"
        >
          Composite SLAs?
        </button>
        <button
          type="button"
          onClick={() => setInputText('What are the storage tiers and minimum retention days?')}
          className="px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold whitespace-nowrap transition-colors"
        >
          Storage Tiers?
        </button>
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
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] text-slate-900 bg-slate-50/50"
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
    </div>
  );
};
