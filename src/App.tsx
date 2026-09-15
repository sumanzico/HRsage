import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { QuestionInput } from './components/QuestionInput';
import { AnswerCard } from './components/AnswerCard';
import { DocumentModal } from './components/DocumentModal';
import { HRInsightsModal } from './components/HRInsightsModal';
import { CommonQuestionsModal } from './components/CommonQuestionsModal';
import { HRDocument, QueryResponse, DocumentCategory, User, UserRole } from './types';
import { DEFAULT_DOCUMENTS } from './data/defaultDocuments';
import {
  FileText,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  ExternalLink,
  History,
  Trash2,
  BookOpen,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  Shield,
  User as UserIcon,
  ArrowRightLeft,
  TrendingUp,
  HelpCircle
} from 'lucide-react';

const FALLBACK_DEFAULT_USER: User = {
  id: 'user-employee-1',
  name: 'Alex Rivera',
  email: 'alex.rivera@company.internal',
  role: 'employee',
  title: 'Senior Fullstack Engineer',
  department: 'Engineering',
  avatar: 'AR',
  createdAt: '2026-02-01T10:30:00.000Z',
};

export default function App() {
  const [documents, setDocuments] = useState<HRDocument[]>(DEFAULT_DOCUMENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentResponse, setCurrentResponse] = useState<QueryResponse | null>(null);
  const [history, setHistory] = useState<QueryResponse[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Accounts and User Role state persisted on backend
  const [users, setUsers] = useState<User[]>([FALLBACK_DEFAULT_USER]);
  const [currentUser, setCurrentUser] = useState<User>(FALLBACK_DEFAULT_USER);

  // Modal states
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [docModalTab, setDocModalTab] = useState<'view' | 'upload'>('view');
  const [modalSelectedDocId, setModalSelectedDocId] = useState<string | undefined>(undefined);
  const [modalHighlightSection, setModalHighlightSection] = useState<string | undefined>(undefined);
  const [isInsightsOpen, setIsInsightsOpen] = useState<boolean>(false);
  const [isCommonQuestionsOpen, setIsCommonQuestionsOpen] = useState<boolean>(false);

  // Fetch documents and persistent users on mount
  useEffect(() => {
    fetchDocuments();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users) && data.users.length > 0) {
          setUsers(data.users);

          // Restore previously selected user if stored in local storage
          const savedUserId = localStorage.getItem('hrsage_active_user_id');
          if (savedUserId) {
            const matched = data.users.find((u: User) => u.id === savedUserId);
            if (matched) {
              setCurrentUser(matched);
              return;
            }
          }

          // Otherwise default to the first employee
          const defaultEmployee = data.users.find((u: User) => u.role === 'employee') || data.users[0];
          setCurrentUser(defaultEmployee);
        }
      }
    } catch (err) {
      console.warn('Could not fetch persistent users from backend:', err);
    }
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('hrsage_active_user_id', user.id);
    } catch (e) {
      // Ignore storage errors
    }
  };

  const handleRegisterUser = async (data: {
    name: string;
    email: string;
    role: UserRole;
    title?: string;
    department?: string;
  }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create user account');
    }

    const result = await res.json();
    if (result.user) {
      setUsers((prev) => [...prev, result.user]);
      handleSelectUser(result.user);
    }
  };

  const handleToggleDemoRole = () => {
    if (currentUser.role === 'employee') {
      const adminUser = users.find((u) => u.role === 'admin');
      if (adminUser) {
        handleSelectUser(adminUser);
      }
    } else {
      const employeeUser = users.find((u) => u.role === 'employee');
      if (employeeUser) {
        handleSelectUser(employeeUser);
      }
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        if (data.documents && data.documents.length > 0) {
          setDocuments(data.documents);
        }
      }
    } catch (err) {
      console.warn('Could not fetch documents from API, using default set', err);
    }
  };

  const handleAskQuestion = async (questionText: string) => {
    if (!questionText || !questionText.trim()) {
      setErrorMessage('Please type a question in the search box before asking HRSage.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          question: questionText.trim(),
          filterCategory: selectedCategory
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data: QueryResponse = await res.json();
      setCurrentResponse(data);
      setHistory((prev) => [data, ...prev.filter((item) => item.id !== data.id)].slice(0, 10));
    } catch (err: any) {
      console.error('Query error:', err);
      setErrorMessage(
        err.message || 'Unable to complete query. Please ensure the server is active and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDocumentSection = (docId?: string, sectionTitle?: string) => {
    setModalSelectedDocId(docId);
    setModalHighlightSection(sectionTitle);
    setDocModalTab('view');
    setIsDocModalOpen(true);
  };

  const handleUploadDocument = async (docData: {
    title: string;
    category: DocumentCategory;
    fileName: string;
    summary: string;
    content: string;
  }) => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify(docData)
    });

    if (res.ok) {
      await fetchDocuments();
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload document');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': currentUser.id
      }
    });
    if (res.ok) {
      await fetchDocuments();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to delete document');
    }
  };

  const handleResetDocuments = async () => {
    const res = await fetch('/api/documents/reset', {
      method: 'POST',
      headers: {
        'x-user-id': currentUser.id
      }
    });
    if (res.ok) {
      await fetchDocuments();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to reset documents');
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header with Persistent User Profile and Role Switcher */}
      <Header
        documentCount={documents.length}
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        onRegisterUser={handleRegisterUser}
        onOpenDocuments={() => {
          setDocModalTab('view');
          setModalHighlightSection(undefined);
          setIsDocModalOpen(true);
        }}
        onOpenAddDocument={() => {
          setDocModalTab('upload');
          setIsDocModalOpen(true);
        }}
        onOpenInsights={() => setIsInsightsOpen(true)}
        onOpenCommonQuestions={() => setIsCommonQuestionsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Role Capability Banner */}
        <div className="max-w-3xl mx-auto">
          <div
            className={`p-3 sm:px-4 sm:py-2.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-colors ${
              currentUser.role === 'admin'
                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 ${
                  currentUser.role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}
              >
                {currentUser.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5" />
                )}
              </div>
              <p className="leading-tight">
                <span className="font-bold">
                  {currentUser.name} ({currentUser.role.toUpperCase()})
                </span>
                <span className="hidden md:inline text-slate-500"> — </span>
                <span className="text-slate-600 block md:inline text-[11px] sm:text-xs">
                  {currentUser.role === 'admin'
                    ? 'Can upload policies, delete documents, reset library, and ask questions.'
                    : 'Can ask questions and search policies. Uploading documents is restricted to Admins.'}
                </span>
              </p>
            </div>

            <button
              onClick={handleToggleDemoRole}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200/80 shadow-2xs transition-colors text-[11px]"
              title={`Quick switch to ${currentUser.role === 'admin' ? 'Employee' : 'Admin'} role`}
            >
              <ArrowRightLeft className="w-3 h-3 text-slate-500" />
              <span>
                Switch to {currentUser.role === 'admin' ? 'Employee (Alex)' : 'Admin (Morgan)'}
              </span>
            </button>
          </div>
        </div>

        {/* Friendly alert if no documents are uploaded yet */}
        {documents.length === 0 && (
          <div
            id="no-documents-friendly-alert"
            className="max-w-3xl mx-auto rounded-2xl bg-amber-50/90 border border-amber-200 p-5 sm:p-6 shadow-xs space-y-3"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-amber-950">
                  No HR Policy Documents Uploaded Yet
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Welcome to HRSage! To receive source-verified answers with exact citations, HR documents need to be uploaded.
                  {currentUser.role === 'admin'
                    ? ' As an HR Administrator, you can upload your company’s employee handbooks or restore the initial sample policy library with one click.'
                    : ' Please ask an HR Administrator to upload company handbooks, or toggle to the Admin profile above to load sample policies.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              {currentUser.role === 'admin' ? (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    id="upload-doc-empty-state-btn"
                    onClick={() => {
                      setDocModalTab('upload');
                      setIsDocModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-2xs transition-colors"
                  >
                    Upload Policy Handbook
                  </button>
                  <button
                    id="restore-docs-empty-state-btn"
                    onClick={handleResetDocuments}
                    className="px-3.5 py-1.5 bg-white hover:bg-amber-100/70 text-amber-950 font-medium border border-amber-300 rounded-lg transition-colors"
                  >
                    Load 5 Sample Policies
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-amber-800 font-medium">
                    Tip: Switch to Morgan Vance (Admin) to upload or restore sample documents.
                  </span>
                  <button
                    onClick={handleToggleDemoRole}
                    className="px-3 py-1 bg-white hover:bg-amber-100/70 text-amber-950 font-medium border border-amber-300 rounded-lg transition-colors shrink-0"
                  >
                    Switch to Admin
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hero & Intro */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant Answers • Exact Source Citations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            What would you like to know about your benefits or policies?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            HRSage reads across our {documents.length} company policy handbooks and health guides to give you an exact answer in plain language, with verified quotes and links.
          </p>
        </div>

        {/* Category Filter Pills & Common Questions Shortcut */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />

          <button
            id="open-common-questions-pill-btn"
            onClick={() => setIsCommonQuestionsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors shadow-2xs"
            title="Browse stored question history on Common Questions Dashboard"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>Common Questions Dashboard</span>
          </button>
        </div>

        {/* Interactive Search Bar */}
        <div className="max-w-3xl mx-auto">
          <QuestionInput
            onSubmit={handleAskQuestion}
            isLoading={isLoading}
            activeCategory={selectedCategory}
            documentCount={documents.length}
          />
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="max-w-3xl mx-auto p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Loading / Thinking State */}
        {isLoading && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-4 shadow-sm animate-pulse">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Searching company HR documents...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Comparing policy clauses, matching benefits limits, and compiling verified source citations.
              </p>
            </div>
            <div className="max-w-md mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full w-2/3 animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>
        )}

        {/* Grounded Answer Card Display */}
        {!isLoading && currentResponse && (
          <div className="max-w-3xl mx-auto">
            <AnswerCard
              response={currentResponse}
              onFollowUpClick={handleAskQuestion}
              onOpenDocument={handleOpenDocumentSection}
            />
          </div>
        )}

        {/* Query History Drawer / List (If multiple queries asked) */}
        {!isLoading && history.length > 1 && (
          <div className="max-w-3xl mx-auto pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Recent Questions in this Session ({history.length})</span>
              </div>
              <button
                onClick={handleClearHistory}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                title="Clear question history"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear History</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentResponse(item)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    currentResponse?.id === item.id
                      ? 'bg-emerald-50/70 border-emerald-300 font-medium text-emerald-950 ring-1 ring-emerald-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <p className="line-clamp-1 font-semibold">"{item.question}"</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span>{item.sources.length} sources</span>
                    <span>•</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State / Feature Discovery (Shown when no question asked yet) */}
        {!isLoading && !currentResponse && (
          <div className="max-w-3xl mx-auto space-y-6 pt-2">
            {/* 3 Core Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">
                  Instant Policy Search
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  No more opening 50-page handbooks. Get exact answers on accrual rates, health plans, or deductibles.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">
                  Exact Source Citations
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Every answer quotes the exact section, page, and policy document so you can verify with confidence.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">
                  Reduces HR Bottlenecks
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Deflects repetitive inquiries so People Ops staff can focus on strategic employee well-being.
                </p>
              </div>
            </div>

            {/* Quick-Start Policy Guides */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Explore Key Company Policies
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click any policy card below to test plain language Q&A with live citations
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDocModalTab('view');
                    setIsDocModalOpen(true);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>View all {documents.length} policies</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.slice(0, 4).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.version}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {doc.summary}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <button
                        onClick={() => {
                          const sampleQuestion =
                            doc.category === 'Time Off'
                              ? 'How many PTO days can I roll over to next year?'
                              : doc.category === 'Benefits'
                              ? 'What is our 401(k) company match formula?'
                              : doc.category === 'General Policies'
                              ? 'Can I work remotely from another state?'
                              : 'What is our annual education stipend budget?';
                          handleAskQuestion(sampleQuestion);
                        }}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <span>Ask about this</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleOpenDocumentSection(doc.id)}
                        className="text-[11px] text-slate-500 hover:text-slate-800"
                      >
                        Read Full PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">HRSage</span>
            <span>•</span>
            <span>Internal HR Knowledge Assistant Prototype</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">All responses grounded in verified HR policy documents</span>
            <span>Support: <strong className="text-slate-700">people-ops@company.internal</strong></span>
          </div>
        </div>
      </footer>

      {/* Document Explorer & Upload Modal */}
      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        documents={documents}
        initialSelectedDocId={modalSelectedDocId}
        initialHighlightSection={modalHighlightSection}
        currentUser={currentUser}
        onSwitchToAdmin={() => {
          const admin = users.find((u) => u.role === 'admin');
          if (admin) handleSelectUser(admin);
        }}
        onUploadDocument={handleUploadDocument}
        onDeleteDocument={handleDeleteDocument}
        onResetDocuments={handleResetDocuments}
        initialTab={docModalTab}
      />

      {/* HR Staff Operations Insights Modal */}
      <HRInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        documentCount={documents.length}
      />

      {/* Common Questions Dashboard Modal */}
      <CommonQuestionsModal
        isOpen={isCommonQuestionsOpen}
        onClose={() => setIsCommonQuestionsOpen(false)}
        onSelectQuestion={handleAskQuestion}
        onOpenDocument={handleOpenDocumentSection}
        currentUser={currentUser}
      />
    </div>
  );
}
