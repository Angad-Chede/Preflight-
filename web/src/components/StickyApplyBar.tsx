import type { Change } from '@preflight/shared';
import { ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

interface StickyApplyBarProps {
  changes: Change[];
  onApply: () => void;
  isApplying: boolean;
  status: string;
}

export function StickyApplyBar({
  changes,
  onApply,
  isApplying,
  status
}: StickyApplyBarProps) {
  if (changes.length === 0 || status === 'applied' || status === 'undone' || status === 'running') {
    return null;
  }

  const approvedCount = changes.filter((c) => c.decision === 'approved').length;
  const criticalApproved = changes.filter((c) => c.decision === 'approved' && c.risk.level === 'CRITICAL').length;
  const highApproved = changes.filter((c) => c.decision === 'approved' && c.risk.level === 'HIGH').length;

  return (
    <div className="fixed bottom-6 inset-x-0 z-40 max-w-3xl mx-auto px-4 animate-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900/95 text-white backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status / Count */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{approvedCount} of {changes.length} Changes Approved</span>
              {criticalApproved > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  {criticalApproved} Critical
                </span>
              )}
              {highApproved > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {highApproved} High
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {approvedCount === 0
                ? 'Review and approve changes above to execute apply'
                : 'Atomic transaction snapshot will be taken before execution'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onApply}
          disabled={approvedCount === 0 || isApplying}
          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isApplying ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Applying with Snapshot...</span>
            </>
          ) : (
            <>
              <span>Apply {approvedCount} Approved Change{approvedCount > 1 ? 's' : ''}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
