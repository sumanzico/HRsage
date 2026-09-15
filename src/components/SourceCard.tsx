import React from 'react';
import { SourceCitation } from '../types';
import { FileText, ExternalLink, Quote, CheckCircle2 } from 'lucide-react';

interface SourceCardProps {
  source: SourceCitation;
  onOpenDocument?: (docId?: string, sectionTitle?: string) => void;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, onOpenDocument }) => {
  return (
    <div className="bg-slate-50/80 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 hover:border-emerald-300 transition-all group">
      {/* Header with Document Name & Tag */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
              {source.documentTitle}
            </h4>
            <span className="text-[11px] font-medium text-emerald-700">
              {source.section}
            </span>
          </div>
        </div>

        {source.pageOrLocation && (
          <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200/80 shrink-0">
            {source.pageOrLocation}
          </span>
        )}
      </div>

      {/* Quoted Excerpt */}
      <div className="relative pl-3 border-l-2 border-emerald-500/60 my-2">
        <p className="text-xs text-slate-700 italic leading-relaxed">
          "{source.excerpt}"
        </p>
      </div>

      {/* Footer metadata & Action to view */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
        {source.relevance ? (
          <span className="text-slate-500 flex items-center gap-1 truncate max-w-[70%]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{source.relevance}</span>
          </span>
        ) : (
          <span className="text-slate-400">Verified Citation</span>
        )}

        {onOpenDocument && (
          <button
            onClick={() => onOpenDocument(source.documentId, source.section)}
            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold hover:underline shrink-0 ml-auto"
            title="Inspect source section in document viewer"
          >
            <span>Read Section</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
