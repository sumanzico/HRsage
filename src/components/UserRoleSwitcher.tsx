import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  Shield,
  User as UserIcon,
  ChevronDown,
  Check,
  Plus,
  Lock,
  X,
  Building2,
  Mail,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface UserRoleSwitcherProps {
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

export const UserRoleSwitcher: React.FC<UserRoleSwitcherProps> = ({
  currentUser,
  users,
  onSelectUser,
  onRegisterUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('employee');
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      setFormError('Name and email are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await onRegisterUser({
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        title: newTitle.trim() || (newRole === 'admin' ? 'HR Administrator' : 'Staff Member'),
        department: newDept.trim() || (newRole === 'admin' ? 'People Operations' : 'Engineering'),
      });
      setShowCreateModal(false);
      setNewName('');
      setNewEmail('');
      setNewTitle('');
      setNewDept('');
      setIsOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Active User Button */}
      <button
        id="user-role-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-2xs text-left"
        aria-expanded={isOpen}
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs ${
            isAdmin ? 'bg-indigo-600' : 'bg-emerald-600'
          }`}
        >
          {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="hidden sm:block text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 max-w-[110px] truncate">
              {currentUser.name}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                isAdmin
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {currentUser.role}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 max-w-[140px] truncate">
            {currentUser.title || currentUser.department || 'Active Account'}
          </p>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Backdrop for closing */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Signed In Account</p>
              <p className="text-[11px] text-slate-500">Persisted in backend database</p>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                isAdmin
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isAdmin ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
              <span className="capitalize">{currentUser.role} Access</span>
            </span>
          </div>

          {/* Current Role Permissions Card */}
          <div className="p-3 bg-slate-50/50 border-b border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="font-semibold text-slate-900">Current Role:</span>
                <span className="capitalize font-bold text-slate-800">{currentUser.role}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isAdmin ? (
                  <span className="text-indigo-900 font-medium">
                    ✓ Full permissions: You can upload new policy documents, delete documents, reset handbooks, and ask questions.
                  </span>
                ) : (
                  <span className="text-emerald-900 font-medium">
                    ✓ Read & Q&A permissions: You can search and ask policy questions. Document uploads are restricted to HR Admins.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Switch Account Section */}
          <div className="p-2 space-y-1">
            <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Backend Account ({users.length})
            </p>
            <div className="max-h-56 overflow-y-auto space-y-1">
              {users.map((u) => {
                const isSelected = u.id === currentUser.id;
                const userIsAdmin = u.role === 'admin';
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                          userIsAdmin ? 'bg-indigo-600' : 'bg-emerald-600'
                        }`}
                      >
                        {u.avatar || u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              userIsAdmin
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {u.title} • {u.department}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create New Account Button */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Persisted Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create Backend Account</h3>
                  <p className="text-xs text-slate-500">Persists account directly on the server</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select User Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('employee')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newRole === 'employee'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                        Employee
                      </span>
                      {newRole === 'employee' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Can only ask questions & search policies. Document upload restricted.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newRole === 'admin'
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                        Admin
                      </span>
                      {newRole === 'admin' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Full access: Can upload new policy documents, delete documents, and ask questions.
                    </p>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="jordan.lee@company.internal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs"
                />
              </div>

              {/* Department & Title */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={newRole === 'admin' ? 'HR Business Partner' : 'Data Analyst'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder={newRole === 'admin' ? 'People Operations' : 'Analytics'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving to Backend...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
