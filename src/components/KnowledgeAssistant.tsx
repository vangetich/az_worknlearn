import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { ChatMessage, Question } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';

interface KnowledgeAssistantProps {
  initialQuestionContext?: Question | null;
  onClearContext?: () => void;
}

const QUICK_QUESTIONS = [
  'What is the difference between Azure Policy and Azure RBAC?',
  'When should I choose Azure App Service vs Azure Virtual Machines?',
  'Explain Storage Access Tiers: Hot vs Cool vs Cold vs Archive',
  'What is the difference between Availability Zones and Region Pairs?',
  'How does CapEx differ from OpEx on the AZ-900 exam?',
  'Explain the Shared Responsibility Model with a simple analogy',
  'What is the difference between Azure VPN Gateway and ExpressRoute?',
];

export const KnowledgeAssistant: React.FC<KnowledgeAssistantProps> = ({
  initialQuestionContext,
  onClearContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Karibu! Welcome to your AZ-900 Knowledge Assistant 🇰🇪 ☁️

I am your dedicated Microsoft Azure tutor. Ask me anything about the **AZ-900 curriculum**:
- Clarify tricky architectural scenarios (e.g., *PaaS vs. IaaS*, *ZRS vs. GRS*)
- Learn memory hooks and exam shortcuts
- Break down any question you got stuck on!

What concept would you like to master today?`,
      timestamp: Date.now(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-fill context if candidate clicked "Ask AI Tutor" from a question card
  useEffect(() => {
    if (initialQuestionContext) {
      const prompt = `Can you explain the key concepts in this question from Module ${initialQuestionContext.moduleId} (${initialQuestionContext.moduleTitle})?\n\nScenario: "${initialQuestionContext.scenario}"\nQuestion: "${initialQuestionContext.question}"\nWhy is ${initialQuestionContext.correctAnswer} correct, and how can I remember this pattern for the exam?`;
      handleSendMessage(prompt);
      if (onClearContext) onClearContext();
    }
  }, [initialQuestionContext]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          text: m.content,
        }));

      const res = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          history: history.slice(-6), // keep last 6 turns
          currentContext: initialQuestionContext?.moduleTitle,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to query assistant');
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Notice**: ${err.message || 'Unable to communicate with Knowledge Assistant right now.'} Please verify your server Gemini API setup.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-elevation flex flex-col h-[750px] overflow-hidden">
      {/* Header */}
      <div className="relative px-6 py-4 bg-gradient-to-r from-[#C2410C] via-[#D97706] to-[#0078D4] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
            <Bot className="w-6 h-6 text-yellow-200" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
              <span>AZ-900 Knowledge Assistant</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-semibold">
                AI Certified Tutor
              </span>
            </h3>
            <p className="text-amber-100 text-xs">
              Instant explanations, analogies & exam shortcuts
            </p>
          </div>
        </div>

        <MaasaiMedallion size={34} className="opacity-90" />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Quick Prompts:
        </span>
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="text-xs px-3 py-1 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-slate-700 border border-slate-200 shadow-2xs whitespace-nowrap transition-colors shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isBot ? 'justify-start' : 'justify-end'
              }`}
            >
              {isBot && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C2410C] to-[#D97706] text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`relative max-w-2xl rounded-xl p-4 sm:p-5 text-sm leading-relaxed ${
                  isBot
                    ? 'bg-slate-50 text-slate-800 border border-slate-200 shadow-xs'
                    : 'bg-[#0078D4] text-white rounded-br-none shadow-xs'
                }`}
              >
                {/* Copy Button for Bot answers */}
                {isBot && (
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-slate-900 prose-headings:font-bold prose-strong:text-slate-950 prose-code:text-[#C2410C] prose-code:bg-orange-50 prose-code:px-1 prose-code:rounded whitespace-pre-line">
                  {msg.content}
                </div>
              </div>

              {!isBot && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 font-bold text-xs shadow-xs">
                  YOU
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C2410C] to-[#D97706] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Loader2 className="w-4 h-4 text-[#D97706] animate-spin" />
              <span>Analyzing Azure curriculum architecture...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about AZ-900 (e.g., 'What is Azure Arc and when do I use it?')..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4]"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-semibold text-sm flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
