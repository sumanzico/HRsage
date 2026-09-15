import React from 'react';
import {
  X,
  BarChart3,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Users,
  Award
} from 'lucide-react';

interface HRInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentCount: number;
}

export const HRInsightsModal: React.FC<HRInsightsModalProps> = ({
  isOpen,
  onClose,
  documentCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                HR Staff Operations & Deflection Metrics
              </h2>
              <p className="text-xs text-slate-500">
                Quantifying repetitive HR question deflection and policy gap analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Deflection Rate</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-950">84.2%</p>
              <p className="text-[11px] text-emerald-800 mt-1">Queries answered without human ticket</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
              <div className="flex items-center justify-between text-blue-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">HR Time Saved</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-blue-950">14.8 hrs</p>
              <p className="text-[11px] text-blue-800 mt-1">Estimated saved per HR specialist/week</p>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80">
              <div className="flex items-center justify-between text-purple-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Citation Accuracy</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-purple-950">98.6%</p>
              <p className="text-[11px] text-purple-800 mt-1">Grounded directly in approved docs</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Policies</span>
                <FileText className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">{documentCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Live indexed HR guidelines</p>
            </div>
          </div>

          {/* Top Repetitive Questions Handled */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Most Common Repetitive Questions Deflected</span>
            </h3>
            <div className="space-y-2">
              {[
                {
                  question: 'How many unused PTO days can I roll over into 2027?',
                  count: 42,
                  doc: 'Paid Time Off & Leave Policy',
                  status: 'Fully automated (Max 5 days)'
                },
                {
                  question: 'What is the 401(k) company match formula and vesting time?',
                  count: 36,
                  doc: '401(k) Retirement Plan Summary',
                  status: 'Fully automated (100% on 4%, 50% on next 2%)'
                },
                {
                  question: 'Can I work remotely from another state or abroad?',
                  count: 29,
                  doc: 'Remote Work & Equipment Policy',
                  status: 'Automated (30 days domestic, 14 days intl)'
                },
                {
                  question: 'How do I claim the $50/month gym and wellness stipend?',
                  count: 24,
                  doc: 'Health Benefits & Coverage Guide',
                  status: 'Automated (Expensify receipt upload)'
                },
                {
                  question: 'How much paid parental leave do secondary caregivers receive?',
                  count: 19,
                  doc: 'Paid Time Off & Leave Policy',
                  status: 'Automated (8 weeks 100% paid)'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">"{item.question}"</p>
                    <p className="text-slate-500 text-[11px]">
                      Source: <span className="font-medium text-slate-700">{item.doc}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                      {item.count} asks this month
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Ambiguity / Gaps Analysis for HR Teams */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Policy Optimization Recommendations for HR</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-amber-800">
              <li>
                <strong>Clarify Part-time PTO Accruals:</strong> 3 employees requested specifics on proration formulas for 30hr/week schedules. Consider adding a table to Section 1 of the PTO policy.
              </li>
              <li>
                <strong>International Travel Lead Time:</strong> Remind managers that international remote work requires 15 days advance notice for compliance review.
              </li>
              <li>
                <strong>Annual Education Reimbursement:</strong> Clarify that certifications outside engineering (e.g. HR, Sales, Design) are eligible under the $1,500 budget.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>HRSage Enterprise Analytics • Real-time knowledge sync</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
