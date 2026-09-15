import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { QueryResponse } from '../types';
import { SourceCard } from './SourceCard';
import {
  ShieldCheck,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface AnswerCardProps {
  response: QueryResponse;
  onFollowUpClick: (question: string) => void;
  onOpenDocument?: (docId?: string, sectionTitle?: string) => void;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  response,
  onFollowUpClick,
  onOpenDocument
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendFeedback = async (helpful: boolean, reason?: string) => {
    setFeedback(helpful ? 'yes' : 'no');
    if (!helpful && !reason) {
      setShowReasonInput(true);
      return;
    }

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: response.id,
          helpful,
          reason: reason || ''
        })
      });
      setFeedbackSubmitted(true);
      setShowReasonInput(false);
    } catch (err) {
      console.error('Feedback error', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Question Header Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
              Employee Question
            </span>
            <span className="text-xs text-slate-400">
              {new Date(response.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {response.question}
          </h2>
        </div>

        {/* Verification Pill */}
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{response.foundInDocs ? 'Document Grounded' : 'General HR Guidance'}</span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* Markdown Answer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>HRSage Answer</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium normal-case transition-colors"
              title="Copy answer to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="text-slate-800 text-sm sm:text-base leading-relaxed space-y-3 font-normal">
            <div className="markdown-body prose prose-sm max-w-none prose-slate prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:font-semibold prose-strong:text-slate-900">
              <Markdown>{response.answer}</Markdown>
            </div>
          </div>
        </div>

        {/* Citations directly under the answer: Document Name & Section */}
        {response.sources && response.sources.length > 0 ? (
          <div
            id={`citations-${response.id}`}
            className="rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-4 space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded">
                  Source Citation
                </span>
                <span className="text-xs text-slate-700 font-medium">
                  {response.sources.length > 1
                    ? `Grounded in ${response.sources.length} policy handbook sections`
                    : 'Grounded in company policy handbook'}
                </span>
              </div>

              {response.confidence && (
                <span className="text-[10px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {response.confidence.toUpperCase()} CONFIDENCE
                </span>
              )}
            </div>

            {/* List of citations with Document Name and Section explicitly shown */}
            <div className="space-y-2.5">
              {response.sources.map((source, idx) => (
                <div
                  key={idx}
                  id={`citation-item-${idx}`}
                  className="bg-white rounded-lg p-3 border border-emerald-100 hover:border-emerald-300 transition-all shadow-2xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Document Name */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                          Document:
                        </span>
                        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {source.documentTitle}
                        </span>
                      </div>

                      <span className="text-slate-300 hidden sm:inline">•</span>

                      {/* Section Name */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                          Section:
                        </span>
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          {source.section}
                        </span>
                      </div>
                    </div>

                    {onOpenDocument && (
                      <button
                        type="button"
                        id={`open-doc-btn-${idx}`}
                        onClick={() => onOpenDocument(source.documentId, source.section)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline shrink-0 ml-auto"
                        title="View and read this section in policy document"
                      >
                        <BookOpen className="w-3 h-3 text-emerald-600" />
                        <span>Inspect in Document</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Verbatim Excerpt */}
                  <div className="relative pl-3 border-l-2 border-emerald-500/70 py-0.5">
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      "{source.excerpt}"
                    </p>
                  </div>

                  {source.relevance && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{source.relevance}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-1 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Policy Citation: Unindexed or General Inquiry</span>
            </div>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              No exact handbook section was cited from the currently uploaded documents for this response. If you need formal verification, please consult People Operations at <strong>people-ops@company.internal</strong>.
            </p>
          </div>
        )}

        {/* Actionable Next Step Card (e.g. Workday, Expensify, Fidelity) */}
        {response.actionableInfo && (
          <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/80 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  {response.actionableInfo.label}
                </p>
                {response.actionableInfo.note && (
                  <p className="text-[11px] text-emerald-800/90">
                    {response.actionableInfo.note}
                  </p>
                )}
              </div>
            </div>

            <a
              href={response.actionableInfo.type === 'email' ? `mailto:${response.actionableInfo.target}` : response.actionableInfo.target}
              target={response.actionableInfo.type === 'email' ? '_self' : '_blank'}
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100/50 shadow-2xs transition-colors shrink-0"
            >
              <span>{response.actionableInfo.type === 'email' ? 'Send Email' : 'Open Portal'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Suggested Follow-up Questions */}
        {response.suggestedFollowUps && response.suggestedFollowUps.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Related questions:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {response.suggestedFollowUps.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onFollowUpClick(q)}
                  className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200/60 transition-colors text-left"
                >
                  <span>{q}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Helpful Feedback Section (Crucial for HR to reduce repetitive tickets) */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Did this answer your question?</span>
            {feedbackSubmitted ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Thanks for your feedback!
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSendFeedback(true)}
                  className={`p-1.5 rounded-md border transition-all ${
                    feedback === 'yes'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title="Yes, helpful"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleSendFeedback(false)}
                  className={`p-1.5 rounded-md border transition-all ${
                    feedback === 'no'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title="No, needs clarification"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            For personal policy exceptions, contact <span className="font-semibold text-slate-600">people-ops@company.internal</span>
          </div>
        </div>

        {/* Feedback Reason Prompt if Thumbs Down */}
        {showReasonInput && !feedbackSubmitted && (
          <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <p className="text-xs text-amber-900 font-medium">
              What was missing or unclear? (This helps HR refine policy documentation)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
                placeholder="e.g., Doesn't mention part-time employees, or confusing rollover deadline..."
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-slate-800 outline-hidden focus:border-amber-400"
              />
              <button
                onClick={() => handleSendFeedback(false, feedbackReason)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0"
              >
                Send to HR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
