import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowRight, CornerDownLeft, Sparkles, X, HelpCircle, AlertCircle, AlertTriangle } from 'lucide-react';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  activeCategory: string;
  documentCount?: number;
}

const FREQUENT_QUESTIONS = [
  {
    category: 'Time Off',
    text: 'How many PTO days can I roll over to next year?'
  },
  {
    category: 'Benefits',
    text: 'What is our 401(k) company match formula and vesting schedule?'
  },
  {
    category: 'General Policies',
    text: 'Can I work remotely from another state or another country?'
  },
  {
    category: 'Benefits',
    text: 'How many free mental health therapy sessions do we get?'
  },
  {
    category: 'Career & Learning',
    text: 'How much is the annual education stipend and what are the clawback terms?'
  },
  {
    category: 'Expenses',
    text: 'What is the daily meal per diem when traveling for business?'
  }
];

export const QuestionInput: React.FC<QuestionInputProps> = ({
  onSubmit,
  isLoading,
  activeCategory,
  documentCount = 5,
}) => {
  const [question, setQuestion] = useState('');
  const [showEmptyPrompt, setShowEmptyPrompt] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    if (!question.trim()) {
      setShowEmptyPrompt(true);
      textareaRef.current?.focus();
      return;
    }

    setShowEmptyPrompt(false);
    onSubmit(question.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSuggested = (text: string) => {
    setShowEmptyPrompt(false);
    setQuestion(text);
    onSubmit(text);
  };

  // Filter suggested questions if a category is picked
  const filteredSuggestions = activeCategory === 'All'
    ? FREQUENT_QUESTIONS
    : FREQUENT_QUESTIONS.filter((q) => q.category === activeCategory);

  return (
    <div className="w-full space-y-3">
      {/* Zero documents warning prompt if policy library is empty */}
      {documentCount === 0 && (
        <div
          id="no-documents-warning"
          className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs shadow-2xs"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">No policy documents are currently uploaded</p>
            <p className="text-amber-800 leading-relaxed">
              HRSage relies on verified company handbooks to ground its answers. To enable source-verified answers, an HR Administrator must upload policy documents or restore default company policies.
            </p>
          </div>
        </div>
      )}

      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative rounded-2xl bg-white border shadow-sm transition-all ${
            showEmptyPrompt
              ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/10'
              : 'border-slate-200/90 hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100'
          }`}
        >
          <div className="flex items-start px-4 pt-3.5 pb-2">
            <Search className={`w-5 h-5 mt-1 mr-3 shrink-0 ${showEmptyPrompt ? 'text-amber-500' : 'text-slate-400'}`} />
            <textarea
              ref={textareaRef}
              id="employee-question-input"
              rows={2}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (showEmptyPrompt && e.target.value.trim()) {
                  setShowEmptyPrompt(false);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask an HR question in plain English (e.g., 'How many PTO days can I carry over?' or 'What is our 401k match?')"
              className="w-full text-slate-900 placeholder:text-slate-400 text-sm sm:text-base resize-none outline-hidden bg-transparent leading-relaxed"
              disabled={isLoading}
            />
            {question && (
              <button
                type="button"
                id="clear-question-btn"
                onClick={() => {
                  setQuestion('');
                  setShowEmptyPrompt(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Prompt message when the question box is empty */}
          {showEmptyPrompt && (
            <div
              id="empty-question-prompt"
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-900 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-medium">
                Please type your HR question above before asking (e.g. ask about PTO rollover, 401(k) match, or parental leave).
              </span>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-4 pb-2.5 pt-1 border-t border-slate-100 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grounded directly in company policy documents</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px]">Enter ↵</kbd>
              </span>
              <button
                type="submit"
                id="submit-question-btn"
                disabled={isLoading}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isLoading
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-[0.98]'
                }`}
                title={!question.trim() ? "Type your question above" : "Ask HRSage"}
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Searching Policies...</span>
                  </>
                ) : (
                  <>
                    <span>Ask HRSage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Suggested Questions Bar */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-slate-500">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Frequently asked by employees:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.map((item, idx) => (
            <button
              key={idx}
              id={`suggested-question-${idx}`}
              onClick={() => handleSelectSuggested(item.text)}
              disabled={isLoading}
              className="text-left text-xs bg-white hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg transition-all shadow-2xs"
            >
              "{item.text}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
