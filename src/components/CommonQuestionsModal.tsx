import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  Search,
  RefreshCw,
  TrendingUp,
  FileText,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Filter,
  BarChart2,
  Users,
  CheckCircle2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { CommonQuestionsDashboardData, StoredQuestion, User } from '../types';

interface CommonQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (question: string) => void;
  onOpenDocument?: (docId?: string, sectionTitle?: string) => void;
  currentUser: User;
}

export const CommonQuestionsModal: React.FC<CommonQuestionsModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestion,
  onOpenDocument,
  currentUser,
}) => {
  const [data, setData] = useState<CommonQuestionsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const fetchCommonQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/common-questions', {
        headers: {
          'x-user-id': currentUser.id,
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to load common questions (status ${res.status})`);
      }
      const json: CommonQuestionsDashboardData = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Error fetching common questions:', err);
      setError(err.message || 'Unable to retrieve common questions from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCommonQuestions();
    }
  }, [isOpen, currentUser.id]);

  const handleReset = async () => {
    if (!window.confirm('Reset question history back to initial company baseline questions?')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/common-questions/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reset questions history');
      }
      await fetchCommonQuestions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen) return null;

  const questions = data?.questions || [];
  const categories = ['All', 'Time Off', 'Benefits', 'General Policies', 'Expenses', 'Career & Learning'];

  const filteredQuestions = questions.filter((q) => {
    const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.primaryDocument.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.primarySection.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answerSummary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalInquiries = data?.totalQueries || 0;
  const uniqueQuestions = data?.uniqueQuestionsCount || 0;
  const answeredFromDocsCount = questions.filter((q) => q.foundInDocs).length;
  const deflectionRate = questions.length > 0 ? Math.round((answeredFromDocsCount / questions.length) * 100) : 100;

  return (
    <div
      id="common-questions-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        id="common-questions-modal-content"
        className="bg-white w-full max-w-4xl h-[90vh] max-h-[820px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Common Questions Dashboard</h2>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                  Backend Question History
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Aggregated employee inquiries and cited HR policy handbook sections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-common-questions-btn"
              onClick={fetchCommonQuestions}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
              title="Refresh stored questions from backend"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {currentUser.role === 'admin' && (
              <button
                id="reset-common-questions-btn"
                onClick={handleReset}
                disabled={isResetting}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                title="Reset stored questions to default company seed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset History</span>
              </button>
            )}

            <button
              id="close-common-questions-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/40 border-b border-slate-100 shrink-0">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Total Inquiries Logged
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-slate-900">{totalInquiries}</span>
              <span className="text-[11px] text-emerald-700 font-medium">Recorded</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Distinct Questions
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-slate-900">{uniqueQuestions}</span>
              <span className="text-[11px] text-slate-500 font-medium">Topics</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Policy Grounding
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-emerald-700">{deflectionRate}%</span>
              <span className="text-[11px] text-emerald-800 font-medium">Found in Docs</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Top Categories
            </span>
            <div className="flex items-baseline gap-1.5 mt-1 truncate">
              <span className="text-xs font-bold text-slate-800 truncate">Time Off & Benefits</span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-common-questions-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stored questions, policies, sections, or answers..."
              className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`filter-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Question List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading stored question history from backend...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No stored questions match your filter</p>
              <p className="text-xs text-slate-500">
                Try a different search query or select another category above.
              </p>
            </div>
          ) : (
            filteredQuestions.map((item, index) => (
              <div
                key={item.id || index}
                id={`common-question-card-${item.id}`}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs space-y-3 group"
              >
                {/* Header: Question Text & Ask Frequency */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      {item.departmentTag && (
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {item.departmentTag}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-950 transition-colors">
                      {item.question}
                    </h3>
                  </div>

                  {/* Ask Frequency Counter Badge */}
                  <div className="shrink-0 flex items-center gap-1.5 bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-900 border border-slate-200 group-hover:border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors">
                    <Users className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-700" />
                    <span>Asked {item.askCount}x</span>
                  </div>
                </div>

                {/* Answer Summary Excerpt */}
                <div className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg border-l-2 border-emerald-600 leading-relaxed">
                  <p>{item.answerSummary}</p>
                </div>

                {/* Citation: Document Name & Section */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-400 uppercase text-[10px]">Document:</span>
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {item.primaryDocument}
                      </span>
                    </div>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-400 uppercase text-[10px]">Section:</span>
                      <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-[11px]">
                        {item.primarySection}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-auto">
                    {onOpenDocument && item.primaryDocument && (
                      <button
                        id={`view-doc-section-btn-${item.id}`}
                        onClick={() => {
                          onClose();
                          onOpenDocument(item.documentId, item.primarySection);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                        title="Open policy handbook to this section"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Section</span>
                      </button>
                    )}

                    <button
                      id={`ask-this-question-btn-${item.id}`}
                      onClick={() => {
                        onClose();
                        onSelectQuestion(item.question);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-2xs transition-colors"
                      title="Ask HRSage this question now"
                    >
                      <span>Ask This</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Updated in real-time as employees query HRSage</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
