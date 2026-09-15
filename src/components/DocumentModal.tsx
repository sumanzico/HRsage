import React, { useState, useEffect } from 'react';
import { HRDocument, DocumentCategory, User } from '../types';
import {
  X,
  FileText,
  Search,
  UploadCloud,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Lock,
  Shield,
  AlertCircle
} from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: HRDocument[];
  initialSelectedDocId?: string;
  initialHighlightSection?: string;
  currentUser: User;
  onSwitchToAdmin?: () => void;
  onUploadDocument: (doc: {
    title: string;
    category: DocumentCategory;
    fileName: string;
    summary: string;
    content: string;
  }) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onResetDocuments: () => Promise<void>;
  initialTab?: 'view' | 'upload';
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  documents,
  initialSelectedDocId,
  initialHighlightSection,
  currentUser,
  onSwitchToAdmin,
  onUploadDocument,
  onDeleteDocument,
  onResetDocuments,
  initialTab = 'view'
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'upload'>(initialTab);
  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialSelectedDocId || documents[0]?.id || ''
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [highlightSection, setHighlightSection] = useState<string>(initialHighlightSection || '');

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('General Policies');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadSummary, setUploadSummary] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    if (initialSelectedDocId) {
      setSelectedDocId(initialSelectedDocId);
    }
    if (initialHighlightSection) {
      setHighlightSection(initialHighlightSection);
    }
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialSelectedDocId, initialHighlightSection, initialTab, isOpen]);

  if (!isOpen) return null;

  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const filteredDocs = documents.filter((doc) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.summary.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q)
    );
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadContent.trim()) return;

    if (!isAdmin) {
      setUploadError(`Access Denied: You are signed in as ${currentUser.name} (Employee). Only Admins can upload documents.`);
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);
    try {
      await onUploadDocument({
        title: uploadTitle.trim(),
        category: uploadCategory,
        fileName: uploadFileName.trim() || `${uploadTitle.trim().replace(/\s+/g, '_')}.md`,
        summary: uploadSummary.trim() || uploadContent.slice(0, 120) + '...',
        content: uploadContent.trim()
      });

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadTitle('');
        setUploadSummary('');
        setUploadContent('');
        setUploadFileName('');
        setActiveTab('view');
      }, 1200);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadSampleTemplate = () => {
    setUploadTitle('Employee Relocation & Commuter Benefits Policy (2026)');
    setUploadCategory('Expenses');
    setUploadFileName('Acme_Relocation_and_Commuter_2026.pdf');
    setUploadSummary('Tax-free commuter transit debit cards, $100/mo parking subsidy, and lump-sum relocation stipends.');
    setUploadContent(`## Section 1: Pre-Tax Commuter Transit & Parking Subsidy
All office-assigned employees can contribute up to IRS pre-tax maximums for mass transit and qualified commuter parking via the WageWorks/HealthEquity portal.
Acme additionally contributes a direct $100 monthly transit stipend for employees who commute via public subway or commuter train.

## Section 2: Approved Domestic Relocation Assistance
Employees transferred at company request to another metropolitan office location qualify for a Tier-2 Relocation Package:
- Lump-sum moving stipend: $5,000 net after taxes for household transport.
- Temporary corporate housing: Up to thirty (30) days in corporate partner suites.
- 100% reimbursed airfare for the employee and immediate dependents.
All relocations require prior approval by the Chief People Officer.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                HR Policy Knowledge Base
              </h2>
              <p className="text-xs text-slate-500">
                {documents.length} verified company policy documents indexed
              </p>
            </div>
          </div>

          {/* Tab Switcher & Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('view')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'view'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Browse Policies
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAdmin ? (
                  <Plus className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3 h-3 text-slate-400" />
                )}
                <span>Add Policy</span>
                {!isAdmin && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                    Admin
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        {activeTab === 'view' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar with Document List */}
            <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50 overflow-hidden shrink-0">
              {/* Search Bar */}
              <div className="p-3 border-b border-slate-200 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter policy documents..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              {/* Documents List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredDocs.map((doc) => {
                  const isSelected = doc.id === currentDoc?.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setHighlightSection('');
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                          : 'bg-white/60 hover:bg-white border-slate-200/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-100 text-slate-700">
                          {doc.category}
                        </span>
                        {doc.isCustom && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Custom
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                        {doc.summary}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <span>{doc.sections.length} sections</span>
                        <span>{doc.lastUpdated}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Reset Defaults Action */}
              <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between">
                {isAdmin ? (
                  <button
                    onClick={onResetDocuments}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                    title="Reset documents to default company set"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Defaults</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Policy management restricted to Admin</span>
                  </div>
                )}
              </div>
            </div>

            {/* Document Reader Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
              {currentDoc ? (
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Document Meta Header */}
                  <div className="pb-4 border-b border-slate-200">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {currentDoc.category}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {currentDoc.fileName}
                        </span>
                      </div>

                      {currentDoc.isCustom && isAdmin && (
                        <button
                          onClick={() => onDeleteDocument(currentDoc.id)}
                          className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-colors"
                          title="Delete this custom policy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {currentDoc.title}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Version {currentDoc.version} • Effective date: {currentDoc.lastUpdated}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      <strong className="font-semibold text-slate-900">Summary: </strong>
                      {currentDoc.summary}
                    </p>
                  </div>

                  {/* Document Sections List */}
                  <div className="space-y-5">
                    {currentDoc.sections.map((section, idx) => {
                      const isHighlighted =
                        highlightSection &&
                        section.title.toLowerCase().includes(highlightSection.toLowerCase());

                      return (
                        <div
                          key={section.id || idx}
                          className={`p-4 rounded-xl border transition-all ${
                            isHighlighted
                              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-300/30'
                              : 'bg-white border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              {section.title}
                            </h3>
                            {isHighlighted && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 uppercase tracking-wider">
                                Cited Source
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                            {section.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Select a document on the left to read
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Upload New Policy Tab */
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white">
            {!isAdmin ? (
              /* Role Gate for Employees */
              <div className="max-w-xl mx-auto py-12 px-6 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/80 shadow-xs">
                  <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
                    Role Restriction: Employee Account
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    Admin Privileges Required to Upload Documents
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    You are currently signed in as <strong className="text-slate-900">{currentUser.name}</strong> with the <strong className="text-slate-900">Employee</strong> role.
                    Employees have full access to search and ask questions about all company policies, while uploading, updating, and deleting policies is restricted to <strong className="text-indigo-900">HR Administrators</strong>.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    Role Matrix in HRSage:
                  </p>
                  <ul className="space-y-1.5 text-slate-600 text-[11px]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span><strong>Employee:</strong> Ask questions in plain language, search policies, inspect citations.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span><strong>Admin:</strong> Upload and publish company policies, delete documents, reset library, ask questions.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('view')}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Browse Policy Library
                  </button>
                  {onSwitchToAdmin && (
                    <button
                      onClick={() => {
                        onSwitchToAdmin();
                        setActiveTab('upload');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Switch to Admin Profile</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Admin Upload Form */
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        Upload New HR Policy Document
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Admin Privileged
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Add new handbook policies, benefits notices, or team guidelines. HRSage immediately indexes the text for plain language queries.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSampleTemplate}
                    className="text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Load Sample Policy
                  </button>
                </div>

                {uploadError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-900 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Policy Document Successfully Uploaded & Indexed!</p>
                      <p className="text-emerald-700">Employees can now ask plain language questions about this policy.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Policy Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="e.g. Employee Wellness & Gym Stipend"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-emerald-600 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Policy Category
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-emerald-600 outline-hidden"
                      >
                        <option value="Benefits">Benefits</option>
                        <option value="Time Off">Time Off</option>
                        <option value="General Policies">General Policies</option>
                        <option value="Expenses">Expenses</option>
                        <option value="Career & Learning">Career & Learning</option>
                      </select>
                    </div>
                  </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={uploadFileName}
                      onChange={(e) => setUploadFileName(e.target.value)}
                      placeholder="e.g. Acme_Policy_2026.pdf"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-emerald-600 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Brief Policy Summary
                    </label>
                    <input
                      type="text"
                      value={uploadSummary}
                      onChange={(e) => setUploadSummary(e.target.value)}
                      placeholder="e.g. Overview of stipends and eligibility limits"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-emerald-600 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Policy Document Content (Markdown or Plain Text) *
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Tip: Use "## Section Title" to automatically structure sections
                    </span>
                  </div>
                  <textarea
                    required
                    rows={10}
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                    placeholder={`## Section 1: Eligibility & Guidelines\nDetail the policy rules, limits, dates, and numbers here...\n\n## Section 2: Application Process\nStep-by-step submission instructions...`}
                    className="w-full text-xs p-3 font-mono rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:border-emerald-600 outline-hidden leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('view')}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !uploadTitle.trim() || !uploadContent.trim()}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Indexing Document...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Publish & Index Policy</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
