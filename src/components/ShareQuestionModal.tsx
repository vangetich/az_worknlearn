import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  QrCode,
  Sparkles,
  BookOpen,
  MessageSquare,
  Smartphone,
} from 'lucide-react';
import { Question } from '../types/quiz';
import { MaasaiMedallion } from './MotifDecorations';

interface ShareQuestionModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareQuestionModal: React.FC<ShareQuestionModalProps> = ({
  question,
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedContext, setCopiedContext] = useState<boolean>(false);
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'link' | 'qr'>('link');

  // Construct absolute shareable URL with question parameter
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?q=${question.id}&path=${question.learningPathId}&mod=${question.moduleId}`
    : `https://azurecurriculum.app/?q=${question.id}`;

  // Generate real SVG QR Code on mount or URL change
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toString(shareUrl, {
      type: 'svg',
      margin: 1.5,
      color: {
        dark: '#004578',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((svg) => {
        setQrCodeSvg(svg);
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
      });
  }, [shareUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyContext = async () => {
    const formatted = `📚 **Microsoft AZ-900 Study Discussion**\n\n**Path ${question.learningPathId}: Module ${question.moduleId} - ${question.moduleTitle}**\n*Difficulty: ${question.difficulty}*\n\n**Scenario & Question:**\n${question.scenario || question.question}\n\n**Options:**\n${question.options.map((opt) => `${opt.letter}. ${opt.text}`).join('\n')}\n\n🔗 *Review and test this question:* ${shareUrl}`;

    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedContext(true);
      setTimeout(() => setCopiedContext(false), 2200);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `AZ-900 Question: ${question.moduleTitle}`,
          text: `Discuss this AZ-900 scenario: ${question.question.slice(0, 100)}...`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#0078D4] to-[#005A9E] text-white shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span>Share Question</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#0078D4] text-white">
                  AZ-900
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Discuss this scenario with your study peers or study room
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Question Summary Pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span className="text-[#0078D4]">
                Path {question.learningPathId} • Module {question.moduleId}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 text-[10px]">
                {question.difficulty}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 line-clamp-2">
              {question.question}
            </p>
          </div>

          {/* Toggle between Link and QR Code */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Direct Link</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>Scan QR Code</span>
            </button>
          </div>

          {activeTab === 'link' ? (
            /* Tab 1: Direct Link Input & Copy Controls */
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Copyable Peer Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 select-all focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Copy Full Context Button (for Discord/Slack) */}
              <button
                type="button"
                onClick={handleCopyContext}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                {copiedContext ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
                    <span className="text-emerald-700 font-extrabold">Question &amp; Options Copied!</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Copy Full Scenario for Discord/Study Chat</span>
                  </>
                )}
              </button>

              {/* Mobile Native Share Trigger */}
              {hasNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-[#0078D4] hover:from-sky-700 hover:to-[#005A9E] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Share via Device Apps</span>
                </button>
              )}
            </div>
          ) : (
            /* Tab 2: Authentic QR Code */
            <div className="flex flex-col items-center justify-center p-3 space-y-3 bg-gradient-to-b from-sky-50/50 to-white rounded-xl border border-sky-100">
              <div className="relative p-3 bg-white rounded-2xl border border-slate-200/90 shadow-md">
                {qrCodeSvg ? (
                  <div
                    className="w-44 h-44 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                    Generating QR code...
                  </div>
                )}
                {/* Center Badge Motif */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="p-1 rounded-full bg-white shadow-sm border border-slate-200">
                    <MaasaiMedallion size={20} />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-extrabold text-slate-900">
                  Scan to Open on Mobile Device
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Study peers can point their phone camera to jump straight into this AZ-900 question.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
