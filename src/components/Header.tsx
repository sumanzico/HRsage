import React from 'react';
import { BookOpen, FileText, Sparkles, BarChart3, Plus, ShieldCheck, Lock, HelpCircle } from 'lucide-react';
import { DocumentCategory, User, UserRole } from '../types';
import { UserRoleSwitcher } from './UserRoleSwitcher';

interface HeaderProps {
  documentCount: number;
  onOpenDocuments: () => void;
  onOpenAddDocument: () => void;
  onOpenInsights: () => void;
  onOpenCommonQuestions: () => void;
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  onRegisterUser: (data: {
    name: string;
    email: string;
    role: UserRole;
    title?: string;
    department?: string;
  }) => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  documentCount,
  onOpenDocuments,
  onOpenAddDocument,
  onOpenInsights,
  onOpenCommonQuestions,
  currentUser,
  users,
  onSelectUser,
  onRegisterUser,
}) => {
  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-lg tracking-tight">HRSage</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                HR Assistant
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Internal policy knowledge base & source-verified answers
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Common Questions Dashboard Button */}
          <button
            id="header-view-common-questions-btn"
            onClick={onOpenCommonQuestions}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-950 hover:bg-emerald-50/80 rounded-lg transition-colors border border-slate-200/80 hover:border-emerald-300"
            title="Open Common Questions Dashboard (backed by stored question history)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline font-semibold text-emerald-950">Common Questions</span>
          </button>

          {/* Document Explorer Button */}
          <button
            id="header-view-docs-btn"
            onClick={onOpenDocuments}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
            title="Browse company HR documents"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Policies</span>
            <span className="bg-white text-slate-700 font-semibold px-1.5 py-0.2 rounded-full text-[10px] border border-slate-200">
              {documentCount}
            </span>
          </button>

          {/* HR Staff Insights */}
          <button
            id="header-view-insights-btn"
            onClick={onOpenInsights}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            title="View HR Staff Deflection & Feedback Metrics"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Insights</span>
          </button>

          {/* Upload New Policy - Role Aware */}
          {isAdmin ? (
            <button
              id="header-add-doc-btn"
              onClick={onOpenAddDocument}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
              title="Upload and index a new HR policy handbook"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Upload Policy</span>
            </button>
          ) : (
            <button
              id="header-add-doc-btn-restricted"
              onClick={onOpenAddDocument}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors"
              title="Only Admins can upload documents. Employees can only ask questions."
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline">Upload</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                Admin
              </span>
            </button>
          )}

          {/* User Role Switcher */}
          <UserRoleSwitcher
            currentUser={currentUser}
            users={users}
            onSelectUser={onSelectUser}
            onRegisterUser={onRegisterUser}
          />
        </div>
      </div>
    </header>
  );
};
